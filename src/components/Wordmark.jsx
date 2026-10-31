import { useEffect, useId, useRef, useState } from 'react';
import FitText from './ui/FitText.jsx';
import Model from './three/Model.jsx';
import { BALL_LETTER, FLAG_LETTER } from './three/wordmarkLetters.js';

const em = (value) => `${value}em`;

/**
 * The giant footer wordmark. Letters rise into view one after another when it
 * scrolls in and lift under the pointer. Two of them are footballing objects:
 * the first "O" is a football that rolls in place, and the first "I" is a
 * corner flag — the stem is the letter itself, the cloth a small 3D scene run
 * up the pole. Works for any brand name; a name without an O or an I simply
 * keeps those letters as type.
 */
export default function Wordmark({ name }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const letters = [...name];
  const ballAt = letters.findIndex((letter) => letter.toUpperCase() === 'O');
  const flagAt = letters.findIndex((letter) => letter.toUpperCase() === 'I');

  return (
    <div ref={ref} data-in={inView || undefined} aria-label={name} role="img">
      <FitText className="display translate-y-[14%] select-none leading-[0.78] text-ink">
        {letters.map((letter, index) => {
          if (index === ballAt) return <BallLetter key={index} index={index} />;
          if (index === flagAt) return <FlagLetter key={index} index={index} />;
          return (
            <span key={index} className="wm-letter" style={{ '--i': index }} aria-hidden="true">
              {letter === ' ' ? ' ' : letter}
            </span>
          );
        })}
      </FitText>
    </div>
  );
}

function BallLetter({ index }) {
  const { width, bottom, diameter, margin } = BALL_LETTER;
  const flat = { left: em((width - diameter) / 2), bottom: em(bottom), width: em(diameter), height: em(diameter) };

  return (
    <span
      className="wm-letter relative"
      style={{ '--i': index, width: em(width), height: em(bottom + diameter) }}
      aria-hidden="true"
      data-model-host
    >
      {/* Built before the footer scrolls in; it rolls in once it is on screen. */}
      <Model
        kind="ballLetter"
        className="peer absolute left-0"
        style={{ bottom: em(bottom - margin), width: em(width), height: em(diameter + 2 * margin) }}
      />

      {/* A drawn ball for devices without WebGL, and until the 3D one is ready. */}
      <FlatBall
        className="absolute transition-opacity duration-500 peer-data-shown:opacity-0"
        style={flat}
      />
    </span>
  );
}

/* Points of a regular pentagon, pointing up, around (x, y). */
const pentagon = (x, y, radius, turn = 0) =>
  Array.from({ length: 5 }, (_, index) => {
    const angle = turn + (index * 2 * Math.PI) / 5 - Math.PI / 2;
    return `${(x + radius * Math.cos(angle)).toFixed(2)},${(y + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');

/**
 * The classic flat football — a centre pentagon, five more cut by the rim
 * and the seams between them — in the wordmark's ink with volt panels.
 */
function FlatBall({ className = '', style }) {
  // React's ids contain characters that break a url(#…) reference.
  const clip = `ball-${useId().replace(/[^\w-]/g, '')}`;
  const rim = Array.from({ length: 5 }, (_, index) => {
    const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
    return { x: Math.cos(angle) * 47, y: Math.sin(angle) * 47, angle };
  });

  return (
    <svg viewBox="-50 -50 100 100" className={className} style={style} aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <circle r="48" />
        </clipPath>
      </defs>
      <circle r="48" fill="currentColor" />
      <g clipPath={`url(#${clip})`} fill="#d4ff3f" stroke="#d4ff3f" strokeWidth="3.5" strokeLinejoin="round">
        <polygon points={pentagon(0, 0, 15)} />
        {rim.map(({ x, y, angle }) => (
          <g key={angle}>
            <line x1={Math.cos(angle) * 15} y1={Math.sin(angle) * 15} x2={x * 0.62} y2={y * 0.62} />
            <polygon points={pentagon(x, y, 15, Math.PI / 5 + angle + Math.PI / 2)} />
          </g>
        ))}
      </g>
    </svg>
  );
}

function FlagLetter({ index }) {
  const { width, capHeight, stemLeft, stemRight, margin } = FLAG_LETTER;

  return (
    <span
      className="wm-letter relative"
      style={{ '--i': index, width: em(width), height: em(capHeight) }}
      aria-hidden="true"
      data-model-host
    >
      {/* The stem: the letter "I" itself, so it always matches the type. */}
      <span
        className="absolute bottom-0 bg-current"
        style={{ left: em(stemLeft), width: em(stemRight - stemLeft), height: em(capHeight) }}
      />

      {/* A flat flag for small screens and devices without WebGL. */}
      <span
        className="absolute bg-volt md:hidden"
        style={{
          left: em(stemRight),
          top: 0,
          width: em(0.3),
          height: em(0.25),
          clipPath: 'polygon(0 0, 100% 35%, 100% 70%, 0 100%)',
        }}
      />

      <Model
        kind="flagLetter"
        className="absolute left-0 hidden md:block"
        style={{ bottom: em(-margin), width: em(width), height: em(capHeight + 2 * margin) }}
        fallback={
          <span
            className="absolute bg-volt"
            style={{ left: em(stemRight), top: em(margin), width: em(0.3), height: em(0.25) }}
          />
        }
      />
    </span>
  );
}
