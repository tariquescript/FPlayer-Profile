import { useCallback, useEffect, useRef, useState } from 'react';
import { CloseIcon, SearchIcon, SpinnerIcon } from './ui/Icons.jsx';

const RECENT_KEY = 'fpp:recent';
const MAX_RECENT = 6;

const SUGGESTIONS = ['Haaland', 'Bellingham', 'Yamal', 'Mbappé', 'Vinicius', 'Musiala'];

function readRecent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function rememberSearch(query) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return;
  try {
    const next = [trimmed, ...readRecent().filter((item) => item.toLowerCase() !== trimmed.toLowerCase())];
    localStorage.setItem(RECENT_KEY, JSON.stringify(next.slice(0, MAX_RECENT)));
  } catch {
    /* storage unavailable */
  }
}

/**
 * Type-to-search field. There is no submit button by design: results follow the
 * keystrokes, and Enter simply commits the term to the recent list.
 */
export default function SearchBar({ value, onChange, busy = false, resultCount = null }) {
  const inputRef = useRef(null);
  const [recent, setRecent] = useState(readRecent);
  const [focused, setFocused] = useState(false);

  // Cmd/Ctrl-K and "/" jump to the field from anywhere on the page.
  useEffect(() => {
    const onKeyDown = (event) => {
      const typingElsewhere = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typingElsewhere)) {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const commit = useCallback(
    (term) => {
      rememberSearch(term);
      setRecent(readRecent());
    },
    [],
  );

  const pick = (term) => {
    onChange(term);
    commit(term);
    inputRef.current?.focus();
  };

  // Recent searches once there are any; curated suggestions until then.
  const chips = recent.length ? recent : SUGGESTIONS;
  const chipLabel = recent.length ? 'Recent' : 'Try';

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div
        className="panel relative flex items-center gap-3 px-4 py-3 transition-all duration-300"
        style={{
          borderColor: focused ? 'color-mix(in oklab, var(--color-pitch-400) 55%, transparent)' : undefined,
          boxShadow: focused
            ? '0 0 0 4px color-mix(in oklab, var(--color-pitch-500) 12%, transparent), 0 30px 60px -35px rgba(0,0,0,.9)'
            : undefined,
        }}
      >
        <span className="text-mist-400">
          {busy ? <SpinnerIcon size={20} className="text-pitch-400" /> : <SearchIcon size={20} />}
        </span>

        <input
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit(value);
            if (event.key === 'Escape') onChange('');
          }}
          type="text"
          role="searchbox"
          inputMode="search"
          autoComplete="off"
          spellCheck="false"
          enterKeyHint="search"
          aria-label="Search football players"
          placeholder="Search any footballer…"
          className="w-full bg-transparent text-base text-mist-100 placeholder:text-mist-500 focus:outline-none"
        />

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="rounded-lg p-1 text-mist-400 transition hover:bg-white/5 hover:text-mist-100"
          >
            <CloseIcon size={18} />
          </button>
        )}

        <kbd className="hidden shrink-0 rounded-md border border-ink-500/80 bg-ink-800/70 px-1.5 py-0.5 font-sans text-[11px] text-mist-400 sm:block">
          ⌘K
        </kbd>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="stat-label">{chipLabel}</span>
        {chips.slice(0, MAX_RECENT).map((term) => (
          <button key={term} type="button" onClick={() => pick(term)} className="chip transition hover:text-mist-100">
            {term}
          </button>
        ))}
        {resultCount !== null && (
          <span className="ml-auto text-xs text-mist-400 num">
            {resultCount} {resultCount === 1 ? 'player' : 'players'}
          </span>
        )}
      </div>
    </div>
  );
}
