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
      <p className="py-10 text-center text-sm text-mist-400">
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
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.42" />
            <stop offset="60%" stopColor="#34d399" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="mv-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="55%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#a78bfa" />
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
              className="text-ink-600"
              strokeDasharray="3 6"
              strokeWidth="1"
            />
            <text x={PAD.left - 10} y={tick.y + 4} textAnchor="end" className="fill-mist-500 text-[11px] num">
              {money(tick.value)}
            </text>
          </g>
        ))}

        <path d={model.area} fill="url(#mv-area)" />
        <path
          d={model.line}
          fill="none"
          stroke="url(#mv-line)"
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {model.points.map((point) => (
          <circle
            key={`${point.date}-${point.marketValue}`}
            cx={point.x}
            cy={point.y}
            r={point === active ? 5.5 : 2.5}
            className={point === active ? 'fill-white' : 'fill-pitch-400'}
            stroke="#04060b"
            strokeWidth="1.5"
          />
        ))}

        {active && (
          <line
            x1={active.x}
            x2={active.x}
            y1={PAD.top - 6}
            y2={HEIGHT - PAD.bottom}
            stroke="currentColor"
            className="text-pitch-400/40"
            strokeWidth="1"
          />
        )}

        <text x={PAD.left} y={HEIGHT - 8} className="fill-mist-500 text-[11px]">
          {fmtDate(model.points[0].date)}
        </text>
        <text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end" className="fill-mist-500 text-[11px]">
          {fmtDate(model.points[model.points.length - 1].date)}
        </text>
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-600/70 bg-ink-800/50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Crest clubId={active.clubId} name={active.clubName} size={22} />
          <div>
            <p className="text-sm font-medium text-mist-100">{active.clubName}</p>
            <p className="text-xs text-mist-400">
              {fmtDate(active.date)}
              {active.age ? ` · age ${active.age}` : ''}
            </p>
          </div>
        </div>
        <p className="num text-xl font-bold text-pitch-300">{money(active.marketValue)}</p>
      </div>
    </div>
  );
}
