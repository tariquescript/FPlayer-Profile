import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TransitionLink from './TransitionLink.jsx';
import Mark from './ui/Mark.jsx';
import { SearchIcon } from './ui/Icons.jsx';
import { BRAND } from '../brand.js';
import { withViewTransition } from '../lib/transition.js';
import { SOCIALS } from '../lib/socials.js';
import myLogo from '../assets/logo-author.png';

/** Asks the search field to take focus, opening the home page first if needed. */
function useFocusSearch() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return () => {
    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent('search:focus'));
      return;
    }
    withViewTransition(() => navigate('/', { state: { focusSearch: true } }));
  };
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const focusSearch = useFocusSearch();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showBuilt = () => {
    const scroll = () => document.getElementById('built')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (pathname === '/' && !search) {
      scroll();
      return;
    }
    withViewTransition(() => navigate('/'));
    setTimeout(scroll, 120);
  };

  return (
    <header
      style={{ viewTransitionName: 'site-header' }}
      className={`sticky top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled ? 'border-line bg-chalk/80 backdrop-blur-xl backdrop-saturate-150' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <TransitionLink to="/" className="group flex items-center gap-2.5" aria-label={`${BRAND.name} home`}>
          <Mark size={30} />
          <span className="letter-roll font-display font-wide text-[15px] font-extrabold uppercase tracking-[0.01em] text-ink">
            {[...BRAND.name].map((letter, index) => (
              <span key={index} style={{ '--i': index }} aria-hidden="true">
                {letter}
              </span>
            ))}
          </span>
        </TransitionLink>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate md:flex" aria-label="Main">
          <TransitionLink to="/" className={`link-draw ${pathname === '/' ? 'text-ink' : 'hover:text-ink'}`}>
            Players
          </TransitionLink>
          <button type="button" onClick={showBuilt} className="link-draw cursor-pointer hover:text-ink">
            How it’s built
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={focusSearch}
            className="group flex h-9 items-center gap-2 rounded-full border border-line bg-paper pl-3 pr-1.5 text-sm text-slate shadow-card transition hover:border-ink hover:text-ink"
            aria-label="Search players"
          >
            <SearchIcon size={15} />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden rounded-full bg-fog px-2 py-0.5 font-sans text-[11px] font-semibold text-graphite transition group-hover:bg-volt group-hover:text-ink sm:inline">
              ⌘K
            </kbd>
          </button>

          <span className="hidden h-6 w-px bg-line sm:block" />

          <a
            href="https://tariquescript.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="opacity-80 transition hover:opacity-100"
            aria-label="Tarique’s portfolio"
          >
            <img src={myLogo} alt="" className="h-8 w-auto brightness-0" />
          </a>

          <ul className="hidden items-center lg:flex">
            {SOCIALS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="grid h-9 w-9 place-items-center rounded-full text-slate transition-colors hover:bg-paper hover:text-ink"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={social.path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}
