/**
 * Two-tier client cache.
 *
 * Tier 1 is an in-memory Map: it makes client-side navigation free, so coming
 * back from a player profile re-renders the search grid instantly.
 * Tier 2 is sessionStorage: it survives a reload and a browser back/forward.
 *
 * Every entry carries its own TTL, and reads sweep expired keys lazily.
 */

const PREFIX = 'fpp:v2:';
const memory = new Map();
const inflight = new Map();

const now = () => Date.now();

function readSession(key) {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return undefined;
    const entry = JSON.parse(raw);
    if (!entry || now() > entry.expiresAt) {
      sessionStorage.removeItem(PREFIX + key);
      return undefined;
    }
    return entry;
  } catch {
    return undefined;
  }
}

function writeSession(key, entry) {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // Quota exceeded (or storage blocked). Drop our oldest keys and retry once.
    try {
      const ours = Object.keys(sessionStorage).filter((k) => k.startsWith(PREFIX));
      ours.slice(0, Math.ceil(ours.length / 2)).forEach((k) => sessionStorage.removeItem(k));
      sessionStorage.setItem(PREFIX + key, JSON.stringify(entry));
    } catch {
      // Memory tier still works; persistence is a bonus, never a requirement.
    }
  }
}

export function readCache(key) {
  const hit = memory.get(key);
  if (hit) {
    if (now() <= hit.expiresAt) return hit.value;
    memory.delete(key);
  }

  const stored = readSession(key);
  if (stored) {
    memory.set(key, stored);
    return stored.value;
  }
  return undefined;
}

export function writeCache(key, value, ttl, { persist = true } = {}) {
  const entry = { value, expiresAt: now() + ttl, storedAt: now() };
  memory.set(key, entry);
  if (persist) writeSession(key, entry);
  return value;
}

export function hasCache(key) {
  return readCache(key) !== undefined;
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
  try {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => sessionStorage.removeItem(key));
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
