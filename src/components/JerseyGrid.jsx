import Crest from './ui/Crest.jsx';

/**
 * Shirt numbers by season. The endpoint returns only a club id, so names are
 * resolved from a lookup the profile page assembles out of the other sections.
 */
export default function JerseyGrid({ jerseyNumbers = [], clubNames = {} }) {
  if (!jerseyNumbers.length) {
    return <p className="py-8 text-center text-sm text-slate">No shirt number history.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 stagger">
      {jerseyNumbers.map((entry, index) => (
        <div
          key={`${entry.season}-${entry.club}-${index}`}
          style={{ '--i': Math.min(index, 12) }}
          className="group flex items-center gap-3 rounded-2xl border border-line bg-paper px-3.5 py-3 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong"
        >
          <span className="num grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink font-display text-base font-extrabold text-volt transition-transform duration-300 group-hover:scale-105">
            {entry.jerseyNumber ?? '—'}
          </span>
          <span className="min-w-0">
            <span className="num block text-sm font-semibold text-ink">{entry.season ?? '—'}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate">
              <Crest clubId={entry.club} size={14} />
              <span className="truncate">{clubNames[entry.club] ?? 'Club'}</span>
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
