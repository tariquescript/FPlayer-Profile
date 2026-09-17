import { classifySocial } from '../lib/profile.js';

/**
 * Brand glyphs drawn with currentColor, so they stay legible on the dark UI and
 * pick up the hover colour — the old multi-colour SVG files included a black X
 * logo that vanished against the background.
 */
const PATHS = {
  instagram:
    'M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2-.1-1.3-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.2-.1 1.6-.1 4.8-.1zm0 4.9a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8zm0 8.1a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.1-9.4a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3z',
  twitter:
    'M18.244 2H21.5l-7.39 8.44L22 22h-6.89l-5.39-7.04L3.5 22H.244l7.9-9.02L2 2h7.06l4.87 6.36L18.244 2zm-1.21 18h1.8L7.98 4H6.06l10.974 16z',
  youtube:
    'M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15.1V8.9l5.8 3.1z',
  facebook:
    'M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12z',
  tiktok:
    'M16.6 2h-3.4v13.3a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9a6.3 6.3 0 1 0 5.4 6.3V8.6a8 8 0 0 0 4.7 1.5V6.7a4.7 4.7 0 0 1-4.7-4.7z',
  twitch:
    'M4.3 2 3 5.4v13.8h4.7V22h2.6l2.7-2.8h3.8L22 14V2zm15.8 11.1-2.9 3H12.4l-2.6 2.6v-2.6H5.9V3.9h14.2zM17.3 7v5.4h-1.9V7zm-5.1 0v5.4h-1.9V7z',
  portfolio:
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.9a15.6 15.6 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8zM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.8 1.9-4zM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4zm.8 2h2.9c.3 1.3.8 2.5 1.4 3.6A8 8 0 0 1 5.1 16zM8 8H5.1a8 8 0 0 1 4.3-3.6C8.8 5.5 8.3 6.7 8 8zm4 12c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.8-1.9 4zm2.3-6H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4zm.3 5.6c.6-1.1 1.1-2.3 1.4-3.6h2.9a8 8 0 0 1-4.3 3.6zM16.3 14a16.5 16.5 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4z',
};

export default function SocialLinks({ links = [] }) {
  if (!links.length) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {links.map((link, index) => {
        const { key, label } = classifySocial(link);
        return (
          <a
            key={`${link}-${index}`}
            href={link}
            target="_blank"
            rel="noreferrer"
            title={label}
            aria-label={label}
            className="grid h-10 w-10 place-items-center rounded-xl border border-ink-600 bg-ink-800/60 text-mist-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-pitch-400/50 hover:bg-ink-700 hover:text-mist-100"
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
              <path d={PATHS[key] ?? PATHS.portfolio} />
            </svg>
          </a>
        );
      })}
    </div>
  );
}
