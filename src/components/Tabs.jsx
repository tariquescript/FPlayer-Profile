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
      className="scroll-x relative flex gap-1 rounded-full border border-line bg-paper p-1.5 shadow-card"
    >
      <span
        aria-hidden="true"
        className="absolute bottom-1.5 top-1.5 rounded-full bg-ink"
        style={{
          left: indicator.left,
          width: indicator.width,
          transition: indicator.ready ? 'left .45s cubic-bezier(.16,1,.3,1), width .45s cubic-bezier(.16,1,.3,1)' : 'none',
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
            className={`relative z-10 flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
              selected ? 'text-white' : 'text-slate hover:text-ink'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge ? (
              <span
                className={`num rounded-full px-1.5 text-[11px] transition-colors duration-300 ${
                  selected ? 'bg-volt text-ink' : 'bg-fog text-slate'
                }`}
              >
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
