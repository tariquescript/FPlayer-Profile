import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import Avatar from '../components/ui/Avatar.jsx';
import Crest from '../components/ui/Crest.jsx';
import Flag from '../components/ui/Flag.jsx';
import FitText from '../components/ui/FitText.jsx';
import CountUp from '../components/ui/CountUp.jsx';
import StatTile from '../components/StatTile.jsx';
import Tabs from '../components/Tabs.jsx';
import SocialLinks from '../components/SocialLinks.jsx';
import MarketValueChart from '../components/MarketValueChart.jsx';
import TransferTimeline from '../components/TransferTimeline.jsx';
import Achievements from '../components/Achievements.jsx';
import Injuries from '../components/Injuries.jsx';
import JerseyGrid from '../components/JerseyGrid.jsx';
import TransitionLink from '../components/TransitionLink.jsx';
import Model from '../components/three/Model.jsx';
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
import { PORTRAIT_TRANSITION } from '../lib/transition.js';

const SECTION_LABELS = {
  marketValue: 'market value',
  transfers: 'transfers',
  jerseyNumbers: 'shirt numbers',
  achievements: 'honours',
  injuries: 'injuries',
};

const PARTICLES = new Set(['de', 'da', 'das', 'do', 'dos', 'di', 'del', 'della', 'van', 'von', 'der', 'den', 'ter', 'le', 'la', 'el', 'al', 'mac', 'mc', 'ben', 'bin']);

/** "Kevin De Bruyne" → { first: 'Kevin', last: 'De Bruyne' }, so the surname can be the headline. */
function splitName(name = '') {
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return { first: '', last: name };
  let cut = words.length - 1;
  while (cut > 1 && PARTICLES.has(words[cut - 1].toLowerCase())) cut -= 1;
  return { first: words.slice(0, cut).join(' '), last: words.slice(cut).join(' ') };
}

// Keyed by id, so moving from one player to another starts from a clean page.
export default function ProfileRoute() {
  const { id } = useParams();
  return <Profile key={id} id={id} />;
}

