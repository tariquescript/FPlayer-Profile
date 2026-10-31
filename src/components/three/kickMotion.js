/*
 * The path of the kicked ball, as plain maths with no DOM. KickBall turns each
 * plan into keyframes for the browser to play on its compositor, and samples
 * the same plan to spin the ball at the rate its travel implies.
 *
 * One pass is a kick: a high arc, then bounces that each keep a share of the
 * first one's height, while friction bleeds off the speed (an ease-out on the
 * travel) until the ball rolls to rest at the far end. A hop from typing is
 * planned separately and rides on top.
 */

const BOUNCES = [1, 0.42, 0.17, 0.06];
const AIRTIME = 0.82; // share of a pass spent bouncing; the rest is a roll
const SQUASH_WINDOW = 0.07; // share of a bounce near the ground that squashes

const GRAVITY = 1700; // px/s², for hops
const RESTITUTION = 0.3;
const MIN_BOUNCE = 90; // px/s; slower landings stop dead

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

/**
 * One kick from x = `from` to x = `to` (px) on a track whose highest bounce is
 * `lift` px; `power` scales the bounces. Returns the pass's duration (s), the
 * moments it touches the ground (s) and `at(t)` → { x, y, squash, velocity },
 * where y is height above the ground and velocity is horizontal, in px/s.
 */
export function planKick({ from, to, lift, power = 1, speed = 270 }) {
  const duration = clamp(Math.abs(to - from) / speed, 1.3, 3.4);
  const heights = BOUNCES.map((share) => Math.min(share * power, 1) * lift);
  // A bounce's time in the air grows with the square root of its height.
  const weights = heights.map((height) => Math.sqrt(Math.max(height, 1)));
  const total = weights.reduce((sum, value) => sum + value, 0);
  const bounces = heights.map((height, index) => ({ height, time: (weights[index] / total) * duration * AIRTIME }));

  const contacts = [];
  bounces.reduce((clock, bounce) => {
    contacts.push(clock + bounce.time);
    return clock + bounce.time;
  }, 0);

  const at = (t) => {
    const progress = clamp(t / duration, 0, 1);
    const x = from + (to - from) * easeOutCubic(progress);
    const velocity = ((to - from) * 3 * (1 - progress) ** 2) / duration;

    let y = 0;
    let squash = 0;
    let clock = clamp(t, 0, duration);
    for (const bounce of bounces) {
      if (clock < bounce.time) {
        const s = clock / bounce.time;
        y = 4 * bounce.height * s * (1 - s);
        const contact = Math.min(s, 1 - s);
        if (contact < SQUASH_WINDOW && lift > 0) {
          squash = (1 - contact / SQUASH_WINDOW) * Math.min(bounce.height / lift, 1) * 0.14;
        }
        break;
      }
      clock -= bounce.time;
    }
    return { x, y, squash, velocity };
  };

  return { duration, contacts, at };
}

/**
 * A hop from typing: thrown up from `height` px at `velocity` px/s, falling
 * under gravity with a small bounce or two. Returns its duration (s), the
 * moments it lands and `at(t)` → { height, velocity }.
 */
export function planHop(height, velocity) {
  const segments = [];
  let start = 0;
  let h = Math.max(0, height);
  let v = velocity;
  for (let i = 0; i < 6; i += 1) {
    // Time until this arc lands: h + v·t − g·t²/2 = 0.
    const flight = (v + Math.sqrt(v * v + 2 * GRAVITY * h)) / GRAVITY;
    segments.push({ start, h, v, flight });
    start += flight;
    const impact = v - GRAVITY * flight;
    if (Math.abs(impact) <= MIN_BOUNCE) break;
    h = 0;
    v = -impact * RESTITUTION;
  }

  const at = (t) => {
    if (t >= start) return { height: 0, velocity: 0 };
    let segment = segments[0];
    for (const candidate of segments) if (t >= candidate.start) segment = candidate;
    const local = Math.max(0, t - segment.start);
    return {
      height: Math.max(0, segment.h + segment.v * local - (GRAVITY * local * local) / 2),
      velocity: segment.v - GRAVITY * local,
    };
  };

  return { duration: start, contacts: segments.map((segment) => segment.start + segment.flight), at };
}

/**
 * Sample times for turning a plan into keyframes: an even grid, plus every
 * moment of contact so the bounces stay crisp. In seconds, ascending.
 */
export function sampleTimes(duration, contacts = [], rate = 60) {
  const count = Math.max(2, Math.ceil(duration * rate));
  const times = Array.from({ length: count + 1 }, (_, index) => (index / count) * duration);
  contacts.forEach((time) => time > 0 && time < duration && times.push(time));
  return times.sort((a, b) => a - b);
}
