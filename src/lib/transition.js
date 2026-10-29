import { flushSync } from 'react-dom';

/**
 * Runs a navigation inside a same-document View Transition, so pages
 * cross-fade and named elements (a player's portrait) fly between them.
 * Browsers without the API, and visitors who prefer reduced motion, simply
 * navigate.
 */
export function withViewTransition(update) {
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof document === 'undefined' || !document.startViewTransition || reduced) {
    update();
    return;
  }
  // flushSync makes the new route render inside the callback, so the browser
  // snapshots the finished page rather than a half-updated one.
  document.startViewTransition(() => flushSync(update));
}

/** The portrait that should morph into the next page's hero. */
export const PORTRAIT_TRANSITION = 'player-portrait';

export function markPortrait(element) {
  if (element) element.style.viewTransitionName = PORTRAIT_TRANSITION;
}
