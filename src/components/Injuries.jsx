import { useState } from 'react';
import Crest from './ui/Crest.jsx';
import { SpinnerIcon } from './ui/Icons.jsx';
import { fetchInjuryPage } from '../lib/api.js';
import { date as fmtDate } from '../lib/format.js';

/**
 * Injury record. The upstream pages it, and the bundle carries only the most
 * recent page, so older spells load on demand.
 *
 * Transfermarkt occasionally emits an end date before the start date, so the
 * length of a spell comes from the reported day count rather than the dates.
 */
export default function Injuries({ playerId, injuries = [], lastPage = 1 }) {
  // Extra pages are remembered per player so navigating between profiles
  // never mixes one player's history into another's.
  const [older, setOlder] = useState({ playerId: null, pages: [], loading: false, error: null });
  const extra = older.playerId === playerId ? older : { pages: [], loading: false, error: null };

  const all = [...injuries, ...extra.pages.flat()];
  const nextPage = 2 + extra.pages.length;
  const hasMore = nextPage <= lastPage;

  const loadMore = async () => {
    setOlder({ ...extra, playerId, loading: true, error: null });
    try {
      const data = await fetchInjuryPage(playerId, nextPage);
      setOlder({ playerId, pages: [...extra.pages, data.injuries ?? []], loading: false, error: null });
    } catch (error) {
      setOlder({ ...extra, playerId, loading: false, error });
    }
  };

  if (!all.length) {
    return <p className="py-8 text-center text-sm text-mist-400">No injuries on record.</p>;
  }

  const totalDays = all.reduce((sum, entry) => sum + (Number(entry.days) || 0), 0);
  const totalGames = all.reduce((sum, entry) => sum + (Number(entry.gamesMissed) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Summary label="Spells" value={hasMore ? `${all.length}+` : all.length} />
        <Summary label="Days out" value={totalDays} />
        <Summary label="Games missed" value={totalGames} />
      </div>

      <div className="scroll-x -mx-1 px-1">
        <table className="w-full min-w-[540px] border-separate border-spacing-y-1.5 text-left text-sm">
          <thead>
            <tr className="stat-label">
              <th className="px-3 pb-1 font-semibold">Season</th>
              <th className="px-3 pb-1 font-semibold">Injury</th>
              <th className="px-3 pb-1 font-semibold">From</th>
              <th className="px-3 pb-1 text-right font-semibold">Days</th>
              <th className="px-3 pb-1 text-right font-semibold">Missed</th>
            </tr>
          </thead>
          <tbody>
            {all.map((entry, index) => (
              <tr key={`${entry.injury}-${entry.fromDate}-${index}`} className="bg-ink-800/40">
                <td className="rounded-l-xl px-3 py-2.5 num text-mist-400">{entry.season ?? '—'}</td>
                <td className="px-3 py-2.5 font-medium text-mist-100">{entry.injury ?? '—'}</td>
                <td className="px-3 py-2.5 text-mist-400">{fmtDate(entry.fromDate)}</td>
                <td className="px-3 py-2.5 text-right num text-ember-400">{entry.days ?? '—'}</td>
                <td className="rounded-r-xl px-3 py-2.5">
                  <span className="flex items-center justify-end gap-1.5">
                    <span className="num text-mist-200">{entry.gamesMissed ?? 0}</span>
                    {entry.gamesMissedClubs?.[0] && <Crest clubId={entry.gamesMissedClubs[0]} size={16} />}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(hasMore || extra.error) && (
        <div className="flex flex-col items-center gap-2 pt-1">
          {extra.error && <p className="text-xs text-ember-400">{extra.error.message}</p>}
          {hasMore && (
            <button type="button" onClick={loadMore} disabled={extra.loading} className="btn btn-ghost">
              {extra.loading ? <SpinnerIcon size={16} /> : null}
              {extra.loading ? 'Loading…' : `Load older injuries (page ${nextPage} of ${lastPage})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div className="rounded-2xl border border-ink-600/70 bg-ink-800/40 px-4 py-3 text-center">
      <p className="num text-2xl font-bold text-mist-100">{value}</p>
      <p className="stat-label mt-1">{label}</p>
    </div>
  );
}
