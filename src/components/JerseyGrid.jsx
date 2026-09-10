import Crest from './ui/Crest.jsx';

/**
 * Shirt numbers by season. The endpoint returns only a club id, so names are
 * resolved from a lookup the profile page assembles out of the other sections.
 */
export default function JerseyGrid({ jerseyNumbers = [], clubNames = {} }) {
  if (!jerseyNumbers.length) {
    return <p className="py-8 text-center text-sm text-mist-400">No shirt number history.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 stagger">
      {jerseyNumbers.map((entry, index) => (
        <div
          key={`${entry.season}-${entry.club}-${index}`}
          style={{ '--i': Math.min(index, 12) }}
          className="flex items-center gap-3 rounded-2xl border border-ink-600/70 bg-ink-800/40 px-3.5 py-3 transition-colors hover:border-volt-400/35"
        >
          <span className="num grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-volt-400/25 bg-volt-500/10 text-base font-bold text-volt-300">
            {entry.jerseyNumber ?? '—'}
          </span>
          <span className="min-w-0">
            <span className="num block text-sm font-medium text-mist-200">{entry.season ?? '—'}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-mist-400">
              <Crest clubId={entry.club} size={14} />
              <span className="truncate">{clubNames[entry.club] ?? 'Club'}</span>
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
