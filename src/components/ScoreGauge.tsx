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

// Semicircle: 180° to 0° (left to right, bottom-centered)
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
  const cx = 120, cy = 110;
  const outerR = 90;
  const innerR = 58;
  const needleR = 72;
  const clampedScore = Math.min(100, Math.max(0, score));
  const needleAngle = scoreToAngle(clampedScore);
  const needleEnd = polarToCartesian(cx, cy, needleR, needleAngle);
  const needleColor = getZoneColor(score, inverted);
  const sizeClass = size === "lg" ? "w-52" : "w-36";

  // Tick marks for scale
  const ticks = [0, 20, 40, 60, 80, 100];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 240 140" className={`${sizeClass} h-auto`}>
        <defs>
          {/* Subtle shadow for needle */}
          <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="hsl(0 0% 0%)" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Background track - thicker arc */}
        <path
          d={describeArc(cx, cy, (outerR + innerR) / 2, GAUGE_START, GAUGE_START + GAUGE_SWEEP)}
          fill="none"
          style={{ stroke: "hsl(var(--muted))" }}
          strokeWidth={outerR - innerR}
          strokeLinecap="butt"
        />

        {/* Colored zone segments */}
        {ZONES.map((z, i) => {
          const gapDeg = 1.2;
          const startA = scoreToAngle(z.start) + gapDeg;
          const endA = scoreToAngle(z.end) - gapDeg;
          return (
            <path
              key={i}
              d={describeArc(cx, cy, (outerR + innerR) / 2, startA, endA)}
              fill="none"
              style={{ stroke: inverted ? z.invertedColor : z.color, opacity: 0.85 }}
              strokeWidth={outerR - innerR}
              strokeLinecap="round"
            />
          );
        })}

        {/* Tick marks */}
        {ticks.map((t) => {
          const angle = scoreToAngle(t);
          const outer = polarToCartesian(cx, cy, outerR + 4, angle);
          const inner = polarToCartesian(cx, cy, outerR - 2, angle);
          return (
            <line
              key={t}
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
              style={{ stroke: "hsl(var(--muted-foreground))" }}
              strokeWidth={1.5}
              strokeLinecap="round"
              opacity={0.4}
            />
          );
        })}

        {/* Needle - sleek triangular */}
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
        <circle cx={cx} cy={cy} r={6} style={{ fill: "hsl(var(--foreground))" }} />
        <circle cx={cx} cy={cy} r={3} style={{ fill: "hsl(var(--background))" }} />

        {/* Score number - large centered */}
        <text
          x={cx}
          y={cy + 32}
          textAnchor="middle"
          style={{
            fill: needleColor,
            fontSize: "32px",
            fontWeight: 700,
            fontFamily: "Space Grotesk, sans-serif",
          }}
        >
          {score}
        </text>
      </svg>

      {/* Zone label badge */}
      <span
        className="text-xs font-semibold tracking-wide uppercase px-3 py-1 rounded-md -mt-1"
        style={{
          color: needleColor,
          backgroundColor: `${needleColor}15`,
        }}
      >
        {zone}
      </span>
    </div>
  );
};

export default ScoreGauge;
