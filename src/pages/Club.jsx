import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Flag from '../components/ui/Flag.jsx';
import FitText from '../components/ui/FitText.jsx';
import StatTile from '../components/StatTile.jsx';
import TransitionLink from '../components/TransitionLink.jsx';
import Model from '../components/three/Model.jsx';
import { ErrorState } from '../components/States.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { ArrowLeft, ArrowRight, CalendarIcon, ExternalIcon, PinIcon, ShieldIcon, UserIcon } from '../components/ui/Icons.jsx';

import { useClubBundle } from '../hooks/useClubBundle.js';
import { usePrefetchIntent } from '../hooks/usePrefetchIntent.js';
import { compactNumber, date as fmtDate, height, money } from '../lib/format.js';

const GROUPS = ['Goalkeeper', 'Defender', 'Midfield', 'Attack'];
const HEX = /^#[0-9a-f]{6}$/i;

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
  const colors = (club.colors ?? []).filter((color) => HEX.test(color));

  return (
    <div className="pb-8">
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <button type="button" onClick={() => navigate(-1)} className="btn btn-ghost !py-1.5 !pl-2.5 text-sm">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="card relative mt-6 overflow-hidden p-6 sm:p-8" data-model-host>
          {/* A band of the club's own colours along the top edge. */}
          {colors.length > 0 && (
            <div className="absolute inset-x-0 top-0 flex h-1.5">
              {colors.map((color) => (
                <span key={color} className="flex-1" style={{ background: color }} />
              ))}
            </div>
          )}

          <Model
            kind="flag"
            options={{ colors: colors.length ? colors : undefined }}
            className="absolute right-0 top-2 hidden h-48 w-40 sm:block lg:h-56 lg:w-48"
          />

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:pr-44 lg:pr-52">
            <div className="grid h-28 w-28 shrink-0 animate-pop place-items-center rounded-[28px] border border-line bg-chalk">
              <img src={club.image} alt="" className="h-20 w-20 object-contain drop-shadow-xl" loading="eager" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {club.league?.name && (
                  <span className="chip chip-volt">
                    <Flag country={club.league.countryName} width={16} />
                    {club.league.name}
                  </span>
                )}
                {club.league?.tier && <span className="chip">{club.league.tier}</span>}
                {club.foundedOn && <span className="chip">Founded {fmtDate(club.foundedOn, { style: 'short' })}</span>}
              </div>
              <h1 className="mask-line mt-4">
                <span className="w-full" style={{ '--d': '60ms' }}>
                  <FitText className="display" max={96}>{club.name}</FitText>
                </span>
              </h1>
              <p className="mt-2 text-sm text-slate">{club.officialName}</p>
            </div>
          </div>

          <div className="stagger mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

          {club.website && (
            <a href={`https://${club.website}`} target="_blank" rel="noreferrer" className="btn btn-ghost mt-6 !py-2 text-xs">
              {club.website} <ExternalIcon size={14} />
            </a>
          )}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="display text-[clamp(1.6rem,3vw,2.2rem)]">
            Squad <span className="num text-ash">{bundle.players?.length ?? 0}</span>
          </h2>

          <div className="flex items-center gap-1 rounded-full border border-line bg-paper p-1 shadow-card">
            {[
              { id: 'value', label: 'Value' },
              { id: 'age', label: 'Age' },
              { id: 'name', label: 'Name' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSort(option.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors duration-300 ${
                  sort === option.id ? 'bg-ink text-white' : 'text-slate hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {squad.length === 0 && (
          <p className="card px-6 py-12 text-center text-sm text-slate">Squad data is not available for this club.</p>
        )}

        <div className="space-y-8">
          {squad.map((section) => (
            <div key={section.group} className="reveal">
              <h3 className="stat-label mb-3 flex items-center gap-3">
                {section.group}
                <span className="h-px flex-1 bg-line" />
                <span className="num">{section.players.length}</span>
              </h3>
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                {section.players.map((player) => (
                  <SquadRow key={player.id} player={player} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {club.historicalCrests?.length > 0 && (
          <div className="card reveal mt-10 p-6">
            <h3 className="mb-4 font-display font-semiwide text-lg font-bold">Crests through the years</h3>
            <div className="scroll-x flex gap-3 pb-2">
              {club.historicalCrests.map((crest) => (
                <img
                  key={crest}
                  src={crest}
                  alt=""
                  loading="lazy"
                  className="h-16 w-16 shrink-0 rounded-2xl border border-line bg-chalk object-contain p-2 transition duration-300 hover:-translate-y-1 hover:border-ink"
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
    <TransitionLink
      to={`/player/${player.id}`}
      {...intent}
      className="group flex items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-ink hover:shadow-card"
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          {player.nationality?.[0] && <Flag country={player.nationality[0]} width={17} />}
          <span className="truncate text-sm font-semibold text-ink">{player.name}</span>
        </span>
        <span className="mt-1 block truncate text-xs text-slate">
          {[player.position, player.age ? `${player.age}y` : null, player.height ? height(player.height) : null]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </span>
      <span className="num shrink-0 font-display font-semiwide text-sm font-bold text-ink">{money(player.marketValue)}</span>
      <ArrowRight size={15} className="shrink-0 -translate-x-1 text-ink opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
    </TransitionLink>
  );
}

function ClubSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Skeleton className="h-9 w-24 rounded-full" />
      <div className="card mt-6 space-y-6 p-8">
        <div className="flex items-center gap-6">
          <Skeleton className="h-28 w-28 rounded-[28px]" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-48 rounded-full" />
            <Skeleton className="h-12 w-72 max-w-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
