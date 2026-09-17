import { useEffect, useRef, useState } from 'react';
import { fetchPlayerProfile, keys, peekCache, recentlyFailed } from '../lib/api.js';

/**
 * Fills in the details a search result does not carry — chiefly the portrait —
 * but only once the card is near the viewport. Search results therefore paint
 * immediately, and the network is spent only on cards someone can actually see.
 */
export function useLazyProfile(id) {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState({ id: null, profile: null });

  useEffect(() => {
    const element = ref.current;
    if (!id || !element) return undefined;
    if (peekCache(keys.profile(id)) || recentlyFailed(keys.profile(id))) return undefined;

    let alive = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        fetchPlayerProfile(id)
          .then((profile) => alive && setLoaded({ id, profile }))
          .catch(() => {});
      },
      { rootMargin: '400px 0px' },
    );
    observer.observe(element);

    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [id]);

  // The cache wins: a profile fetched by a hover prefetch or an earlier visit
  // shows up without this card having to ask for it.
  const profile = (id && peekCache(keys.profile(id))) || (loaded.id === id ? loaded.profile : null);
  return { ref, profile };
}
