import { useEffect, useRef, useState } from 'react';

/**
 * Tab strip with a sliding indicator. Arrow keys move between tabs, matching
 * the WAI-ARIA tabs pattern.
 */
export default function Tabs({ tabs, active, onChange }) {
  const listRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    const list = listRef.current;
    const current = list?.querySelector('[aria-selected="true"]');
    if (!list || !current) return undefined;

    const measure = () => {
      setIndicator({ left: current.offsetLeft, width: current.offsetWidth, ready: true });
      current.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [active, tabs]);

  const move = (event) => {
    const index = tabs.findIndex((tab) => tab.id === active);
    if (event.key === 'ArrowRight') onChange(tabs[(index + 1) % tabs.length].id);
    if (event.key === 'ArrowLeft') onChange(tabs[(index - 1 + tabs.length) % tabs.length].id);
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={move}
      className="scroll-x relative flex gap-1 rounded-2xl border border-ink-600/70 bg-ink-850/60 p-1.5"
    >
      <span
        aria-hidden="true"
        className="absolute bottom-1.5 top-1.5 rounded-xl bg-gradient-to-b from-ink-600/90 to-ink-700/90 ring-1 ring-pitch-400/25"
        style={{
          left: indicator.left,
          width: indicator.width,
          transition: indicator.ready ? 'left .32s cubic-bezier(.22,1,.36,1), width .32s cubic-bezier(.22,1,.36,1)' : 'none',
        }}
      />

      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`relative z-10 flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              selected ? 'text-mist-100' : 'text-mist-400 hover:text-mist-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge ? (
              <span className="num rounded-md bg-ink-900/70 px-1.5 text-[11px] text-mist-400">{tab.badge}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
