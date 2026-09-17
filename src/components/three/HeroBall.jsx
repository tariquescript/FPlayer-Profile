import { Suspense, lazy } from 'react';
import { useWebglReady } from '../../hooks/useWebglReady.js';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';

const FootballScene = lazy(() => import('./FootballScene.jsx'));

/**
 * The hero visual. WebGL is loaded only once the browser is idle and the device
 * looks capable; everywhere else a CSS-only ball stands in, so the page never
 * pays 500 kB of renderer for decoration it cannot use.
 */
export default function HeroBall({ className = '' }) {
  const reducedMotion = useReducedMotion();
  const tier = useWebglReady();

  if (tier) {
    return (
      <Suspense fallback={<CssBall className={className} />}>
        <FootballScene className={className} reducedMotion={reducedMotion} quality={tier} />
      </Suspense>
    );
  }

  return <CssBall className={className} still={tier === false && reducedMotion} />;
}

/** Pure CSS stand-in: a lit sphere with orbiting rings. */
function CssBall({ className = '', still = false }) {
  return (
    <div className={`relative grid place-items-center ${className}`} aria-hidden="true">
      <div
        className={`relative aspect-square w-[62%] max-w-[300px] rounded-full ${still ? '' : 'animate-float'}`}
        style={{
          background:
            'radial-gradient(circle at 32% 26%, #ffffff 0%, #dfe7f2 18%, #8f9cb3 46%, #1b2334 78%, #070a12 100%)',
          boxShadow:
            '0 40px 90px -30px rgba(0,0,0,.9), inset -18px -22px 60px rgba(0,0,0,.55), 0 0 90px -20px rgba(52,211,153,.35)',
        }}
      >
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full opacity-85">
          <defs>
            <clipPath id="ball-clip">
              <circle cx="100" cy="100" r="99" />
            </clipPath>
          </defs>
          <g clipPath="url(#ball-clip)" fill="#0b1220">
            <polygon points="100,62 122,78 114,104 86,104 78,78" />
            <polygon points="52,40 70,30 84,44 76,62 56,60" />
            <polygon points="148,40 130,30 116,44 124,62 144,60" />
            <polygon points="44,132 62,120 78,132 72,152 50,152" />
            <polygon points="156,132 138,120 122,132 128,152 150,152" />
            <polygon points="100,176 84,166 88,150 112,150 116,166" />
          </g>
        </svg>
      </div>

      <span
        className={`pointer-events-none absolute aspect-square w-[86%] max-w-[420px] rounded-full border border-pitch-400/25 ${
          still ? '' : 'animate-[spin_26s_linear_infinite]'
        }`}
        style={{ transform: 'rotateX(72deg)' }}
      />
      <span
        className={`pointer-events-none absolute aspect-square w-[98%] max-w-[480px] rounded-full border border-volt-400/20 ${
          still ? '' : 'animate-[spin_38s_linear_infinite_reverse]'
        }`}
        style={{ transform: 'rotateX(64deg) rotateZ(28deg)' }}
      />
    </div>
  );
}
