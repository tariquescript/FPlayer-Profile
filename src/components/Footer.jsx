import Wordmark from './Wordmark.jsx';
import { SOCIALS } from '../lib/socials.js';
import { BRAND } from '../brand.js';
import { MODE } from '../lib/api.js';

export default function Footer() {
  return (
    <footer className="mt-28 overflow-hidden border-t border-line bg-paper">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-display font-semiwide text-2xl font-bold tracking-tight text-ink">
            Built for the curious fan.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate">
            A portfolio project by{' '}
            <a href="https://tariquescript.vercel.app/" target="_blank" rel="noreferrer" className="link-draw font-semibold text-ink">
              Tarique
            </a>{' '}
            — React, Vite, three.js and a caching layer in front of the Transfermarkt API.
          </p>
        </div>

        <div>
          <p className="stat-label">Elsewhere</p>
          <ul className="mt-4 space-y-2 text-sm font-medium text-graphite">
            <li>
              <a href="https://tariquescript.vercel.app/" target="_blank" rel="noreferrer" className="link-draw hover:text-ink">
                Portfolio
              </a>
            </li>
            {SOCIALS.map((social) => (
              <li key={social.label}>
                <a href={social.href} target="_blank" rel="noreferrer" className="link-draw hover:text-ink">
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="stat-label">Data</p>
          <p className="mt-4 text-sm leading-relaxed text-graphite">
            Transfermarkt API,{' '}
            {MODE === 'gateway' ? 'served through the caching gateway' : 'called directly from your browser'}.
          </p>
          <p className="mt-2 text-xs text-ash">Not affiliated with Transfermarkt.</p>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6">
        <Wordmark name={BRAND.name} />
      </div>
    </footer>
  );
}
