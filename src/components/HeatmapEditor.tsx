import { useRef, useCallback } from "react";

interface HeatmapEditorProps {
  heatX: number;
  heatY: number;
  onChange: (x: number, y: number) => void;
}

const HeatmapEditor = ({ heatX, heatY, onChange }: HeatmapEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const getPosition = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    onChange(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  }, [onChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    getPosition(e);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) getPosition(e);
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [getPosition]);

  const favorability = (heatX + heatY) / 2;
  const heatColor = favorability >= 75 ? "hsl(142, 71%, 45%)" 
    : favorability >= 50 ? "hsl(80, 80%, 45%)"
    : favorability >= 35 ? "hsl(48, 96%, 53%)"
    : favorability >= 20 ? "hsl(25, 95%, 53%)"
    : "hsl(0, 84%, 55%)";

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="relative w-full h-[200px] rounded-xl overflow-hidden cursor-crosshair select-none border border-border/40"
        onMouseDown={handleMouseDown}
        style={{
          background: `
            linear-gradient(to right, 
              hsl(0, 84%, 55%, 0.8), 
              hsl(25, 95%, 53%, 0.7) 25%,
              hsl(48, 96%, 53%, 0.7) 50%, 
              hsl(80, 80%, 45%, 0.7) 75%,
              hsl(142, 71%, 45%, 0.8)
            ),
            linear-gradient(to bottom,
              hsl(0, 84%, 55%, 0.4),
              hsl(142, 71%, 45%, 0.4)
            )
          `,
          backgroundBlendMode: "multiply",
        }}
      >
        {/* Grid */}
        <div className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: "10% 10%",
          }}
        />

        {/* Crosshair lines */}
        <div className="absolute top-0 bottom-0 w-px bg-white/40 transition-all duration-75" style={{ left: `${heatX}%` }} />
        <div className="absolute left-0 right-0 h-px bg-white/40 transition-all duration-75" style={{ top: `${heatY}%` }} />

        {/* Glow */}
        <div
          className="absolute w-20 h-20 rounded-full blur-xl transition-all duration-75 pointer-events-none"
          style={{
            left: `${heatX}%`,
            top: `${heatY}%`,
            transform: "translate(-50%, -50%)",
            backgroundColor: heatColor,
            opacity: 0.5,
          }}
        />

        {/* Point */}
        <div
          className="absolute w-6 h-6 rounded-full border-[3px] border-white shadow-xl transition-all duration-75 pointer-events-none"
          style={{
            left: `${heatX}%`,
            top: `${heatY}%`,
            transform: "translate(-50%, -50%)",
            backgroundColor: heatColor,
            boxShadow: `0 0 16px ${heatColor}, 0 0 32px ${heatColor}40, 0 2px 8px rgba(0,0,0,0.3)`,
          }}
        >
          <div className="absolute inset-1 rounded-full bg-white/30" />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(0, 84%, 55%)" }} />
          <span className="text-[10px] text-muted-foreground">Ruim</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(25, 95%, 53%)" }} />
          <span className="text-[10px] text-muted-foreground">Atenção</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(48, 96%, 53%)" }} />
          <span className="text-[10px] text-muted-foreground">Neutro</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(80, 80%, 45%)" }} />
          <span className="text-[10px] text-muted-foreground">Bom</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(142, 71%, 45%)" }} />
          <span className="text-[10px] text-muted-foreground">Ótimo</span>
        </div>
      </div>
    </div>
  );
};

export default HeatmapEditor;
