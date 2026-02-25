import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import treendLogo from "@/assets/treend-logo.png";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { useTreendRate } from "@/hooks/useTreendRate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calculator as CalcIcon,
  TrendingDown,
  TrendingUp,
  Save,
  Percent,
  SlidersHorizontal,
  DollarSign,
  Target,
  Clock,
  Zap,
  Users,
  BarChart3,
  Wallet,
  LineChart,
  ArrowUpRight,
  Activity,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  MinusCircle,
  Bookmark,
  BookmarkCheck,
  Trash2,
  FileDown,
  Mail,
  Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, LineChart as RechartsLineChart, Line,
  ComposedChart, Area,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const RATE_RANGES: Record<string, { min: number; max: number; default: number }> = {
  USD: { min: 4.00, max: 6.50, default: 5.12 },
  EUR: { min: 4.50, max: 7.00, default: 5.58 },
  GBP: { min: 5.00, max: 8.00, default: 6.50 },
  BRL: { min: 0.15, max: 0.30, default: 0.20 },
};

const currencySymbol = (c: string) => c === "BRL" ? "R$" : c === "USD" ? "US$" : c === "GBP" ? "£" : "€";

const currencyFlag = (c: string) => c === "USD" ? "🇺🇸" : c === "EUR" ? "🇪🇺" : c === "GBP" ? "🇬🇧" : c === "BRL" ? "🇧🇷" : "";

