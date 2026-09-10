import { config } from '../config.js';
import { tryGet } from './upstream.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Walks the popular-search list one request at a time. Spacing matters more
 * than speed here: a burst would trip the upstream's rate limit and hurt the
 * real visitors this is meant to help.
 */
async function warmOnce(log) {
  const started = Date.now();
  let ok = 0;

  for (const query of config.warm.queries) {
    const path = `/players/search/${encodeURIComponent(query)}?page_number=1`;
    const result = await tryGet(path, config.cache.search);
    if (result.value) ok += 1;
    // Cache hits cost nothing upstream, so only pause after a real request.
    if (result.state === 'miss' || result.state === 'error') await sleep(config.warm.spacingMs);
  }

  log('cache warmed', { ok, total: config.warm.queries.length, ms: Date.now() - started });
}

export function startWarmup(log) {
  if (!config.warm.enabled || !config.warm.queries.length) return () => {};

  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await warmOnce(log);
    } finally {
      running = false;
    }
  };

  // Give the upstream a moment to wake before the first pass.
  const first = setTimeout(run, 5_000);
  const timer = setInterval(run, config.warm.intervalMs);
  first.unref?.();
  timer.unref?.();

  return () => {
    clearTimeout(first);
    clearInterval(timer);
  };
}
