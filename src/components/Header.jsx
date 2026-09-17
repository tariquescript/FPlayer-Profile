import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo-mark.png';
import myLogo from '../assets/logo-author.png';

const SOCIALS = [
  {
    href: 'https://github.com/tariquescript',
    label: 'GitHub',
    path: 'M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.57v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.21.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.48.99.11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.23-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.62-2.81 5.65-5.49 5.95.43.37.81 1.1.81 2.23v3.3c0 .32.21.69.83.57A12 12 0 0024 12c0-6.63-5.37-12-12-12z',
  },
  {
    href: 'https://www.linkedin.com/in/tariquedev',
    label: 'LinkedIn',
    path: 'M4.98 3.5C4.98 4.88 3.87 6 2.49 6S0 4.88 0 3.5 1.11 1 2.49 1s2.49 1.12 2.49 2.5zM0 8h5v16H0V8zm7.5 0h4.78v2.18h.07c.67-1.27 2.3-2.6 4.73-2.6C22.1 7.58 24 10.11 24 14.07V24h-5v-8.22c0-1.96-.04-4.48-2.73-4.48-2.73 0-3.15 2.13-3.15 4.34V24h-5V8z',
  },
  {
    href: 'https://x.com/tariquescript',
    label: 'X',
    path: 'M18.244 2H21.5l-7.39 8.44L22 22h-6.89l-5.39-7.04L3.5 22H.244l7.9-9.02L2 2h7.06l4.87 6.36L18.244 2z',
  },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-ink-600/70 bg-ink-950/75 backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3" aria-label="Home">
          <img src={logo} alt="" className="h-9 w-auto" />
          <span className="hidden font-display text-sm font-semibold tracking-tight text-mist-100 sm:block">
            Player<span className="text-pitch-400">Index</span>
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          <Link
            to="/"
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              pathname === '/' ? 'bg-ink-700/60 text-mist-100' : 'text-mist-400 hover:text-mist-100'
            }`}
          >
            Search
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <a
            href="https://tariquescript.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="opacity-90 transition hover:opacity-100"
            aria-label="Portfolio"
          >
            <img src={myLogo} alt="Portfolio" className="h-9 w-auto" />
          </a>

          <span className="hidden h-6 w-px bg-ink-600 sm:block" />

          <ul className="hidden items-center gap-1 sm:flex">
            {SOCIALS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="grid h-9 w-9 place-items-center rounded-xl text-mist-400 transition-colors hover:bg-ink-700/60 hover:text-mist-100"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
