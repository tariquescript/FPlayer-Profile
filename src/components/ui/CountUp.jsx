import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';

/** Counts a number up from zero once, formatting every frame with `format`. */
export default function CountUp({ value, format = String, duration = 1100 }) {
  const reduced = useReducedMotion();
  const target = Number(value);
  const valid = Number.isFinite(target) && target > 0;
  const [shown, setShown] = useState(reduced || !valid ? value : 0);
  const frame = useRef(0);

  useEffect(() => {
    if (reduced || !valid) return undefined;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - 2 ** (-10 * progress);
      setShown(progress >= 1 ? target : target * eased);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, valid, reduced, duration]);

  return <>{format(reduced || !valid ? value : shown)}</>;
}
