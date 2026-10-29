import { memo, useRef } from 'react';
import TransitionLink from './TransitionLink.jsx';
import Avatar from './ui/Avatar.jsx';
import Crest from './ui/Crest.jsx';
import Flag from './ui/Flag.jsx';
import { ArrowRight } from './ui/Icons.jsx';
import { useLazyProfile } from '../hooks/useLazyProfile.js';
import { usePrefetchIntent } from '../hooks/usePrefetchIntent.js';
import { money, shirt } from '../lib/format.js';
import { WITHOUT_CLUB_IDS } from '../lib/images.js';
import { markPortrait } from '../lib/transition.js';

/**
 * A result card. Everything visible here comes from the search response, so the
 * grid is complete the moment results arrive; the portrait fades in afterwards
 * from a lazily fetched profile. The whole card is the link, and its portrait
 * flies into the profile hero on click.
 */
function PlayerCard({ player, index = 0 }) {
  const { ref, profile } = useLazyProfile(player.id);
  const portraitRef = useRef(null);

  const club = player.club ?? {};
  const unattached = WITHOUT_CLUB_IDS.has(String(club.id));
  const number = shirt(profile?.shirtNumber);
  const nationality = player.nationalities?.[0] ?? profile?.citizenship?.[0];

  const intent = usePrefetchIntent(player.id);

  return (
    <TransitionLink
      ref={ref}
      to={`/player/${player.id}`}
      state={{ profile: profile ?? null, from: 'search' }}
      onBeforeTransition={() => markPortrait(portraitRef.current)}
      {...intent}
      style={{ '--i': index % 12 }}
      className="card card-hover group relative flex flex-col overflow-hidden"
    >
      <div className="flex items-start gap-4 p-5">
        <div className="relative">
          <div ref={portraitRef} className="overflow-hidden rounded-2xl">
            <Avatar
              src={profile?.imageUrl}
              name={player.name}
              size="md"
              className="rounded-2xl transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05]"
              eager={index < 4}
            />
          </div>
          {number && (
            <span className="num absolute -bottom-2 -right-2 grid h-7 w-7 place-items-center rounded-full border-2 border-paper bg-ink text-[11px] font-bold text-volt">
              {number}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-display font-semiwide text-[17px] font-bold leading-tight text-ink" title={player.name}>
            {player.name}
          </h3>

          <div className="mt-1.5 flex min-w-0 items-center gap-2 text-sm text-slate">
            {nationality && <Flag country={nationality} width={18} />}
            <span className="min-w-0 truncate" title={nationality}>{nationality ?? '—'}</span>
            {player.age ? <span className="shrink-0 whitespace-nowrap text-ash">· {player.age}y</span> : null}
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {player.position && <span className="chip">{player.position}</span>}
            {profile?.foot && <span className="chip capitalize">{profile.foot}</span>}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-line px-5 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {!unattached && <Crest clubId={club.id} name={club.name} size={24} />}
          <p className="truncate text-sm font-medium text-graphite" title={club.name}>
            {unattached ? (club.name === 'Retired' ? 'Retired' : 'Without club') : club.name || '—'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="stat-label !text-[10px]">Value</p>
            <p className="num font-display font-semiwide text-lg font-bold leading-tight text-ink">{money(player.marketValue)}</p>
          </div>
          <span className="grid h-0 w-0 place-items-center overflow-hidden rounded-full bg-ink text-white opacity-0 transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:h-9 group-hover:w-9 group-hover:opacity-100">
            <ArrowRight size={16} />
          </span>
        </div>
      </div>

      {/* A volt rule that draws across the foot of the card on hover. */}
      <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-volt transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-x-100" />
    </TransitionLink>
  );
}

export default memo(PlayerCard);
