/*
 * The path of the kicked ball, as plain maths with no DOM: given a track and a
 * time step, where is the ball, how high, how squashed, how fast. KickBall
 * drives it once a frame; keeping it pure makes the motion easy to reason
 * about and to check frame by frame.
 *
 * One pass is a kick: a high arc, then bounces that each keep a share of the
 * first one's height, while friction bleeds off the speed (an ease-out on the
 * travel) until the ball rolls to rest at the far end. After a short rest it
 * is kicked back the other way, for ever.
 */

const BOUNCES = [1, 0.42, 0.17, 0.06];
const AIRTIME = 0.82; // share of a pass spent bouncing; the rest is a roll
const SQUASH_WINDOW = 0.07; // share of a bounce near the ground that squashes

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

/**
 * track: { from, to, lift } — the x range in px and the highest bounce.
 * Returns { x, y, squash, velocity } each step; y is height above the ground.
 */
export function createKickMotion({ rest = 0.55, speed = 270, random = Math.random } = {}) {
  let x = null;
  let direction = -1;
  let pass = null;
  let restLeft = 0.25;
  let hop = 0;
  let hopVelocity = 0;

  const startPass = (track) => {
    const target = direction > 0 ? track.to : track.from;
    const duration = clamp(Math.abs(target - x) / speed, 1.3, 3.4);
    const power = 0.8 + random() * 0.35;
    const heights = BOUNCES.map((share) => Math.min(share * power, 1) * track.lift);
    // A bounce's time in the air grows with the square root of its height.
    const weights = heights.map((height) => Math.sqrt(Math.max(height, 1)));
    const total = weights.reduce((sum, value) => sum + value, 0);
    pass = {
      from: x,
      to: target,
      duration,
      elapsed: 0,
      bounces: heights.map((height, index) => ({ height, time: (weights[index] / total) * duration * AIRTIME })),
    };
  };

  return {
    /** Advance by dt seconds along the given track. */
    step(dt, track) {
      if (x === null) x = track.from;
      let y = 0;
      let squash = 0;
      let velocity = 0;

      if (!pass) {
        // Resting at one end. If the layout moved the end (the volt word
        // changes width), roll gently back onto the track instead of jumping.
        const previous = x;
        x += (clamp(x, track.from, track.to) - x) * Math.min(1, dt * 5);
        velocity = dt > 0 ? (x - previous) / dt : 0;
        restLeft -= dt;
        if (restLeft <= 0) {
          direction = -direction;
          startPass(track);
        }
      } else {
        pass.elapsed += dt;
        const progress = Math.min(pass.elapsed / pass.duration, 1);
        const previous = x;
        x = pass.from + (pass.to - pass.from) * easeOutCubic(progress);
        velocity = dt > 0 ? (x - previous) / dt : 0;

        let clock = pass.elapsed;
        for (const bounce of pass.bounces) {
          if (clock < bounce.time) {
            const s = clock / bounce.time;
            y = 4 * bounce.height * s * (1 - s);
            const contact = Math.min(s, 1 - s);
            if (contact < SQUASH_WINDOW && track.lift > 0) {
              squash = (1 - contact / SQUASH_WINDOW) * Math.min(bounce.height / track.lift, 1) * 0.14;
            }
            break;
          }
          clock -= bounce.time;
        }

        if (progress >= 1) {
          pass = null;
          restLeft = rest;
        }
      }

      // Hops from typing ride on top of the kick.
      if (hop > 0 || hopVelocity > 0) {
        hopVelocity -= 1700 * dt;
        hop += hopVelocity * dt;
        if (hop <= 0) {
          hop = 0;
          hopVelocity = Math.abs(hopVelocity) > 90 ? -hopVelocity * 0.3 : 0;
        }
      }

      return { x, y: Math.min(y + hop, track.lift + 30), squash, velocity };
    },

    /** A nudge from typing: a small extra hop. */
    kick(amount = 1) {
      hopVelocity = Math.max(hopVelocity, 260 * amount);
      if (hop <= 0) hop = 0.01;
    },
  };
}
