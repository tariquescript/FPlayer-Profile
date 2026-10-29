/**
 * Sends a cached upstream result with headers that let the browser and the CDN
 * in front of us reuse it.
 *
 * s-maxage is for shared caches (Vercel's edge): it keeps a response for the
 * whole fresh window, then keeps serving it for the stale window while it
 * fetches a new copy in the background — so after the first visitor, nobody
 * waits on the upstream again. Browsers ignore s-maxage and keep a copy for
 * at most a minute; the app has its own cache for longer.
 */
export function sendCached(res, { value, state, age }, { ttl, swr }) {
  const fresh = Math.max(0, Math.round(ttl / 1000) - Math.round((age || 0) / 1000));
  res.set(
    'Cache-Control',
    `public, max-age=${Math.min(fresh, 60)}, s-maxage=${fresh}, stale-while-revalidate=${Math.round(swr / 1000)}`,
  );
  res.set('X-Cache', state);
  res.json(value);
}
