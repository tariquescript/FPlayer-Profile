import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Crest from '../components/ui/Crest.jsx';
import Flag from '../components/ui/Flag.jsx';
import StatTile from '../components/StatTile.jsx';
import { ErrorState } from '../components/States.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { ArrowLeft, CalendarIcon, ExternalIcon, PinIcon, ShieldIcon, UserIcon } from '../components/ui/Icons.jsx';

import { useClubBundle } from '../hooks/useClubBundle.js';
import { usePrefetchIntent } from '../hooks/usePrefetchIntent.js';
import { compactNumber, date as fmtDate, height, money } from '../lib/format.js';

const GROUPS = ['Goalkeeper', 'Defender', 'Midfield', 'Attack'];

/** Transfermarkt gives a specific role; roll it up into a squad section. */
function groupFor(position = '') {
  const value = position.toLowerCase();
  if (value.includes('keeper')) return 'Goalkeeper';
  if (value.includes('back') || value.includes('defender')) return 'Defender';
  if (value.includes('midfield')) return 'Midfield';
  return 'Attack';
}

export default function Club() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bundle, status, error } = useClubBundle(id);
  const [sort, setSort] = useState('value');

  const squad = useMemo(() => {
    const players = bundle?.players ?? [];
    const sorted = [...players].sort((a, b) => {
      if (sort === 'value') return (b.marketValue ?? 0) - (a.marketValue ?? 0);
      if (sort === 'age') return (a.age ?? 99) - (b.age ?? 99);
      return String(a.name).localeCompare(String(b.name));
    });

    return GROUPS.map((group) => ({
      group,
      players: sorted.filter((player) => groupFor(player.position) === group),
    })).filter((section) => section.players.length);
  }, [bundle?.players, sort]);

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <ErrorState error={error} title="Could not load this club" onRetry={() => navigate(0)} />
      </div>
    );
  }

  if (!bundle?.profile) return <ClubSkeleton />;

  const club = bundle.profile;
  const [primary] = club.colors ?? [];

  return (
    <div className="pb-16">
      <section className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black_30%,transparent)]"
          style={{
            background: primary
              ? `linear-gradient(160deg, ${primary}22, transparent 70%)`
              : undefined,
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pt-6 sm:px-6">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-ghost mb-6 !py-1.5 text-sm">
            <ArrowLeft size={16} /> Back
          </button>

          <div className="panel p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-6">
              <img
                src={club.image}
                alt=""
                className="h-24 w-24 object-contain drop-shadow-2xl"
                loading="eager"
              />

              <div className="min-w-0 flex-1">
                <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{club.name}</h1>
                <p className="mt-1 text-sm text-mist-400">{club.officialName}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {club.league?.name && (
                    <span className="chip chip-accent">
                      <Flag country={club.league.countryName} width={16} />
                      {club.league.name}
                    </span>
                  )}
                  {club.league?.tier && <span className="chip">{club.league.tier}</span>}
                  {club.foundedOn && <span className="chip">Founded {fmtDate(club.foundedOn, { style: 'short' })}</span>}
                </div>
              </div>

              {club.website && (
                <a href={`https://${club.website}`} target="_blank" rel="noreferrer" className="btn btn-ghost">
                  {club.website} <ExternalIcon size={15} />
                </a>
              )}
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="Squad value" value={money(club.currentMarketValue)} accent icon={<ShieldIcon size={15} />} />
              <StatTile label="Squad size" value={club.squad?.size ?? '—'} icon={<UserIcon size={15} />} hint={club.squad?.averageAge ? `Ø ${club.squad.averageAge} years` : null} />
              <StatTile label="Stadium" value={club.stadiumName ?? '—'} icon={<PinIcon size={15} />} hint={club.stadiumSeats ? `${compactNumber(club.stadiumSeats)} seats` : null} />
              <StatTile
                label="Transfer balance"
                value={money(Math.abs(Number(club.currentTransferRecord)) || null)}
                icon={<CalendarIcon size={15} />}
                hint={
                  club.currentTransferRecord == null
                    ? null
                    : Number(club.currentTransferRecord) < 0
                      ? 'Net spend this season'
                      : 'Net income this season'
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Squad <span className="num text-mist-400">({bundle.players?.length ?? 0})</span>
          </h2>

          <div className="flex items-center gap-1 rounded-xl border border-ink-600/70 bg-ink-850/60 p-1">
            {[
              { id: 'value', label: 'Value' },
              { id: 'age', label: 'Age' },
              { id: 'name', label: 'Name' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSort(option.id)}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  sort === option.id ? 'bg-ink-700 text-mist-100' : 'text-mist-400 hover:text-mist-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {squad.length === 0 && (
          <p className="panel px-6 py-12 text-center text-sm text-mist-400">Squad data is not available for this club.</p>
        )}

        <div className="space-y-6">
          {squad.map((section) => (
            <div key={section.group}>
              <h3 className="stat-label mb-2.5">{section.group}</h3>
              <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                {section.players.map((player) => (
                  <SquadRow key={player.id} player={player} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {club.historicalCrests?.length > 0 && (
          <div className="panel mt-8 p-6">
            <h3 className="mb-4 text-lg font-semibold">Crests through the years</h3>
            <div className="scroll-x flex gap-4 pb-2">
              {club.historicalCrests.map((crest) => (
                <img
                  key={crest}
                  src={crest}
                  alt=""
                  loading="lazy"
                  className="h-16 w-16 shrink-0 rounded-xl border border-ink-600 bg-ink-900/60 object-contain p-2 transition hover:scale-105"
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function SquadRow({ player }) {
  const intent = usePrefetchIntent(player.id);

  return (
    <Link to={`/player/${player.id}`} {...intent} className="panel panel-hover flex items-center gap-3 px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          {player.nationality?.[0] && <Flag country={player.nationality[0]} width={17} />}
          <span className="truncate text-sm font-semibold text-mist-100">{player.name}</span>
        </span>
        <span className="mt-1 block truncate text-xs text-mist-400">
          {[player.position, player.age ? `${player.age}y` : null, player.height ? height(player.height) : null]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </span>
      <span className="num shrink-0 text-sm font-semibold text-pitch-300">{money(player.marketValue)}</span>
    </Link>
  );
}

function ClubSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <div className="panel space-y-6 p-8">
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
