import { Link } from 'react-router-dom';
import Avatar from './ui/Avatar.jsx';
import Crest from './ui/Crest.jsx';
import { useLazyProfile } from '../hooks/useLazyProfile.js';
import { usePrefetchIntent } from '../hooks/usePrefetchIntent.js';
import { money } from '../lib/format.js';

/** A hand-picked starting point so the idle page is never a blank grid. */
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

  return (
    <Link
      ref={ref}
      to={`/player/${player.id}`}
      state={{ profile: profile ?? null }}
      {...intent}
      style={{ '--i': index }}
      className="panel panel-hover group flex w-[190px] shrink-0 flex-col items-center gap-3 p-4 text-center"
    >
      <Avatar
        src={profile?.imageUrl}
        name={player.name}
        size="md"
        className="rounded-2xl ring-1 ring-white/10"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-mist-100">{profile?.name ?? player.name}</p>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-mist-400">
          <Crest clubId={profile?.club?.id} size={14} />
          <span className="truncate">{profile?.club?.name ?? '—'}</span>
        </p>
      </div>
      <span className="num text-xs font-semibold text-pitch-300">{money(profile?.marketValue)}</span>
    </Link>
  );
}
