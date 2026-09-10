import { readCache, writeCache, dedupe, noteFailure, recentlyFailed } from './cache.js';
import { indexPlayers } from './playerIndex.js';

/**
 * The app talks to one of two backends and the rest of the code cannot tell
 * which:
 *
 *   gateway - our Node service (VITE_API_BASE). Aggregates and caches, so a
 *             profile page is a single request.
 *   direct  - the Transfermarkt API itself. Used when no gateway is
 *             configured, by fanning out in parallel from the browser.
 */
const RAW_BASE = (import.meta.env.VITE_API_BASE ?? '').trim();

/**
 * "/" means the gateway is served from this origin (the Vite dev proxy, or a
 * rewrite in front of the deployed site), so requests stay relative. Anything
 * else is treated as an absolute origin. Empty falls back to direct mode.
 */
const GATEWAY = RAW_BASE === '/' ? '' : RAW_BASE.replace(/\/+$/, '');
const USE_GATEWAY = RAW_BASE !== '';

const UPSTREAM = (
  import.meta.env.VITE_UPSTREAM_URL || 'https://transfermarkt-api-82dl.onrender.com'
).replace(/\/+$/, '');

export const MODE = USE_GATEWAY ? 'gateway' : 'direct';

const TTL = {
  search: 30 * 60_000,
  player: 60 * 60_000,
  club: 60 * 60_000,
};

/** Cold Render instances can take ~50s to answer the first request. */
const TIMEOUT_MS = Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS) || 60_000;

export class ApiError extends Error {
  constructor(message, { status, url, cause } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
    this.cause = cause;
  }
}

/**
 * The upstream scrapes transfermarkt.com and is refused now and then (403/429),
 * or is waking from sleep (5xx). Those clear up on their own within seconds.
 */
const isTransient = (status) => !status || status === 403 || status === 429 || status >= 500;
const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    }, { once: true });
  });

/**
 * The Transfermarkt API only sends CORS headers for a short allowlist of
 * origins (the Vite dev server and the production domain). In direct mode a
 * browser on any other origin — a Vercel preview URL, say — sees every request
 * fail as a bare network error, so say so once in the console.
 */
let corsWarned = false;
function warnAboutCors() {
  if (USE_GATEWAY || corsWarned) return;
  corsWarned = true;
  console.warn(
    '[api] Requests to the Transfermarkt API are failing. In direct mode it only accepts browsers ' +
      'on origins it allowlists via CORS. Deploy the gateway in server/ and set VITE_API_BASE to its URL.',
  );
}

async function requestOnce(url, { signal, timeoutMs, fresh }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('Timeout', 'TimeoutError')), timeoutMs);
  const onAbort = () => controller.abort(signal.reason);
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
      // A forced refresh must reach the server; otherwise the browser's HTTP
      // cache can hand back the very response being replaced.
      cache: fresh ? 'no-cache' : 'default',
    });
    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      if (response.status === 404) message = 'Not found';
      if ([403, 429, 503].includes(response.status)) {
        message = 'The data source is busy right now. Give it a few seconds and try again.';
      }
      throw new ApiError(message, { status: response.status, url });
    }
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error?.name === 'AbortError' && signal?.aborted) throw error;
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. It may be waking up — try again.', { url, cause: error });
    }
    warnAboutCors();
    throw new ApiError('Could not reach the server. Check your connection.', { url, cause: error });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

async function request(url, { signal, timeoutMs = TIMEOUT_MS, retries = 2, fresh = false } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await requestOnce(url, { signal, timeoutMs, fresh });
    } catch (error) {
      const retryable = error instanceof ApiError && isTransient(error.status) && !error.cause;
      if (!retryable || attempt >= retries || signal?.aborted) throw error;
      const base = 900 * 2 ** attempt;
      await sleep(base + Math.random() * base * 0.4, signal);
    }
  }
}

/** Cache-first fetch: a hit returns synchronously-fast, a miss is de-duplicated. */
function cached(key, ttl, producer) {
  const hit = readCache(key);
  if (hit !== undefined) return Promise.resolve(hit);
  return dedupe(key, async () => {
    try {
      return writeCache(key, await producer(), ttl);
    } catch (error) {
      if (error?.name !== 'AbortError') noteFailure(key);
      throw error;
    }
  });
}

export { recentlyFailed };

export function peekCache(key) {
  return readCache(key);
}

/* ------------------------------------------------------------------ keys */

export const keys = {
  search: (query, page = 1) => `search:${query.toLowerCase()}:${page}`,
  bundle: (id) => `player:${id}:bundle`,
  profile: (id) => `player:${id}:profile`,
  club: (id) => `club:${id}:bundle`,
};

/* --------------------------------------------------------------- players */

