import { useState } from 'react';
import { initials } from '../../lib/format.js';
import { accentFor, portraitBig } from '../../lib/images.js';

// Portraits this tab has already decoded. They render at full opacity
// straight away instead of fading in again, which also gives a page
// transition a finished image to morph to.
const seen = new Set();

/**
 * A player's portrait, with their initials on a tinted ground until it loads.
 *
 * Transfermarkt portraits are tight 3:4 headshots, so `fit="contain"` shows
 * the whole photo in a box of another shape instead of cropping the face: the
 * photo sits at full height and a soft, blurred copy of it fills the sides.
 */
export default function Avatar({ src, name, className = '', size = 'md', eager = false, fit = 'cover' }) {
  const useBig = size !== 'sm';
  const imgSrc = useBig ? portraitBig(src) : src;

  const [loadedSrc, setLoadedSrc] = useState(() => (seen.has(imgSrc) ? imgSrc : null));
  const [failedSrc, setFailedSrc] = useState(null);
  const hue = accentFor(name || '');

  const sizes = {
    sm: 'h-11 w-11 text-xs',
    md: 'h-24 w-20 text-lg',
    lg: 'h-40 w-40 text-4xl',
    xl: 'h-72 w-56 text-5xl',
  };

  const showImage = imgSrc && failedSrc !== imgSrc;
  const loaded = showImage && (loadedSrc === imgSrc || seen.has(imgSrc));

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${sizes[size] ?? sizes.md} ${className}`}
      style={{
        background: `linear-gradient(160deg, hsl(${hue} 30% 93%), hsl(${hue} 22% 84%))`,
      }}
    >
      <span
        className="absolute inset-0 grid place-items-center font-display font-bold tracking-tight"
        style={{ color: `hsl(${hue} 25% 38%)`, opacity: loaded ? 0 : 1, transition: 'opacity .45s ease' }}
      >
        {initials(name)}
      </span>

      {showImage && fit === 'contain' && (
        <img
          src={imgSrc}
          alt=""
          aria-hidden="true"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="absolute inset-0 h-full w-full scale-125 object-cover blur-[5px] brightness-75"
          style={{ opacity: loaded ? 0.85 : 0, transition: 'opacity .5s ease' }}
        />
      )}

      {showImage && (
        <img
          src={imgSrc}
          alt={name ? `${name} portrait` : ''}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={eager ? 'high' : 'auto'}
          onLoad={() => {
            seen.add(imgSrc);
            setLoadedSrc(imgSrc);
          }}
          onError={() => setFailedSrc(imgSrc)}
          className={`relative h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover object-top'}`}
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'none' : 'scale(1.04)',
            transition: 'opacity .5s ease, transform .7s cubic-bezier(.16,1,.3,1)',
          }}
        />
      )}
    </div>
  );
}
