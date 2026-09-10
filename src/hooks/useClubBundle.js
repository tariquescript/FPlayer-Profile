import { useCallback, useEffect, useState } from 'react';
import { fetchClubBundle, keys, peekCache } from '../lib/api.js';

export function useClubBundle(id) {
  const key = id ? keys.club(id) : null;
  const [remote, setRemote] = useState({ key: null, status: 'idle', bundle: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!key || peekCache(key)) return undefined;

    let alive = true;
    fetchClubBundle(id)
      .then((bundle) => alive && setRemote({ key, status: 'ready', bundle, error: null }))
      .catch((error) => alive && setRemote({ key, status: 'error', bundle: null, error }));

    return () => {
      alive = false;
    };
  }, [key, id, attempt]);

  const retry = useCallback(() => {
    setRemote((previous) => ({ ...previous, status: 'retrying' }));
    setAttempt((value) => value + 1);
  }, []);

  if (!key) return { status: 'idle', bundle: null, error: null, retry };

  const bundle = peekCache(key) ?? (remote.key === key && remote.status === 'ready' ? remote.bundle : null);
  if (bundle) return { status: 'ready', bundle, error: null, retry };
  if (remote.key === key && remote.status === 'error') return { status: 'error', bundle: null, error: remote.error, retry };
  return { status: 'loading', bundle: null, error: null, retry };
}
