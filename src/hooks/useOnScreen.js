import { useEffect, useState } from 'react';

/**
 * Whether an element is in the viewport, so looping animations can pause
 * while nobody can see them instead of repainting off screen.
 */
export function useOnScreen(ref) {
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver !== 'function') return undefined;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return onScreen;
}
