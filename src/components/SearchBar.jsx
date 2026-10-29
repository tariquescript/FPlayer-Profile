import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KickBall from './three/KickBall.jsx';
import { kickModels } from './three/bus.js';
import { ArrowRight, CloseIcon, SearchIcon, SpinnerIcon } from './ui/Icons.jsx';
import { MIN_LENGTH } from '../hooks/usePlayerSearch.js';
import { FEATURED } from '../lib/featured.js';
import { prefetchPlayer } from '../lib/api.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { withViewTransition } from '../lib/transition.js';

const RECENT_KEY = 'fpp:recent';
const MAX_RECENT = 5;
const TRENDING = FEATURED.slice(0, 5);

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
  if (trimmed.length < MIN_LENGTH) return;
  try {
    const next = [trimmed, ...readRecent().filter((item) => item.toLowerCase() !== trimmed.toLowerCase())];
    localStorage.setItem(RECENT_KEY, JSON.stringify(next.slice(0, MAX_RECENT)));
  } catch {
    /* storage unavailable */
  }
}

/**
 * The command bar. Results follow the keystrokes, so there is no submit step;
 * Enter only commits the term to the recent list. Focused while empty, it
 * opens a panel of recent searches and trending players that the arrow keys
 * move through.
 *
 * A 3D match ball is kicked back and forth along its top edge: it hops as you
 * type and spins while a search is in flight.
 */
