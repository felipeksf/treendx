import { useMemo, useEffect } from "react";
import { HelpCircle, TrendingUp, TrendingDown, Minus, ShieldCheck, Target, AlertTriangle, XCircle, Zap, Package, Globe, Plane, Laptop } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ScoreGauge from "@/components/ScoreGauge";

interface HeatmapBlockProps {
  profileType: string;
  profileLabel: string;
  profileDescription: string;
  heatX: number;
  heatY: number;
  volatilityPct?: number;
  momentumVal?: number;
  updatedAt?: string | null;
  compact?: boolean;
  expanded?: boolean;
}

const PROFILE_ICONS: Record<string, React.ElementType> = {
  importador: Package,
  exportador: Globe,
  agente_turismo: Plane,
  freelancer: Laptop,
};

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
  profileType,
  profileLabel,
  profileDescription,
  heatX,
  heatY,
  volatilityPct,
  momentumVal,
  updatedAt,
  compact = false,
  expanded = false,
}: HeatmapBlockProps) => {
  const { user } = useAuth();
  const watermarkText = user?.email || "Treend";
  const heatColor = useMemo(() => getHeatColor(heatX, heatY), [heatX, heatY]);
  const zoneMessage = useMemo(() => getZoneMessage(heatX, heatY), [heatX, heatY]);

  const scoreCambial = useMemo(() => {
    return Math.round((heatX + (100 - heatY)) / 2);
  }, [heatX, heatY]);

  // Use real values from DB, fallback to simulated
  const volatility = useMemo(() => {
    if (volatilityPct !== undefined && volatilityPct !== 0) return volatilityPct.toFixed(1);
    return (Math.abs(heatX - 50) / 50 * 3 + 0.5).toFixed(1);
  }, [heatX, volatilityPct]);

  const momentum = useMemo(() => {
    const val = (momentumVal !== undefined && momentumVal !== 0) ? momentumVal : ((heatX - 50) / 50 * 1.5);
    return val >= 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
  }, [heatX, momentumVal]);

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
      action: "Cenário de Probabilidade Neutra",
      confidence: "Moderada",
      confidenceColor: "hsl(var(--score-zone-3))",
      Icon: Minus,
      SignalIcon: Target,
      tip: "Mercado sem tendência clara.\nFracione operações se necessário.",
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
      action: "Condições atuais não interessantes",
      confidence: "Muito Baixa",
      confidenceColor: "hsl(var(--score-zone-1))",
      Icon: TrendingDown,
      SignalIcon: XCircle,
      tip: "Condições desfavoráveis. Aguarde melhora nos indicadores.",
    };
  }, [scoreCambial]);

  const scoreLabel = scoreData.label;
  const ProfileIcon = PROFILE_ICONS[profileType] || Package;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5"))) {
        e.preventDefault();
        navigator.clipboard?.writeText?.("");
      }
    };
    const handleVisibilityChange = () => {
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
    <div
      className="kpi-card overflow-visible transition-all duration-300 hover:shadow-xl hover:scale-[1.01]"
      style={{
        borderColor: scoreData.confidenceColor,
        borderWidth: "1.5px",
        borderStyle: "solid",
      }}
    >
      {/* Header — icon + name + confidence badge */}
      <div className={`${expanded ? "p-6 pb-3" : "p-5 pb-3"} flex items-start justify-between gap-2`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${scoreData.confidenceColor}20`, border: `1px solid ${scoreData.confidenceColor}40` }}
          >
            <ProfileIcon className="w-4 h-4" style={{ color: scoreData.confidenceColor }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
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
              <p className="text-[10px] text-muted-foreground tracking-wider uppercase mt-0.5">
                Atualizado em: {updatedAt}
              </p>
            )}
          </div>
        </div>
        {/* Confidence badge */}
        <span
          className="shrink-0 text-[11px] font-semibold tracking-wide uppercase px-3 py-1 rounded-full border"
          style={{
            color: scoreData.confidenceColor,
            borderColor: scoreData.confidenceColor,
            backgroundColor: `${scoreData.confidenceColor}12`,
          }}
        >
          ● {scoreData.confidence}
        </span>
      </div>

      {/* Score section — action label + gauge + metrics */}
      <div className={`${expanded ? "px-6" : "px-5"} pb-3`}>
        {/* Action recommendation */}
        <div className="flex items-center gap-2 mb-3">
          <scoreData.Icon className="h-4 w-4 shrink-0" style={{ color: scoreData.confidenceColor }} />
          <span className="text-sm font-semibold text-foreground leading-tight">{scoreData.action}</span>
        </div>
        {/* Tip text */}
        <p className="text-[11px] text-muted-foreground/80 leading-relaxed mb-4 whitespace-pre-line break-words">
          {scoreData.tip}
        </p>

        {/* Gauge + KPI metrics row */}
        <div className="flex items-end gap-4">
          <div className="shrink-0">
            <ScoreGauge score={scoreCambial} label={scoreLabel} size={expanded ? 200 : 140} />
          </div>
          <div className="flex-1 grid grid-cols-3 gap-2 pb-2">
            {/* Volatilidade */}
            <div className="text-center">
              <p className="text-sm sm:text-base font-bold text-foreground">{volatility}%</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Volatilidade</p>
            </div>
            {/* Momentum */}
            <div className="text-center">
              <p className={`text-sm sm:text-base font-bold ${parseFloat(momentum) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {momentum}
              </p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Momentum</p>
            </div>
            {/* Score */}
            <div className="text-center">
              <p className="text-sm sm:text-base font-bold text-foreground">{scoreCambial}/100</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap visualization */}
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

                {/* The heat point */}
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
