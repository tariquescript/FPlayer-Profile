/** Compact label/value pane used across the profile and club pages. */
export default function StatTile({ label, value, icon = null, accent = false, hint = null }) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        accent
          ? 'border-pitch-400/25 bg-pitch-500/8 hover:border-pitch-400/45'
          : 'border-ink-600/70 bg-ink-800/40 hover:border-ink-500'
      }`}
    >
      <div className="flex items-center gap-2">
        {icon && <span className={accent ? 'text-pitch-400' : 'text-mist-500'}>{icon}</span>}
        <p className="stat-label">{label}</p>
      </div>
      <p
        className={`num mt-2 truncate text-base font-semibold ${accent ? 'text-pitch-300' : 'text-mist-100'}`}
        title={typeof value === 'string' ? value : undefined}
      >
        {value ?? '—'}
      </p>
      {hint && <p className="mt-1 text-xs text-mist-400">{hint}</p>}
    </div>
  );
}
