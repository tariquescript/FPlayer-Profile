import { useMemo, useState } from 'react';
import Crest from './ui/Crest.jsx';
import { date as fmtDate, money } from '../lib/format.js';

const WIDTH = 820;
const HEIGHT = 260;
const PAD = { top: 24, right: 18, bottom: 30, left: 56 };

/** Rounded "nice" ceiling so the y-axis labels land on readable numbers. */
function niceMax(value) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

/**
 * Market value over a career, drawn as an area chart in plain SVG — no chart
 * library, so it adds nothing to the bundle and scales to any width.
 */
export default function MarketValueChart({ history = [] }) {
  const [hover, setHover] = useState(null);

  const model = useMemo(() => {
    const points = history
      .filter((entry) => entry && Number.isFinite(Number(entry.marketValue)))
      .map((entry) => ({ ...entry, marketValue: Number(entry.marketValue), time: new Date(entry.date).getTime() }))
      .filter((entry) => Number.isFinite(entry.time))
      .sort((a, b) => a.time - b.time);

    if (points.length < 2) return null;

    const maxValue = niceMax(Math.max(...points.map((point) => point.marketValue)));
    const minTime = points[0].time;
    const maxTime = points[points.length - 1].time;
    const span = Math.max(maxTime - minTime, 1);

    const plotWidth = WIDTH - PAD.left - PAD.right;
    const plotHeight = HEIGHT - PAD.top - PAD.bottom;

    const scaled = points.map((point) => ({
      ...point,
      x: PAD.left + ((point.time - minTime) / span) * plotWidth,
      y: PAD.top + plotHeight - (point.marketValue / maxValue) * plotHeight,
    }));

    // Smooth the line with a light cardinal spline; raw polylines look jagged
    // when a value jumps by an order of magnitude.
    const line = scaled
      .map((point, index, all) => {
        if (index === 0) return `M ${point.x} ${point.y}`;
        const previous = all[index - 1];
        const controlX = (previous.x + point.x) / 2;
        return `C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
      })
      .join(' ');

    const area = `${line} L ${scaled[scaled.length - 1].x} ${HEIGHT - PAD.bottom} L ${scaled[0].x} ${HEIGHT - PAD.bottom} Z`;

    const ticks = [0, 0.5, 1].map((ratio) => ({
      value: maxValue * ratio,
      y: PAD.top + plotHeight - ratio * plotHeight,
    }));

    const peak = scaled.reduce((best, point) => (point.marketValue > best.marketValue ? point : best), scaled[0]);

    return { points: scaled, line, area, ticks, peak, maxValue };
  }, [history]);

  if (!model) {
    return (
      <p className="py-10 text-center text-sm text-slate">
        Not enough valuation history to plot a trend.
      </p>
    );
  }

  const track = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * WIDTH;
    let nearest = model.points[0];
    for (const point of model.points) {
      if (Math.abs(point.x - x) < Math.abs(nearest.x - x)) nearest = point;
    }
    setHover(nearest);
  };

  const active = hover ?? model.peak;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-pan-y"
        role="img"
        aria-label="Market value over time"
        onPointerMove={track}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="mv-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4ff3f" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#d4ff3f" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#d4ff3f" stopOpacity="0" />
          </linearGradient>
        </defs>

        {model.ticks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={tick.y}
              y2={tick.y}
              stroke="currentColor"
              className="text-line"
              strokeDasharray="3 6"
              strokeWidth="1"
            />
            <text x={PAD.left - 10} y={tick.y + 4} textAnchor="end" className="fill-ash text-[11px] num">
              {money(tick.value)}
            </text>
          </g>
        ))}

        <path d={model.area} fill="url(#mv-area)" className="animate-fade" style={{ animationDelay: '250ms' }} />
        <path
          d={model.line}
          fill="none"
          stroke="#0b0c0e"
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset="1"
          style={{ animation: 'dash 1.4s cubic-bezier(.16,1,.3,1) forwards' }}
        />

        {model.points.map((point) => (
          <circle
            key={`${point.date}-${point.marketValue}`}
            cx={point.x}
            cy={point.y}
            r={point === active ? 6.5 : 2.5}
            className={point === active ? 'fill-volt' : 'fill-ink'}
            stroke={point === active ? '#0b0c0e' : '#ffffff'}
            strokeWidth={point === active ? 2.5 : 1.5}
            style={{ transition: 'r .2s ease' }}
          />
        ))}

        {active && (
          <line
            x1={active.x}
            x2={active.x}
            y1={PAD.top - 6}
            y2={HEIGHT - PAD.bottom}
            stroke="currentColor"
            className="text-ink/25"
            strokeDasharray="2 4"
            strokeWidth="1"
          />
        )}

        <text x={PAD.left} y={HEIGHT - 8} className="fill-ash text-[11px]">
          {fmtDate(model.points[0].date)}
        </text>
        <text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end" className="fill-ash text-[11px]">
          {fmtDate(model.points[model.points.length - 1].date)}
        </text>
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Crest clubId={active.clubId} name={active.clubName} size={22} />
          <div>
            <p className="text-sm font-semibold text-white">{active.clubName}</p>
            <p className="text-xs text-[#8d939c]">
              {fmtDate(active.date)}
              {active.age ? ` · age ${active.age}` : ''}
            </p>
          </div>
        </div>
        <p className="num font-display font-semiwide text-xl font-bold text-volt">{money(active.marketValue)}</p>
      </div>
    </div>
  );
}
