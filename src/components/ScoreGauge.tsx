import React from "react";

interface ScoreGaugeProps {
  score: number;
  zone: string;
  size?: "sm" | "lg";
  inverted?: boolean;
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

const GAUGE_START = 180;
const GAUGE_SWEEP = 180;

const ZONES = [
  { start: 0, end: 20, color: "hsl(var(--score-zone-1))", invertedColor: "hsl(var(--score-zone-5))" },
  { start: 20, end: 40, color: "hsl(var(--score-zone-2))", invertedColor: "hsl(var(--score-zone-4))" },
  { start: 40, end: 60, color: "hsl(var(--score-zone-3))", invertedColor: "hsl(var(--score-zone-3))" },
  { start: 60, end: 80, color: "hsl(var(--score-zone-4))", invertedColor: "hsl(var(--score-zone-2))" },
  { start: 80, end: 100, color: "hsl(var(--score-zone-5))", invertedColor: "hsl(var(--score-zone-1))" },
];

const scoreToAngle = (s: number) => GAUGE_START + (s / 100) * GAUGE_SWEEP;

const getZoneColor = (score: number, inverted = false) => {
  if (inverted) {
    if (score <= 20) return "hsl(var(--score-zone-5))";
    if (score <= 40) return "hsl(var(--score-zone-4))";
    if (score <= 60) return "hsl(var(--score-zone-3))";
    if (score <= 80) return "hsl(var(--score-zone-2))";
    return "hsl(var(--score-zone-1))";
  }
  if (score <= 20) return "hsl(var(--score-zone-1))";
  if (score <= 40) return "hsl(var(--score-zone-2))";
  if (score <= 60) return "hsl(var(--score-zone-3))";
  if (score <= 80) return "hsl(var(--score-zone-4))";
  return "hsl(var(--score-zone-5))";
};

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, zone, size = "lg", inverted = false }) => {
  const cx = 120, cy = 115;
  const outerR = 95;
  const innerR = 60;
  const needleR = 58;
  const clampedScore = Math.min(100, Math.max(0, score));
  const needleAngle = scoreToAngle(clampedScore);
  const needleEnd = polarToCartesian(cx, cy, needleR, needleAngle);
  const needleColor = getZoneColor(score, inverted);
  const sizeClass = size === "lg" ? "w-44" : "w-28";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 240 145" className={`${sizeClass} h-auto`}>
        <defs>
          <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="hsl(0 0% 0%)" floodOpacity="0.3" />
          </filter>
          <filter id="gaugeShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="hsl(0 0% 0%)" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Background track */}
        <path
          d={describeArc(cx, cy, (outerR + innerR) / 2, GAUGE_START, GAUGE_START + GAUGE_SWEEP)}
          fill="none"
          style={{ stroke: "hsl(var(--muted))" }}
          strokeWidth={outerR - innerR}
          strokeLinecap="butt"
          opacity={0.4}
        />

        {/* Colored zone segments */}
        {ZONES.map((z, i) => {
          const gapDeg = 0.8;
          const startA = scoreToAngle(z.start) + gapDeg;
          const endA = scoreToAngle(z.end) - gapDeg;
          return (
            <path
              key={i}
              d={describeArc(cx, cy, (outerR + innerR) / 2, startA, endA)}
              fill="none"
              style={{ stroke: inverted ? z.invertedColor : z.color }}
              strokeWidth={outerR - innerR}
              strokeLinecap="round"
              filter="url(#gaugeShadow)"
            />
          );
        })}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleEnd.x}
          y2={needleEnd.y}
          style={{ stroke: "hsl(var(--foreground))" }}
          strokeWidth={2.5}
          strokeLinecap="round"
          filter="url(#needleShadow)"
        />

        {/* Needle hub */}
        <circle cx={cx} cy={cy} r={5} style={{ fill: "hsl(var(--foreground))" }} />
        <circle cx={cx} cy={cy} r={2.5} style={{ fill: "hsl(var(--background))" }} />

        {/* Score number — large, centered above baseline */}
        <text
          x={cx}
          y={cy - 12}
          textAnchor="middle"
          style={{
            fill: needleColor,
            fontSize: "42px",
            fontWeight: 800,
            fontFamily: "Space Grotesk, sans-serif",
          }}
        >
          {score}
        </text>

        {/* Zone label — overlapping bottom of arc */}
        <rect
          x={cx - 60}
          y={cy + 2}
          width={120}
          height={18}
          rx={4}
          style={{ fill: `${needleColor}` }}
          opacity={0.9}
        />
        <text
          x={cx}
          y={cy + 15}
          textAnchor="middle"
          style={{
            fill: "hsl(var(--background))",
            fontSize: "10px",
            fontWeight: 700,
            fontFamily: "Space Grotesk, sans-serif",
            letterSpacing: "1.5px",
            textTransform: "uppercase" as const,
          }}
        >
          {zone}
        </text>
      </svg>
    </div>
  );
};

export default ScoreGauge;
