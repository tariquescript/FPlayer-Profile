import { useCallback, useEffect, useState } from 'react';
import { keys, peekCache, searchPlayers } from '../lib/api.js';
import { localSearch } from '../lib/playerIndex.js';

const MIN_LENGTH = 2;

/**
 * Search that never shows a spinner it does not need to.
 *
 * State is derived during render: a cached query is "ready" on the very render
 * that asks for it, so navigating back from a profile restores the grid with no
 * flash and no refetch. Only a genuinely new query reaches the network, and a
 * response for a query the visitor has since moved past is ignored.
 *
 * Portraits are not prefetched here: each card loads its own profile when it
 * scrolls into view, which keeps upstream traffic proportional to what is seen.
 */
export function usePlayerSearch(query, page = 1, { live } = {}) {
  const trimmed = query.trim();
  // `query` is debounced and drives the network; `live` is what is in the box
  // right now and drives the instant local matches.
  const liveTrimmed = (live ?? query).trim();
  const key = trimmed.length >= MIN_LENGTH ? keys.search(trimmed, page) : null;

  // The last network outcome, remembered with the key it belongs to.
  const [remote, setRemote] = useState({ key: null, status: 'idle', data: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!key || peekCache(key)) return undefined;

    let alive = true;
    searchPlayers(trimmed, { page })
      .then((data) => alive && setRemote({ key, status: 'ready', data, error: null }))
      .catch((error) => alive && setRemote({ key, status: 'error', data: null, error }));

    return () => {
      alive = false;
    };
  }, [key, trimmed, page, attempt]);

  const retry = useCallback(() => {
    setRemote((previous) => ({ ...previous, status: 'retrying' }));
    setAttempt((value) => value + 1);
  }, []);

  // Mid-debounce: answer from players already seen, on the keystroke itself.
  const typing = liveTrimmed !== trimmed && liveTrimmed.length >= MIN_LENGTH;
  if (typing) {
    const local = page === 1 ? localSearch(liveTrimmed) : [];
    if (local.length) {
      return { status: 'loading', results: local, provisional: true, error: null, lastPage: 1, retry };
    }
    const current = key ? peekCache(key)?.results ?? [] : [];
    return { status: 'loading', results: current, provisional: false, error: null, lastPage: 1, retry };
  }

  if (!key) return { status: 'idle', results: [], provisional: false, error: null, lastPage: 1, retry };

  const cached = peekCache(key) ?? (remote.key === key && remote.status === 'ready' ? remote.data : null);
  if (cached) {
    return {
      status: 'ready',
      results: cached.results,
      provisional: false,
      error: null,
      lastPage: cached.lastPageNumber ?? 1,
      retry,
    };
  }

  if (remote.key === key && remote.status === 'error') {
    return { status: 'error', results: [], error: remote.error, lastPage: 1, retry };
  }

  // Loading: show players already seen that match what has been typed, so the
  // grid responds on the keystroke; the network answer then refines it. With
  // nothing local, keep the previous cards on screen rather than blanking.
  const local = page === 1 ? localSearch(trimmed) : [];
  const previous = remote.status === 'ready' ? remote.data?.results ?? [] : [];
  return {
    status: 'loading',
    results: local.length ? local : previous,
    provisional: local.length > 0,
    error: null,
    lastPage: 1,
    retry,
  };
}

export { MIN_LENGTH };