const fmtThousands = (v: string) => {
  const num = v.replace(/\D/g, "");
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseThousands = (v: string) => v.replace(/\./g, "");

const fmt = (v: number, negative = false, cur = "BRL") => {
  const sym = currencySymbol(cur);
  const prefix = negative ? `-${sym} ` : `${sym} `;
  const abs = Math.abs(v);
  return abs >= 1_000_000
    ? `${prefix}${(abs / 1_000_000).toFixed(1)}M`
    : abs >= 1_000
    ? `${prefix}${(abs / 1_000).toFixed(1)}K`
    : `${prefix}${abs.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtFull = (v: number, cur = "BRL") => {
  const sym = currencySymbol(cur);
  return `${sym} ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

interface TooltipLabelProps {
  label: string;
  tip: string;
}

const TooltipLabel = ({ label, tip }: TooltipLabelProps) => (
  <Label className="flex items-center gap-1 text-xs text-muted-foreground">
    {label}
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-xs">
          {tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </Label>
);

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  highlight?: boolean;
  color?: "success" | "warning" | "danger" | "default";
  tooltip?: string;
}

const MetricCard = ({ title, value, subtitle, icon, highlight, color = "default", tooltip }: MetricCardProps) => {
  const colorMap = {
    success: "text-treend-success",
    warning: "text-treend-warning",
    danger: "text-treend-danger",
    default: "text-foreground",
  };

  return (
    <div
      className={`kpi-stat p-4 flex flex-col gap-1.5 ${
        highlight ? "border-treend-success/30 bg-treend-success/5" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground font-medium">{title}</span>
          {tooltip && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px] text-xs">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted/40">
          {icon}
        </div>
      </div>
      <span className={`text-lg font-bold tabular-nums tracking-tight ${colorMap[color]}`}>
        {value}
      </span>
      <span className="text-[11px] text-muted-foreground">{subtitle}</span>
    </div>
  );
};

interface HealthItemProps {
  label: string;
  value: string;
  description: string;
  benchmark: string;
  status: "good" | "warning" | "bad";
}

const HealthItem = ({ label, value, description, benchmark, status }: HealthItemProps) => {
  const colors = {
    good: "text-treend-success border-treend-success/20 bg-treend-success/5",
    warning: "text-treend-warning border-treend-warning/20 bg-treend-warning/5",
    bad: "text-treend-danger border-treend-danger/20 bg-treend-danger/5",
  };
  const dotColors = {
    good: "bg-treend-success",
    warning: "bg-treend-warning",
    bad: "bg-treend-danger",
  };

  return (
    <div className={`rounded-xl border p-3.5 transition-all ${colors[status]}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotColors[status]}`} />
          <span className="text-sm font-semibold text-foreground">{label}</span>
        </div>
        <span className="text-sm font-bold tabular-nums text-foreground">{value}</span>
      </div>
      <p className="text-[11px] text-muted-foreground ml-4">{description}</p>
      <p className="text-[10px] text-muted-foreground/70 ml-4 mt-0.5">Benchmark: {benchmark}</p>
    </div>
  );
};

const PRESET_KEY = "treend_calc_preset";

interface CalcPreset {
  currency: string;
  monthlyVolume: string;
  opsPerMonth: string;
  opsFrequency: "month" | "week" | "day";
  bankSpread: string;
  projectionMonths: string;
  profile: string;
}

const loadPreset = (): CalcPreset | null => {
  try {
    const raw = localStorage.getItem(PRESET_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const CalculatorPage = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const saved = loadPreset();
  const [currency, setCurrency] = useState(saved?.currency ?? "USD");
  const [monthlyVolume, setMonthlyVolume] = useState(saved?.monthlyVolume ?? "50000");
  const [currentRate, setCurrentRate] = useState("5.12");
  const [treendRate, setTreendRate] = useState("5.08");
  const [opsPerMonth, setOpsPerMonth] = useState(saved?.opsPerMonth ?? "10");
  const [opsFrequency, setOpsFrequency] = useState<"month" | "week" | "day">(saved?.opsFrequency ?? "month");
  const [bankSpread, setBankSpread] = useState(saved?.bankSpread ?? "1.0");
  const [projectionMonths, setProjectionMonths] = useState(saved?.projectionMonths ?? "12");
  const [sliderRate, setSliderRate] = useState([5.12]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [profile, setProfile] = useState<"importador" | "exportador" | "agente_turismo" | "turista" | "freelancer">((saved?.profile as any) ?? "importador");
  const [hasPreset, setHasPreset] = useState(!!saved);
  const { toast } = useToast();
  const { user } = useAuth();
  const { usd: liveUsd, eur: liveEur, gbp: liveGbp } = useExchangeRates();
  const [converterCurrency, setConverterCurrency] = useState("USD");
  const [converterAmount, setConverterAmount] = useState("1000");
  const [converterResultCurrency, setConverterResultCurrency] = useState<"foreign" | "BRL">("foreign");
  const [scenarioCurrency, setScenarioCurrency] = useState(saved?.currency ?? "USD");
  const [scenarioPeriod, setScenarioPeriod] = useState<"day" | "week" | "month" | "operation">("month");
  const [impactCurrency, setImpactCurrency] = useState("BRL");
  const [evolutionCurrency, setEvolutionCurrency] = useState(saved?.currency ?? "USD");

  const handleSavePreset = () => {
    const preset: CalcPreset = { currency, monthlyVolume, opsPerMonth, opsFrequency, bankSpread, projectionMonths, profile };
    localStorage.setItem(PRESET_KEY, JSON.stringify(preset));
    setHasPreset(true);
    toast({ title: "Predefinição salva", description: "Seus valores padrão serão carregados automaticamente." });
  };

  const handleClearPreset = () => {
    localStorage.removeItem(PRESET_KEY);
    setHasPreset(false);
    toast({ title: "Predefinição removida", description: "Os valores padrão foram restaurados." });
  };

  const prefersLower = ["importador", "agente_turismo", "turista"].includes(profile);

  // Dynamic Treend rate from DB
  const { data: treendRateData } = useTreendRate();
  const treendFraction = treendRateData?.rateFraction ?? 0.008;

  // Compute Treend estimated rate: ±X% from current rate based on profile
  const computeTreendRate = (rate: number, fraction: number = treendFraction) => {
    return prefersLower ? rate * (1 - fraction) : rate * (1 + fraction);
  };

  // Update currentRate and treendRate when live rates load or treend fraction changes
  useEffect(() => {
    const liveRate = currency === "USD" && liveUsd ? liveUsd.bid
      : currency === "EUR" && liveEur ? liveEur.bid
      : currency === "GBP" && liveGbp ? liveGbp.bid
      : null;
    if (liveRate) {
      setCurrentRate(liveRate.toFixed(4));
      setTreendRate((prefersLower ? liveRate * (1 - treendFraction) : liveRate * (1 + treendFraction)).toFixed(4));
    }
  }, [liveUsd?.bid, liveEur?.bid, liveGbp?.bid, treendFraction, currency, prefersLower]);

  // Recalculate treend rate when profile changes
  useEffect(() => {
    const rate = parseFloat(currentRate);
    if (rate > 0) {
      setTreendRate(computeTreendRate(rate).toFixed(4));
    }
  }, [profile, treendFraction]);

  const rateRange = RATE_RANGES[currency];
  const volume = parseFloat(monthlyVolume) || 0;
  const curRate = parseFloat(currentRate) || 0;
  const trdRate = parseFloat(treendRate) || 0;
  const opsRaw = parseFloat(opsPerMonth) || 1;
  const ops = opsFrequency === "week" ? opsRaw * 4 : opsFrequency === "day" ? opsRaw * 22 : opsRaw;
  const spread = parseFloat(bankSpread) || 0;
  const projMonths = parseInt(projectionMonths) || 12;
  const sliderRateNum = sliderRate[0];

  const handleCurrencyChange = (val: string) => {
    setCurrency(val);
    const range = RATE_RANGES[val];
    const liveRate = val === "USD" && liveUsd ? liveUsd.bid : val === "EUR" && liveEur ? liveEur.bid : val === "GBP" && liveGbp ? liveGbp.bid : range.default;
    setCurrentRate(liveRate.toFixed(4));
    setSliderRate([liveRate]);
    const prefLower = ["importador", "agente_turismo", "turista"].includes(profile);
    setTreendRate((prefLower ? liveRate * (1 - treendFraction) : liveRate * (1 + treendFraction)).toFixed(4));
    setScenarioCurrency(val);
    setEvolutionCurrency(val);
  };

  const handleReset = () => {
    setMonthlyVolume("50000");
    setCurrentRate(rateRange.default.toFixed(2));
    setTreendRate(computeTreendRate(rateRange.default).toFixed(4));
    setOpsPerMonth("10");
    setBankSpread("1.0");
    setProjectionMonths("12");
    setSliderRate([rateRange.default]);
  };

  const metrics = useMemo(() => {
    const curBRL = volume * curRate;
    const trdBRL = volume * trdRate;

    // Rate difference – always as positive magnitude of the benefit
    const rateDiffAbs = Math.abs(curRate - trdRate);
    const rateDiffPct = curRate > 0 ? (rateDiffAbs / curRate) * 100 : 0;
    const rateDiff = curRate - trdRate; // signed, for display

    // Gross economy (just the rate-difference benefit, before spread)
    const grossPct = rateDiffPct;
    const grossMonth = (grossPct / 100) * curBRL;
    const grossPerOp = ops > 0 ? grossMonth / ops : 0;

    // Net economy = (|diff%| - spread%) × volume BRL
    const netPct = rateDiffPct - spread;
    const netMonth = (netPct / 100) * curBRL;
    const netPerOp = ops > 0 ? netMonth / ops : 0;
    const netYear = netMonth * 12;

    // Spread cost = volume BRL × spread%
    const spreadCost = curBRL * (spread / 100);
    const effectiveRate = curRate * (1 + spread / 100);

    // Economia - Spread = gross - spread cost (= netMonth, but shown with breakdown context)
    const economiaMinusSpread = grossMonth - spreadCost;

    const proj6m = netMonth * 6;
    const proj12m = netMonth * 12;
    const proj24m = netMonth * 24;

    // Zone info (kept for health – based on main currency)
    const range = rateRange.max - rateRange.min;
    const rawPct = ((curRate - rateRange.min) / range) * 100;
    const pct = prefersLower ? rawPct : 100 - rawPct;

    // Health scores
    // Economia <= 0.8% ideal
    const savingsHealthStatus: "good" | "warning" | "bad" =
      grossPct <= 0.8 && grossPct > 0 ? "good" : grossPct <= 1.2 ? "warning" : "bad";
    // Spread <= 1.2% ideal 0.5%
    const spreadHealthStatus: "good" | "warning" | "bad" =
      spread <= 0.5 ? "good" : spread <= 1.2 ? "warning" : "bad";
    // Economia Líquida (net %) >= 0.1% good
    const netHealthStatus: "good" | "warning" | "bad" =
      netPct >= 0.1 ? "good" : netPct >= 0 ? "warning" : "bad";
    const volumeHealthStatus: "good" | "warning" | "bad" =
      volume >= 2000 ? "good" : volume >= 1000 ? "warning" : "bad";

    const overallHealth =
      [savingsHealthStatus, spreadHealthStatus, netHealthStatus, volumeHealthStatus].filter(
        (s) => s === "good"
      ).length >= 3
        ? "good"
        : [savingsHealthStatus, spreadHealthStatus, netHealthStatus, volumeHealthStatus].filter(
            (s) => s === "bad"
          ).length >= 2
        ? "bad"
        : "warning";

    return {
      curBRL, trdBRL, rateDiff, rateDiffPct,
      grossPct, grossMonth, grossPerOp,
      netPct, netMonth, netPerOp, netYear,
      spreadCost, effectiveRate,
      economiaMinusSpread,
      proj6m, proj12m, proj24m,
      pct,
      savingsHealthStatus, spreadHealthStatus, netHealthStatus, volumeHealthStatus,
      overallHealth,
    };
  }, [volume, curRate, trdRate, ops, spread, rateRange, profile, prefersLower]);

  // Scenario slider – independent currency
  const scenarioRange = RATE_RANGES[scenarioCurrency] || RATE_RANGES.USD;
  const scenarioLiveRate = scenarioCurrency === "USD" && liveUsd ? liveUsd.bid
    : scenarioCurrency === "EUR" && liveEur ? liveEur.bid
    : scenarioCurrency === "GBP" && liveGbp ? liveGbp.bid
    : scenarioRange.default;

  const scenarioPeriodLabel = opsFrequency === "day" ? "por dia" : opsFrequency === "week" ? "por semana" : "por mês";
  const scenarioPeriodVolumeLabel = opsFrequency === "day" ? "diário" : opsFrequency === "week" ? "semanal" : "mensal";
  const scenarioTreendEstimate = scenarioCurrency === currency ? trdRate : (prefersLower ? scenarioLiveRate * (1 - treendFraction) : scenarioLiveRate * (1 + treendFraction));

  // Reset slider to Treend estimate when scenario currency changes
  useEffect(() => {
    setSliderRate([scenarioTreendEstimate]);
  }, [scenarioCurrency, scenarioTreendEstimate]);

  // Sync scenario period with main calculator ops frequency
  useEffect(() => {
    setScenarioPeriod(opsFrequency);
  }, [opsFrequency]);

  const scenario = useMemo(() => {
    const sRate = sliderRate[0];
    const periodVolume = volume;

    // BRL values at simulated rate vs current live rate
    const sBRL = periodVolume * sRate;
    const currentBRL = periodVolume * scenarioLiveRate;

    // Treend rate: 0.8% better than simulated rate
    const treendRate = prefersLower ? sRate * (1 - treendFraction) : sRate * (1 + treendFraction);
    const treendBRL = periodVolume * treendRate;

    // "Economia mensal" = simulated vs current (without Treend advantage)
    const diffVsCurrent = sBRL - currentBRL;
    const diffPct = currentBRL > 0 ? (diffVsCurrent / currentBRL) * 100 : 0;
    const isBetter = prefersLower ? diffVsCurrent < 0 : diffVsCurrent > 0;
    const impactAbs = Math.abs(diffVsCurrent);

    // "Economia com a Treend" = Treend rate vs current (always >= impactAbs)
    const treendVsCurrent = treendBRL - currentBRL;
    const treendImpactAbs = Math.abs(treendVsCurrent);
    const treendIsBetter = prefersLower ? treendVsCurrent < 0 : treendVsCurrent > 0;
    const treendDiffPct = currentBRL > 0 ? (treendVsCurrent / currentBRL) * 100 : 0;

    // Pure Treend advantage (treend rate vs simulated rate)
    const treendSaving = Math.abs(sBRL - treendBRL);

    const range = scenarioRange.max - scenarioRange.min;
    const rawPct = ((sRate - scenarioRange.min) / range) * 100;
    const zonePct = prefersLower ? rawPct : 100 - rawPct;

    // Scenario-based spread calculations for dynamic cards
    const scenarioSpreadCost = sBRL * (spread / 100);
    const scenarioEconWithTreend = treendSaving - scenarioSpreadCost;
    const scenarioEconWithoutTreend = -scenarioSpreadCost;

    return { periodVolume, sBRL, currentBRL, diffVsCurrent, diffPct, isBetter, impactAbs, treendSaving, treendImpactAbs, treendIsBetter, treendDiffPct, zonePct, scenarioSpreadCost, scenarioEconWithTreend, scenarioEconWithoutTreend };
  }, [sliderRate, volume, scenarioLiveRate, scenarioRange, prefersLower, treendFraction, spread]);

  const getZoneLabel = (pct: number) => {
    if (pct <= 20) return { label: "Zona muito interessante", color: "text-treend-success" };
    if (pct <= 40) return { label: "Zona interessante", color: "text-treend-success" };
    if (pct <= 60) return { label: "Zona neutra", color: "text-treend-warning" };
    if (pct <= 80) return { label: "Zona de pressão", color: "text-treend-danger" };
    return { label: "Zona de alta pressão", color: "text-treend-danger" };
  };

  const scenarioZoneInfo = getZoneLabel(scenario.zonePct);
  const profileActionLabel = prefersLower ? "custo mensal" : "receita mensal";
  const isPositive = metrics.netMonth > 0;
  const healthLabels = { good: "Saudável", warning: "Atenção", bad: "Crítico" };
  const healthColors = { good: "bg-treend-success/10 text-treend-success border-treend-success/30", warning: "bg-treend-warning/10 text-treend-warning border-treend-warning/30", bad: "bg-treend-danger/10 text-treend-danger border-treend-danger/30" };

  const handleExportFullPDF = useCallback(async () => {
    if (!pageRef.current) return;
    setExportingPDF(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { default: jsPDF } = await import("jspdf");

      const canvas = await html2canvas(pageRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--background").trim()
          ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--background").trim()})`
          : "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 277;

      const doc = new jsPDF("p", "mm", "a4");
      let position = 10;
      let heightLeft = imgHeight;

      doc.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        doc.addPage();
        doc.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      doc.save(`simulacao-treend-completa-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      toast({ title: "Erro ao gerar PDF", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setExportingPDF(false);
    }
  }, [toast]);

  return (
    <div ref={pageRef} className="space-y-5 max-w-5xl mx-auto overflow-x-hidden">
      {/* Input Card */}
      <div className="kpi-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Simulação Interativa</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Ajuste os valores e veja as mudanças em tempo real</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={profile} onValueChange={(v) => setProfile(v as "importador" | "exportador")}>
              <SelectTrigger className="h-9 w-full sm:w-[150px] text-xs bg-muted/40 border-border/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="importador">Importador</SelectItem>
                <SelectItem value="exportador">Exportador</SelectItem>
                <SelectItem value="agente_turismo">Agente de Turismo</SelectItem>
                <SelectItem value="turista">Turista</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
              </SelectContent>
            </Select>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={hasPreset ? "secondary" : "outline"} size="sm" onClick={handleSavePreset} className="gap-1.5 text-xs">
                    {hasPreset ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                    {hasPreset ? "Salvo" : "Salvar"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Salvar valores atuais como predefinição
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {hasPreset && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleClearPreset} className="h-9 w-9 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Remover predefinição salva
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
              Resetar
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportFullPDF} disabled={exportingPDF} className="gap-1.5 text-xs">
              {exportingPDF ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
              PDF
            </Button>
          </div>
        </div>

        <div className="border-t border-border/40 pt-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <TooltipLabel label="Moeda" tip="Selecione a moeda para simulação" />
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="h-10 text-sm bg-muted/40 border-border/40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD"><span className="flex items-center gap-2">{currencyFlag("USD")} USD — Dólar</span></SelectItem>
                  <SelectItem value="EUR"><span className="flex items-center gap-2">{currencyFlag("EUR")} EUR — Euro</span></SelectItem>
                  <SelectItem value="GBP"><span className="flex items-center gap-2">{currencyFlag("GBP")} GBP — Libra</span></SelectItem>
                  <SelectItem value="BRL"><span className="flex items-center gap-2">{currencyFlag("BRL")} BRL — Real</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <TooltipLabel label={`Volume (${currency})`} tip="Total em moeda estrangeira movimentado por mês" />
              <Input type="text" inputMode="numeric" value={fmtThousands(monthlyVolume)} onChange={(e) => setMonthlyVolume(parseThousands(e.target.value))} className="h-10 text-sm bg-muted/40 border-border/40" />
            </div>
            <div className="space-y-1.5">
              <TooltipLabel label={`Operações/${opsFrequency === "day" ? "Dia" : opsFrequency === "week" ? "Semana" : "Mês"}`} tip="Quantidade de operações de câmbio no período selecionado" />
              <div className="flex gap-1.5">
                <Input type="number" value={opsPerMonth} onChange={(e) => setOpsPerMonth(e.target.value)} className="h-10 text-sm bg-muted/40 border-border/40 flex-1 min-w-0" />
                <Select value={opsFrequency} onValueChange={(v) => setOpsFrequency(v as "month" | "week" | "day")}>
                  <SelectTrigger className="h-10 w-[80px] shrink-0 text-xs bg-muted/40 border-border/40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Dia</SelectItem>
                    <SelectItem value="week">Semana</SelectItem>
                    <SelectItem value="month">Mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mt-3">
            <div className="space-y-1.5">
              <TooltipLabel label={`Taxa Atual (${currencySymbol(currency)})`} tip="Insira a taxa de câmbio comercial do dia abaixo" />
              <Input
                type="number"
                value={currentRate}
                onChange={(e) => {
                  const val = e.target.value;
                  setCurrentRate(val);
                  setSliderRate([parseFloat(val) || rateRange.default]);
                  const rate = parseFloat(val) || 0;
                  if (rate > 0) setTreendRate(computeTreendRate(rate).toFixed(4));
                }}
                step="0.01"
                className="h-10 text-sm bg-muted/40 border-border/40"
              />
            </div>
            <div className="space-y-1.5">
              <TooltipLabel label={`Taxa Estimada pela Treend (${currencySymbol(currency)})`} tip="Taxa estimada pela Treend com base na cotação atual ±0.8%" />
              <Input type="number" value={treendRate} onChange={(e) => setTreendRate(e.target.value)} step="0.01" className="h-10 text-sm bg-muted/40 border-border/40" />
            </div>
            <div className="space-y-1.5">
              <TooltipLabel label="Percentual de Diferença" tip="Diferença percentual entre a Taxa Atual e a Taxa Estimada pela Treend" />
              <div className={`h-10 flex items-center justify-center rounded-md border text-sm font-semibold tabular-nums ${
                curRate > 0 && trdRate > 0 && curRate !== trdRate
                  ? isPositive
                    ? "border-treend-success/30 bg-treend-success/10 text-treend-success"
                    : "border-treend-danger/30 bg-treend-danger/10 text-treend-danger"
                  : "border-border/40 bg-muted/40 text-muted-foreground"
              }`}>
                {curRate > 0 && trdRate > 0
                  ? `${Math.abs((curRate - trdRate) / curRate * 100).toFixed(2)}%`
                  : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Advanced */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full border-t border-border/40 pt-3 mt-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <span>Configurações Avançadas</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            <div className="space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <TooltipLabel label="Taxa de Spread (%)" tip="Percentual de spread cobrado por bancos e plataformas sobre a taxa de câmbio" />
                  <span className="text-sm font-semibold tabular-nums text-foreground">{parseFloat(bankSpread).toFixed(1)}%</span>
                </div>
                <Slider
                  value={[parseFloat(bankSpread) || 0]}
                  onValueChange={(val) => setBankSpread(val[0].toFixed(1))}
                  min={0}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0%</span>
                  <span>2.5%</span>
                  <span>5%</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <TooltipLabel label="Projeção (meses)" tip="Período para projeção de economia futura" />
                <Input type="number" value={projectionMonths} onChange={(e) => setProjectionMonths(e.target.value)} className="h-10 text-sm bg-muted/40 border-border/40" />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Metric Cards + Health Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Left - Metric Cards Grid */}
        <div className="space-y-3">
          {/* Row 1: Economia → Economia Mensal → Economia - Spread */}
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              title="Economia"
              value={fmt(metrics.netPerOp, !isPositive, currency)}
              subtitle="Por transação (líquida)"
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
              color={isPositive ? "success" : "danger"}
              tooltip="(% diferença - % spread) × volume ÷ operações. Economia líquida por operação."
            />
            <MetricCard
              title="Economia Mensal"
              value={fmt(metrics.netMonth, !isPositive, currency)}
              subtitle={isPositive ? "Economia potencial" : "Custo adicional"}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              color={isPositive ? "success" : "danger"}
              highlight={isPositive}
              tooltip="(% diferença - % spread) × volume mensal em BRL. Economia líquida no mês."
            />
            <MetricCard
              title="Economia - Spread"
              value={fmt(metrics.economiaMinusSpread, metrics.economiaMinusSpread < 0, currency)}
              subtitle={`Bruto ${fmt(metrics.grossMonth, false, currency)} − Spread ${fmt(metrics.spreadCost, false, currency)}`}
              icon={<MinusCircle className="h-4 w-4 text-muted-foreground" />}
              color={metrics.economiaMinusSpread > 0 ? "success" : "danger"}
              highlight={metrics.economiaMinusSpread > 0}
              tooltip="Economia bruta (só diferença de taxa) menos o custo de spread. Resultado final líquido."
            />
            <MetricCard
              title="Diferença de Taxa"
              value={`${metrics.rateDiffPct.toFixed(2)}%`}
              subtitle={`${Math.abs(metrics.rateDiff).toFixed(4)} pts`}
              icon={<Zap className="h-4 w-4 text-muted-foreground" />}
              color={metrics.rateDiffPct >= 0.5 ? "success" : "warning"}
              tooltip="Diferença percentual entre a cotação do dia e a taxa estimada pela Treend."
            />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              title="Economia Bruta"
              value={fmt(metrics.grossMonth, false, currency)}
              subtitle="Mensal (sem spread)"
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              color={metrics.grossMonth > 0 ? "success" : "default"}
              tooltip="Economia bruta apenas pela diferença de taxas, sem descontar spread."
            />
            <MetricCard
              title="Custo Spread"
              value={fmt(metrics.spreadCost, false, currency)}
              subtitle={`${spread.toFixed(1)}% sobre ${fmt(metrics.curBRL, false, "BRL")}`}
              icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
              color="warning"
              tooltip="Volume mensal em BRL × a taxa de spread selecionada."
            />
            <MetricCard
              title="Taxa Efetiva"
              value={metrics.effectiveRate.toFixed(4)}
              subtitle="Com taxa de spread"
              icon={<LineChart className="h-4 w-4 text-muted-foreground" />}
              color="default"
              tooltip="A cotação do dia + Taxa de Spread que você selecionou."
            />
            <MetricCard
              title="Percentual Líquido"
              value={`${metrics.netPct.toFixed(2)}%`}
              subtitle={isPositive ? "% de economia" : "% de custo"}
              icon={<Percent className="h-4 w-4 text-muted-foreground" />}
              color={metrics.netPct >= 0.5 ? "success" : metrics.netPct >= 0 ? "warning" : "danger"}
              tooltip="(% diferença - % spread). Percentual líquido da operação."
            />
          </div>

          {/* Row 3 - Projections */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              title="Volume BRL"
              value={fmt(metrics.curBRL, false, "BRL")}
              subtitle="Total mensal em R$"
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              color="default"
              tooltip="O valor da operação × a cotação do dia (em reais)."
            />
            <MetricCard
              title="Economia Anual"
              value={fmt(metrics.netYear, !isPositive, currency)}
              subtitle="Projeção 12 meses"
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
              color={isPositive ? "success" : "danger"}
              tooltip="Economia líquida mensal × 12 meses."
            />
            <MetricCard
              title={`Projeção ${projMonths}m`}
              value={fmt(metrics.netMonth * projMonths, !isPositive, currency)}
              subtitle="Economia projetada"
              icon={<ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
              color={isPositive ? "success" : "danger"}
              tooltip="Economia líquida mensal × meses de projeção."
            />
            <MetricCard
              title="Projeção 24m"
              value={fmt(metrics.proj24m, !isPositive, currency)}
              subtitle="Economia 2 anos"
              icon={<ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
              color={isPositive ? "success" : "danger"}
              tooltip="Economia líquida mensal × 24 meses."
            />
          </div>
        </div>

        {/* Right - Health Panel */}
        <div className="kpi-card p-5 space-y-4 h-fit">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">Saúde da Operação</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${healthColors[metrics.overallHealth]}`}>
                {healthLabels[metrics.overallHealth]}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <HealthItem
              label="Economia"
              value={`${metrics.grossPct.toFixed(2)}%`}
              description={
                metrics.savingsHealthStatus === "good"
                  ? "Excelente diferencial cambial sobre operações"
                  : metrics.savingsHealthStatus === "warning"
                  ? "Diferencial moderado, avalie condições"
                  : "Diferencial insuficiente para gerar economia"
              }
              benchmark="<= 0,8% (ideal)"
              status={metrics.savingsHealthStatus}
            />
            <HealthItem
              label="Taxa de Spread"
              value={`${spread.toFixed(2)}%`}
              description={
                metrics.spreadHealthStatus === "good"
                  ? "Spread competitivo e saudável"
                  : metrics.spreadHealthStatus === "warning"
                  ? "Spread aceitável mas pode melhorar"
                  : "Spread elevado, renegociar condições"
              }
              benchmark="<= 1,2% (ideal: 0,5%)"
              status={metrics.spreadHealthStatus}
            />
            <HealthItem
              label="Economia Líquida"
              value={`${metrics.netPct.toFixed(2)}%`}
              description={
                metrics.netHealthStatus === "good"
                  ? "Resultado líquido excelente após descontar spread"
                  : metrics.netHealthStatus === "warning"
                  ? "Resultado positivo, mas margem apertada"
                  : "Spread consome a economia — renegocie ou aguarde melhor taxa"
              }
              benchmark=">= 0,1% (ideal)"
              status={metrics.netHealthStatus}
            />
            <HealthItem
              label="Volume Mensal"
              value={fmt(volume, false, currency)}
              description="Este é o volume mensal projetado conforme as suas inserções na calculadora."
              benchmark={`>= ${currency} 2K`}
              status="good"
            />
          </div>
        </div>
      </div>

      {/* Quick Converter */}
      {(() => {
        const convRate = converterCurrency === "USD" ? liveUsd?.bid : converterCurrency === "EUR" ? liveEur?.bid : liveGbp?.bid;
        const convAmount = parseFloat(converterAmount.replace(/\./g, "").replace(",", ".")) || 0;
        const convSymbol = converterCurrency === "USD" ? "US$" : converterCurrency === "EUR" ? "€" : "£";
        return (
          <div className="kpi-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                <CalcIcon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Conversor Rápido</span>
              <span className="text-xs text-muted-foreground ml-1">({converterCurrency} → {converterResultCurrency === "BRL" ? "BRL" : converterCurrency} com cotação do dia)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Moeda</Label>
                <Select value={converterCurrency} onValueChange={setConverterCurrency}>
                  <SelectTrigger className="h-10 text-sm bg-muted/40 border-border/40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD"><span className="flex items-center gap-2">{currencyFlag("USD")} USD — Dólar</span></SelectItem>
                    <SelectItem value="EUR"><span className="flex items-center gap-2">{currencyFlag("EUR")} EUR — Euro</span></SelectItem>
                    <SelectItem value="GBP"><span className="flex items-center gap-2">{currencyFlag("GBP")} GBP — Libra</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Valor em {convSymbol}</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={(() => {
                    const parts = converterAmount.split(",");
                    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                    return parts.length > 1 ? `${intPart},${parts[1]}` : intPart;
                  })()}
                  onChange={(e) => {
                    // Remove dots (thousands), keep comma (decimal), keep digits
                    let raw = e.target.value.replace(/\./g, "");
                    // Allow only digits and one comma
                    raw = raw.replace(/[^0-9,]/g, "");
                    // Ensure only one comma
                    const commaIdx = raw.indexOf(",");
                    if (commaIdx !== -1) {
                      raw = raw.slice(0, commaIdx + 1) + raw.slice(commaIdx + 1).replace(/,/g, "").slice(0, 2);
                    }
                    setConverterAmount(raw);
                  }}
                  className="h-10 text-sm bg-muted/40 border-border/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Cotação Atual</Label>
                <div className="h-10 flex items-center justify-center rounded-md border border-border/40 bg-muted/40 text-sm font-semibold tabular-nums text-foreground">
                  {convRate ? convRate.toFixed(4) : "—"}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Resultado</Label>
                  <Select value={converterResultCurrency} onValueChange={(v) => setConverterResultCurrency(v as "foreign" | "BRL")}>
                    <SelectTrigger className="h-5 w-auto gap-1 border-0 bg-transparent px-1 text-[10px] font-medium text-primary hover:text-primary/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="foreign">{converterCurrency}</SelectItem>
                      <SelectItem value="BRL">BRL (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-10 flex items-center justify-center rounded-md border border-primary/30 bg-primary/5 text-sm font-bold tabular-nums text-foreground">
                  {convRate
                    ? converterResultCurrency === "BRL"
                      ? fmtFull(convAmount * convRate, "BRL")
                      : fmtFull(convAmount, converterCurrency)
                    : "—"}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Impacto em 12 Meses</Label>
                <div className="h-10 flex items-center justify-center rounded-md border border-primary/30 bg-primary/5 text-sm font-bold tabular-nums text-foreground">
                  {convRate
                    ? converterResultCurrency === "BRL"
                      ? fmtFull(convAmount * convRate * 12, "BRL")
                      : fmtFull(convAmount * 12, converterCurrency)
                    : "—"}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Scenario Slider */}
      <div className="kpi-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 shrink-0">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="min-w-0">
                <span className="text-sm font-semibold text-foreground">E se o câmbio mudar?</span>
                <p className="text-[11px] text-muted-foreground">Simule como variações na cotação impactam sua operação mensal</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] text-xs">
                  Aqui você faz uma simulação de economia/lucro com base no valor inserido em volume mensal no início da calculadora. Você consegue ter uma projeção mensal e quanto economizaria com as estatísticas da Treend no determinado período (dia, semana ou mês).
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              {["USD", "EUR", "GBP"].map((cur) => (
                <button
                  key={cur}
                  onClick={() => setScenarioCurrency(cur)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    scenarioCurrency === cur
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span className="text-sm">{currencyFlag(cur)}</span>
                  {cur}
                </button>
              ))}
            </div>
            <Select value={scenarioPeriod} onValueChange={(v) => setScenarioPeriod(v as "day" | "week" | "month" | "operation")}>
              <SelectTrigger className="h-8 w-[120px] shrink-0 text-xs bg-muted/40 border-border/40">
                <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operation">Na Operação</SelectItem>
                <SelectItem value="day">Dia</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Cotação simulada ({scenarioCurrency}/BRL)</Label>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${scenarioZoneInfo.color} ${scenario.isBetter ? "bg-treend-success/10" : scenario.zonePct <= 60 ? "bg-treend-warning/10" : "bg-treend-danger/10"}`}>{scenarioZoneInfo.label}</span>
          </div>
          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-3 py-1.5">
            <span className="text-[11px] text-muted-foreground">Taxa estimada Treend:</span>
            <button
              onClick={() => setSliderRate([scenarioTreendEstimate])}
              className="text-xs font-bold text-primary tabular-nums hover:underline cursor-pointer"
            >
              {scenarioTreendEstimate.toFixed(4)} {scenarioCurrency}
            </button>
          </div>
          <Slider value={sliderRate} onValueChange={setSliderRate} min={scenarioRange.min} max={scenarioRange.max} step={0.01} className="py-2" />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{prefersLower ? "Melhor ←" : ""} {scenarioRange.min.toFixed(2)}</span>
            <span className="text-base font-bold text-foreground tabular-nums">{sliderRate[0].toFixed(4)}</span>
            <span>{scenarioRange.max.toFixed(2)} {prefersLower ? "" : "→ Melhor"}</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {/* Card 1: Volume */}
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              Volume {opsFrequency === "day" ? "diário" : opsFrequency === "week" ? "semanal" : "mensal"}
            </p>
            <p className="text-base font-bold text-foreground tabular-nums">
              {fmtFull(volume, currency)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Cotação simulada: {sliderRate[0].toFixed(4)} {scenarioCurrency}
            </p>
          </div>

          {/* Card 2: Economia com a Treend - dynamic based on slider */}
          <div className={`rounded-xl p-3 text-center ${scenario.scenarioEconWithTreend > 0 ? "bg-treend-success/5 border border-treend-success/20" : "bg-treend-danger/5 border border-treend-danger/20"}`}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              Economia {scenarioPeriodVolumeLabel} com a Treend
            </p>
            <div className="flex items-center justify-center gap-1">
              {scenario.scenarioEconWithTreend > 0 ? (
                <TrendingDown className="h-3.5 w-3.5 text-treend-success" />
              ) : scenario.scenarioEconWithTreend === 0 ? null : (
                <TrendingUp className="h-3.5 w-3.5 text-treend-danger" />
              )}
              <p className={`text-base font-bold tabular-nums ${scenario.scenarioEconWithTreend > 0 ? "text-treend-success" : scenario.scenarioEconWithTreend === 0 ? "text-muted-foreground" : "text-treend-danger"}`}>
                {fmtFull(Math.abs(scenario.scenarioEconWithTreend), currency)}
              </p>
            </div>
            <span className={`text-[10px] ${scenario.scenarioEconWithTreend > 0 ? "text-treend-success" : "text-muted-foreground"}`}>
              Quanto você economizaria com a Treend
            </span>
          </div>

          {/* Card 3: Economia sem a Treend - dynamic based on slider */}
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Economia {scenarioPeriodVolumeLabel} sem a Treend
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px] text-xs">
                  Volume × cotação simulada × spread. Custo do spread sem o diferencial Treend.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-treend-danger" />
              <p className="text-base font-bold tabular-nums text-treend-danger">
                -{fmtFull(scenario.scenarioSpreadCost, currency)}
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground">
              Volume × cotação simulada × spread
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {(() => {
        const TREEND_BLUE = "#3B82F6";
        const RATE_ORANGE = "#F97316";
        const EFFECTIVE_RED = "#EF4444";
        const GRID_COLOR = "hsl(var(--border) / 0.3)";
        const TEXT_COLOR = "hsl(var(--muted-foreground))";

        const barComparisonData = [
          { name: currency, "Taxa Atual": curRate, "Taxa Estimada Treend": trdRate },
        ];

        // Currency conversion for evolution chart
        const evoBrlToTarget = (() => {
          if (evolutionCurrency === "BRL") return 1;
          if (evolutionCurrency === "USD") return liveUsd ? 1 / liveUsd.bid : 1 / curRate;
          if (evolutionCurrency === "EUR") return liveEur ? 1 / liveEur.bid : 1 / curRate;
          return liveGbp ? 1 / liveGbp.bid : 1 / curRate;
        })();

        // Economy evolution based on economia per transaction * ops * months
        const economyEvolutionData = Array.from({ length: 24 }, (_, i) => ({
          name: `Mês ${i + 1}`,
          economia: Math.abs(metrics.netMonth) * (i + 1) * evoBrlToTarget,
        }));

        const comparativoData = Array.from({ length: 24 }, (_, i) => {
          const month = i + 1;
          const variation = Math.sin(month * 0.5) * 0.03;
          return {
            name: `Mês ${month}`,
            "Taxa Atual": parseFloat((curRate + variation * curRate * 0.1).toFixed(4)),
            "Taxa Estimada Treend": parseFloat((trdRate - variation * trdRate * 0.05).toFixed(4)),
            "Taxa Efetiva": parseFloat((metrics.effectiveRate + variation * metrics.effectiveRate * 0.08).toFixed(4)),
          };
        });

        const chartTooltipStyle = {
          contentStyle: {
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "12px",
            fontSize: "12px",
            color: "hsl(var(--foreground))",
          },
        };

        const evoCurrencySymbol = currencySymbol(evolutionCurrency);

        return (
          <div className="space-y-5">
            {/* Chart 1 - Taxa Atual vs Taxa Estimada pela Treend */}
            {(() => {
              const rateDiff = Math.abs(curRate - trdRate);
              const rateDiffPct = curRate > 0 ? (rateDiff / curRate) * 100 : 0;
              const treendIsBetter = prefersLower ? trdRate < curRate : trdRate > curRate;
              const maxRate = Math.max(curRate, trdRate);
              const minDomain = Math.min(curRate, trdRate) * 0.997;
              const barMaxWidth = 100;
              const curBarWidth = maxRate > 0 ? (curRate / maxRate) * barMaxWidth : 0;
              const trdBarWidth = maxRate > 0 ? (trdRate / maxRate) * barMaxWidth : 0;

              return (
                <div className="kpi-card overflow-hidden">
                  {/* Header */}
                  <div className="p-5 pb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10">
                        <BarChart3 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground tracking-tight">Taxa Atual vs Taxa Estimada pela Treend</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Comparação direta entre a cotação do dia e a taxa estimada pela Treend</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">Volume de referência: <span className="font-semibold text-muted-foreground">{fmtFull(volume, currency)}</span></p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${treendIsBetter ? "bg-treend-success/10 text-treend-success" : "bg-treend-danger/10 text-treend-danger"}`}>
                      {treendIsBetter ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                      {rateDiffPct.toFixed(2)}%
                    </div>
                  </div>

                  {/* Visual comparison bars */}
                  <div className="px-5 pb-4 space-y-4">
                    {/* Taxa Atual */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RATE_ORANGE }} />
                          <span className="text-xs text-muted-foreground font-medium">Taxa Atual</span>
                        </div>
                        <span className="text-sm font-bold text-foreground tabular-nums tracking-tight">{curRate.toFixed(4)}</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-muted/40 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${curBarWidth}%`,
                            background: `linear-gradient(90deg, ${RATE_ORANGE}88, ${RATE_ORANGE})`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Taxa Estimada Treend */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TREEND_BLUE }} />
                          <span className="text-xs text-muted-foreground font-medium">Taxa Estimada Treend</span>
                        </div>
                        <span className="text-sm font-bold text-foreground tabular-nums tracking-tight">{trdRate.toFixed(4)}</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-muted/40 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${trdBarWidth}%`,
                            background: `linear-gradient(90deg, ${TREEND_BLUE}88, ${TREEND_BLUE})`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border/30" />

                  {/* Bottom stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-border/30">
                    <div className="p-4 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Diferença</p>
                      <p className="text-base font-bold text-foreground tabular-nums">{rateDiff.toFixed(4)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">pontos</p>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Variação</p>
                      <p className={`text-base font-bold tabular-nums ${treendIsBetter ? "text-treend-success" : "text-treend-danger"}`}>
                        {treendIsBetter ? "−" : "+"}{rateDiffPct.toFixed(2)}%
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{treendIsBetter ? "economia" : "custo"}</p>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Impacto / op</p>
                      {(() => {
                        const val = metrics.economiaMinusSpread;
                        const isPositive = val > 0;
                        return (
                          <p className={`text-base font-bold tabular-nums ${isPositive ? "text-treend-success" : val === 0 ? "text-muted-foreground" : "text-treend-danger"}`}>
                            {fmtFull(Math.abs(val), currency)}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Chart 2 - Evolução da Economia/Lucro */}
            <div className="kpi-card p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-foreground">Evolução da Economia/Lucro</span>
                  <p className="text-[11px] text-muted-foreground">Projeção acumulada com base na economia mensal (já descontando spread).</p>
                </div>
                <Select value={evolutionCurrency} onValueChange={setEvolutionCurrency}>
                  <SelectTrigger className="h-7 w-auto px-2.5 text-[11px] bg-muted/40 border-border/40 gap-1 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="BRL"><span className="flex items-center gap-1.5">{currencyFlag("BRL")} BRL</span></SelectItem>
                    <SelectItem value="USD"><span className="flex items-center gap-1.5">{currencyFlag("USD")} USD</span></SelectItem>
                    <SelectItem value="EUR"><span className="flex items-center gap-1.5">{currencyFlag("EUR")} EUR</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={economyEvolutionData}>
                    <defs>
                      <linearGradient id="economyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? "#22C55E" : "#EF4444"} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={isPositive ? "#22C55E" : "#EF4444"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                    <XAxis dataKey="name" tick={{ fill: TEXT_COLOR, fontSize: 10 }} interval={1} />
                    <YAxis
                      tick={{ fill: TEXT_COLOR, fontSize: 11 }}
                      tickFormatter={(v: number) =>
                        v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : v.toString()
                      }
                    />
                    <RechartsTooltip
                      {...chartTooltipStyle}
                      formatter={(value: number) => [
                        `${evoCurrencySymbol} ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        isPositive ? "Economia" : "Custo",
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                    <Area
                      type="monotone"
                      dataKey="economia"
                      fill="url(#economyGradient)"
                      stroke="none"
                      name={isPositive ? "Economia Acumulada" : "Custo Acumulado"}
                    />
                    <Line
                      type="monotone"
                      dataKey="economia"
                      stroke={isPositive ? "#22C55E" : "#EF4444"}
                      strokeWidth={2.5}
                      dot={{ fill: isPositive ? "#22C55E" : "#EF4444", r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                      name={isPositive ? "Economia Acumulada" : "Custo Acumulado"}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3 - Comparativo Treend — Redesigned */}
            <div className="kpi-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                  <LineChart className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-foreground tracking-tight">Comparativo de Taxas</span>
                  <p className="text-[11px] text-muted-foreground">Visão comparativa entre as taxas do mercado, estimada pela Treend e efetiva (com spread).</p>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-border/30 bg-muted/20 p-3 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RATE_ORANGE }} />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Taxa Atual</span>
                  </div>
                  <p className="text-lg font-bold text-foreground tabular-nums tracking-tight">{curRate.toFixed(4)}</p>
                  <p className="text-[10px] text-muted-foreground">Mercado</p>
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center space-y-1 ring-1 ring-primary/10">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TREEND_BLUE }} />
                    <span className="text-[10px] text-primary uppercase tracking-wider font-medium">Treend</span>
                  </div>
                  <p className="text-lg font-bold text-primary tabular-nums tracking-tight">{trdRate.toFixed(4)}</p>
                  <p className="text-[10px] text-muted-foreground">Estimada</p>
                </div>
                <div className="rounded-xl border border-border/30 bg-muted/20 p-3 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: EFFECTIVE_RED }} />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Efetiva</span>
                  </div>
                  <p className="text-lg font-bold text-foreground tabular-nums tracking-tight">{metrics.effectiveRate.toFixed(4)}</p>
                  <p className="text-[10px] text-muted-foreground">Com spread</p>
                </div>
              </div>

              {/* Difference highlight bar */}
              {(() => {
                const diff = Math.abs(curRate - trdRate);
                const diffPct = curRate > 0 ? (diff / curRate) * 100 : 0;
                const spreadDiff = Math.abs(metrics.effectiveRate - curRate);
                return (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/20">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider whitespace-nowrap">Vantagem Treend</span>
                      <span className="text-xs font-bold text-treend-success tabular-nums">{diff.toFixed(4)} pts ({diffPct.toFixed(2)}%)</span>
                    </div>
                    <div className="hidden sm:block w-px h-4 bg-border/40" />
                    <div className="flex items-center gap-2 flex-1 min-w-0 sm:justify-end">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider whitespace-nowrap">Custo Spread</span>
                      <span className="text-xs font-bold text-treend-danger tabular-nums">{spreadDiff.toFixed(4)} pts</span>
                    </div>
                  </div>
                );
              })()}

              {/* Visual bar comparison */}
              {(() => {
                const rates = [
                  { label: "Taxa Atual", value: curRate, color: RATE_ORANGE, sub: "Mercado" },
                  { label: "Taxa Estimada Treend", value: trdRate, color: TREEND_BLUE, sub: "Treend" },
                  { label: "Taxa Efetiva", value: metrics.effectiveRate, color: EFFECTIVE_RED, sub: "Com spread" },
                ];
                const maxRate = Math.max(...rates.map(r => r.value));
                const minRate = Math.min(...rates.map(r => r.value));
                const range = maxRate - minRate;
                const padMin = minRate - range * 0.3;
                const padMax = maxRate + range * 0.1;
                const barPct = (v: number) => ((v - padMin) / (padMax - padMin)) * 100;

                return (
                  <div className="space-y-3 py-1">
                    {rates.map((r) => (
                      <div key={r.label} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                            <span className="text-xs text-muted-foreground font-medium">{r.label}</span>
                          </div>
                          <span className="text-sm font-bold text-foreground tabular-nums tracking-tight">{r.value.toFixed(4)}</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-muted/40 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${Math.max(barPct(r.value), 2)}%`,
                              background: `linear-gradient(90deg, ${r.color}66, ${r.color})`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 w-full sm:w-auto"
          onClick={async () => {
            if (!user) {
              toast({ title: "Faça login para registrar", variant: "destructive" });
              return;
            }
            try {
              const zone = getZoneLabel(metrics.pct).label;
              const { error } = await supabase.from("user_decisions").insert({
                user_id: user.id,
                currency,
                amount: volume,
                rate: curRate,
                savings: metrics.netMonth,
                zone,
                spread,
                profile,
                ops_per_month: opsRaw,
                ops_frequency: opsFrequency,
                projection_months: projMonths,
                treend_rate: trdRate,
              });
              if (error) throw error;
              toast({ title: "Decisão registrada!", description: "Salva no seu histórico." });
            } catch (err: any) {
              toast({ title: "Erro ao registrar", description: err.message, variant: "destructive" });
            }
          }}
        >
          <Save className="h-4 w-4" />
          Registrar decisão
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 w-full sm:w-auto"
          onClick={async () => {
            try {
              const { default: html2canvas } = await import("html2canvas");
              const { default: jsPDF } = await import("jspdf");

              const sym = currencySymbol(currency);
              const flag = currencyFlag(currency);
              const zone = getZoneLabel(metrics.pct);
              const profileLabels: Record<string, string> = {
                importador: "Importador", exportador: "Exportador",
                agente_turismo: "Agente de Turismo", turista: "Turista", freelancer: "Freelancer",
              };
              const freqLabels: Record<string, string> = { month: "Mensal", week: "Semanal", day: "Diário" };
              const savings = metrics.netMonth;
              const spreadCost = metrics.spreadCost;
              const rateDiff = metrics.rateDiff;
              const rateDiffPct = metrics.rateDiffPct;

              // Build off-screen container mirroring History modal
              const container = document.createElement("div");
              container.style.position = "fixed";
              container.style.left = "-9999px";
              container.style.top = "0";
              container.style.width = "420px";
              container.style.background = "#ffffff";
              container.style.color = "#1e293b";
              container.style.fontFamily = "system-ui, -apple-system, sans-serif";
              container.style.padding = "24px";
              container.style.fontSize = "10px";
              container.style.lineHeight = "1.25";

              const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

              // Health data for PDF
              const grossPct = curRate > 0 ? Math.abs(rateDiff) / curRate * 100 : 0;
              const netPct = grossPct - spread;
              const savingsHs = grossPct <= 0.8 && grossPct > 0 ? "good" : grossPct <= 1.2 ? "warning" : "bad";
              const spreadHs = spread <= 0.5 ? "good" : spread <= 1.2 ? "warning" : "bad";
              const netHs = netPct >= 0.1 ? "good" : netPct >= 0 ? "warning" : "bad";
              const volHs = volume >= 2000 ? "good" : volume >= 1000 ? "warning" : "bad";
              const overallHs = [savingsHs, spreadHs, netHs, volHs].filter(s => s === "good").length >= 3 ? "good" : [savingsHs, spreadHs, netHs, volHs].filter(s => s === "bad").length >= 2 ? "bad" : "warning";
              const hsColors: Record<string, string> = { good: "#22c55e", warning: "#eab308", bad: "#ef4444" };
              const hsLabels: Record<string, string> = { good: "Saudável", warning: "Atenção", bad: "Crítico" };

              container.innerHTML = `
                <div style="border:1px solid #e2e8f0;border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:6px;">
                  <div style="display:flex;flex-direction:column;align-items:center;gap:4px;padding-bottom:12px;border-bottom:1px solid #e2e8f030;">
                    <img src="${treendLogo}" style="height:120px;object-fit:contain;" />
                    <p style="font-size:10px;color:#94a3b8;">${user?.email || ""}</p>
                    <p style="font-size:10px;color:#94a3b8;">${dateStr}</p>
                  </div>
                  <div style="display:flex;align-items:center;justify-content:center;gap:8px;font-size:16px;font-weight:700;margin:8px 0;">
                    <span style="font-size:18px;">${flag}</span> Simulação — ${currency}
                  </div>

                  <div style="background:#f8fafc;border-radius:10px;padding:12px;">
                    <p style="font-size:9px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Parâmetros</p>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                      ${[
                        { label: "Volume", value: `${sym} ${volume.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "#2563eb" },
                        { label: "Taxa no momento", value: curRate.toFixed(4), color: "#2563eb" },
                        { label: "Taxa Treend estimada", value: trdRate.toFixed(4), color: "#22c55e" },
                        { label: "Zona", value: zone.label, color: zone.color.includes("success") ? "#22c55e" : zone.color.includes("danger") ? "#ef4444" : "#eab308" },
                      ].map(i => `
                        <div style="display:flex;align-items:center;gap:6px;">
                          <div style="width:28px;height:28px;border-radius:6px;background:${i.color}15;display:flex;align-items:center;justify-content:center;">
                            <div style="width:12px;height:12px;border-radius:50%;background:${i.color}30;"></div>
                          </div>
                          <div>
                            <p style="font-size:8px;color:#94a3b8;">${i.label}</p>
                            <p style="font-size:11px;font-weight:700;color:${i.label === 'Taxa Treend estimada' ? '#22c55e' : i.label === 'Zona' ? i.color : '#1e293b'};">${i.value}</p>
                          </div>
                        </div>
                      `).join("")}
                    </div>
                    <div style="border-top:1px solid #e2e8f0;margin-top:8px;padding-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                      ${[
                        { label: "Perfil", value: profileLabels[profile] || profile },
                        { label: "Spread bancário", value: `${spread.toFixed(1)}%` },
                        { label: "Operações", value: `${opsRaw} / ${freqLabels[opsFrequency] || opsFrequency}` },
                        { label: "Projeção", value: `${projMonths} meses` },
                      ].map(i => `
                        <div style="display:flex;align-items:center;gap:6px;">
                          <div style="width:28px;height:28px;border-radius:6px;background:#2563eb15;display:flex;align-items:center;justify-content:center;">
                            <div style="width:12px;height:12px;border-radius:50%;background:#2563eb30;"></div>
                          </div>
                          <div>
                            <p style="font-size:8px;color:#94a3b8;">${i.label}</p>
                            <p style="font-size:11px;font-weight:700;">${i.value}</p>
                          </div>
                        </div>
                      `).join("")}
                    </div>
                  </div>

                  <div style="background:#f8fafc;border-radius:10px;padding:12px;">
                    <p style="font-size:9px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Resultado da Simulação</p>
                    <div style="display:flex;flex-direction:column;gap:6px;">
                      ${[
                        { label: "Volume em BRL", value: `R$ ${(volume * curRate).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "#1e293b" },
                        { label: "Volume com Treend", value: `R$ ${(volume * trdRate).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "#22c55e" },
                        { label: "Diferença de taxa", value: `${rateDiff.toFixed(4)} (${rateDiffPct.toFixed(2)}%)`, color: "#1e293b" },
                        { label: `Custo do spread (${spread.toFixed(1)}%)`, value: `-R$ ${spreadCost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "#ef4444" },
                      ].map(i => `
                        <div style="display:flex;align-items:center;justify-content:space-between;border:1px solid #e2e8f030;border-radius:10px;padding:8px 10px;">
                          <span style="font-size:10px;color:#94a3b8;">${i.label}</span>
                          <span style="font-size:11px;font-weight:700;color:${i.color};">${i.value}</span>
                        </div>
                      `).join("")}
                    </div>
                  </div>

                  <div style="border-radius:10px;padding:12px;border:1px solid ${savings >= 0 ? '#22c55e30' : '#ef444430'};background:${savings >= 0 ? '#22c55e08' : '#ef444408'};display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-size:11px;font-weight:500;color:#1e293b;">${savings >= 0 ? "Economia estimada" : "Custo adicional estimado"}</span>
                    <span style="font-size:16px;font-weight:700;color:${savings >= 0 ? '#22c55e' : '#ef4444'};">
                      ${savings >= 0 ? "+" : ""}${sym} ${savings.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div style="background:#f8fafc;border-radius:10px;padding:12px;">
                    <p style="font-size:9px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Projeções</p>
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">
                      ${[
                        { label: "6 meses", value: savings * 6 },
                        { label: "12 meses", value: savings * 12 },
                        { label: "24 meses", value: savings * 24 },
                      ].map(p => `
                        <div style="text-align:center;border:1px solid #e2e8f040;border-radius:10px;padding:8px;">
                          <p style="font-size:8px;color:#94a3b8;margin-bottom:3px;">${p.label}</p>
                          <p style="font-size:12px;font-weight:700;color:${p.value >= 0 ? '#22c55e' : '#ef4444'};">
                            ${sym} ${Math.abs(p.value).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </p>
                        </div>
                      `).join("")}
                    </div>
                  </div>

                  <div style="background:#f8fafc;border-radius:10px;padding:12px;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                      <span style="font-size:9px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Saúde da Operação</span>
                      <span style="font-size:8px;font-weight:600;padding:2px 8px;border-radius:99px;border:1px solid ${hsColors[overallHs]}30;background:${hsColors[overallHs]}10;color:${hsColors[overallHs]};">
                        ${hsLabels[overallHs]}
                      </span>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                      ${[
                        { label: "Economia", value: `${grossPct.toFixed(2)}%`, status: savingsHs },
                        { label: "Taxa de Spread", value: `${spread.toFixed(2)}%`, status: spreadHs },
                        { label: "Economia Líquida", value: `${netPct.toFixed(2)}%`, status: netHs },
                        { label: "Volume Mensal", value: `${sym} ${volume.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, status: volHs },
                      ].map(h => `
                        <div style="border:1px solid ${hsColors[h.status]}20;background:${hsColors[h.status]}05;border-radius:8px;padding:6px 8px;display:flex;align-items:center;justify-content:space-between;">
                          <div style="display:flex;align-items:center;gap:6px;">
                            <div style="width:6px;height:6px;border-radius:50%;background:${hsColors[h.status]};"></div>
                            <span style="font-size:10px;font-weight:600;color:#1e293b;">${h.label}</span>
                          </div>
                          <span style="font-size:10px;font-weight:700;color:#1e293b;">${h.value}</span>
                        </div>
                      `).join("")}
                    </div>
                  </div>

                  <p style="font-size:7px;color:#94a3b8;font-style:italic;text-align:center;margin-top:4px;">
                    Esta simulação é meramente ilustrativa. A decisão final é de responsabilidade do usuário.
                  </p>
                </div>
              `;

              document.body.appendChild(container);
              await new Promise((r) => setTimeout(r, 100));

              const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
              });

              document.body.removeChild(container);

              const imgData = canvas.toDataURL("image/png");
              const A4_W = 210;
              const A4_H = 297;
              const MARGIN = 10;
              const contentW = A4_W - MARGIN * 2;
              const maxH = A4_H - MARGIN * 2;
              const naturalH = (canvas.height / canvas.width) * contentW;
              let finalW = contentW;
              let finalH = naturalH;
              if (finalH > maxH) {
                const shrink = maxH / finalH;
                finalW *= shrink;
                finalH = maxH;
              }

              const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
              const offsetX = (A4_W - finalW) / 2;
              doc.addImage(imgData, "PNG", offsetX, MARGIN, finalW, finalH);
              doc.save(`treend-simulacao-${currency.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
              toast({ title: "PDF gerado!", description: "Download iniciado." });
            } catch (err: any) {
              toast({ title: "Erro ao gerar PDF", description: err.message, variant: "destructive" });
            }
          }}
        >
          <FileDown className="h-4 w-4" />
          Baixar PDF
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 w-full sm:w-auto"
          disabled={!user}
          onClick={async () => {
            if (!user) {
              toast({ title: "Faça login", variant: "destructive" });
              return;
            }
            toast({ title: "Enviando e-mail...", description: "Aguarde um momento." });
            try {
              const { error } = await supabase.functions.invoke("send-simulation-email", {
                body: {
                  currency,
                  profile,
                  volume,
                  currentRate: curRate,
                  treendRate: trdRate,
                  opsPerMonth: parseInt(opsPerMonth),
                  opsFrequency,
                  bankSpread: parseFloat(bankSpread),
                  projectionMonths: parseInt(projectionMonths),
                  netMonth: metrics.netMonth,
                  netYear: metrics.netYear,
                  grossMonth: metrics.grossMonth,
                  spreadCost: metrics.spreadCost,
                  effectiveRate: metrics.effectiveRate,
                  rateDiffPct: metrics.rateDiffPct,
                  netPct: metrics.netPct,
                  economiaMinusSpread: metrics.economiaMinusSpread,
                  overallHealth: metrics.overallHealth,
                },
              });
              if (error) throw error;
              toast({ title: "E-mail enviado!", description: "Confira sua caixa de entrada." });
            } catch (err: any) {
              toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
            }
          }}
        >
          <Mail className="h-4 w-4" />
          Enviar por e-mail
        </Button>
      </div>

      {/* Loss Reduction Simulation - only shown when economy is negative */}
      {!isPositive && curRate > 0 && trdRate > 0 && (
        <div className="kpi-card border-treend-warning/30 p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-treend-warning/10">
              <TrendingDown className="h-4 w-4 text-treend-warning" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">Redução de Perda com a Treend</span>
              <p className="text-[11px] text-muted-foreground">Embora o resultado final seja negativo por conta do spread, a Treend ajudou a minimizar a perda.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-treend-danger/20 bg-treend-danger/5 p-3.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Perda sem a Treend</p>
              <p className="text-lg font-bold text-treend-danger tabular-nums">
                {fmt(metrics.spreadCost, true, currency)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Spread integral sobre a cotação do dia</p>
            </div>
            <div className="rounded-xl border border-treend-warning/20 bg-treend-warning/5 p-3.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Perda com a Treend</p>
              <p className="text-lg font-bold text-treend-warning tabular-nums">
                {fmt(Math.abs(metrics.netMonth), true, currency)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Spread menos a economia da taxa Treend</p>
            </div>
            <div className="rounded-xl border border-treend-success/20 bg-treend-success/5 p-3.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Você economizou</p>
              <p className="text-lg font-bold text-treend-success tabular-nums">
                {fmt(metrics.grossMonth, false, currency)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Redução de {metrics.grossPct.toFixed(2)}% na perda total</p>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground text-center italic">
            💡 Sem a Treend, você pagaria {fmt(metrics.spreadCost, false, currency)} de spread. Com a taxa estimada da Treend, 
            o custo líquido caiu para {fmt(Math.abs(metrics.netMonth), false, currency)} — uma economia de {fmt(metrics.grossMonth, false, currency)}.
          </p>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground text-center pb-4">
        Esta simulação é meramente ilustrativa. A decisão final é de responsabilidade do usuário.
      </p>
    </div>
  );
};

export default CalculatorPage;
