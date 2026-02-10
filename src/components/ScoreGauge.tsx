import React from "react";

interface ScoreGaugeProps {
  score: number;
  zone: string;
  size?: "sm" | "lg";
}

const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
};

const GAUGE_START = 135;
const GAUGE_SWEEP = 270;

const ZONES = [
  { start: 0, end: 20, color: "hsl(var(--score-zone-1))" },
  { start: 20, end: 40, color: "hsl(var(--score-zone-2))" },
  { start: 40, end: 60, color: "hsl(var(--score-zone-3))" },
  { start: 60, end: 80, color: "hsl(var(--score-zone-4))" },
  { start: 80, end: 100, color: "hsl(var(--score-zone-5))" },
];

const scoreToAngle = (s: number) => GAUGE_START + (s / 100) * GAUGE_SWEEP;

const getZoneColor = (score: number) => {
  if (score <= 20) return "hsl(var(--score-zone-1))";
  if (score <= 40) return "hsl(var(--score-zone-2))";
  if (score <= 60) return "hsl(var(--score-zone-3))";
  if (score <= 80) return "hsl(var(--score-zone-4))";
  return "hsl(var(--score-zone-5))";
};

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, zone, size = "lg" }) => {
  const cx = 100, cy = 100, r = 80;
  const needleAngle = scoreToAngle(Math.min(100, Math.max(0, score)));
  const needleEnd = polarToCartesian(cx, cy, r - 18, needleAngle);
  const sizeClass = size === "lg" ? "w-56" : "w-40";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 140" className={`${sizeClass} h-auto`}>
        {/* Background track */}
        <path
          d={describeArc(cx, cy, r, GAUGE_START, GAUGE_START + GAUGE_SWEEP)}
          fill="none"
          style={{ stroke: "hsl(var(--muted))" }}
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* Zone segments */}
        {ZONES.map((z, i) => (
          <path
            key={i}
            d={describeArc(cx, cy, r, scoreToAngle(z.start) + 0.5, scoreToAngle(z.end) - 0.5)}
            fill="none"
            style={{ stroke: z.color }}
            strokeWidth={12}
            strokeLinecap="round"
          />
        ))}
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleEnd.x}
          y2={needleEnd.y}
          style={{ stroke: "hsl(var(--foreground))" }}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={5} style={{ fill: "hsl(var(--foreground))" }} />
        {/* Score text */}
        <text
          x={cx}
          y={cy + 28}
          textAnchor="middle"
          style={{ fill: getZoneColor(score), fontSize: "26px", fontWeight: 700, fontFamily: "Space Grotesk, sans-serif" }}
        >
          {score}
        </text>
      </svg>
      <span
        className="text-sm font-semibold mt-1 px-3 py-1 rounded-full"
        style={{ color: getZoneColor(score), backgroundColor: `${getZoneColor(score)}20` }}
      >
        {zone}
      </span>
    </div>
  );
};

export default ScoreGauge;
