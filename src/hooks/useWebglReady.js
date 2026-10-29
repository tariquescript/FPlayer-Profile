import { useEffect, useState } from 'react';

function supportsWebgl() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    // Hand the probe context straight back rather than waiting for GC.
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(gl);
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

// Decided once per page load and shared by every model on the page.
let tier;
let idle = false;
let idlePromise = null;

function whenIdle() {
  if (!idlePromise) {
    idlePromise = new Promise((resolve) => {
      if (typeof requestIdleCallback === 'function') requestIdleCallback(resolve, { timeout: 1_200 });
      else setTimeout(resolve, 400);
    }).then(() => {
      idle = true;
    });
  }
  return idlePromise;
}

/**
 * Decides whether the 3D models are worth loading, and defers them until the
 * browser is idle so they never compete with the first paint or the first
 * search request.
 *
 * Returns `null` while waiting, `false` for the fallback, or a tier.
 */
export function useWebglReady() {
  const [current] = useState(() => {
    if (tier === undefined) tier = detectTier();
    return tier;
  });
  const [ready, setReady] = useState(idle);

  useEffect(() => {
    if (!current || ready) return undefined;
    let cancelled = false;
    whenIdle().then(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [current, ready]);

  if (current === false) return false;
  return ready ? current : null;
}
