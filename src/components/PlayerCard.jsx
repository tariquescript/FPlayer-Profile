import { memo } from 'react';
import { Link } from 'react-router-dom';
import Avatar from './ui/Avatar.jsx';
import Crest from './ui/Crest.jsx';
import Flag from './ui/Flag.jsx';
import { ArrowRight } from './ui/Icons.jsx';
import { useLazyProfile } from '../hooks/useLazyProfile.js';
import { usePrefetchIntent } from '../hooks/usePrefetchIntent.js';
import { money, shirt } from '../lib/format.js';
import { WITHOUT_CLUB_IDS } from '../lib/images.js';

/**
 * A result card. Everything visible here comes from the search response, so the
 * grid is complete the moment results arrive; the portrait fades in afterwards
 * from a lazily fetched profile.
 */
function PlayerCard({ player, index = 0 }) {
  const { ref, profile } = useLazyProfile(player.id);

  const club = player.club ?? {};
  const unattached = WITHOUT_CLUB_IDS.has(String(club.id));
  const number = shirt(profile?.shirtNumber);
  const nationality = player.nationalities?.[0] ?? profile?.citizenship?.[0];

  const intent = usePrefetchIntent(player.id);

  return (
    <article
      ref={ref}
      style={{ '--i': index % 12 }}
      className="panel panel-hover group relative flex flex-col overflow-hidden"
    >
      {/* Accent wash that lights up on hover */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-pitch-500/12 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-start gap-4 p-5">
        <div className="relative">
          <Avatar
            src={profile?.imageUrl}
            name={player.name}
            size="md"
            className="rounded-2xl ring-1 ring-white/10"
            eager={index < 4}
          />
          {number && (
            <span className="absolute -bottom-2 -right-2 grid h-7 w-7 place-items-center rounded-full border border-ink-600 bg-ink-900 text-[11px] font-bold text-pitch-300 num shadow-lg">
              {number}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold leading-tight text-mist-100" title={player.name}>
            {player.name}
          </h3>

          <div className="mt-1.5 flex min-w-0 items-center gap-2 text-sm text-mist-400">
            {nationality && <Flag country={nationality} width={18} />}
            <span className="min-w-0 truncate" title={nationality}>{nationality ?? '—'}</span>
            {player.age ? <span className="shrink-0 whitespace-nowrap text-mist-500">· {player.age}y</span> : null}
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {player.position && <span className="chip chip-accent">{player.position}</span>}
            {profile?.foot && <span className="chip capitalize">{profile.foot} foot</span>}
          </div>
        </div>
      </div>

      <div className="hairline mt-auto" />

      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {!unattached && <Crest clubId={club.id} name={club.name} size={26} />}
          <div className="min-w-0">
            <p className="stat-label">Club</p>
            <p className="truncate text-sm font-medium text-mist-200" title={club.name}>
              {unattached ? (club.name === 'Retired' ? 'Retired' : 'Without club') : club.name || '—'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="stat-label">Value</p>
          <p className="num text-sm font-semibold text-pitch-300">{money(player.marketValue)}</p>
        </div>
      </div>

      <Link
        to={`/player/${player.id}`}
        state={{ profile: profile ?? null, from: 'search' }}
        {...intent}
        className="btn btn-ghost mx-5 mb-5 justify-between group-hover:border-pitch-400/50"
      >
        <span>View full profile</span>
        <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </article>
  );
}

export default memo(PlayerCard);