function Profile({ id }) {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState(state?.tab ?? 'overview');

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
        <ErrorState error={error} title="Could not load this player" onRetry={retry} />
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
  const { first, last } = splitName(profile.name);

  return (
    <div className="pb-8">
      {/* ---------------------------------------------------------- hero */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="flex items-center gap-3 text-sm">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-ghost !py-1.5 !pl-2.5">
            <ArrowLeft size={16} /> Back
          </button>
          <span className="hidden truncate text-slate sm:inline">
            <TransitionLink to="/" className="link-draw hover:text-ink">Players</TransitionLink>
            <span className="mx-2 text-ash">/</span>
            <span className="text-ink">{profile.name}</span>
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
          {/* portrait */}
          <div className="relative mx-auto lg:mx-0">
            <div style={{ viewTransitionName: PORTRAIT_TRANSITION }} className="overflow-hidden rounded-[28px] shadow-lift">
              <Avatar src={profile.imageUrl} name={profile.name} size="xl" eager className="rounded-[28px]" />
            </div>
            {profile.isRetired && <span className="chip chip-gold absolute left-4 top-4">Retired</span>}
          </div>

          {/* identity */}
          <div className="card relative flex min-w-0 flex-col overflow-hidden p-6 sm:p-8" data-model-host>
            {number && (
              <Model
                kind="jersey"
                options={{ number }}
                className="absolute -right-2 -top-1 h-28 w-28 sm:h-40 sm:w-40"
                fallback={
                  <span className="num absolute right-6 top-6 grid h-16 w-16 place-items-center rounded-2xl bg-ink font-display text-2xl font-extrabold text-volt">
                    {number}
                  </span>
                }
              />
            )}

            <div className="flex flex-wrap items-center gap-2 pr-24 sm:pr-36">
              {profile.position?.main && <span className="chip chip-volt">{profile.position.main}</span>}
              {profile.position?.other?.map((position) => (
                <span key={position} className="chip">{position}</span>
              ))}
            </div>

            <h1 className="mt-5 sm:pr-36">
              {first && (
                <span className="block animate-rise font-display font-semiwide text-xl font-semibold text-slate sm:text-2xl">
                  {first}
                </span>
              )}
              <span className="mask-line mt-1">
                <span className="w-full" style={{ '--d': '80ms' }}>
                  <FitText className="display" max={112}>{last}</FitText>
                </span>
              </span>
            </h1>

            {profile.nameInHomeCountry && profile.nameInHomeCountry !== profile.name && (
              <p className="mt-2 text-sm text-slate">{profile.nameInHomeCountry}</p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-graphite">
              {profile.club?.id && (
                <TransitionLink to={`/club/${profile.club.id}`} className="flex items-center gap-2 font-semibold text-ink">
                  <Crest clubId={profile.club.id} name={profile.club.name} size={24} />
                  <span className="link-draw">{profile.club.name}</span>
                </TransitionLink>
              )}
              <span className="flex items-center gap-2">
                {profile.citizenship?.[0] && <Flag country={profile.citizenship[0]} width={20} />}
                {profile.citizenship?.join(' · ') || '—'}
              </span>
              {derived.born.age !== null && (
                <span className="num flex items-center gap-1.5">
                  <CalendarIcon size={15} className="text-ash" />
                  {derived.born.age} years
                </span>
              )}
            </div>

            {profile.description && (
              <p className="mt-5 line-clamp-3 max-w-2xl text-sm leading-relaxed text-slate">{profile.description}</p>
            )}

            <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
              <SocialLinks links={profile.socialMedia ?? []} />
              {profile.url && (
                <a href={profile.url} target="_blank" rel="noreferrer" className="btn btn-ghost !py-2 text-xs">
                  Transfermarkt <ExternalIcon size={14} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* value strip */}
        <div className="mt-4 grid grid-cols-1 overflow-hidden rounded-[1.5rem] border border-line bg-line sm:grid-cols-2 lg:grid-cols-5" style={{ gap: 1 }}>
          <div className="bg-ink-soft p-6 sm:col-span-2">
            <p className="stat-label !text-[#8d939c]">Market value</p>
            <p className="num mt-2 font-display font-wide text-[clamp(2.4rem,5vw,3.6rem)] font-extrabold leading-none text-volt">
              <CountUp value={profile.marketValue} format={money} />
            </p>
            {derived.trend && (
              <p className={`num mt-3 text-sm font-semibold ${derived.trend.direction >= 0 ? 'text-volt' : 'text-[#ff8a66]'}`}>
                {derived.trend.direction >= 0 ? '▲' : '▼'} {Math.abs(derived.trend.percent).toFixed(1)}%
                <span className="ml-1.5 font-normal text-[#8d939c]">vs previous valuation</span>
              </p>
            )}
          </div>
          <Figure label="Peak value" value={money(derived.summary.peak?.marketValue)} hint={derived.summary.peak?.clubName} />
          <Figure label="Career fees" value={money(derived.summary.totalFees)} hint={`${derived.summary.transferCount || 0} transfers`} />
          <Figure
            label="Trophies"
            value={derived.summary.trophies || '—'}
            hint={derived.ranks[0] ? `#${derived.ranks[0].position} ${derived.ranks[0].scope}` : null}
          />
        </div>

        {loading && (
          <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-fog">
            <div className="absolute inset-y-0 w-1/3 animate-[sweep_1.2s_linear_infinite] rounded-full bg-ink" />
          </div>
        )}
      </section>

      {gaps.length > 0 && (
        <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/25 bg-gold-soft px-4 py-3 text-sm text-gold">
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
      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />

        <div className="mt-6 animate-rise" key={tab}>
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
              <Injuries playerId={id} injuries={injuries} lastPage={bundle?.injuries?.lastPageNumber ?? 1} />
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
      <div className="stagger grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {youthClubs.length > 0 && (
          <Panel title="Youth career" subtitle={`${youthClubs.length} clubs`}>
            <ul className="space-y-2">
              {youthClubs.map((club) => (
                <li key={club} className="flex items-center gap-3 rounded-xl bg-chalk px-4 py-3 text-sm font-medium text-ink">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-volt ring-2 ring-ink" />
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
                  <Link key={relative.id} to={`/player/${relative.id}`} className="chip transition hover:border-ink hover:text-ink">
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
    <section className="card p-5 sm:p-7">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display font-semiwide text-xl font-bold">{title}</h2>
        {subtitle && <p className="num text-xs font-medium text-slate">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function Figure({ label, value, hint }) {
  return (
    <div className="bg-paper p-6">
      <p className="stat-label">{label}</p>
      <p className="num mt-2 font-display font-semiwide text-2xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-1 truncate text-xs text-slate">{hint}</p>}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Skeleton className="h-9 w-24 rounded-full" />
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
        <Skeleton className="mx-auto h-72 w-56 rounded-[28px] lg:mx-0" />
        <div className="card space-y-4 p-8">
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-16 w-4/5" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
      </div>
      <Skeleton className="mt-4 h-36 rounded-[1.5rem]" />
    </div>
  );
}
