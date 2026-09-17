/* A small stroke icon set, inlined so the UI never waits on an icon font. */

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function Svg({ children, size = 20, ...rest }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base} {...rest} aria-hidden="true">
      {children}
    </svg>
  );
}

export const SearchIcon = (props) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </Svg>
);

export const CloseIcon = (props) => (
  <Svg {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const ArrowRight = (props) => (
  <Svg {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const ArrowLeft = (props) => (
  <Svg {...props}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </Svg>
);

export const TrophyIcon = (props) => (
  <Svg {...props}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M7 6H4.5A2.5 2.5 0 0 0 7 9.5M17 6h2.5A2.5 2.5 0 0 1 17 9.5" />
    <path d="M12 14v3M9 20h6M10 17h4" />
  </Svg>
);

export const ChartIcon = (props) => (
  <Svg {...props}>
    <path d="M4 19h16" />
    <path d="m5 15 4-5 3.5 3L19 6" />
  </Svg>
);

export const SwapIcon = (props) => (
  <Svg {...props}>
    <path d="M4 8h13l-3-3M20 16H7l3 3" />
  </Svg>
);

export const ShirtIcon = (props) => (
  <Svg {...props}>
    <path d="M9 4 5 6l-1 5h3v8h10v-8h3l-1-5-4-2a3 3 0 0 1-6 0z" />
  </Svg>
);

export const PulseIcon = (props) => (
  <Svg {...props}>
    <path d="M3 12h4l2.5-6 4 12L16 12h5" />
  </Svg>
);

export const UserIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </Svg>
);

export const PinIcon = (props) => (
  <Svg {...props}>
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.6" />
  </Svg>
);

export const CalendarIcon = (props) => (
  <Svg {...props}>
    <rect x="3.5" y="5" width="17" height="16" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);

export const BoltIcon = (props) => (
  <Svg {...props}>
    <path d="M13 3 5 14h6l-1 7 8-11h-6z" />
  </Svg>
);

export const GlobeIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c4 4.6 4 12.4 0 17-4-4.6-4-12.4 0-17z" />
  </Svg>
);

export const ExternalIcon = (props) => (
  <Svg {...props}>
    <path d="M14 4h6v6M20 4l-8.5 8.5" />
    <path d="M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V8a1.5 1.5 0 0 1 1.5-1.5H10" />
  </Svg>
);

export const SpinnerIcon = ({ size = 20, className = '' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={`animate-spin ${className}`} aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

export const ShieldIcon = (props) => (
  <Svg {...props}>
    <path d="M12 3 5 6v6c0 4.4 3 7.9 7 9 4-1.1 7-4.6 7-9V6z" />
  </Svg>
);

export const RulerIcon = (props) => (
  <Svg {...props}>
    <rect x="3" y="8" width="18" height="8" rx="2" />
    <path d="M7 8v3M11 8v4M15 8v3M19 8v4" />
  </Svg>
);

export const FootIcon = (props) => (
  <Svg {...props}>
    <path d="M8 4.5c2.2 0 3.5 1.4 3.5 3.6 0 2-1 3.2-1 5.1 0 2 1.2 3 1.2 4.8 0 1.4-1.2 2.5-3 2.5s-3.2-1.1-3.2-3c0-2.6 1-3.6 1-5.6S6 8.8 6 7c0-1.6.8-2.5 2-2.5z" />
    <path d="M14.5 6.5c1.2 0 2 .8 2 2s-.8 2-2 2" />
  </Svg>
);
