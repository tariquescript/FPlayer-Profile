import { useEffect, useState } from 'react';

function supportsWebgl() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** `false` when WebGL is not worth it on this device, otherwise a quality tier. */
function detectTier() {
  const connection = navigator.connection;
  const memory = navigator.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;

  const tooLimited =
    connection?.saveData === true ||
    /2g/.test(connection?.effectiveType ?? '') ||
    memory < 2 ||
    cores <= 2 ||
    !supportsWebgl();

  if (tooLimited) return false;
  return memory < 4 || window.innerWidth < 900 ? 'low' : 'high';
}

/**
 * Decides whether the WebGL hero is worth loading, and defers it until the
 * browser is idle so it never competes with the first paint or the first
 * search request.
 *
 * Returns `null` while waiting, `false` for the CSS fallback, or a tier.
 */
export function useWebglReady() {
  const [tier] = useState(detectTier);
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!tier) return undefined;

    let cancelled = false;
    const reveal = () => !cancelled && setIdle(true);

    if (typeof requestIdleCallback === 'function') {
      const handle = requestIdleCallback(reveal, { timeout: 1_200 });
      return () => {
        cancelled = true;
        cancelIdleCallback(handle);
      };
    }

    const timer = setTimeout(reveal, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [tier]);

  if (tier === false) return false;
  return idle ? tier : null;
}
