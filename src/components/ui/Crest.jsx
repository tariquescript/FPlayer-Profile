import { useState } from 'react';
import { clubCrest } from '../../lib/images.js';

/** Club badge. Derived straight from the club id, so it needs no extra request. */
export default function Crest({ clubId, name, size = 22, className = '' }) {
  const [failed, setFailed] = useState(false);
  const src = clubCrest(clubId, size);
  if (!src || failed) return null;

  return (
    <img
      src={src}
      alt={name ? `${name} crest` : ''}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`inline-block shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
