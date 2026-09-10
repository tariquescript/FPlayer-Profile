import { flagUrl } from '../../lib/countries.js';

/** Small country flag; renders nothing when the nation is not in the map. */
export default function Flag({ country, width = 20, className = '' }) {
  const src = flagUrl(country, 40);
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      width={width}
      height={Math.round(width * 0.72)}
      loading="lazy"
      decoding="async"
      title={country}
      className={`inline-block shrink-0 rounded-[2px] object-cover ring-1 ring-white/10 ${className}`}
      style={{ width, height: Math.round(width * 0.72) }}
    />
  );
}
