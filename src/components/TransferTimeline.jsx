import { Link } from 'react-router-dom';
import Crest from './ui/Crest.jsx';
import { ArrowRight } from './ui/Icons.jsx';
import { date as fmtDate, fee as fmtFee, money } from '../lib/format.js';

/** Career moves, newest first, with the fee and the value at the time. */
export default function TransferTimeline({ transfers = [] }) {
  if (!transfers.length) {
    return <p className="py-8 text-center text-sm text-mist-400">No transfers recorded.</p>;
  }

  return (
    <ol className="relative space-y-3 stagger">
      {transfers.map((transfer, index) => (
        <li
          key={transfer.id ?? `${transfer.date}-${index}`}
          style={{ '--i': Math.min(index, 10) }}
          className="group relative rounded-2xl border border-ink-600/70 bg-ink-800/40 p-4 transition-colors hover:border-pitch-400/35 hover:bg-ink-800/70"
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <span className="chip chip-volt shrink-0">{transfer.season ?? '—'}</span>

            <div className="flex min-w-0 flex-1 items-center gap-3">
              <ClubTag club={transfer.clubFrom} />
              <ArrowRight size={16} className="shrink-0 text-mist-500 transition-transform group-hover:translate-x-0.5" />
              <ClubTag club={transfer.clubTo} />
            </div>

            <div className="ml-auto text-right">
              <p className="stat-label">Fee</p>
              <p className="num text-sm font-semibold text-pitch-300">{fmtFee(transfer.fee)}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mist-400">
            <span>{fmtDate(transfer.date)}</span>
            {transfer.marketValue ? <span>Value then · {money(transfer.marketValue)}</span> : null}
            {transfer.upcoming ? <span className="chip chip-flare">Upcoming</span> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function ClubTag({ club }) {
  if (!club?.name) return <span className="text-sm text-mist-400">—</span>;

  const content = (
    <>
      <Crest clubId={club.id} name={club.name} size={22} />
      <span className="truncate text-sm font-medium text-mist-200 group-hover:text-mist-100">{club.name}</span>
    </>
  );

  return club.id ? (
    <Link to={`/club/${club.id}`} className="flex min-w-0 items-center gap-2 hover:underline">
      {content}
    </Link>
  ) : (
    <span className="flex min-w-0 items-center gap-2">{content}</span>
  );
}
