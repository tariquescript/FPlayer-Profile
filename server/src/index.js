import { app, log } from './app.js';
import { config } from './config.js';
import { startKeepAlive } from './lib/keepalive.js';
import { startWarmup } from './lib/warmup.js';

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
