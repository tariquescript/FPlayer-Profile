import { useEffect, useRef, useState } from 'react';
import Model from './Model.jsx';
import { onKick } from './bus.js';
import { planHop, planKick, sampleTimes } from './kickMotion.js';
import { useWebglReady } from '../../hooks/useWebglReady.js';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const REST = 0.55; // seconds at each end before the kick back

/**
 * The match ball on the search bar, kicked back and forth along the space
 * beneath the hero's volt word.
 *
 * Each pass is a kick: a high arc, smaller and smaller bounces, friction
 * bleeding the speed off until it rolls to rest at the far end, then a kick
 * back the other way. It squashes a touch on every landing, its shadow on the
 * bar shrinks and fades as it rises, and it turns at exactly the rate its
 * travel implies. Typing makes it hop.
 *
 * The travel, bounces, squash and shadow are handed to the browser as
 * keyframe animations, so they run on the compositor at the display's full
 * rate and stay smooth even while the page is busy — building a model,
 * rendering results. Only the spin is drawn frame by frame, read from the
 * same plan. Everything pauses whenever the bar is off screen.
 */
export default function KickBall({ busy = false, under = '.roll' }) {
  const tier = useWebglReady();
  const reduced = useReducedMotion();
  const hostRef = useRef(null);
  const hopRef = useRef(null);
  const shadowRef = useRef(null);
  const shadowHopRef = useRef(null);
  const drive = useRef({ spin: 0 });
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const hopper = hopRef.current;
    const shadow = shadowRef.current;
    const shadowHop = shadowHopRef.current;
    const bar = host?.parentElement;
    if (!tier || !host || !hopper || !shadow || !shadowHop || !bar) return undefined;

    // Where the ball may travel: on phones, the full width of the search bar;
    // on wider screens, the stretch under the volt word. How high it may fly
    // is set by the lowest piece of hero content above that stretch (anything
    // marked [data-ball-ceiling]), so it never bounces into the text.
    const track = { from: 0, to: 0, lift: 0, size: 0 };
    const measure = () => {
      const box = bar.getBoundingClientRect();
      const size = host.offsetWidth;
      const narrow = window.innerWidth < 640;
      const word = document.querySelector(under)?.getBoundingClientRect();
      const wordVisible = word && word.height > 0 && word.bottom <= box.top;

      let from = 0;
      let to = box.width * 0.35 - size;
      if (narrow) to = box.width - size;
      else if (wordVisible) {
        from = word.left - box.left;
        to = word.right - box.left - size;
      }
      track.from = Math.max(0, from);
      track.to = Math.max(track.from, to);
      track.size = size;

      let ceiling = null;
      document.querySelectorAll('[data-ball-ceiling]').forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (!rect.height || rect.bottom > box.top) return;
        const crosses = rect.right > box.left + track.from && rect.left < box.left + track.to + size;
        if (crosses) ceiling = Math.max(ceiling ?? -Infinity, rect.bottom);
      });
      track.lift = ceiling === null ? 14 : clamp(box.top - ceiling - size - 12, 0, 150);
    };

    // The higher the ball, the smaller and fainter its shadow.
    const height = (y) => (track.lift ? Math.min(y / (track.lift + 20), 1) : 0);
    const ballPose = ({ x, y, squash }) => ({
      transform: `translate3d(${x}px, ${-y}px, 0) scale(${1 + squash * 0.55}, ${1 - squash})`,
    });
    const shadowPose = ({ x, y }) => ({
      transform: `translate3d(${x + track.size * 0.08}px, 0, 0) scale(${1 - height(y) * 0.5}, ${1 - height(y) * 0.35})`,
      opacity: 0.55 - height(y) * 0.38,
    });
    // A hop lifts the ball on its own layer and shrinks the shadow on another.
    const hopPose = ({ height: lift }) => ({ transform: `translate3d(0, ${-lift}px, 0)` });
    const shadowHopPose = ({ height: lift }) => ({
      transform: `scale(${1 - height(lift) * 0.5}, ${1 - height(lift) * 0.35})`,
      opacity: 1 - height(lift) * 0.7,
    });

    // Plays a plan as keyframe animations on [element, pose] pairs.
    const perform = (plan, targets) => {
      const times = sampleTimes(plan.duration, plan.contacts);
      return targets.map(([element, pose]) =>
        element.animate(
          times.map((time) => ({ ...pose(plan.at(time)), offset: time / plan.duration })),
          { duration: plan.duration * 1000, fill: 'forwards' },
        ),
      );
    };

    // The resting pose, kept as inline style under the animations.
    const settle = (x) => {
      host.style.transform = ballPose({ x, y: 0, squash: 0 }).transform;
      const pose = shadowPose({ x, y: 0 });
      shadow.style.transform = pose.transform;
      shadow.style.opacity = String(pose.opacity);
    };

    let x = null;
    let direction = -1;
    let pass = null;
    let hop = null;
    let restTimer = 0;
    let running = false;
    let frame = 0;
    let last = 0;

    const kick = () => {
      restTimer = 0;
      measure();
      direction = -direction;
      const to = direction > 0 ? track.to : track.from;
      const plan = planKick({ from: x, to, lift: track.lift, power: 0.8 + Math.random() * 0.35 });
      const current = { plan, animations: perform(plan, [[host, ballPose], [shadow, shadowPose]]) };
      pass = current;
      x = to;
      settle(to);
      current.animations[0].finished.then(
        () => {
          if (pass !== current) return;
          current.animations.forEach((animation) => animation.cancel());
          pass = null;
          if (running) restTimer = setTimeout(kick, REST * 1000);
        },
        () => {},
      );
    };

    // A nudge from typing: a small extra hop, or a boost if already in the air.
    const hopUp = (amount) => {
      if (!running) return;
      let state = { height: 0.01, velocity: 260 * amount };
      if (hop) {
        const now = hop.plan.at((hop.animations[0].currentTime ?? 0) / 1000);
        if (now.height > 0) state = { height: now.height, velocity: Math.max(now.velocity, state.velocity) };
      }
      const plan = planHop(state.height, state.velocity);
      const previous = hop;
      const current = { plan, animations: perform(plan, [[hopper, hopPose], [shadowHop, shadowHopPose]]) };
      hop = current;
      previous?.animations.forEach((animation) => animation.cancel());
      current.animations[0].finished.then(
        () => {
          if (hop !== current) return;
          current.animations.forEach((animation) => animation.cancel());
          hop = null;
        },
        () => {},
      );
    };

    // Roll without slipping: the turn rate is the travel speed over the radius.
    const spin = (now) => {
      frame = requestAnimationFrame(spin);
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now;
      const time = pass?.animations[0].currentTime;
      const velocity = pass && time != null ? pass.plan.at(time / 1000).velocity : 0;
      const radius = (track.size / 2) * 0.94;
      const target = radius ? velocity / radius : 0;
      drive.current.spin += (target - drive.current.spin) * Math.min(1, dt * 12);
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      last = 0;
      frame = requestAnimationFrame(spin);
      if (pass) pass.animations.forEach((animation) => animation.play());
      else if (!restTimer) restTimer = setTimeout(kick, 250);
      hop?.animations.forEach((animation) => animation.play());
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
      clearTimeout(restTimer);
      restTimer = 0;
      pass?.animations.forEach((animation) => animation.pause());
      hop?.animations.forEach((animation) => animation.pause());
    };

    measure();
    x = track.from;
    settle(x);
    if (reduced) drive.current.spin = 0.4;

    const visibility = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    visibility.observe(bar);
    // A resize between kicks moves the resting ball back onto the track.
    const onResize = () => {
      measure();
      if (pass) return;
      x = clamp(x, track.from, track.to);
      settle(x);
    };
    window.addEventListener('resize', onResize);

    const unsubscribe = onKick((amount) => !reduced && hopUp(amount));

    return () => {
      stop();
      pass?.animations.forEach((animation) => animation.cancel());
      hop?.animations.forEach((animation) => animation.cancel());
      visibility.disconnect();
      window.removeEventListener('resize', onResize);
      unsubscribe();
    };
  }, [tier, reduced, under]);

  if (!tier) return null;

  return (
    <>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-[calc(100%-5px)] left-0 z-[1] h-3 w-[54px] transition-opacity duration-700 sm:h-4 sm:w-[78px] ${
          shown ? '' : 'opacity-0'
        }`}
      >
        <span ref={shadowRef} className="absolute inset-0">
          <span
            ref={shadowHopRef}
            className="absolute inset-0 rounded-[50%] bg-[radial-gradient(closest-side,rgb(11_12_14/0.45),transparent)]"
          />
        </span>
      </span>
      <div
        ref={hostRef}
        className="pointer-events-none absolute bottom-[calc(100%-3px)] left-0 z-10 h-[60px] w-[60px] origin-bottom will-change-transform sm:h-[88px] sm:w-[88px]"
      >
        <div ref={hopRef} className="absolute inset-0">
          <Model kind="matchBall" busy={busy} drive={drive} onShown={() => setShown(true)} className="absolute inset-0" />
        </div>
      </div>
    </>
  );
}
