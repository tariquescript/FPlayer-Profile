import { useRef } from 'react';
import TransitionLink from '../TransitionLink.jsx';
import Model from '../three/Model.jsx';
import Avatar from '../ui/Avatar.jsx';
import Crest from '../ui/Crest.jsx';
import { ArrowRight, ChartIcon, ShirtIcon, TrophyIcon } from '../ui/Icons.jsx';
import { useLazyProfile } from '../../hooks/useLazyProfile.js';
import { usePrefetchIntent } from '../../hooks/usePrefetchIntent.js';
import { FEATURED } from '../../lib/featured.js';
import { money } from '../../lib/format.js';
import { markPortrait } from '../../lib/transition.js';

/**
 * The home page below the search: a bento of what a profile holds. Each tile
 * opens a real profile on the matching tab, and the 3D objects are spread
 * across the tiles rather than parked beside the headline.
 */
export default function Showcase() {
  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:mt-24 sm:px-6" aria-labelledby="showcase-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2 id="showcase-title" className="display text-[clamp(1.6rem,3.4vw,2.6rem)]">
          Inside every profile
        </h2>
        <p className="max-w-sm text-sm leading-relaxed text-slate">
          <span className="font-medium text-ink">Six Transfermarkt sources, one page.</span> Pick a tile to open a
          real profile.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:grid-rows-[auto_auto]">
        <Spotlight />

        <FeatureTile
          className="lg:col-span-4"
          index="01"
          label="Market value"
          title="Every valuation, charted."
          body="From a first professional season to today — every peak, every dip, and the club that held him."
          model="coins"
          fallbackIcon={<ChartIcon size={30} />}
          player={{ id: '937958', name: 'Yamal' }}
          tab="value"
        >
          <Sparkline />
        </FeatureTile>

        <FeatureTile
          className="lg:col-span-3"
          index="02"
          label="Honours"
          title="Every trophy lifted."
          body="Leagues, cups and individual awards, grouped and counted."
          model="trophy"
          fallbackIcon={<TrophyIcon size={30} />}
          player={{ id: '342229', name: 'Mbappé' }}
          tab="honours"
        />

        <FeatureTile
          className="lg:col-span-3"
          index="03"
          label="Shirt numbers"
          title="Every number worn."
          body="Season by season, club by club."
          model="jersey"
          modelOptions={{ number: '10' }}
          fallbackIcon={<ShirtIcon size={30} />}
          player={{ id: '581678', name: 'Bellingham' }}
          tab="shirts"
        />

        <FeatureTile
          className="lg:col-span-4"
          index="04"
          label="Transfers"
          title="Every move, every fee."
          body="The complete transfer record, with the fee and the player’s value at the time."
          player={{ id: '418560', name: 'Haaland' }}
          tab="transfers"
        >
          <TransferRoute />
        </FeatureTile>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- spotlight */

function Spotlight() {
  return (
    <div className="card-dark animate-rise overflow-hidden p-6 md:col-span-2 lg:col-span-5 lg:row-span-2 sm:p-7">
      <div className="flex items-center justify-between">
        <p className="stat-label !text-[#8d939c]">Spotlight</p>
        <span className="flex items-center gap-2 text-xs text-[#8d939c]">
          <span className="live-dot" /> Live values
        </span>
      </div>
      <h3 className="mt-3 font-display font-semiwide text-2xl font-bold text-white">On everyone’s radar</h3>

      <ol className="mt-5 divide-y divide-ink-line">
        {FEATURED.map((player, index) => (
          <SpotlightRow key={player.id} player={player} index={index} />
        ))}
      </ol>
    </div>
  );
}

function SpotlightRow({ player, index }) {
  const { ref, profile } = useLazyProfile(player.id);
  const intent = usePrefetchIntent(player.id);
  const portraitRef = useRef(null);

  return (
    <li>
      <TransitionLink
        ref={ref}
        to={`/player/${player.id}`}
        state={{ profile: profile ?? null }}
        onBeforeTransition={() => markPortrait(portraitRef.current)}
        {...intent}
        className="group -mx-3 flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
      >
        <span className="num w-6 shrink-0 font-display text-xs font-bold text-[#6b717b] transition-colors group-hover:text-volt">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div ref={portraitRef} className="overflow-hidden rounded-xl">
          <Avatar src={profile?.imageUrl} name={player.name} size="sm" fit="contain" className="rounded-xl" />
        </div>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-white">{profile?.name ?? player.name}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-[#8d939c]">
            <Crest clubId={profile?.club?.id} size={15} />
            <span className="truncate">{profile?.club?.name ?? '—'}</span>
          </span>
        </span>
        <span className="num shrink-0 font-display font-semiwide text-[15px] font-bold text-volt">
          {money(profile?.marketValue)}
        </span>
        <ArrowRight
          size={16}
          className="hidden shrink-0 -translate-x-1 text-white opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:block"
        />
      </TransitionLink>
    </li>
  );
}

/* ---------------------------------------------------------- feature tile */

/**
 * One feature of a profile. Every tile has the same three parts, so the eye
 * reads them the same way: a label (number and topic), a stage where the
 * visual sits like a product on a plinth, and the words with a link to a real
 * profile. The stage is the same height on every tile, so titles and links
 * line up across a row, and the 3D models stay clear of the text.
 */
function FeatureTile({ className, index, label, title, body, model, modelOptions, fallbackIcon, player, tab, children }) {
  return (
    <TransitionLink
      to={`/player/${player.id}`}
      state={{ tab }}
      data-model-host
      className={`card card-hover reveal group flex flex-col p-4 sm:p-5 ${className}`}
    >
      <div className="flex items-center gap-2.5 px-1 pt-1">
        <span className="num grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1.5 font-display text-[10px] font-bold text-volt">
          {index}
        </span>
        <span className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-slate">{label}</span>
      </div>

      <div className="tile-stage relative mt-3.5 h-36 overflow-hidden rounded-2xl">
        {children && (
          <div
            className={`absolute inset-y-0 left-0 flex items-center ${
              model ? 'right-[40%] pl-4' : 'right-0 justify-center px-4'
            }`}
          >
            {children}
          </div>
        )}

        {model && (
          <Model
            kind={model}
            options={modelOptions}
            className={`absolute bottom-1 h-32 w-32 ${children ? 'right-1' : 'left-1/2 -translate-x-1/2'}`}
            fallback={
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-volt-soft text-olive">
                  {fallbackIcon}
                </span>
              </span>
            }
          />
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-5">
        <h3 className="font-display font-semiwide text-[1.35rem] font-bold leading-[1.12] text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate">{body}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-ink">
          <span className="link-draw">See it on {player.name}</span>
          <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </TransitionLink>
  );
}

/** A decorative value curve that draws itself in as the tile appears. */
function Sparkline() {
  const line = 'M2 70 C 40 68, 60 64, 90 58 S 140 50, 170 36 S 220 14, 262 6';
  return (
    <svg viewBox="0 0 264 76" className="h-20 w-full" aria-hidden="true">
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#d4ff3f" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#d4ff3f" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L 262 76 L 2 76 Z`} fill="url(#spark-fill)" className="animate-fade" style={{ animationDelay: '600ms' }} />
      <path
        d={line}
        fill="none"
        stroke="#0b0c0e"
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset="1"
        style={{ animation: 'dash 1.6s cubic-bezier(.16,1,.3,1) .3s forwards' }}
      />
      <circle cx="262" cy="6" r="4" fill="#0b0c0e" className="animate-pop" style={{ animationDelay: '1.4s' }} />
    </svg>
  );
}

/** Haaland's senior moves as a route map: a dashed line keeps travelling along it. */
function TransferRoute() {
  const stops = [
    { x: 14, y: 58, name: 'Molde', year: '2017' },
    { x: 100, y: 22, name: 'Salzburg', year: '2019' },
    { x: 186, y: 50, name: 'Dortmund', year: '2020' },
    { x: 266, y: 16, name: 'Man City', year: '2022' },
  ];
  const path = 'M14 58 C 50 58, 64 22, 100 22 S 150 50, 186 50 S 236 16, 266 16';

  return (
    <svg viewBox="0 0 290 86" className="h-[86px] w-full max-w-[330px] overflow-visible" aria-hidden="true">
      <path d={path} fill="none" stroke="#dde0e5" strokeWidth="2" />
      <path
        d={path}
        fill="none"
        stroke="#0b0c0e"
        strokeWidth="2"
        strokeDasharray="6 14"
        style={{ animation: 'travel 1.4s linear infinite' }}
      />
      {stops.map((stop, index) => (
        <g key={stop.name}>
          <circle
            cx={stop.x}
            cy={stop.y}
            r={index === stops.length - 1 ? 7 : 5}
            fill={index === stops.length - 1 ? '#d4ff3f' : '#fff'}
            stroke="#0b0c0e"
            strokeWidth="2"
          />
          <text
            x={stop.x}
            y={stop.y + (stop.y > 40 ? 22 : -12)}
            textAnchor="middle"
            className="fill-ink font-sans text-[10px] font-semibold"
          >
            {stop.name}
          </text>
          <text
            x={stop.x}
            y={stop.y + (stop.y > 40 ? 33 : -23)}
            textAnchor="middle"
            className="num fill-ash font-sans text-[9px]"
          >
            {stop.year}
          </text>
        </g>
      ))}
    </svg>
  );
}
