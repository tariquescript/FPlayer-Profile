import { useCallback, useEffect, useState } from 'react';
import { fetchPlayerBundle, keys, peekCache } from '../lib/api.js';

/** Background retries for a bundle that came back with sections missing. */
const REFILL_DELAYS = [3_000, 8_000, 20_000];

/**
 * Loads a full player profile. If a card prefetched it — or the visitor has
 * been here before — the page renders complete on its first frame.
 *
 * A bundle with missing sections (the upstream refused some requests) is shown
 * as-is and quietly re-requested a few times until it fills in.
 */
export function usePlayerBundle(id, { seed } = {}) {
  const key = id ? keys.bundle(id) : null;
  const [remote, setRemote] = useState({ key: null, status: 'idle', bundle: null, error: null });
  const [refill, setRefill] = useState({ key: null, count: 0 });

  useEffect(() => {
    if (!key || peekCache(key)) return undefined;

    let alive = true;
    fetchPlayerBundle(id)
      .then((bundle) => alive && setRemote({ key, status: 'ready', bundle, error: null }))
      .catch((error) => alive && setRemote({ key, status: 'error', bundle: null, error }));

    return () => {
      alive = false;
    };
  }, [key, id]);

  const complete = key
    ? peekCache(key) ?? (remote.key === key && remote.status === 'ready' ? remote.bundle : null)
    : null;
  const refillCount = refill.key === key ? refill.count : 0;
  const hasGaps = Boolean(complete?.partial?.length);

  useEffect(() => {
    if (!key || !hasGaps || refillCount >= REFILL_DELAYS.length) return undefined;

    let alive = true;
    const timer = setTimeout(() => {
      setRefill({ key, count: refillCount + 1 });
      fetchPlayerBundle(id, { force: true })
        .then((bundle) => alive && setRemote({ key, status: 'ready', bundle, error: null }))
        .catch(() => {});
    }, REFILL_DELAYS[refillCount]);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [key, id, hasGaps, refillCount]);

  // A manual retry always goes to the network: the cached copy is the thing
  // the visitor is unhappy with.
  const retry = useCallback(() => {
    if (!key) return;
    setRemote((previous) => ({ ...previous, key, status: 'retrying' }));
    setRefill({ key: null, count: 0 });
    fetchPlayerBundle(id, { force: true })
      .then((bundle) => setRemote({ key, status: 'ready', bundle, error: null }))
      .catch((error) => setRemote({ key, status: 'error', bundle: null, error }));
  }, [id, key]);

  if (!key) return { status: 'idle', bundle: null, error: null, gaps: [], retry };

  if (complete) {
    const gaps = complete.partial ?? [];
    return {
      status: 'ready',
      bundle: complete,
      error: null,
      gaps,
      refilling: gaps.length > 0 && refillCount < REFILL_DELAYS.length,
      retry,
    };
  }

  // A card can hand over the profile it already had, so the header paints
  // immediately while the remaining sections stream in.
  const profile = seed ?? peekCache(keys.profile(id));
  const partial = profile ? { id, profile } : null;

  if (remote.key === key && remote.status === 'error') {
    return { status: 'error', bundle: partial, error: remote.error, gaps: [], retry };
  }
  return { status: 'loading', bundle: partial, error: null, gaps: [], retry };
}
