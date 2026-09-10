import { useState } from 'react';
import Crest from './ui/Crest.jsx';
import { competitionLogo } from '../lib/images.js';
import { TrophyIcon } from './ui/Icons.jsx';

/** Honours, biggest hauls first, with the seasons behind a disclosure. */
export default function Achievements({ achievements = [] }) {
  if (!achievements.length) {
    return <p className="py-8 text-center text-sm text-mist-400">No honours listed yet.</p>;
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
      className="rounded-2xl border border-ink-600/70 bg-ink-800/40 transition-colors hover:border-flare-400/35"
    >
      <button
        type="button"
        onClick={() => details.length && setOpen((value) => !value)}
        aria-expanded={details.length ? open : undefined}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-flare-400/25 bg-flare-500/10 text-flare-400">
          <TrophyIcon size={19} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-mist-100">{achievement.title}</span>
          {details.length > 0 && (
            <span className="text-xs text-mist-400">
              {open ? 'Hide' : 'Show'} {details.length} {details.length === 1 ? 'season' : 'seasons'}
            </span>
          )}
        </span>

        <span className="num shrink-0 rounded-lg border border-ink-500/80 bg-ink-900/70 px-2.5 py-1 text-sm font-bold text-flare-400">
          ×{achievement.count ?? details.length ?? 1}
        </span>
      </button>

      {open && details.length > 0 && (
        <ul className="animate-fade space-y-1.5 border-t border-ink-600/60 px-4 py-3">
          {details.map((detail, detailIndex) => (
            <li key={detailIndex} className="flex items-center gap-2.5 text-xs text-mist-300">
              <DetailSource detail={detail} />
              <span className="ml-auto num text-mist-400">{detail.season?.name ?? '—'}</span>
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
            className="h-[18px] w-[18px] shrink-0 rounded-sm bg-white/90 object-contain p-px"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        )}
        <span className="truncate">{detail.competition.name}</span>
      </>
    );
  }

  return <span className="truncate text-mist-400">Individual award</span>;
}
