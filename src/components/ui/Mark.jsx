/** The brand mark: a pitch's centre spot, halfway line and circle. Name-agnostic on purpose. */
export default function Mark({ size = 30, className = '' }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#0b0c0e" />
      <path d="M32 8v48" stroke="#d4ff3f" strokeWidth="5" strokeLinecap="round" />
      <circle
        cx="32"
        cy="32"
        r="13"
        fill="none"
        stroke="#d4ff3f"
        strokeWidth="5"
        className="origin-center transition-transform duration-500 ease-[cubic-bezier(.34,1.4,.64,1)] group-hover:scale-[1.18]"
      />
      <circle cx="32" cy="32" r="4" fill="#d4ff3f" />
    </svg>
  );
}