export function searchPlayers(query, { page = 1, signal } = {}) {
  const trimmed = query.trim();
  if (!trimmed) return Promise.resolve({ results: [], query: '', lastPageNumber: 1 });

  const path = `/players/search/${encodeURIComponent(trimmed)}`;
  const url = USE_GATEWAY
    ? `${GATEWAY}/api${path}?page=${page}`
    : `${UPSTREAM}${path}?page_number=${page}`;

  return cached(keys.search(trimmed, page), TTL.search, async () => {
    const data = await request(url, { signal });
    indexPlayers(data.results);
    return {
      query: trimmed,
      page,
      lastPageNumber: data.lastPageNumber ?? 1,
      results: Array.isArray(data.results) ? data.results : [],
      updatedAt: data.updatedAt,
    };
  });
}

/** Just the profile — enough for a card portrait, cheap enough to prefetch. */
export function fetchPlayerProfile(id, { signal } = {}) {
  const url = USE_GATEWAY ? `${GATEWAY}/api/players/${id}/profile` : `${UPSTREAM}/players/${id}/profile`;
  return cached(keys.profile(id), TTL.player, () => request(url, { signal }));
}

// `stats` is skipped: the upstream returns an empty list for every player.
const SECTIONS = [
  ['marketValue', 'market_value'],
  ['transfers', 'transfers'],
  ['jerseyNumbers', 'jersey_numbers'],
  ['achievements', 'achievements'],
  ['injuries', 'injuries'],
];

/** How long a bundle with missing sections may be reused before a retry. */
const PARTIAL_TTL = 20_000;

/**
 * Everything the profile page renders. One request against the gateway; a
 * parallel fan-out when talking to the upstream directly. A failed section
 * degrades to null rather than failing the page.
 */
export function fetchPlayerBundle(id, { signal, force = false } = {}) {
  const key = keys.bundle(id);
  if (!force) {
    const hit = readCache(key);
    if (hit !== undefined) return Promise.resolve(hit);
  }

  return dedupe(key, async () => {
    let bundle;
    try {
      if (USE_GATEWAY) {
        bundle = await request(`${GATEWAY}/api/players/${id}/bundle`, { signal, fresh: force });
      } else {
        const [profile, ...rest] = await Promise.all([
          request(`${UPSTREAM}/players/${id}/profile`, { signal, fresh: force }),
          ...SECTIONS.map(([, path]) =>
            request(`${UPSTREAM}/players/${id}/${path}`, { signal, fresh: force }).catch(() => null),
          ),
        ]);

        bundle = { id, profile, partial: [] };
        SECTIONS.forEach(([sectionKey], index) => {
          bundle[sectionKey] = rest[index];
          if (rest[index] === null) bundle.partial.push(sectionKey);
        });
      }
    } catch (error) {
      if (error?.name !== 'AbortError') noteFailure(key);
      throw error;
    }

    // The profile alone is worth caching separately — cards read it directly.
    if (bundle.profile) writeCache(keys.profile(id), bundle.profile, TTL.player);

    // A bundle with holes is kept only briefly and never persisted, so a
    // passing upstream refusal cannot pin a half-empty page for an hour.
    const complete = !bundle.partial?.length;
    return writeCache(key, bundle, complete ? TTL.player : PARTIAL_TTL, { persist: complete });
  });
}

/** Older injury pages; the bundle carries only the first. */
export function fetchInjuryPage(id, page, { signal } = {}) {
  const url = USE_GATEWAY
    ? `${GATEWAY}/api/players/${id}/injuries?page=${page}`
    : `${UPSTREAM}/players/${id}/injuries?page_number=${page}`;
  return cached(`player:${id}:injuries:${page}`, TTL.player, () => request(url, { signal }));
}

/* ----------------------------------------------------------------- clubs */

export function fetchClubBundle(id, { signal } = {}) {
  return cached(keys.club(id), TTL.club, async () => {
    if (USE_GATEWAY) return request(`${GATEWAY}/api/clubs/${id}/bundle`, { signal });

    const [profile, squad] = await Promise.all([
      request(`${UPSTREAM}/clubs/${id}/profile`, { signal }),
      request(`${UPSTREAM}/clubs/${id}/players`, { signal }).catch(() => null),
    ]);
    return { id, profile, players: squad?.players ?? [], partial: squad ? [] : ['players'] };
  });
}

/* -------------------------------------------------------------- prefetch */

/**
 * Warms the cache without blocking anything. Used on hover/focus of a card and
 * for the first rows of a fresh result set, so opening a profile feels instant.
 */
export function prefetchPlayer(id, { full = false } = {}) {
  if (!id) return;
  const key = full ? keys.bundle(id) : keys.profile(id);
  if (readCache(key) !== undefined || recentlyFailed(key)) return;

  const run = () => {
    const task = full ? fetchPlayerBundle(id) : fetchPlayerProfile(id);
    task.catch(() => {});
  };

  if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 1_500 });
  else setTimeout(run, 0);
}

/** Fire-and-forget ping that wakes a sleeping Render instance early. */
export function warmBackend() {
  const url = USE_GATEWAY ? `${GATEWAY}/api/health` : `${UPSTREAM}/players/search/messi?page_number=1`;
  fetch(url, { mode: 'cors', cache: 'no-store' }).catch(() => {});
}
