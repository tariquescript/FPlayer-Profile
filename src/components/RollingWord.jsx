import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

/**
 * The hero's rotating word, lettered like a football shirt on a volt block.
 * On each change the outgoing letters roll up and away one after another, the
 * new ones roll in behind them, the block eases to the new width and a foil
 * sheen passes across it. Transforms only, plus one width change per cycle.
 * It holds still when paused or for reduced motion.
 */
export default function RollingWord({ words, interval = 2800, paused = false }) {
  const reduced = useReducedMotion();
  const [{ index, previous }, setRoll] = useState({ index: 0, previous: null });
  const [width, setWidth] = useState(null);
  const refs = useRef([]);

  useEffect(() => {
    if (reduced || paused) return undefined;
    const timer = setInterval(() => {
      setRoll((current) => ({ index: (current.index + 1) % words.length, previous: current.index }));
    }, interval);
    return () => clearInterval(timer);
  }, [reduced, paused, interval, words.length]);

  // Size the block to the current word, and again once the display font has
  // loaded or the viewport changes the font size.
  useLayoutEffect(() => {
    const measure = () => {
      const node = refs.current[index];
      if (node) setWidth(node.getBoundingClientRect().width);
    };
    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    const observer = new ResizeObserver(measure);
    refs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [index, words]);

  return (
    <span className="roll" style={width ? { width } : undefined}>
      <span className="sr-only">{words[index]}</span>
      {/* Keyed by index so the sheen replays on every change. */}
      {previous !== null && <span key={index} className="roll-sheen" aria-hidden="true" />}
      {words.map((word, wordIndex) => (
        <span
          key={word}
          ref={(node) => {
            refs.current[wordIndex] = node;
          }}
          aria-hidden="true"
          className="roll-word"
          data-state={wordIndex === index ? 'current' : wordIndex === previous ? 'leaving' : undefined}
        >
          {[...word].map((letter, letterIndex) => (
            <span key={letterIndex} style={{ '--i': letterIndex }}>
              {letter === ' ' ? ' ' : letter}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
