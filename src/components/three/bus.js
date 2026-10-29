/**
 * Lets the page nudge its 3D models (the ball hops as you type) without
 * importing three.js: this file is tiny and lives in the main bundle, the
 * models subscribe once their lazily loaded runtime is up.
 */
const listeners = new Set();

export function kickModels(amount = 1) {
  listeners.forEach((listener) => listener(amount));
}

export function onKick(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
