import { config } from '../config.js';

const buckets = new Map();

/** Fixed-window limiter, per client IP, held in process memory. */
export function rateLimit(req, res, next) {
  const { windowMs, max } = config.rateLimit;
  const key = req.ip || 'unknown';
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  res.set('X-RateLimit-Limit', String(max));
  res.set('X-RateLimit-Remaining', String(Math.max(0, max - bucket.count)));

  if (bucket.count > max) {
    res.set('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
    return res.status(429).json({ error: 'Too many requests', retryAfterMs: bucket.resetAt - now });
  }

  next();
}

// Keep the map from growing without bound on a long-lived instance.
const sweep = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}, 60_000);
sweep.unref?.();
