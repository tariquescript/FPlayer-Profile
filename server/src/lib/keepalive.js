import { config } from '../config.js';

/**
 * Render suspends free instances after ~15 minutes idle, and waking one costs
 * the next visitor a ~40 second request. A cheap heartbeat against the
 * upstream (and optionally this service) keeps both hot.
 */
export function startKeepAlive(log) {
  if (!config.keepAlive.enabled) return () => {};

  const targets = [`${config.upstream}/docs`];
  if (config.keepAlive.selfUrl) {
    targets.push(`${config.keepAlive.selfUrl.replace(/\/+$/, '')}/api/health`);
  }

  const ping = async () => {
    await Promise.all(
      targets.map(async (url) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 30_000);
        try {
          const started = Date.now();
          const response = await fetch(url, { signal: controller.signal, method: 'GET' });
          log('keepalive', { url, status: response.status, ms: Date.now() - started });
        } catch (error) {
          log('keepalive failed', { url, error: error.message });
        } finally {
          clearTimeout(timer);
        }
      }),
    );
  };

  ping();
  const timer = setInterval(ping, config.keepAlive.intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}
