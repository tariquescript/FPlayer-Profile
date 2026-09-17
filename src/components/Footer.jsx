import { MODE } from '../lib/api.js';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-ink-600/60 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 text-center sm:px-6">
        <p className="text-sm text-mist-400">
          Data from the Transfermarkt API ·{' '}
          <span className="text-mist-500">
            served {MODE === 'gateway' ? 'through the caching gateway' : 'directly from the upstream API'}
          </span>
        </p>
        <p className="text-xs text-mist-500">
          Built by{' '}
          <a
            href="https://tariquescript.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="text-pitch-400 underline-offset-4 hover:underline"
          >
            Tarique
          </a>
          . Not affiliated with Transfermarkt.
        </p>
      </div>
    </footer>
  );
}
