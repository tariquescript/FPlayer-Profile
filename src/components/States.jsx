import { SearchIcon, BoltIcon } from './ui/Icons.jsx';

export function EmptyState({ title, message, icon = null, action = null }) {
  return (
    <div className="card mx-auto flex max-w-md animate-rise flex-col items-center gap-4 px-8 py-14 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-volt text-ink">
        {icon ?? <SearchIcon size={26} />}
      </div>
      <h3 className="font-display font-semiwide text-lg font-bold">{title}</h3>
      <p className="text-sm leading-relaxed text-slate">{message}</p>
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  const message = error?.message ?? 'The request failed. Please try again in a moment.';

  return (
    <div className="card mx-auto flex max-w-md animate-rise flex-col items-center gap-4 px-8 py-14 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-signal-soft text-signal">
        <BoltIcon size={26} />
      </div>
      <h3 className="font-display font-semiwide text-lg font-bold">{title}</h3>
      <p className="text-sm leading-relaxed text-slate">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-primary">
          Try again
        </button>
      )}
    </div>
  );
}

/**
 * Shown while a cold Render instance wakes up. Saying so is better than a
 * spinner that looks broken for forty seconds.
 */
export function WakingNotice() {
  return (
    <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-gold/25 bg-gold-soft px-4 py-3 text-sm text-gold">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
      </span>
      <p>Waking the data service — the first search after a quiet spell can take a moment.</p>
    </div>
  );
}
