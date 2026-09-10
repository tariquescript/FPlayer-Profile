import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import Avatar from '../components/ui/Avatar.jsx';
import Crest from '../components/ui/Crest.jsx';
import Flag from '../components/ui/Flag.jsx';
import StatTile from '../components/StatTile.jsx';
import Tabs from '../components/Tabs.jsx';
import SocialLinks from '../components/SocialLinks.jsx';
import MarketValueChart from '../components/MarketValueChart.jsx';
import TransferTimeline from '../components/TransferTimeline.jsx';
import Achievements from '../components/Achievements.jsx';
import Injuries from '../components/Injuries.jsx';
import JerseyGrid from '../components/JerseyGrid.jsx';
import { ErrorState } from '../components/States.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import {
  ArrowLeft, BoltIcon, CalendarIcon, SpinnerIcon, ChartIcon, ExternalIcon, FootIcon, GlobeIcon,
  PinIcon, PulseIcon, RulerIcon, ShieldIcon, ShirtIcon, SwapIcon, TrophyIcon, UserIcon,
} from '../components/ui/Icons.jsx';

import { usePlayerBundle } from '../hooks/usePlayerBundle.js';
import { useScrollMemory } from '../hooks/useScrollMemory.js';
import { date as fmtDate, foot, height, money, shirt, until } from '../lib/format.js';
import { birth, careerSummary, clubNames, rankings, valueTrend } from '../lib/profile.js';

const SECTION_LABELS = {
  marketValue: 'market value',
  transfers: 'transfers',
  jerseyNumbers: 'shirt numbers',
  achievements: 'honours',
  injuries: 'injuries',
};

