/**
 * Two-tier client cache with stale-while-revalidate.
 *
 * Tier 1 is an in-memory Map: client-side navigation is free, so coming back
 * from a player profile re-renders the search grid instantly.
 * Tier 2 is localStorage: it survives closing the tab, so a returning visitor
 * sees every player they have already looked at on the first frame.
 *
 * Every entry has two deadlines. Until `expiresAt` it is fresh. After that,
 * until `staleUntil`, it is still shown at once, and the API layer fetches a
 * new copy in the background (see api.js). Past `staleUntil` it is dropped.
 */

const PREFIX = 'fpp:v3:';
const memory = new Map();
const inflight = new Map();

const now = () => Date.now();

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStored(key) {
  const store = storage();
  if (!store) return undefined;
  try {
    const raw = store.getItem(PREFIX + key);
    if (!raw) return undefined;
    const entry = JSON.parse(raw);
    if (!entry || now() > entry.staleUntil) {
      store.removeItem(PREFIX + key);
      return undefined;
    }
    return entry;
  } catch {
    return undefined;
  }
}

function writeStored(key, entry) {
  const store = storage();
  if (!store) return;
  const raw = JSON.stringify(entry);
  try {
    store.setItem(PREFIX + key, raw);
  } catch {
    // Quota exceeded (or storage blocked). Drop our oldest half and retry once.
    try {
      const ours = Object.keys(store)
        .filter((name) => name.startsWith(PREFIX))
        .map((name) => [name, JSON.parse(store.getItem(name) || '{}').storedAt ?? 0])
        .sort((a, b) => a[1] - b[1]);
      ours.slice(0, Math.ceil(ours.length / 2)).forEach(([name]) => store.removeItem(name));
      store.setItem(PREFIX + key, raw);
    } catch {
      // Memory tier still works; persistence is a bonus, never a requirement.
    }
  }
}

function readEntry(key) {
  const hit = memory.get(key);
  if (hit) {
    if (now() <= hit.staleUntil) return hit;
    memory.delete(key);
  }
  const stored = readStored(key);
  if (stored) memory.set(key, stored);
  return stored;
}

/** The cached value, fresh or stale; undefined if there is none. */
export function readCache(key) {
  return readEntry(key)?.value;
}

/** True only while the entry is inside its fresh window. */
export function isFresh(key) {
  const entry = readEntry(key);
  return Boolean(entry && now() <= entry.expiresAt);
}

/**
 * Stores a value: fresh for `ttl`, then servable while stale for `swr` more.
 * `stale: true` stores it already stale (a bundled snapshot), so the first
 * read both shows it and triggers a refresh.
 */
export function writeCache(key, value, ttl, { persist = true, swr = 0, stale = false } = {}) {
  const stamp = now();
  const expiresAt = stale ? stamp : stamp + ttl;
  const entry = { value, expiresAt, staleUntil: expiresAt + swr, storedAt: stamp };
  memory.set(key, entry);
  if (persist) writeStored(key, entry);
  return value;
}

export function hasCache(key) {
  return readCache(key) !== undefined;
}

/** Every stored value whose key starts with `prefix`, for rebuilding indexes. */
export function storedValues(prefix) {
  const store = storage();
  if (!store) return [];
  try {
    return Object.keys(store)
      .filter((name) => name.startsWith(PREFIX + prefix))
      .map((name) => readStored(name.slice(PREFIX.length))?.value)
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Single-flight: concurrent callers for the same key share one request, so a
 * grid of cards that all want the same profile only asks for it once.
 */
export function dedupe(key, producer) {
  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = producer().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

export function clearCache() {
  memory.clear();
  inflight.clear();
  const store = storage();
  try {
    Object.keys(store ?? {})
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => store.removeItem(key));
  } catch {
    /* storage unavailable */
  }
}

/**
 * Short-lived memory of failed keys. A card for a player the upstream is
 * refusing would otherwise re-request on every mount and scroll, and that
 * extra traffic is what keeps an upstream rate limit in force.
 */
const failures = new Map();

export function noteFailure(key, ttl = 30_000) {
  failures.set(key, now() + ttl);
}

export function recentlyFailed(key) {
  const until = failures.get(key);
  if (!until) return false;
  if (now() > until) {
    failures.delete(key);
    return false;
  }
  return true;
}
