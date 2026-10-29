import { Link } from 'react-router-dom';
import Crest from './ui/Crest.jsx';
import { ArrowRight } from './ui/Icons.jsx';
import { date as fmtDate, fee as fmtFee, money } from '../lib/format.js';

/** Career moves, newest first, with the fee and the value at the time. */
export default function TransferTimeline({ transfers = [] }) {
  if (!transfers.length) {
    return <p className="py-8 text-center text-sm text-slate">No transfers recorded.</p>;
  }

  return (
    <ol className="stagger relative space-y-3 before:absolute before:bottom-4 before:left-[11px] before:top-4 before:w-px before:bg-line sm:before:left-[13px]">
      {transfers.map((transfer, index) => (
        <li
          key={transfer.id ?? `${transfer.date}-${index}`}
          style={{ '--i': Math.min(index, 10) }}
          className="group relative pl-9 sm:pl-11"
        >
          <span
            className={`absolute left-[5px] top-6 h-[13px] w-[13px] rounded-full border-2 border-ink sm:left-[7px] ${
              index === 0 ? 'bg-volt' : 'bg-paper'
            }`}
          />
          <div className="rounded-2xl border border-line bg-paper p-4 transition-[border-color,box-shadow,transform] duration-300 group-hover:-translate-y-0.5 group-hover:border-line-strong group-hover:shadow-card">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <span className="chip chip-ink num shrink-0">{transfer.season ?? '—'}</span>

            <div className="order-last flex min-w-0 basis-full items-center gap-3 sm:order-none sm:basis-auto sm:flex-1">
              <ClubTag club={transfer.clubFrom} />
              <ArrowRight size={16} className="shrink-0 text-ash transition-transform group-hover:translate-x-0.5" />
              <ClubTag club={transfer.clubTo} />
            </div>

            <div className="ml-auto text-right">
              <p className="stat-label">Fee</p>
              <p className="num font-display font-semiwide text-sm font-bold text-ink">{fmtFee(transfer.fee)}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate">
            <span>{fmtDate(transfer.date)}</span>
            {transfer.marketValue ? <span>Value then · {money(transfer.marketValue)}</span> : null}
            {transfer.upcoming ? <span className="chip chip-gold">Upcoming</span> : null}
          </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ClubTag({ club }) {
  if (!club?.name) return <span className="text-sm text-slate">—</span>;

  const content = (
    <>
      <Crest clubId={club.id} name={club.name} size={22} />
      <span className="truncate text-sm font-semibold text-ink">{club.name}</span>
    </>
  );

  return club.id ? (
    <Link to={`/club/${club.id}`} className="flex min-w-0 items-center gap-2 py-1 hover:underline">
      {content}
    </Link>
  ) : (
    <span className="flex min-w-0 items-center gap-2">{content}</span>
  );
}
