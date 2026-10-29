const POINTS = [
  {
    title: 'Results as you type',
    body: 'A local index of every player you have already seen answers on the first keystroke; the network only refines it.',
  },
  {
    title: 'Prefetch on intent',
    body: 'Rest the pointer on a player for a moment and the full profile starts loading before you click.',
  },
  {
    title: 'Cached, not refetched',
    body: 'Searches and profiles are kept for the session, so the back button and a second visit never wait.',
  },
  {
    title: '3D that waits its turn',
    body: 'Every model is built in code, loads once the page is idle, and stops drawing the moment it scrolls away.',
  },
];

/** The engineering, said plainly — for the visitor who wonders why it is fast. */
export default function Built() {
  return (
    <section id="built" className="reveal mx-auto mt-24 max-w-7xl scroll-mt-24 px-4 sm:mt-32 sm:px-6">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <p className="stat-label">Under the hood</p>
          <h2 className="display mt-4 text-[clamp(2rem,4.6vw,3.7rem)]">
            Built to
            <br />
            feel instant.
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-slate">
            Football data is slow to fetch and the free API behind it sleeps when nobody is using it.{' '}
            <span className="font-medium text-ink">Everything here is arranged so you rarely notice.</span>
          </p>
        </div>

        <ol className="grid grid-cols-1 overflow-hidden rounded-[1.75rem] border border-line bg-line sm:grid-cols-2 lg:col-span-7" style={{ gap: 1 }}>
          {POINTS.map((point, index) => (
            <li key={point.title} className="group bg-paper p-6 transition-colors duration-300 hover:bg-volt-soft sm:p-7">
              <span className="num inline-grid h-8 w-8 place-items-center rounded-full border border-line font-display text-xs font-bold text-ink transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-volt">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-5 font-display font-semiwide text-lg font-bold">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate">{point.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
