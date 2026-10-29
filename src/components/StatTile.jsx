/** Compact label/value pane used across the profile and club pages. */
export default function StatTile({ label, value, icon = null, accent = false, hint = null }) {
  return (
    <div
      className={`group rounded-2xl border p-4 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 ${
        accent ? 'border-volt-deep bg-volt-soft' : 'border-line bg-paper hover:border-line-strong'
      }`}
    >
      <div className="flex items-center gap-2">
        {icon && <span className={accent ? 'text-olive' : 'text-ash group-hover:text-ink'}>{icon}</span>}
        <p className="stat-label">{label}</p>
      </div>
      <p className="num mt-2 truncate text-base font-semibold text-ink" title={typeof value === 'string' ? value : undefined}>
        {value ?? '—'}
      </p>
      {hint && <p className={`mt-1 text-xs ${accent ? 'text-olive' : 'text-slate'}`}>{hint}</p>}
    </div>
  );
}
