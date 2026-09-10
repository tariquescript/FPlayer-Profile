import { useState } from 'react';
import { initials } from '../../lib/format.js';
import { accentFor } from '../../lib/images.js';

/**
 * Player portrait with a graceful in-between: Transfermarkt image URLs are not
 * derivable from an id, so a card shows a tinted monogram until the profile
 * that carries the real URL arrives.
 */
export default function Avatar({ src, name, className = '', size = 'md', eager = false }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const hue = accentFor(name || '');

  const sizes = {
    sm: 'h-11 w-11 text-xs',
    md: 'h-20 w-20 text-lg',
    lg: 'h-40 w-40 text-4xl',
    xl: 'h-56 w-56 text-5xl',
  };

  const showImage = src && !failed;

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${sizes[size] ?? sizes.md} ${className}`}
      style={{
        background: `radial-gradient(120% 120% at 30% 15%, hsl(${hue} 60% 24%), hsl(${hue} 55% 10%) 70%)`,
      }}
    >
      <span
        className="absolute inset-0 grid place-items-center font-display font-bold tracking-tight text-white/80"
        style={{ opacity: showImage && loaded ? 0 : 1, transition: 'opacity .45s ease' }}
      >
        {initials(name)}
      </span>

      {showImage && (
        <img
          src={src}
          alt={name ? `${name} portrait` : ''}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={eager ? 'high' : 'auto'}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className="relative h-full w-full object-cover object-top"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'scale(1)' : 'scale(1.04)',
            transition: 'opacity .5s ease, transform .7s cubic-bezier(.22,1,.36,1)',
          }}
        />
      )}
    </div>
  );
}
