import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import SearchBar from '../components/SearchBar.jsx';
import PlayerCard from '../components/PlayerCard.jsx';
import FeaturedRail from '../components/FeaturedRail.jsx';
import { GridSkeleton } from '../components/ui/Skeleton.jsx';
import { EmptyState, ErrorState, WakingNotice } from '../components/States.jsx';
import { ArrowLeft, ArrowRight, BoltIcon, SearchIcon } from '../components/ui/Icons.jsx';

import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { usePlayerSearch, MIN_LENGTH } from '../hooks/usePlayerSearch.js';
import { useScrollMemory } from '../hooks/useScrollMemory.js';
import { hasCache } from '../lib/cache.js';
import { keys, warmBackend } from '../lib/api.js';
import HeroBall from '../components/three/HeroBall.jsx';

export default function Home() {
  const [params, setParams] = useSearchParams();

  const queryParam = params.get('q') ?? '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [input, setInput] = useState(queryParam);

  // A query already in the cache skips the debounce entirely, so re-running a
  // previous search feels instantaneous.
  const isCached = useMemo(
    () => (value) => value.trim().length >= MIN_LENGTH && hasCache(keys.search(value.trim(), 1)),
    [],
  );
  const debounced = useDebouncedValue(input, 250, { immediate: isCached });

  // Keep the URL in step with the box: the query survives reloads, sharing and
  // — with the cache — a round trip through a player profile. This runs only
  // when the debounced term changes, so it can never undo a URL change made
  // elsewhere (the header link, the back button).
  useEffect(() => {
    const trimmed = debounced.trim();
    const current = new URLSearchParams(window.location.search);
    if ((current.get('q') ?? '') === trimmed) return;

    if (trimmed) current.set('q', trimmed);
    else current.delete('q');
    current.delete('page');
    setParams(current, { replace: true });
  }, [debounced, setParams]);

  // If the URL changes underneath us (header link, back/forward), follow it.
  // Our own writes echo back equal to the debounced term and are ignored.
  const [syncedParam, setSyncedParam] = useState(queryParam);
  if (queryParam !== syncedParam) {
    setSyncedParam(queryParam);
    if (queryParam !== debounced.trim()) setInput(queryParam);
  }

  // Nudge a sleeping backend awake while the visitor is still reading the hero.
  useEffect(() => {
    warmBackend();
  }, []);

  const search = usePlayerSearch(debounced, page, { live: input });
  const active = input.trim().length >= MIN_LENGTH;
  const showSkeleton = search.status === 'loading' && search.results.length === 0;

  // After three seconds without an answer, say why: a cold Render instance is
  // far less alarming when the page admits it is waking up.
  const [slowQuery, setSlowQuery] = useState(null);
  useEffect(() => {
    if (search.status !== 'loading') return undefined;
    const term = debounced.trim();
    const timer = setTimeout(() => setSlowQuery(term), 3_000);
    return () => clearTimeout(timer);
  }, [search.status, debounced]);
  const slowRequest = search.status === 'loading' && slowQuery === debounced.trim();

  useScrollMemory(active ? `home:${debounced.trim()}:${page}` : 'home', search.status === 'ready');

  const goToPage = (next) => {
    const nextParams = new URLSearchParams(params);
    nextParams.set('page', String(next));
    setParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pb-10">
      <section
        className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
        style={{ paddingTop: active ? '1.5rem' : '3rem', transition: 'padding .5s ease' }}
      >
        <div className="relative z-10">
          <span className={`chip chip-accent animate-fade ${active ? 'max-sm:hidden' : ''}`}>
            <BoltIcon size={13} />
            Live Transfermarkt data
          </span>

          <h1
            className={`font-display font-extrabold leading-[1.05] tracking-tight sm:mt-5 sm:text-5xl lg:text-6xl ${
              active ? 'text-2xl max-sm:mt-0' : 'mt-5 text-4xl'
            }`}
          >
            Every footballer,
            <br />
            <span className="gradient-text">one search away.</span>
          </h1>

          <p className={`mt-4 max-w-lg text-base leading-relaxed text-mist-300 ${active ? 'max-sm:hidden' : ''}`}>
            Market values, transfer history, honours, injuries and shirt numbers — pulled together into a single
            profile and cached so it opens the moment you click.
          </p>

          <div className={active ? 'mt-5 sm:mt-8' : 'mt-8'}>
            <SearchBar
              value={input}
              onChange={setInput}
              busy={search.status === 'loading'}
              resultCount={search.status === 'ready' && active ? search.results.length : null}
            />
          </div>
        </div>

        <div
          className={`relative mx-auto w-full ${active ? 'max-sm:hidden' : ''} ${
            active ? 'h-[200px]' : 'h-[300px] sm:h-[420px]'
          }`}
          style={{ transition: 'height .6s cubic-bezier(.22,1,.36,1)' }}
        >
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-pitch-500/10 blur-3xl" />
          <HeroBall className="h-full w-full" />
        </div>
      </section>

      <div className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
        {slowRequest && showSkeleton && (
          <div className="mb-6">
            <WakingNotice />
          </div>
        )}
      </div>

      <section className="mx-auto mt-2 max-w-7xl px-4 sm:px-6">
        {!active && <FeaturedRail />}

        {active && showSkeleton && <GridSkeleton count={8} />}

        {active && search.status === 'error' && (
          <ErrorState error={search.error} title="Search failed" onRetry={search.retry} />
        )}

        {active && search.results.length > 0 && (
          <>
            <div
              className="grid gap-5 stagger sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              style={{
                opacity: search.status === 'loading' && !search.provisional ? 0.55 : 1,
                transition: 'opacity .25s ease',
              }}
            >
              {search.results.map((player, index) => (
                <PlayerCard key={player.id} player={player} index={index} />
              ))}
            </div>

            {search.lastPage > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  <ArrowLeft size={16} />
                  Previous
                </button>
                <span className="num text-sm text-mist-400">
                  Page {page} of {search.lastPage}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={page >= search.lastPage}
                  onClick={() => goToPage(page + 1)}
                >
                  Next
                  <ArrowRight size={16} />
                </button>
              </nav>
            )}
          </>
        )}

        {active && search.status === 'ready' && search.results.length === 0 && (
          <EmptyState
            icon={<SearchIcon size={26} />}
            title={`No players match “${debounced.trim()}”`}
            message="Try a surname on its own, or check the spelling — accents are optional."
          />
        )}
      </section>
    </div>
  );
}
