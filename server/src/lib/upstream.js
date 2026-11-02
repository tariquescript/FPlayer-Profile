import { config } from '../config.js';
import { cache } from './cache.js';

export class UpstreamError extends Error {
  constructor(message, status, path, { retryAfterMs } = {}) {
    super(message);
    this.name = 'UpstreamError';
    this.status = status;
    this.path = path;
    this.retryAfterMs = retryAfterMs;
  }
}

/** Simple semaphore so a burst of card requests cannot flood the upstream. */
class Gate {
  #active = 0;
  #queue = [];

  constructor(limit) {
    this.limit = limit;
  }

  async run(task) {
    if (this.#active >= this.limit) {
      await new Promise((resolve) => this.#queue.push(resolve));
    }
    this.#active += 1;
    try {
      return await task();
    } finally {
      this.#active -= 1;
      this.#queue.shift()?.();
    }
  }
}

const gate = new Gate(config.upstreamConcurrency);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The upstream scrapes transfermarkt.com, which intermittently answers 403 when
 * it decides the scraper is going too fast. The identical request succeeds a
 * few seconds later, so 403 is treated as transient alongside 429 and 5xx.
 */
const isTransient = (status) => !status || status === 403 || status === 429 || status >= 500;

async function fetchOnce(path, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(config.upstream + path, {
      signal: controller.signal,
      headers: { accept: 'application/json', 'user-agent': 'fplayerprofile-gateway/1.0' },
    });

    if (!response.ok) {
      throw new UpstreamError(`Upstream responded ${response.status}`, response.status, path);
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') throw new UpstreamError('Upstream timed out', 504, path);
    if (error instanceof UpstreamError) throw error;
    throw new UpstreamError(`Upstream unreachable: ${error.message}`, 502, path);
  } finally {
    clearTimeout(timer);
  }
}

/** Exponential backoff with jitter, so parallel retries do not re-collide. */
async function fetchWithRetry(path) {
  let lastError;

  for (let attempt = 0; attempt <= config.upstreamRetries; attempt += 1) {
    try {
      return await gate.run(() => fetchOnce(path, config.upstreamTimeoutMs));
    } catch (error) {
      lastError = error;
      if (!isTransient(error.status) || attempt === config.upstreamRetries) break;
      const base = 700 * 2 ** attempt;
      await sleep(base + Math.random() * base * 0.5);
    }
  }

  // Present an upstream block as "busy, try again" rather than leaking a 403
  // that reads like an auth problem on our side.
  if (lastError.status === 403 || lastError.status === 429) {
    throw new UpstreamError('The data source is rate limiting requests. Try again shortly.', 503, path, {
      retryAfterMs: 10_000,
    });
  }
  throw lastError;
}

/**
 * Failures are remembered briefly. Without this, every card that re-renders
 * for a player the upstream is refusing sends yet another doomed request —
 * which is exactly the traffic that keeps the block in place.
 */
const failures = new Map();
const FAILURE_TTL_MS = 15_000;

function recentFailure(path) {
  const entry = failures.get(path);
  if (!entry) return null;
  if (Date.now() > entry.until) {
    failures.delete(path);
    return null;
  }
  return entry.error;
}

/** Cached upstream GET. Resolves to `{ value, state, age }`. */
export async function get(path, policy) {
  const failed = recentFailure(path);
  if (failed && !cache.peek(path)) throw failed;

  try {
    return await cache.resolve(path, policy, () => fetchWithRetry(path));
  } catch (error) {
    // 404s are stable facts, everything else is worth another go soon.
    const ttl = error.status === 404 ? 5 * 60_000 : FAILURE_TTL_MS;
    failures.set(path, { error, until: Date.now() + ttl });
    throw error;
  }
}

/** Cached upstream GET that resolves to a null value instead of throwing. */
export async function tryGet(path, policy) {
  try {
    return await get(path, policy);
  } catch {
    return { value: null, state: 'error', age: 0 };
  }
}

/** The weakest cache state across several results, for an honest X-Cache. */
export function combinedState(results) {
  const rank = { error: 0, miss: 1, stale: 2, hit: 3 };
  return results.reduce(
    (worst, result) => ((rank[result.state] ?? 1) < (rank[worst] ?? 1) ? result.state : worst),
    'hit',
  );
}

export const upstreamBase = config.upstream;
