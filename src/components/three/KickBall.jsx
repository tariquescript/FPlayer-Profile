import { useEffect, useRef, useState } from 'react';
import Model from './Model.jsx';
import { onKick } from './bus.js';
import { createKickMotion } from './kickMotion.js';
import { useWebglReady } from '../../hooks/useWebglReady.js';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * The match ball on the search bar, kicked back and forth along the space
 * beneath the hero's volt word.
 *
 * Each pass is a kick: a high arc, smaller and smaller bounces, friction
 * bleeding the speed off until it rolls to rest at the far end, then a kick
 * back the other way. It squashes a touch on every landing, its shadow on the
 * bar shrinks and fades as it rises, and it turns at exactly the rate its
 * travel implies. Typing still makes it hop.
 *
 * Only the ball's own small canvas moves — one transform a frame — and the
 * loop stops whenever the bar is off screen.
 */
export default function KickBall({ busy = false, under = '.roll' }) {
  const tier = useWebglReady();
  const reduced = useReducedMotion();
  const hostRef = useRef(null);
  const shadowRef = useRef(null);
  const drive = useRef({ spin: 0 });
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const shadow = shadowRef.current;
    const bar = host?.parentElement;
    if (!tier || !host || !shadow || !bar) return undefined;

    // Where the ball may travel: under the volt word when it is on screen,
    // and how high it may fly before it would reach that word.
    const track = { from: 0, to: 0, lift: 0, size: 0 };
    const measure = () => {
      const box = bar.getBoundingClientRect();
      const size = host.offsetWidth;
      const word = document.querySelector(under)?.getBoundingClientRect();
      const visible = word && word.height > 0 && word.bottom <= box.top;
      const from = visible ? word.left - box.left : 0;
      const to = visible ? word.right - box.left - size : box.width * 0.35 - size;
      track.from = Math.max(0, from);
      track.to = Math.max(track.from, to);
      track.size = size;
      track.lift = visible ? clamp(box.top - word.bottom - size - 14, 0, 150) : 14;
    };

    const motion = createKickMotion();
    let frame = 0;
    let last = 0;
    let ticks = 0;
    let running = false;

    const place = ({ x, y, squash }) => {
      host.style.transform = `translate3d(${x}px, ${-y}px, 0) scale(${1 + squash * 0.55}, ${1 - squash})`;
      const height = track.lift ? Math.min(y / (track.lift + 20), 1) : 0;
      shadow.style.transform = `translate3d(${x + track.size * 0.08}px, 0, 0) scale(${1 - height * 0.5}, ${1 - height * 0.35})`;
      shadow.style.opacity = String(0.55 - height * 0.38);
    };

    const step = (now) => {
      if (!running) return;
      frame = requestAnimationFrame(step);
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now;
      ticks += 1;
      if (ticks % 20 === 0) measure();

      const ball = motion.step(dt, track);
      // Roll without slipping: the turn rate is the travel speed over the radius.
      const radius = (track.size / 2) * 0.94;
      const spin = radius ? ball.velocity / radius : 0;
      drive.current.spin += (spin - drive.current.spin) * Math.min(1, dt * 12);
      place(ball);
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      last = 0;
      frame = requestAnimationFrame(step);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    measure();
    place({ x: track.from, y: 0, squash: 0 });
    if (reduced) drive.current.spin = 0.4;

    const visibility = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    visibility.observe(bar);
    const onResize = () => measure();
    window.addEventListener('resize', onResize);

    const unsubscribe = onKick((amount) => !reduced && motion.kick(amount));

    return () => {
      stop();
      visibility.disconnect();
      window.removeEventListener('resize', onResize);
      unsubscribe();
    };
  }, [tier, reduced, under]);

  if (!tier) return null;

  return (
    <>
      <span
        ref={shadowRef}
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-[calc(100%-5px)] left-0 z-[1] h-3 w-[54px] rounded-[50%] bg-[radial-gradient(closest-side,rgb(11_12_14/0.45),transparent)] transition-opacity duration-700 sm:h-4 sm:w-[78px] ${
          shown ? '' : '!opacity-0'
        }`}
      />
      <div
        ref={hostRef}
        className="pointer-events-none absolute bottom-[calc(100%-3px)] left-0 z-10 h-[60px] w-[60px] origin-bottom will-change-transform sm:h-[88px] sm:w-[88px]"
      >
        <Model kind="matchBall" busy={busy} drive={drive} onShown={() => setShown(true)} className="absolute inset-0" />
      </div>
    </>
  );
}
