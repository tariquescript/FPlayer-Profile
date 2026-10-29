import { useState } from 'react';
import Crest from './ui/Crest.jsx';
import { competitionLogo } from '../lib/images.js';
import { TrophyIcon } from './ui/Icons.jsx';

/** Honours, biggest hauls first, with the seasons behind a disclosure. */
export default function Achievements({ achievements = [] }) {
  if (!achievements.length) {
    return <p className="py-8 text-center text-sm text-slate">No honours listed yet.</p>;
  }

  const sorted = [...achievements].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));

  return (
    <div className="grid gap-3 md:grid-cols-2 stagger">
      {sorted.map((achievement, index) => (
        <AchievementRow key={achievement.title ?? index} achievement={achievement} index={index} />
      ))}
    </div>
  );
}

function AchievementRow({ achievement, index }) {
  const [open, setOpen] = useState(false);
  const details = achievement.details ?? [];

  return (
    <div
      style={{ '--i': Math.min(index, 10) }}
      className="rounded-2xl border border-line bg-paper transition-[border-color,box-shadow] duration-300 hover:border-gold/40 hover:shadow-card"
    >
      <button
        type="button"
        onClick={() => details.length && setOpen((value) => !value)}
        aria-expanded={details.length ? open : undefined}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold">
          <TrophyIcon size={19} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{achievement.title}</span>
          {details.length > 0 && (
            <span className="text-xs text-slate">
              {open ? 'Hide' : 'Show'} {details.length} {details.length === 1 ? 'season' : 'seasons'}
            </span>
          )}
        </span>

        <span className="num shrink-0 rounded-full bg-ink px-2.5 py-1 font-display text-sm font-bold text-volt">
          ×{achievement.count ?? details.length ?? 1}
        </span>
      </button>

      {open && details.length > 0 && (
        <ul className="animate-fade space-y-1.5 border-t border-line px-4 py-3">
          {details.map((detail, detailIndex) => (
            <li key={detailIndex} className="flex items-center gap-2.5 text-xs text-graphite">
              <DetailSource detail={detail} />
              <span className="ml-auto num text-slate">{detail.season?.name ?? '—'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * What an honour was won with. Team trophies carry a club, scoring titles a
 * competition, and individual awards (TM Player of the Season) neither.
 */
function DetailSource({ detail }) {
  if (detail.club?.name) {
    return (
      <>
        <Crest clubId={detail.club.id} name={detail.club.name} size={18} />
        <span className="truncate">{detail.club.name}</span>
      </>
    );
  }

  if (detail.competition?.name) {
    const logo = competitionLogo(detail.competition.id);
    return (
      <>
        {logo && (
          <img
            src={logo}
            alt=""
            width={18}
            height={18}
            loading="lazy"
            className="h-[18px] w-[18px] shrink-0 rounded-sm bg-white object-contain p-px"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        )}
        <span className="truncate">{detail.competition.name}</span>
      </>
    );
  }

  return <span className="truncate text-slate">Individual award</span>;
}
