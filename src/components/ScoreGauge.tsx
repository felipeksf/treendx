import React, { useEffect, useRef, useState } from "react";

interface ScoreGaugeProps {
  score: number;
  label?: string;
  size?: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function scoreToColor(score: number): string {
  const stops = [
    { pos: 0, r: 255, g: 50, b: 50 },
    { pos: 50, r: 255, g: 210, b: 0 },
    { pos: 100, r: 0, g: 230, b: 118 },
  ];
  const t = Math.max(0, Math.min(100, score));
  let a = stops[0], b = stops[1];
  if (t > 50) { a = stops[1]; b = stops[2]; }
  const pct = t <= 50 ? t / 50 : (t - 50) / 50;
  const r = Math.round(lerp(a.r, b.r, pct));
  const g = Math.round(lerp(a.g, b.g, pct));
  const bl = Math.round(lerp(a.b, b.b, pct));
  return `rgb(${r},${g},${bl})`;
}

function getScoreColor(score: number): string {
  if (score >= 65) return "#00e676";
  if (score >= 35) return "#ffd600";
  return "#ff4444";
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  label = "CENÁRIO NEUTRO",
  size = 260,
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [animScore, setAnimScore] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = animScore;
    const end = score;
    const duration = 1600;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * ease;
      setDisplayScore(Math.round(current));
      setAnimScore(current);
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      }
    };

    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [score]); // eslint-disable-line react-hooks/exhaustive-deps

  const W = size;
  const H = size * 0.62;
  const cx = W / 2;
  const cy = H * 0.92;
  const R = W * 0.42;
  const trackThick = W * 0.055;
  const r = R - trackThick / 2;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  // Flip y so arc curves UPWARD
  const arcPoint = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(toRad(angle)),
    y: cy - radius * Math.sin(toRad(angle)),
  });

  const tStart = arcPoint(180, r);
  const tEnd = arcPoint(0, r);
  const trackD = `M ${tStart.x} ${tStart.y} A ${r} ${r} 0 1 0 ${tEnd.x} ${tEnd.y}`;

  const fillAngleDeg = 180 - (animScore / 100) * 180;

  const needleAngle = fillAngleDeg;
  const needleLen = r * 0.78;
  const nEnd = arcPoint(needleAngle, needleLen);
  const nBase1 = arcPoint(needleAngle + 90, W * 0.012);
  const nBase2 = arcPoint(needleAngle - 90, W * 0.012);

  const mainColor = scoreToColor(animScore);

  // Build colored arc segments covering the FULL semicircle (always visible)
  const SEGMENT_COUNT = 40;
  const arcSegments = [];
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const segPct = i / SEGMENT_COUNT;
    const segPctEnd = (i + 1) / SEGMENT_COUNT;
    const startAngle = 180 - segPct * 180;
    const endAngle = 180 - segPctEnd * 180;
    const segStart = arcPoint(startAngle, r);
    const segEnd = arcPoint(endAngle, r);
    const midPct = (segPct + segPctEnd) / 2;
    const color = scoreToColor(midPct * 100);
    arcSegments.push({
      d: `M ${segStart.x} ${segStart.y} A ${r} ${r} 0 0 0 ${segEnd.x} ${segEnd.y}`,
      color,
    });
  }

  const ticks = Array.from({ length: 9 }, (_, i) => {
    const angleDeg = 180 - (i / 8) * 180;
    const inner = arcPoint(angleDeg, r - trackThick * 0.9);
    const outer = arcPoint(angleDeg, r + trackThick * 0.4);
    return { inner, outer, i };
  });

  return (
    <div
      style={{
        width: W,
        position: "relative",
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        userSelect: "none",
      }}
    >
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        overflow="visible"
      >
        <defs>
          <filter id="arcGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="numGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="needleGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background arc glow */}
        <path
          d={trackD}
          fill="none"
          stroke={mainColor}
          strokeWidth={trackThick * 3}
          strokeLinecap="round"
          opacity={0.06}
        />

        {/* Track dark base */}
        <path
          d={trackD}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={trackThick}
          strokeLinecap="round"
        />

        {/* Colored arc — crisp segments */}
        {arcSegments.map((seg, i) => (
          <path
            key={i}
            d={seg.d}
            fill="none"
            stroke={seg.color}
            strokeWidth={trackThick}
            strokeLinecap={i === 0 || i === SEGMENT_COUNT - 1 ? "round" : "butt"}
          />
        ))}

        {/* Tick marks */}
        {ticks.map(({ inner, outer, i }) => (
          <line
            key={i}
            x1={inner.x} y1={inner.y}
            x2={outer.x} y2={outer.y}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={i === 0 || i === 4 || i === 8 ? 1.5 : 0.8}
          />
        ))}

        {/* Needle shadow */}
        <polygon
          points={`${nEnd.x},${nEnd.y} ${nBase1.x},${nBase1.y} ${nBase2.x},${nBase2.y}`}
          fill="rgba(0,0,0,0.4)"
          transform="translate(2,3)"
          filter="url(#needleGlow)"
        />

        {/* Needle */}
        <polygon
          points={`${nEnd.x},${nEnd.y} ${nBase1.x},${nBase1.y} ${nBase2.x},${nBase2.y}`}
          fill="white"
          filter="url(#needleGlow)"
        />

        {/* Needle center cap */}
        <circle
          cx={cx} cy={cy}
          r={W * 0.022}
          fill="white"
          style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.8))" }}
        />
        <circle
          cx={cx} cy={cy}
          r={W * 0.012}
          fill={mainColor}
        />

        {/* Score number */}
        <text
          x={cx}
          y={cy - R * 0.12}
          textAnchor="middle"
          dominantBaseline="auto"
          fill={mainColor}
          fontSize={W * 0.22}
          fontWeight="800"
          fontFamily="'Space Grotesk', 'JetBrains Mono', monospace"
          filter="url(#numGlow)"
          style={{ letterSpacing: "-2px" }}
        >
          {displayScore}
        </text>
      </svg>

      {/* Label below */}
      <div
        style={{
          marginTop: -H * 0.12,
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: W * 0.048,
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "rgba(180,190,210,0.55)",
          textAlign: "center",
          lineHeight: 1.2,
          pointerEvents: "none",
          maxWidth: W,
          wordBreak: "break-word",
        }}
      >
        {label}
      </div>
    </div>
  );
};

export default ScoreGauge;
