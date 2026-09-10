import { useEffect, useMemo, useRef } from 'react';
import { prefetchPlayer } from '../lib/api.js';

/**
 * Prefetches a full profile once the pointer rests on a link, or immediately on
 * focus/touch. The short delay stops a mouse sweeping across a grid from firing
 * a seven-request bundle for every card it passes over.
 */
export function usePrefetchIntent(id, delay = 140) {
  const timer = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  return useMemo(() => {
    const load = () => prefetchPlayer(id, { full: true });
    return {
      onMouseEnter: () => {
        clearTimeout(timer.current);
        timer.current = setTimeout(load, delay);
      },
      onMouseLeave: () => clearTimeout(timer.current),
      onFocus: load,
      onTouchStart: load,
    };
  }, [id, delay]);
}
