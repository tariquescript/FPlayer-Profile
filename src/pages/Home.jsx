import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import SearchBar from '../components/SearchBar.jsx';
import PlayerCard from '../components/PlayerCard.jsx';
import RollingWord from '../components/RollingWord.jsx';
import Showcase from '../components/home/Showcase.jsx';
import Built from '../components/home/Built.jsx';
import { GridSkeleton } from '../components/ui/Skeleton.jsx';
import { EmptyState, ErrorState, WakingNotice } from '../components/States.jsx';
import { ArrowLeft, ArrowRight, SearchIcon } from '../components/ui/Icons.jsx';

import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { usePlayerSearch, MIN_LENGTH } from '../hooks/usePlayerSearch.js';
import { useScrollMemory } from '../hooks/useScrollMemory.js';
import { hasCache } from '../lib/cache.js';
import { keys, warmBackend } from '../lib/api.js';

const WORDS = ['player.', 'transfer.', 'trophy.', 'price tag.', 'career.'];

export default function Home() {
  const [params, setParams] = useSearchParams();
  const { state } = useLocation();

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

  const scrollToResults = () =>
    document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="pb-4">
      {/* ------------------------------------------------------------ hero */}
      <section className="relative z-20 mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10">
        {/* The headline folds away while searching; grid rows animate its height. */}
        <div
          className="grid grid-cols-1 transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(.16,1,.3,1)]"
          style={{ gridTemplateRows: active ? '0fr' : '1fr', opacity: active ? 0 : 1 }}
          aria-hidden={active || undefined}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="flex animate-fade items-center justify-between gap-4 border-b border-line pb-4 text-[13px] text-slate">
              <span className="flex items-center gap-2.5 font-medium text-graphite">
                <span className="live-dot" /> Live Transfermarkt data
              </span>
              <span className="hidden sm:block">Market values · Transfers · Honours · Injuries · Shirt numbers</span>
            </div>

            <h1 data-ball-ceiling className="display mt-8 text-[clamp(2.35rem,8.4vw,8.25rem)] sm:mt-12">
              <span className="mask-line">
                <span style={{ '--d': '60ms' }}>Know every</span>
              </span>
              <span className="mask-line">
                <span style={{ '--d': '170ms' }}>
                  <RollingWord words={WORDS} paused={active} />
                </span>
              </span>
            </h1>

            <div className="mt-8 grid grid-cols-1 gap-6 pb-32 sm:mt-10 sm:pb-28 lg:grid-cols-12 lg:pb-10">
              <p
                data-ball-ceiling
                className="max-w-md animate-rise text-[17px] leading-relaxed text-slate lg:col-span-5 lg:col-start-8"
                style={{ animationDelay: '320ms' }}
              >
                <span className="font-medium text-ink">
                  Market values, transfers, honours, injuries and shirt numbers
                </span>{' '}
                for any footballer — pulled into one profile that opens the moment you click.
              </p>
            </div>
          </div>
        </div>

        <div
          className={`animate-rise transition-[padding] duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${active ? 'pt-20 sm:pt-24' : ''}`}
          style={{ animationDelay: '420ms' }}
        >
          <SearchBar
            value={input}
            onChange={setInput}
            busy={search.status === 'loading'}
            resultCount={search.status === 'ready' && active ? search.results.length : null}
            autoFocus={Boolean(state?.focusSearch)}
            onSubmit={scrollToResults}
          />
        </div>
      </section>

      {/* --------------------------------------------------------- results */}
      {active && (
        <section id="results" className="mx-auto mt-10 max-w-7xl scroll-mt-24 px-4 sm:px-6">
          {slowRequest && showSkeleton && (
            <div className="mb-6">
              <WakingNotice />
            </div>
          )}

          {showSkeleton && <GridSkeleton count={8} />}

          {search.status === 'error' && (
            <ErrorState error={search.error} title="Search failed" onRetry={search.retry} />
          )}

          {search.results.length > 0 && (
            <>
              <div className="mb-5 flex items-baseline justify-between gap-4">
                <h2 className="font-display font-semiwide text-xl font-bold">
                  Results for <span className="bg-volt px-1.5">{debounced.trim() || input.trim()}</span>
                </h2>
                {search.lastPage > 1 && (
                  <span className="num text-sm text-slate">
                    Page {page} of {search.lastPage}
                  </span>
                )}
              </div>

              <div
                className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
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
                  <button type="button" className="btn btn-ghost" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                    <ArrowLeft size={16} />
                    Previous
                  </button>
                  <span className="num text-sm text-slate">
                    {page} / {search.lastPage}
                  </span>
                  <button
                    type="button"
                    className="btn btn-primary"
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

          {search.status === 'ready' && search.results.length === 0 && (
            <EmptyState
              icon={<SearchIcon size={26} />}
              title={`No players match “${debounced.trim()}”`}
              message="Try a surname on its own, or check the spelling — accents are optional."
            />
          )}
        </section>
      )}

      {/* ------------------------------------------------------- showcase */}
      {!active && (
        <>
          <Showcase />
          <Built />
        </>
      )}
    </div>
  );
}
