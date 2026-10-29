import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Scrolls to the top on a forward navigation only. Back and forward through
 * history keep their position, which is what useScrollMemory restores.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  // Layout effect: during a View Transition the new page must already be at the
  // top when the browser takes its snapshot.
  useLayoutEffect(() => {
    if (navigationType === 'POP') return;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, navigationType]);

  return null;
}
