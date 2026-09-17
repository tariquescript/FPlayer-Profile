/**
 * Sends a cached upstream result with headers that let the browser and any CDN
 * in front of us reuse it too.
 */
export function sendCached(res, { value, state, age }, { ttl, swr }) {
  const maxAge = Math.max(0, Math.round(ttl / 1000) - Math.round((age || 0) / 1000));
  res.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${Math.round(swr / 1000)}`);
  res.set('X-Cache', state);
  res.json(value);
}