export default function SearchBar({ value, onChange, busy = false, resultCount = null, autoFocus = false, onSubmit }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listId = useId();
  const [recent, setRecent] = useState(readRecent);
  const [focused, setFocused] = useState(false);
  const [cursor, setCursor] = useState(-1);

  const focus = useCallback(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // Cmd/Ctrl-K and "/" jump to the field from anywhere; the header asks too.
  useEffect(() => {
    const onKeyDown = (event) => {
      const typingElsewhere = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typingElsewhere)) {
        event.preventDefault();
        focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('search:focus', focus);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('search:focus', focus);
    };
  }, [focus]);

  useEffect(() => {
    if (autoFocus) focus();
  }, [autoFocus, focus]);

  const commit = (term) => {
    rememberSearch(term);
    setRecent(readRecent());
  };

  const open = focused && value.trim().length < MIN_LENGTH;
  const items = [
    ...recent.map((term) => ({ type: 'recent', key: `r:${term}`, label: term })),
    ...TRENDING.map((player) => ({ type: 'player', key: `p:${player.id}`, label: player.name, id: player.id })),
  ];

  const choose = (item) => {
    if (item.type === 'recent') {
      onChange(item.label);
      commit(item.label);
      kickModels(1.2);
      return;
    }
    inputRef.current?.blur();
    withViewTransition(() => navigate(`/player/${item.id}`));
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      if (value) onChange('');
      else inputRef.current?.blur();
      return;
    }
    if (open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      // -1 is the input itself; the cursor wraps through it.
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setCursor((current) => ((current + 1 + step + items.length + 1) % (items.length + 1)) - 1);
      return;
    }
    if (event.key === 'Enter') {
      if (open && items[cursor]) {
        event.preventDefault();
        choose(items[cursor]);
        return;
      }
      commit(value);
      onSubmit?.();
    }
  };

  const activeItem = open ? items[cursor] : null;

  return (
    <div className="relative mx-auto w-full">
      {/* The match ball, kicked back and forth along the bar under the volt word. */}
      <KickBall busy={busy} />

      <div
        className="search-field flex h-16 items-center gap-2.5 pl-3 pr-2 sm:h-[70px] sm:gap-3 sm:pl-3.5"
        data-focused={focused || undefined}
      >
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors duration-300 ${
            focused || busy ? 'bg-volt-soft text-ink' : 'bg-chalk text-slate'
          }`}
        >
          {busy ? <SpinnerIcon size={18} /> : <SearchIcon size={18} />}
        </span>

        <div className="relative h-full min-w-0 flex-1">
          {!value && <PlaceholderHint />}
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              setCursor(-1);
              kickModels(0.7);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              setCursor(-1);
            }}
            onKeyDown={onKeyDown}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeItem ? `${listId}-${activeItem.key}` : undefined}
            inputMode="search"
            autoComplete="off"
            spellCheck="false"
            enterKeyHint="search"
            aria-label="Search football players"
            className="relative h-full w-full bg-transparent text-[17px] font-medium tracking-[-0.01em] text-ink caret-ink focus:outline-none sm:text-lg"
          />
        </div>

        {resultCount !== null && (
          <span className="num hidden shrink-0 rounded-full bg-chalk px-3 py-1 text-xs font-semibold text-slate animate-fade sm:block">
            {resultCount} {resultCount === 1 ? 'player' : 'players'}
          </span>
        )}

        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ash transition hover:bg-chalk hover:text-ink"
          >
            <CloseIcon size={16} />
          </button>
        ) : (
          <span className="hidden shrink-0 items-center gap-1 sm:flex" aria-hidden="true">
            <Keycap>{IS_MAC ? '⌘' : 'Ctrl'}</Keycap>
            <Keycap>K</Keycap>
          </span>
        )}

        <button
          type="button"
          onClick={() => {
            commit(value);
            if (value.trim().length >= MIN_LENGTH) onSubmit?.();
            else focus();
          }}
          aria-label="Search"
          className={`flex h-11 shrink-0 items-center gap-2 rounded-[14px] px-3.5 text-sm font-semibold transition-[background-color,color,transform] duration-300 active:scale-[0.97] sm:h-12 sm:px-5 ${
            value.trim()
              ? 'bg-volt text-ink hover:bg-ink hover:text-white'
              : 'bg-ink text-white hover:bg-volt hover:text-ink'
          }`}
        >
          <span className="hidden sm:inline">Search</span>
          <ArrowRight size={17} />
        </button>

        {/* A fine line runs along the foot of the bar while a search is in flight. */}
        {busy && <span className="search-progress" aria-hidden="true" />}
      </div>

      {/* Suggestions: kept mounted so it can animate in and out. */}
      <div
        id={listId}
        role="listbox"
        aria-label="Suggestions"
        onMouseDown={(event) => event.preventDefault()}
        className={`search-panel absolute inset-x-0 top-full z-30 mt-3 origin-top p-2 transition-[opacity,transform,visibility] duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${
          open ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible -translate-y-2 scale-[0.98] opacity-0'
        }`}
      >
        <div className="grid gap-1 sm:grid-cols-2">
          <Group title={recent.length ? 'Recent searches' : 'Start typing'}>
            {recent.length ? (
              items
                .filter((item) => item.type === 'recent')
                .map((item) => (
                  <Option key={item.key} id={`${listId}-${item.key}`} active={activeItem === item} onClick={() => choose(item)}>
                    <ClockGlyph />
                    <span className="truncate">{item.label}</span>
                  </Option>
                ))
            ) : (
              <p className="px-3 py-2 text-sm leading-relaxed text-slate">
                Surnames work best. Accents are optional — <span className="text-ink">mbappe</span> finds Mbappé.
              </p>
            )}
          </Group>

          <Group title="Trending players">
            {items
              .filter((item) => item.type === 'player')
              .map((item) => (
                <Option
                  key={item.key}
                  id={`${listId}-${item.key}`}
                  active={activeItem === item}
                  onClick={() => choose(item)}
                  onMouseEnter={() => prefetchPlayer(item.id, { full: true })}
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-volt text-[10px] font-bold text-ink">
                    ↗
                  </span>
                  <span className="truncate">{item.label}</span>
                  <ArrowRight size={15} className="ml-auto shrink-0 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Option>
              ))}
          </Group>
        </div>
        <p className="mt-1 hidden items-center gap-3 border-t border-line px-3 pt-2.5 pb-1 text-[11px] text-ash sm:flex">
          <span><Key>↑</Key> <Key>↓</Key> to move</span>
          <span><Key>Enter</Key> to open</span>
          <span><Key>Esc</Key> to close</span>
        </p>
      </div>
    </div>
  );
}

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

const HINTS = ['Haaland', 'Bellingham', 'Yamal', 'Mbappé', 'Musiala', 'Saka', 'Pedri'];

/**
 * The placeholder, drawn over the empty field so the example name can roll:
 * "Search any footballer, e.g. Haaland" → "… e.g. Bellingham" and so on.
 */
function PlaceholderHint() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced) return undefined;
    const timer = setInterval(() => setIndex((current) => (current + 1) % HINTS.length), 2400);
    return () => clearInterval(timer);
  }, [reduced]);

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center whitespace-nowrap text-[17px] tracking-[-0.01em] text-ash sm:text-lg"
    >
      Search any footballer
      <span className="sm:hidden">…</span>
      <span className="hidden sm:inline">,&nbsp;e.g.&nbsp;</span>
      <span className="hidden h-[1.4em] items-center overflow-hidden sm:inline-flex">
        <span key={index} className="hint-in font-medium text-slate">
          {HINTS[index]}
        </span>
      </span>
    </span>
  );
}

function Keycap({ children }) {
  return (
    <kbd className="grid h-7 min-w-7 place-items-center rounded-lg border border-line bg-paper px-1.5 font-sans text-[11px] font-semibold text-slate shadow-[0_1px_0_var(--color-line)]">
      {children}
    </kbd>
  );
}

function Group({ title, children }) {
  return (
    <div className="p-1">
      <p className="stat-label px-3 pt-2 pb-1.5">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Option({ id, active, children, ...rest }) {
  return (
    <button
      type="button"
      id={id}
      role="option"
      aria-selected={active}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
        active ? 'bg-chalk text-ink' : 'text-graphite hover:bg-chalk hover:text-ink'
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}

function Key({ children }) {
  return <kbd className="rounded border border-line bg-chalk px-1 font-sans text-[10px] text-slate">{children}</kbd>;
}

function ClockGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-ash" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" />
    </svg>
  );
}
