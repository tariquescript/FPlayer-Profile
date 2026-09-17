import { useLayoutEffect } from 'react';

const positions = new Map();

/**
 * Restores scroll position per key. React Router does not do this, and landing
 * back at the top of a long result grid loses the visitor's place.
 *
 * The saved offset is only overwritten once it has been restored, so an effect
 * that runs twice (StrictMode) or a page that is still laying out cannot
 * clobber it with 0.
 */
export function useScrollMemory(key, ready = true) {
  useLayoutEffect(() => {
    if (!key || !ready) return undefined;

    const saved = positions.get(key) ?? 0;
    let restored = saved === 0;
    let frame = 0;
    let attempts = 0;

    const restore = () => {
      const reachable = document.documentElement.scrollHeight - window.innerHeight;
      // Images and lazy sections can still be growing the page; retry for a
      // few frames until the saved offset actually fits.
      if (reachable >= saved || attempts >= 30) {
        window.scrollTo({ top: saved, behavior: 'instant' });
        restored = true;
        return;
      }
      attempts += 1;
      frame = requestAnimationFrame(restore);
    };

    if (!restored) restore();

    const remember = () => {
      if (restored) positions.set(key, window.scrollY);
    };

    window.addEventListener('scroll', remember, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      remember();
      window.removeEventListener('scroll', remember);
    };
  }, [key, ready]);
}
