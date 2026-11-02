import { createHash } from 'node:crypto';

/**
 * The second cache level: Vercel's Runtime Cache, shared by every instance of
 * the gateway and kept across deploys (free on Hobby within its monthly
 * allowance; past it the cache pauses, nothing is billed).
 *
 * The in-memory cache is lost whenever Vercel starts a fresh instance, which
 * on a quiet site is most requests — so without this, a player one visitor
 * loaded a minute ago could still mean a slow trip to Transfermarkt for the
 * next. With it, anything anyone has fetched comes back in milliseconds, and
 * an old copy can stand in when the upstream is asleep or refusing requests.
 *
 * Only loaded on Vercel. A long-lived server (local dev, a VM) keeps its
 * memory, and the snapshot script runs with no packages installed.
 */
const functions = process.env.VERCEL && process.env.SHARED_CACHE !== 'false'
  ? await import('@vercel/functions').catch(() => null)
  : null;

// Keys go into a URL, and the library's default hash is 32-bit: a collision
// would serve one player's data for another. SHA-256 is safe on both counts.
const store = functions?.getCache({
  namespace: 'fpp1',
  keyHashFunction: (key) => createHash('sha256').update(key).digest('hex'),
});

/** Whether this instance is talking to the shared cache (reported by /api/health). */
export const sharedCacheEnabled = Boolean(store);

/** How long a copy is kept as a stand-in, well past the point it is refreshed. */
const RETAIN_SECONDS = 30 * 24 * 60 * 60;

/** Resolves to `{ value, storedAt }` or null; never throws. */
export async function readShared(key) {
  if (!store) return null;
  try {
    const entry = await store.get(key);
    return entry && typeof entry.storedAt === 'number' ? entry : null;
  } catch {
    return null;
  }
}

/** Stores a fresh upstream value without holding up the response. */
export function writeShared(key, value) {
  if (!store) return;
  background(store.set(key, { value, storedAt: Date.now() }, { ttl: RETAIN_SECONDS }).catch(() => {}));
}

/**
 * Lets work outlive the response. On Vercel a function can be frozen once it
 * has answered, which would cut a background refresh short; waitUntil keeps it
 * alive until the promise settles. Elsewhere the promise simply runs.
 */
export function background(promise) {
  try {
    functions?.waitUntil(promise);
  } catch {
    /* outside a request */
  }
}
