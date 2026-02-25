import { useMemo, useEffect } from "react";
import { HelpCircle, TrendingUp, TrendingDown, Minus, ShieldCheck, Target, AlertTriangle, XCircle, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ScoreGauge from "@/components/ScoreGauge";

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
  const { user } = useAuth();
  const watermarkText = user?.email || "Treend";
  const heatColor = useMemo(() => getHeatColor(heatX, heatY), [heatX, heatY]);
  const zoneMessage = useMemo(() => getZoneMessage(heatX, heatY), [heatX, heatY]);

  // Score Cambial: single dominant score 0-100
  const scoreCambial = useMemo(() => {
    return Math.round((heatX + (100 - heatY)) / 2);
  }, [heatX, heatY]);

  const scoreData = useMemo(() => {
    if (scoreCambial >= 81) return {
      label: "Cenário Interessante",
      action: "Zona com Potencial",
      confidence: "Alta",
      confidenceColor: "hsl(var(--score-zone-5))",
      Icon: TrendingUp,
      SignalIcon: Zap,
      tip: "Condições de mercado alinhadas ao seu perfil. Considere aproveitar.",
    };
    if (scoreCambial >= 61) return {
      label: "Cenário OK",
      action: "Bom momento, avalie com calma",
      confidence: "Moderada-Alta",
      confidenceColor: "hsl(var(--score-zone-4))",
      Icon: TrendingUp,
      SignalIcon: ShieldCheck,
      tip: "Cenário positivo, mas avalie volume e prazo antes de decidir.",
    };
    if (scoreCambial >= 41) return {
      label: "Cenário Neutro",
      action: "Aguarde ou opere parcialmente",
      confidence: "Moderada",
      confidenceColor: "hsl(var(--score-zone-3))",
      Icon: Minus,
      SignalIcon: Target,
      tip: "Mercado sem tendência clara. Fracione operações se necessário.",
    };
    if (scoreCambial >= 21) return {
      label: "Cenário de Atenção",
      action: "Cautela — opere só se urgente",
      confidence: "Baixa",
      confidenceColor: "hsl(var(--score-zone-2))",
      Icon: TrendingDown,
      SignalIcon: AlertTriangle,
      tip: "Pressão no câmbio. Evite grandes volumes neste momento.",
    };
    return {
      label: "Cenário Pessimista",
      action: "Condições atuais não interesantes",
      confidence: "Muito Baixa",
      confidenceColor: "hsl(var(--score-zone-1))",
      Icon: TrendingDown,
      SignalIcon: XCircle,
      tip: "Condições desfavoráveis. Aguarde melhora nos indicadores.",
    };
  }, [scoreCambial]);

  const scoreLabel = scoreData.label;

  // Block PrintScreen / screenshot shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5"))) {
        e.preventDefault();
        navigator.clipboard?.writeText?.("");
      }
    };
    const handleVisibilityChange = () => {
      // Clear clipboard when user switches away (common PrintScreen flow)
      if (document.hidden) {
        navigator.clipboard?.writeText?.("").catch(() => {});
      }
    };
    window.addEventListener("keyup", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("keyup", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

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

      {/* Score Cambial — dominant indicator + assets */}
      <div className={`${expanded ? "px-6" : "px-5"} pb-3`}>
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <ScoreGauge score={scoreCambial} zone={scoreLabel} size={expanded ? "lg" : "sm"} />
          </div>
          <div className="flex-1 min-w-0 space-y-2.5">
            {/* Recommendation */}
            <div className="flex items-center gap-2">
              <scoreData.Icon className="h-4 w-4 shrink-0" style={{ color: scoreData.confidenceColor }} />
              <span className="text-sm font-semibold text-foreground leading-tight">{scoreData.action}</span>
            </div>

            {/* Confidence */}
            <div className="flex items-center gap-2">
              <scoreData.SignalIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Confiança: <span className="font-semibold" style={{ color: scoreData.confidenceColor }}>{scoreData.confidence}</span>
              </span>
            </div>

            {/* Tip */}
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed">{scoreData.tip}</p>
          </div>
        </div>
      </div>

      {/* Heatmap visualization — screenshot protected */}
      <div className={`${expanded ? "px-6 pb-6" : "px-5 pb-5"} heatmap-protected`}>
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

                {/* The heat point — pulsing */}
                <div
                  className={`absolute ${expanded ? "w-8 h-8" : "w-5 h-5"} rounded-full border-2 border-white/80 shadow-lg transition-all duration-500 animate-[heatpulse_2s_ease-in-out_infinite]`}
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

                {/* Ping ring */}
                <div
                  className={`absolute ${expanded ? "w-8 h-8" : "w-5 h-5"} rounded-full animate-[heatping_2s_ease-out_infinite]`}
                  style={{
                    left: `${heatX}%`,
                    top: `${heatY}%`,
                    transform: "translate(-50%, -50%)",
                    border: `2px solid ${heatColor}`,
                  }}
                />

                {/* Watermark overlay */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
                  <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 -rotate-[25deg] scale-125 opacity-[0.09]">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <span key={i} className="text-[11px] font-semibold text-white whitespace-nowrap tracking-wider">
                        {watermarkText}
                      </span>
                    ))}
                  </div>
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