import TransitionLink from '../components/TransitionLink.jsx';
import Model from '../components/three/Model.jsx';
import { ArrowLeft } from '../components/ui/Icons.jsx';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24" data-model-host>
      <Model
        kind="card"
        className="relative h-48 w-48 sm:h-56 sm:w-56"
        fallback={<span className="mt-10 block h-32 w-22 rotate-12 rounded-xl bg-[#e5262f] shadow-lift" />}
      />
      <p className="stat-label mt-2">Error 404</p>
      <h1 className="display mt-4 text-[clamp(2.6rem,9vw,6rem)]">Sent off.</h1>
      <p className="mt-5 max-w-md leading-relaxed text-slate">
        This page has left the pitch. Head back to the search and look someone up instead.
      </p>
      <TransitionLink to="/" className="btn btn-primary mt-8">
        <ArrowLeft size={16} /> Back to the players
      </TransitionLink>
    </div>
  );
}
