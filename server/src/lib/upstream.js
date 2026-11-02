import { config } from '../config.js';
import { cache } from './cache.js';
import { background, readShared, writeShared } from './sharedCache.js';

export class UpstreamError extends Error {
  constructor(message, status, path, { retryAfterMs } = {}) {
    super(message);
    this.name = 'UpstreamError';
    this.status = status;
    this.path = path;
    this.retryAfterMs = retryAfterMs;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Paces requests to the upstream: at most `limit` at once, each starting at
 * least `spacingMs` after the one before, and a pause after a refusal. The
 * upstream scrapes transfermarkt.com, which refuses bursts — a profile's six
 * requests sent together used to come back with sections missing.
 */
class Gate {
  #active = 0;
  #queue = [];
  #nextStart = 0;

  constructor(limit, spacingMs = 0) {
    this.limit = limit;
    this.spacingMs = spacingMs;
  }

  /** Holds back the next request, e.g. after the upstream refused one. */
  pause(ms) {
    this.#nextStart = Math.max(this.#nextStart, Date.now() + ms);
  }

  async run(task) {
    if (this.#active >= this.limit) {
      await new Promise((resolve) => this.#queue.push(resolve));
    }
    this.#active += 1;
    try {
      const start = Math.max(Date.now(), this.#nextStart);
      this.#nextStart = start + this.spacingMs;
      if (start > Date.now()) await sleep(start - Date.now());
      return await task();
    } finally {
      this.#active -= 1;
      this.#queue.shift()?.();
    }
  }
}

const gate = new Gate(config.upstreamConcurrency, config.upstreamSpacingMs);

/**
 * transfermarkt.com refuses the scraper when it decides it is going too fast:
 * 403 or 429, and lately 405 ("Not Allowed"). A 403 or 429 often clears within
 * seconds, so those are retried alongside 5xx; a 405 has so far meant a longer
 * block, so it is not.
 */
const isRefusal = (status) => status === 403 || status === 405 || status === 429;
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
      // Back off for everyone, not just this request: the next one would most
      // likely be refused too.
      if (isRefusal(error.status)) gate.pause(config.upstreamRefusalPauseMs);
      if (!isTransient(error.status) || attempt === config.upstreamRetries) break;
      const base = 700 * 2 ** attempt;
      await sleep(base + Math.random() * base * 0.5);
    }
  }

  // Present an upstream block as "busy, try again" rather than leaking a 403
  // that reads like an auth problem on our side.
  if (isRefusal(lastError.status)) {
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

/** A fresh upstream value, also handed to the shared cache for every other instance. */
async function fetchAndShare(path) {
  const value = await fetchWithRetry(path);
  writeShared(path, value);
  return value;
}

/**
 * Cached upstream GET. Resolves to `{ value, state, age }`.
 *
 * Memory first, then the shared cache (a fresh instance starts empty), then
 * the upstream. When the upstream fails, any older copy is served instead of
 * an error — a week-old market value beats a "try again" screen.
 */
export async function get(path, policy) {
  let shared = null;
  if (!cache.peek(path)) {
    shared = await readShared(path);
    if (shared) cache.set(path, shared.value, policy.ttl, policy.swr, shared.storedAt);
  }
  const standIn = () => shared && { value: shared.value, state: 'stale', age: Date.now() - shared.storedAt };

  const failed = recentFailure(path);
  if (failed && !cache.peek(path)) {
    if (shared && failed.status !== 404) return standIn();
    throw failed;
  }

  try {
    return await cache.resolve(path, policy, () => fetchAndShare(path), { background });
  } catch (error) {
    // 404s are stable facts, everything else is worth another go soon.
    const ttl = error.status === 404 ? 5 * 60_000 : FAILURE_TTL_MS;
    failures.set(path, { error, until: Date.now() + ttl });
    if (shared && error.status !== 404) return standIn();
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
