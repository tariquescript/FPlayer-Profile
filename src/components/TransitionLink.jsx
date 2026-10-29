import { forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { withViewTransition } from '../lib/transition.js';

/**
 * A router link that navigates inside a View Transition. Modified clicks
 * (new tab, new window) keep the browser's own behaviour.
 *
 * `onBeforeTransition` runs just before the old page is captured — the place
 * to name the element that should morph into the next page.
 */
const TransitionLink = forwardRef(function TransitionLink(
  { to, state, replace = false, onClick, onBeforeTransition, target, ...rest },
  ref,
) {
  const navigate = useNavigate();

  const handleClick = (event) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (target && target !== '_self')
    ) {
      return;
    }
    event.preventDefault();
    onBeforeTransition?.();
    withViewTransition(() => navigate(to, { state, replace }));
  };

  return <Link ref={ref} to={to} state={state} replace={replace} target={target} onClick={handleClick} {...rest} />;
});

export default TransitionLink;