export default function Profile() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  const { bundle, status, error, gaps = [], refilling, retry } = usePlayerBundle(id, { seed: state?.profile ?? undefined });
  const profile = bundle?.profile;
  useScrollMemory(`player:${id}`, status === 'ready');

  const derived = useMemo(
    () => ({
      names: clubNames(bundle),
      summary: careerSummary(bundle),
      trend: valueTrend(bundle?.marketValue?.marketValueHistory ?? []),
      ranks: rankings(bundle?.marketValue?.ranking),
      born: birth(profile?.description),
    }),
    [bundle, profile?.description],
  );

  if (status === 'error' && !profile) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <ErrorState
          error={error}
          title="Could not load this player"
          onRetry={retry}
        />
        <div className="mt-6 text-center">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-ghost">
            <ArrowLeft size={16} /> Back to results
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return <ProfileSkeleton />;

  const history = bundle?.marketValue?.marketValueHistory ?? [];
  const transfers = bundle?.transfers?.transfers ?? [];
  const youthClubs = bundle?.transfers?.youthClubs ?? [];
  const achievements = bundle?.achievements?.achievements ?? [];
  const injuries = bundle?.injuries?.injuries ?? [];
  const jerseys = bundle?.jerseyNumbers?.jerseyNumbers ?? [];
  const loading = status === 'loading';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <UserIcon size={16} /> },
    { id: 'value', label: 'Market value', icon: <ChartIcon size={16} />, badge: history.length || null },
    { id: 'transfers', label: 'Transfers', icon: <SwapIcon size={16} />, badge: transfers.length || null },
    { id: 'honours', label: 'Honours', icon: <TrophyIcon size={16} />, badge: derived.summary.trophies || null },
    { id: 'injuries', label: 'Injuries', icon: <PulseIcon size={16} />, badge: injuries.length || null },
    { id: 'shirts', label: 'Shirt numbers', icon: <ShirtIcon size={16} />, badge: jerseys.length || null },
  ];

  const number = shirt(profile.shirtNumber);

  return (
    <div className="pb-16">
      {/* ---------------------------------------------------------- hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 overflow-hidden [mask-image:linear-gradient(to_bottom,black_40%,transparent)]">
          <div className="absolute inset-0 bg-gradient-to-br from-pitch-500/18 via-volt-500/10 to-transparent" />
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-pitch-500/20 blur-[90px] animate-drift" />
          <div className="absolute right-0 top-10 h-64 w-64 rounded-full bg-volt-500/18 blur-[90px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pt-6 sm:px-6">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-ghost mb-6 !py-1.5 text-sm">
            <ArrowLeft size={16} /> Back
          </button>

          <div className="panel overflow-hidden">
            <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:p-8">
              {/* portrait */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar
                    src={profile.imageUrl}
                    name={profile.name}
                    size="xl"
                    eager
                    className="rounded-3xl ring-1 ring-white/12"
                  />
                  {number && (
                    <span className="num absolute -bottom-3 -right-3 grid h-14 w-14 place-items-center rounded-2xl border border-ink-600 bg-ink-900/95 text-xl font-black text-pitch-300 shadow-2xl">
                      {number}
                    </span>
                  )}
                </div>

                <SocialLinks links={profile.socialMedia ?? []} />
              </div>

              {/* identity */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {profile.position?.main && <span className="chip chip-accent">{profile.position.main}</span>}
                  {profile.position?.other?.map((position) => (
                    <span key={position} className="chip">{position}</span>
                  ))}
                  {profile.isRetired && <span className="chip chip-flare">Retired</span>}
                </div>

                <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
                  {profile.name}
                </h1>

                {profile.nameInHomeCountry && profile.nameInHomeCountry !== profile.name && (
                  <p className="mt-1 text-sm text-mist-400">{profile.nameInHomeCountry}</p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-mist-300">
                  {profile.club?.id && (
                    <Link to={`/club/${profile.club.id}`} className="flex items-center gap-2 hover:text-mist-100">
                      <Crest clubId={profile.club.id} name={profile.club.name} size={24} />
                      <span className="font-medium">{profile.club.name}</span>
                    </Link>
                  )}

                  <span className="flex items-center gap-2">
                    {profile.citizenship?.[0] && <Flag country={profile.citizenship[0]} width={20} />}
                    {profile.citizenship?.join(' · ') || '—'}
                  </span>

                  {derived.born.age !== null && (
                    <span className="num flex items-center gap-1.5">
                      <CalendarIcon size={15} className="text-mist-500" />
                      {derived.born.age} years
                    </span>
                  )}
                </div>

                {profile.description && (
                  <p className="mt-5 max-w-2xl text-sm leading-relaxed text-mist-400">{profile.description}</p>
                )}

                {derived.ranks.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {derived.ranks.map((rank) => (
                      <span key={rank.scope} className="chip chip-volt">
                        #{rank.position} <span className="font-normal text-mist-400">{rank.scope}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* value */}
              <div className="lg:w-64">
                <div className="rounded-3xl border border-pitch-400/20 bg-gradient-to-br from-pitch-500/12 to-volt-500/10 p-6">
                  <p className="stat-label">Market value</p>
                  <p className="num mt-2 text-4xl font-black text-pitch-300">{money(profile.marketValue)}</p>

                  {derived.trend && (
                    <p
                      className={`num mt-2 text-sm font-semibold ${
                        derived.trend.direction >= 0 ? 'text-pitch-400' : 'text-ember-400'
                      }`}
                    >
                      {derived.trend.direction >= 0 ? '▲' : '▼'} {Math.abs(derived.trend.percent).toFixed(1)}%
                      <span className="ml-1 font-normal text-mist-400">vs previous</span>
                    </p>
                  )}

                  <div className="mt-5 space-y-3 border-t border-white/10 pt-4 text-sm">
                    <Row label="Peak" value={money(derived.summary.peak?.marketValue)} />
                    <Row label="Career fees" value={money(derived.summary.totalFees)} />
                    <Row label="Trophies" value={derived.summary.trophies || '—'} />
                  </div>
                </div>

                {profile.url && (
                  <a
                    href={profile.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost mt-3 w-full"
                  >
                    Transfermarkt <ExternalIcon size={15} />
                  </a>
                )}
              </div>
            </div>

            {loading && (
              <div className="relative h-0.5 overflow-hidden bg-ink-700">
                <div className="absolute inset-y-0 w-1/3 animate-[sweep_1.2s_linear_infinite] bg-gradient-to-r from-transparent via-pitch-400 to-transparent" />
              </div>
            )}
          </div>
        </div>
      </section>

      {gaps.length > 0 && (
        <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-flare-400/25 bg-flare-500/8 px-4 py-3 text-sm text-flare-400">
            {refilling ? <SpinnerIcon size={16} /> : <BoltIcon size={16} />}
            <p className="flex-1">
              {refilling
                ? 'The data source is busy — still fetching some sections.'
                : `Some sections could not be loaded (${gaps.map((gap) => SECTION_LABELS[gap] ?? gap).join(', ')}).`}
            </p>
            {!refilling && (
              <button type="button" onClick={retry} className="btn btn-ghost !py-1.5 text-xs">
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- tabs */}
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />

        <div className="mt-6 animate-fade" key={tab}>
          {tab === 'overview' && (
            <Overview profile={profile} born={derived.born} summary={derived.summary} youthClubs={youthClubs} history={history} />
          )}
          {tab === 'value' && (
            <Panel title="Market value history" subtitle={`${history.length} valuations recorded`}>
              <MarketValueChart history={history} />
            </Panel>
          )}
          {tab === 'transfers' && (
            <Panel title="Transfer history" subtitle={`${transfers.length} moves`}>
              <TransferTimeline transfers={transfers} />
            </Panel>
          )}
          {tab === 'honours' && (
            <Panel title="Honours & awards" subtitle={`${derived.summary.trophies} titles`}>
              <Achievements achievements={achievements} />
            </Panel>
          )}
          {tab === 'injuries' && (
            <Panel title="Injury history" subtitle={`${derived.summary.daysOut} days out in total`}>
              <Injuries
                playerId={id}
                injuries={injuries}
                lastPage={bundle?.injuries?.lastPageNumber ?? 1}
              />
            </Panel>
          )}
          {tab === 'shirts' && (
            <Panel title="Shirt numbers" subtitle={`${jerseys.length} seasons`}>
              <JerseyGrid jerseyNumbers={jerseys} clubNames={derived.names} />
            </Panel>
          )}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------- sections */

function Overview({ profile, born, summary, youthClubs, history }) {
  const contract = until(profile.club?.contractExpires);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 stagger">
        <StatTile label="Date of birth" value={born.dateOfBirth ? fmtDate(born.dateOfBirth) : '—'} icon={<CalendarIcon size={15} />} hint={born.age !== null ? `${born.age} years old` : null} />
        <StatTile label="Place of birth" value={[profile.placeOfBirth?.city, profile.placeOfBirth?.country].filter(Boolean).join(', ') || '—'} icon={<PinIcon size={15} />} />
        <StatTile label="Height" value={height(profile.height)} icon={<RulerIcon size={15} />} />
        <StatTile label="Preferred foot" value={foot(profile.foot)} icon={<FootIcon size={15} />} />

        <StatTile label="Citizenship" value={profile.citizenship?.join(', ') || '—'} icon={<GlobeIcon size={15} />} />
        <StatTile label="Joined club" value={fmtDate(profile.club?.joined)} icon={<SwapIcon size={15} />} />
        <StatTile label="Contract until" value={fmtDate(profile.club?.contractExpires)} icon={<ShieldIcon size={15} />} hint={contract} accent={contract === 'expiring' || contract === 'expired'} />
        <StatTile label="Agent" value={profile.agent?.name || '—'} icon={<UserIcon size={15} />} />

        <StatTile label="Outfitter" value={profile.outfitter || '—'} icon={<ShirtIcon size={15} />} />
        <StatTile label="Clubs played for" value={summary.clubCount || '—'} icon={<ShieldIcon size={15} />} />
        <StatTile label="Career transfers" value={summary.transferCount || '—'} icon={<SwapIcon size={15} />} />
        <StatTile label="Peak value" value={money(summary.peak?.marketValue)} icon={<ChartIcon size={15} />} accent hint={summary.peak?.clubName} />
      </div>

      {history.length > 1 && (
        <Panel title="Value trajectory" subtitle="Full valuation history">
          <MarketValueChart history={history} />
        </Panel>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {youthClubs.length > 0 && (
          <Panel title="Youth career" subtitle={`${youthClubs.length} clubs`}>
            <ul className="space-y-2">
              {youthClubs.map((club) => (
                <li key={club} className="flex items-center gap-3 rounded-xl border border-ink-600/70 bg-ink-800/40 px-4 py-3 text-sm text-mist-200">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-pitch-400" />
                  {club}
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {profile.relatives?.length > 0 && (
          <Panel title="Football family" subtitle="Relatives in the game">
            <div className="flex flex-wrap gap-2">
              {profile.relatives.map((relative) =>
                relative.profileType === 'player' && relative.id ? (
                  <Link key={relative.id} to={`/player/${relative.id}`} className="chip transition hover:border-pitch-400/45 hover:text-mist-100">
                    <UserIcon size={13} /> {relative.name}
                  </Link>
                ) : (
                  <span key={relative.name} className="chip">{relative.name}</span>
                ),
              )}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <section className="panel p-5 sm:p-6">
      <header className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-mist-400 num">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-mist-400">{label}</span>
      <span className="num font-semibold text-mist-100">{value}</span>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <div className="panel grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
        <Skeleton className="h-56 w-56 rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-12 w-80 max-w-full" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-3/4 max-w-lg" />
        </div>
        <Skeleton className="h-52 w-full rounded-3xl lg:w-64" />
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
