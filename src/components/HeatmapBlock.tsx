import { useMemo } from "react";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeatmapBlockProps {
  profileType: string;
  profileLabel: string;
  profileDescription: string;
  heatX: number;
  heatY: number;
  updatedAt?: string | null;
  compact?: boolean;
  expanded?: boolean;
}

const getHeatColor = (x: number, y: number): string => {
  const favorability = (x + y) / 2;
  if (favorability >= 75) return "hsl(142, 71%, 45%)";
  if (favorability >= 50) return "hsl(80, 80%, 45%)";
  if (favorability >= 35) return "hsl(48, 96%, 53%)";
  if (favorability >= 20) return "hsl(25, 95%, 53%)";
  return "hsl(0, 84%, 55%)";
};

const getZoneMessage = (x: number, y: number): string => {
  const column = x / 100;
  if (column <= 0.2) return "Cenário pessimista para tomada de decisão";
  if (column <= 0.4) return "Cenário não saudável para tomada de decisão";
  if (column <= 0.6) return "Cenário Neutro para tomada de decisão";
  if (column <= 0.8) return "Cenário OK para tomada de decisão";
  return "Cenário interessante para tomada de decisão";
};

const HeatmapBlock = ({
  profileLabel,
  profileDescription,
  heatX,
  heatY,
  updatedAt,
  compact = false,
  expanded = false,
}: HeatmapBlockProps) => {
  const heatColor = useMemo(() => getHeatColor(heatX, heatY), [heatX, heatY]);
  const zoneMessage = useMemo(() => getZoneMessage(heatX, heatY), [heatX, heatY]);

  const gradientStyle = useMemo(() => ({
    background: `
      linear-gradient(to right, 
        hsl(0, 84%, 55%, 0.8), 
        hsl(25, 95%, 53%, 0.7) 25%,
        hsl(48, 96%, 53%, 0.7) 50%, 
        hsl(80, 80%, 45%, 0.7) 75%,
        hsl(142, 71%, 45%, 0.8)
      ),
      linear-gradient(to bottom,
        hsl(142, 71%, 45%, 0.4),
        hsl(0, 84%, 55%, 0.4)
      )
    `,
    backgroundBlendMode: "multiply" as const,
  }), []);

  return (
    <div className="kpi-card overflow-hidden">
      {/* Header */}
      <div className={`${expanded ? "p-6 pb-4" : "p-5 pb-3"} flex items-start justify-between gap-2`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`${expanded ? "text-lg" : "text-base"} font-bold text-foreground tracking-tight`}>{profileLabel}</h3>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px] text-xs">
                  {profileDescription}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {updatedAt && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Atualizado em: {updatedAt}
            </p>
          )}
        </div>
      </div>

      {/* Heatmap visualization */}
      <div className={`${expanded ? "px-6 pb-6" : "px-5 pb-5"}`}>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="relative w-full rounded-2xl overflow-hidden cursor-crosshair transition-all duration-300"
                style={{ ...gradientStyle, height: expanded ? "480px" : compact ? "120px" : "180px" }}
              >
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-[0.07]"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
                      linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
                    `,
                    backgroundSize: "20% 25%",
                  }}
                />

                {/* Glow behind the point */}
                <div
                  className={`absolute ${expanded ? "w-28 h-28" : "w-20 h-20"} rounded-full blur-2xl transition-all duration-500`}
                  style={{
                    left: `${heatX}%`,
                    top: `${heatY}%`,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: heatColor,
                    opacity: 0.5,
                  }}
                />

                {/* The heat point */}
                <div
                  className={`absolute ${expanded ? "w-8 h-8" : "w-5 h-5"} rounded-full border-2 border-white/80 shadow-lg transition-all duration-500`}
                  style={{
                    left: `${heatX}%`,
                    top: `${heatY}%`,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: heatColor,
                    boxShadow: `0 0 16px ${heatColor}, 0 0 32px ${heatColor}40`,
                  }}
                >
                  <div className="absolute inset-1 rounded-full bg-white/30" />
                </div>

                {/* Corner labels */}
                <div className="absolute top-2 left-3 text-[9px] font-semibold text-white/70 drop-shadow-md select-none">●</div>
                <div className="absolute bottom-2 right-3 text-[9px] font-semibold text-white/70 drop-shadow-md select-none">●</div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[220px]">
              {zoneMessage}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Color legend */}
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(0, 84%, 55%)" }} />
            <span className="text-[10px] text-muted-foreground">Zona de pressão</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(48, 96%, 53%)" }} />
            <span className="text-[10px] text-muted-foreground">Equilíbrio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(142, 71%, 45%)" }} />
            <span className="text-[10px] text-muted-foreground">Zona interessante</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapBlock;