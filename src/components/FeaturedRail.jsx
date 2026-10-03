import { useState } from 'react';
import { Link } from 'react-router-dom';
import Crest from './ui/Crest.jsx';
import { useLazyProfile } from '../hooks/useLazyProfile.js';
import { usePrefetchIntent } from '../hooks/usePrefetchIntent.js';
import { money, initials } from '../lib/format.js';
import { accentFor, portraitBig } from '../lib/images.js';

const FEATURED = [
  { id: '418560', name: 'Erling Haaland' },
  { id: '937958', name: 'Lamine Yamal' },
  { id: '581678', name: 'Jude Bellingham' },
  { id: '342229', name: 'Kylian Mbappé' },
  { id: '371998', name: 'Vinicius Junior' },
  { id: '580195', name: 'Jamal Musiala' },
  { id: '598577', name: 'Florian Wirtz' },
  { id: '683840', name: 'Pedri' },
];

export default function FeaturedRail() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">In the spotlight</h2>
          <p className="text-sm text-mist-400">Open a profile instantly, or search for anyone else.</p>
        </div>
      </div>

      <div className="scroll-x mask-fade-r -mx-4 flex gap-3 px-4 pb-2 sm:mx-0 sm:px-0">
        {FEATURED.map((player, index) => (
          <FeaturedCard key={player.id} player={player} index={index} />
        ))}
      </div>
    </section>
  );
}

function FeaturedCard({ player, index }) {
  const { ref, profile } = useLazyProfile(player.id);
  const intent = usePrefetchIntent(player.id);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const hue = accentFor(player.name);
  const imgSrc = portraitBig(profile?.imageUrl);
  const showImage = imgSrc && !imgFailed;

  return (
    <Link
      ref={ref}
      to={`/player/${player.id}`}
      state={{ profile: profile ?? null }}
      {...intent}
      style={{ '--i': index }}
      className="panel panel-hover group flex w-[185px] shrink-0 flex-col overflow-hidden"
    >
      <div
        className="relative h-48 w-full overflow-hidden"
        style={{
          background: `radial-gradient(120% 120% at 30% 15%, hsl(${hue} 60% 24%), hsl(${hue} 55% 10%) 70%)`,
        }}
      >
        <span
          className="absolute inset-0 grid place-items-center font-display text-3xl font-bold tracking-tight text-white/80"
          style={{ opacity: showImage && imgLoaded ? 0 : 1, transition: 'opacity .45s ease' }}
        >
          {initials(player.name)}
        </span>

        {showImage && (
          <img
            src={imgSrc}
            alt={`${player.name} portrait`}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover object-top"
            style={{
              opacity: imgLoaded ? 1 : 0,
              transform: imgLoaded ? 'scale(1)' : 'scale(1.04)',
              transition: 'opacity .5s ease, transform .7s cubic-bezier(.22,1,.36,1)',
            }}
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-900/80 to-transparent" />
      </div>

      <div className="flex flex-col items-center gap-1.5 px-3 py-3 text-center">
        <p className="truncate text-sm font-semibold text-mist-100 w-full">{profile?.name ?? player.name}</p>
        <p className="flex items-center justify-center gap-1.5 text-xs text-mist-400">
          <Crest clubId={profile?.club?.id} size={18} />
          <span className="truncate">{profile?.club?.name ?? '—'}</span>
        </p>
        <span className="num text-xs font-semibold text-pitch-300">{money(profile?.marketValue)}</span>
      </div>
    </Link>
  );
}
