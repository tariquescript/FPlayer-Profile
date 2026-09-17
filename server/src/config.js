const num = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: num(process.env.PORT, 8787),

  /** Upstream Transfermarkt API (the service deployed on Render). */
  upstream: (
    process.env.UPSTREAM_URL || 'https://transfermarkt-api-82dl.onrender.com'
  ).replace(/\/+$/, ''),

  /** Per-request upstream budget. Render free tier can cold start for ~50s. */
  upstreamTimeoutMs: num(process.env.UPSTREAM_TIMEOUT_MS, 55_000),
  upstreamRetries: num(process.env.UPSTREAM_RETRIES, 3),

  /**
   * How many upstream requests run at once. The upstream scrapes
   * transfermarkt.com, which starts refusing requests when they arrive too
   * fast, so this stays deliberately low.
   */
  upstreamConcurrency: num(process.env.UPSTREAM_CONCURRENCY, 4),

  /**
   * Cache windows. Transfermarkt data moves slowly, so we cache hard and serve
   * stale content while revalidating in the background.
   */
  cache: {
    maxEntries: num(process.env.CACHE_MAX_ENTRIES, 3_000),
    // Search results barely move within a day, so anything searched in the last
    // 12 hours is answered from memory and quietly refreshed in the background.
    search: { ttl: num(process.env.CACHE_TTL_SEARCH, 30 * 60_000), swr: 12 * 60 * 60_000 },
    player: { ttl: num(process.env.CACHE_TTL_PLAYER, 6 * 60 * 60_000), swr: 7 * 24 * 60 * 60_000 },
    club: { ttl: num(process.env.CACHE_TTL_CLUB, 6 * 60 * 60_000), swr: 7 * 24 * 60 * 60_000 },
    competition: { ttl: num(process.env.CACHE_TTL_COMPETITION, 12 * 60 * 60_000), swr: 7 * 24 * 60 * 60_000 },
  },

  /** Naive in-process rate limit, enough to keep a single abusive client out. */
  rateLimit: {
    windowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    max: num(process.env.RATE_LIMIT_MAX, 240),
  },

  /**
   * Render spins free instances down after 15 minutes of inactivity, which
   * turns the next request into a 40s cold start. A heartbeat keeps both the
   * upstream and this service awake.
   */
  keepAlive: {
    enabled: process.env.KEEP_ALIVE !== 'false',
    intervalMs: num(process.env.KEEP_ALIVE_INTERVAL_MS, 10 * 60_000),
    selfUrl: process.env.SELF_URL || '',
  },

  /**
   * Searches pre-loaded into the cache on boot and every few hours, so the
   * names people look up most are instant even for the first visitor.
   */
  warm: {
    enabled: process.env.WARM_CACHE !== 'false',
    intervalMs: num(process.env.WARM_INTERVAL_MS, 6 * 60 * 60_000),
    spacingMs: num(process.env.WARM_SPACING_MS, 1_500),
    queries: (
      process.env.WARM_QUERIES ||
      'haaland,mbappe,bellingham,yamal,vinicius,messi,ronaldo,salah,kane,de bruyne,saka,musiala,' +
        'wirtz,pedri,rodri,foden,palmer,lewandowski,neymar,modric,kimmich,valverde,rice,odegaard,' +
        'van dijk,alisson,courtois,dias,bruno fernandes,osimhen,lautaro,griezmann,son,' +
        'alexander-arnold,gavi,camavinga,tchouameni,leao,kvaratskhelia,dembele'
    )
      .split(',')
      .map((query) => query.trim())
      .filter(Boolean),
  },

  corsOrigins: (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
