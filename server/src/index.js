import express from 'express';
import cors from 'cors';
import compression from 'compression';

import { config } from './config.js';
import { cache } from './lib/cache.js';
import { rateLimit } from './lib/rateLimit.js';
import { startKeepAlive } from './lib/keepalive.js';
import { startWarmup } from './lib/warmup.js';
import { players } from './routes/players.js';
import { clubs } from './routes/clubs.js';
import { competitions } from './routes/competitions.js';

const log = (message, meta) =>
  console.log(JSON.stringify({ t: new Date().toISOString(), message, ...meta }));

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.set('etag', 'strong');

app.use(compression());
app.use(
  cors({
    origin: config.corsOrigins.includes('*') ? true : config.corsOrigins,
    maxAge: 86_400,
  }),
);

app.use((req, res, next) => {
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    log('request', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      cache: res.get('X-Cache') || '-',
      ms: Math.round(ms),
    });
  });
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    upstream: config.upstream,
    cache: { entries: cache.size, ...cache.stats },
  });
});

app.use('/api', rateLimit);
app.use('/api/players', players);
app.use('/api/clubs', clubs);
app.use('/api/competitions', competitions);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found', path: req.originalUrl }));

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity.
app.use((error, req, res, next) => {
  const status = error.status && error.status >= 400 ? error.status : 502;
  log('error', { path: req.originalUrl, status, error: error.message });

  if (error.retryAfterMs) res.set('Retry-After', String(Math.ceil(error.retryAfterMs / 1000)));
  // Failures must never be cached by the browser or a CDN.
  res.set('Cache-Control', 'no-store');

  res.status(status).json({
    error: status === 404 ? 'Not found' : status === 503 ? 'Data source busy' : 'Upstream request failed',
    detail: error.message,
  });
});

const server = app.listen(config.port, () => {
  log('listening', { port: config.port, upstream: config.upstream });
  startKeepAlive(log);
  startWarmup(log);
});

const shutdown = (signal) => {
  log('shutting down', { signal });
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
