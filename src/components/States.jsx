import { SearchIcon, BoltIcon } from './ui/Icons.jsx';

export function EmptyState({ title, message, icon = null, action = null }) {
  return (
    <div className="panel mx-auto flex max-w-md flex-col items-center gap-4 px-8 py-14 text-center">
      <div className="relative grid h-16 w-16 place-items-center rounded-2xl border border-ink-600 bg-ink-800 text-pitch-400">
        <span className="absolute inset-0 rounded-2xl border border-pitch-400/30 animate-pulse-ring" />
        {icon ?? <SearchIcon size={26} />}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-mist-400">{message}</p>
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  const message =
    error?.message ?? 'The request failed. Please try again in a moment.';

  return (
    <div className="panel mx-auto flex max-w-md flex-col items-center gap-4 px-8 py-14 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-ember-400/30 bg-ember-400/10 text-ember-400">
        <BoltIcon size={26} />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-mist-400">{message}</p>
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
    <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-flare-400/25 bg-flare-500/8 px-4 py-3 text-sm text-flare-400">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flare-400 opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-flare-400" />
      </span>
      <p>Waking the data service — the first search after a quiet spell can take a moment.</p>
    </div>
  );
}
