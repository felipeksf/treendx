import { useMemo } from "react";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeatmapBlockProps {
  profileType: string;
  profileLabel: string;
  profileDescription: string;
  heatX: number; // 0-100
  heatY: number; // 0-100
  updatedAt?: string | null;
  compact?: boolean;
  expanded?: boolean;
}

const getHeatColor = (x: number, y: number): string => {
  // Map position to color: top-left = green (favorable), bottom-right = red (unfavorable)
  // Using a 2D gradient approach
  const favorability = 100 - ((x + y) / 2);
  
  if (favorability >= 75) return "hsl(142, 71%, 45%)"; // Green
  if (favorability >= 50) return "hsl(80, 80%, 45%)";  // Yellow-green
  if (favorability >= 35) return "hsl(48, 96%, 53%)";  // Yellow
  if (favorability >= 20) return "hsl(25, 95%, 53%)";  // Orange
  return "hsl(0, 84%, 55%)"; // Red
};

const getZoneMessage = (x: number, y: number): string => {
  const favorability = 100 - ((x + y) / 2);
  if (favorability >= 75) return "Zona muito favorável para tomada de decisão";
  if (favorability >= 50) return "Zona favorável — bom momento para avaliar";
  if (favorability >= 35) return "Zona neutra — aguarde por melhores condições";
  if (favorability >= 20) return "Zona de atenção — cautela recomendada";
  return "Zona crítica — momento não recomendado";
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

  // Generate the 2D gradient background for the heatmap
  const gradientStyle = useMemo(() => ({
    background: `
      linear-gradient(to right, 
        hsl(142, 71%, 45%, 0.8), 
        hsl(80, 80%, 45%, 0.7) 25%,
        hsl(48, 96%, 53%, 0.7) 50%, 
        hsl(25, 95%, 53%, 0.7) 75%,
        hsl(0, 84%, 55%, 0.8)
      ),
      linear-gradient(to bottom,
        hsl(142, 71%, 45%, 0.4),
        hsl(0, 84%, 55%, 0.4)
      )
    `,
    backgroundBlendMode: "multiply" as const,
  }), []);

  return (
    <div className="rounded-2xl bg-card border border-primary/40 overflow-hidden transition-all hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10">
      {/* Header */}
      <div className={`${expanded ? "p-6 pb-4" : "p-4 pb-3"} flex items-start justify-between gap-2`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`${expanded ? "text-lg" : "text-sm"} font-bold text-foreground tracking-tight`}>{profileLabel}</h3>
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
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Atualizado em: {updatedAt}
            </p>
          )}
        </div>
      </div>

      {/* Heatmap visualization */}
      <div className={`${expanded ? "px-6 pb-6" : "px-4 pb-4"}`}>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="relative w-full rounded-xl overflow-hidden cursor-crosshair transition-all duration-300"
                style={{ ...gradientStyle, height: expanded ? "480px" : compact ? "120px" : "160px" }}
              >
                {/* Grid overlay for depth */}
                <div className="absolute inset-0 opacity-10"
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
                  className={`absolute ${expanded ? "w-24 h-24" : "w-16 h-16"} rounded-full blur-xl transition-all duration-500`}
                  style={{
                    left: `${heatX}%`,
                    top: `${heatY}%`,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: heatColor,
                    opacity: 0.6,
                  }}
                />

                {/* The heat point */}
                <div
                  className={`absolute ${expanded ? "w-8 h-8" : "w-5 h-5"} rounded-full border-2 border-white shadow-lg transition-all duration-500`}
                  style={{
                    left: `${heatX}%`,
                    top: `${heatY}%`,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: heatColor,
                    boxShadow: `0 0 12px ${heatColor}, 0 0 24px ${heatColor}40`,
                  }}
                >
                  <div className="absolute inset-1 rounded-full bg-white/30" />
                </div>

                {/* Corner labels */}
                <div className="absolute top-2 left-3 text-[9px] font-semibold text-white/70 drop-shadow-md select-none">
                  ●
                </div>
                <div className="absolute bottom-2 right-3 text-[9px] font-semibold text-white/70 drop-shadow-md select-none">
                  ●
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[220px]">
              {zoneMessage}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Color legend */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(142, 71%, 45%)" }} />
            <span className="text-[9px] text-muted-foreground">Ótimo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(48, 96%, 53%)" }} />
            <span className="text-[9px] text-muted-foreground">Neutro</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(0, 84%, 55%)" }} />
            <span className="text-[9px] text-muted-foreground">Ruim</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapBlock;
