import { useState, useMemo, useEffect } from "react";
import { useExchangeRates } from "@/hooks/useExchangeRates";
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
      className={`rounded-2xl border p-4 flex flex-col gap-1.5 transition-all ${
        highlight
          ? "border-treend-success/30 bg-treend-success/5"
          : "border-border/40 bg-card"
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
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted/60">
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
    <div className={`rounded-xl border p-3.5 ${colors[status]}`}>
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

const CalculatorPage = () => {
  const [currency, setCurrency] = useState("USD");
  const [monthlyVolume, setMonthlyVolume] = useState("50000");
  const [currentRate, setCurrentRate] = useState("5.12");
  const [treendRate, setTreendRate] = useState("5.08");
  const [opsPerMonth, setOpsPerMonth] = useState("10");
  const [opsFrequency, setOpsFrequency] = useState<"month" | "week" | "day">("month");
  const [bankSpread, setBankSpread] = useState("1.0");
  const [projectionMonths, setProjectionMonths] = useState("12");
  const [sliderRate, setSliderRate] = useState([5.12]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [profile, setProfile] = useState<"importador" | "exportador" | "agente_turismo" | "turista" | "freelancer">("importador");
  const { toast } = useToast();
  const { user } = useAuth();
  const { usd: liveUsd, eur: liveEur, gbp: liveGbp } = useExchangeRates();
  const [converterCurrency, setConverterCurrency] = useState("USD");
  const [converterAmount, setConverterAmount] = useState("1000");
  const [converterResultCurrency, setConverterResultCurrency] = useState<"foreign" | "BRL">("foreign");
  const [scenarioCurrency, setScenarioCurrency] = useState("USD");
  const [scenarioPeriod, setScenarioPeriod] = useState<"day" | "week" | "month" | "operation">("month");

  const prefersLower = ["importador", "agente_turismo", "turista"].includes(profile);

  // Compute Treend estimated rate: ±0.8% from current rate based on profile
  const computeTreendRate = (rate: number) => {
    // importador/agente_turismo → 0.8% below (cheaper buy); exportador/freelancer → 0.8% above (better sell)
    return prefersLower ? rate * (1 - 0.008) : rate * (1 + 0.008);
  };

  // Update currentRate and treendRate when live rates load
  useEffect(() => {
    if (currency === "USD" && liveUsd) {
      setCurrentRate(liveUsd.bid.toFixed(4));
      setSliderRate([liveUsd.bid]);
      setTreendRate(computeTreendRate(liveUsd.bid).toFixed(4));
    } else if (currency === "EUR" && liveEur) {
      setCurrentRate(liveEur.bid.toFixed(4));
      setSliderRate([liveEur.bid]);
      setTreendRate(computeTreendRate(liveEur.bid).toFixed(4));
    } else if (currency === "GBP" && liveGbp) {
      setCurrentRate(liveGbp.bid.toFixed(4));
      setSliderRate([liveGbp.bid]);
      setTreendRate(computeTreendRate(liveGbp.bid).toFixed(4));
    }
  }, [liveUsd?.bid, liveEur?.bid, liveGbp?.bid]);

  // Recalculate treend rate when profile changes
  useEffect(() => {
    const rate = parseFloat(currentRate);
    if (rate > 0) {
      setTreendRate(computeTreendRate(rate).toFixed(4));
    }
  }, [profile]);

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
    setTreendRate((prefLower ? liveRate * (1 - 0.008) : liveRate * (1 + 0.008)).toFixed(4));
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
      volume >= 50000 ? "good" : volume >= 10000 ? "warning" : "bad";

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

  // Reset slider when scenario currency changes
  useEffect(() => {
    setSliderRate([scenarioLiveRate]);
  }, [scenarioCurrency, scenarioLiveRate]);

  // Sync scenario period with main calculator ops frequency
  useEffect(() => {
    setScenarioPeriod(opsFrequency);
  }, [opsFrequency]);

  const scenarioPeriodMultiplier = scenarioPeriod === "day" ? 1 / 22 : scenarioPeriod === "week" ? 1 / 4 : scenarioPeriod === "operation" ? (ops > 0 ? 1 / ops : 1) : 1;
  const scenarioToMonthMultiplier = scenarioPeriod === "day" ? 22 : scenarioPeriod === "week" ? 4 : scenarioPeriod === "operation" ? (ops > 0 ? ops : 1) : 1;
  const scenarioPeriodLabel = scenarioPeriod === "day" ? "por dia" : scenarioPeriod === "week" ? "por semana" : scenarioPeriod === "operation" ? "por operação" : "por mês";
  const scenarioPeriodVolumeLabel = scenarioPeriod === "day" ? "diário" : scenarioPeriod === "week" ? "semanal" : scenarioPeriod === "operation" ? "por operação" : "mensal";
  const scenarioTreendEstimate = scenarioCurrency === currency ? trdRate : (prefersLower ? scenarioLiveRate * (1 - 0.008) : scenarioLiveRate * (1 + 0.008));

  const scenario = useMemo(() => {
    const sRate = sliderRate[0];
    // Always use the full volume as entered by the user
    const periodVolume = volume;

    // BRL values at simulated rate vs current live rate
    const sBRL = periodVolume * sRate;
    const currentBRL = periodVolume * scenarioLiveRate;
    const diffVsCurrent = sBRL - currentBRL;
    const diffPct = currentBRL > 0 ? (diffVsCurrent / currentBRL) * 100 : 0;
    const isBetter = prefersLower ? diffVsCurrent < 0 : diffVsCurrent > 0;
    const impactAbs = Math.abs(diffVsCurrent);

    // Treend saving: how much Treend saves vs the simulated rate (0.8% improvement)
    const treendRate = prefersLower ? sRate * (1 - 0.008) : sRate * (1 + 0.008);
    const treendBRL = periodVolume * treendRate;
    const treendSaving = Math.abs(sBRL - treendBRL);

    const range = scenarioRange.max - scenarioRange.min;
    const rawPct = ((sRate - scenarioRange.min) / range) * 100;
    const zonePct = prefersLower ? rawPct : 100 - rawPct;

    return { periodVolume, sBRL, currentBRL, diffVsCurrent, diffPct, isBetter, impactAbs, treendSaving, zonePct };
  }, [sliderRate, volume, scenarioLiveRate, scenarioRange, prefersLower]);

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

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Input Card */}
      <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Simulação Interativa</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Ajuste os valores e veja as mudanças em tempo real</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={profile} onValueChange={(v) => setProfile(v as "importador" | "exportador")}>
              <SelectTrigger className="h-9 w-[150px] text-xs bg-muted/40 border-border/40">
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
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
              Resetar
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
                <Input type="number" value={opsPerMonth} onChange={(e) => setOpsPerMonth(e.target.value)} className="h-10 text-sm bg-muted/40 border-border/40 flex-1" />
                <Select value={opsFrequency} onValueChange={(v) => setOpsFrequency(v as "month" | "week" | "day")}>
                  <SelectTrigger className="h-10 w-[100px] text-xs bg-muted/40 border-border/40"><SelectValue /></SelectTrigger>
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
              tooltip="(% diferença - % spread) × volume mensal ÷ operações. Economia líquida por operação."
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
        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4 h-fit">
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
              benchmark={`>= ${currency} 50K (ideal: 100K)`}
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
          <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                <CalcIcon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Conversor Rápido</span>
              <span className="text-xs text-muted-foreground ml-1">({converterCurrency} → {converterResultCurrency === "BRL" ? "BRL" : converterCurrency} com cotação do dia)</span>
            </div>
            <div className="grid sm:grid-cols-5 gap-3 items-end">
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
      <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-center gap-1.5">
              <div>
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
              <SelectTrigger className="h-8 w-[140px] text-xs bg-muted/40 border-border/40">
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
              Volume inserido
            </p>
            <p className="text-base font-bold text-foreground tabular-nums">
              {fmtFull(volume, currency)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Cotação simulada: {sliderRate[0].toFixed(4)} {scenarioCurrency}
            </p>
          </div>

          {/* Card 2: Economia vs cotação atual */}
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              {scenario.isBetter ? "Economia" : scenario.diffVsCurrent === 0 ? "Impacto" : "Custo adicional"} {scenarioPeriodVolumeLabel}
            </p>
            <div className="flex items-center justify-center gap-1">
              {scenario.isBetter ? (
                <TrendingDown className="h-3.5 w-3.5 text-treend-success" />
              ) : scenario.diffVsCurrent === 0 ? null : (
                <TrendingUp className="h-3.5 w-3.5 text-treend-danger" />
              )}
              <p className={`text-base font-bold tabular-nums ${scenario.isBetter ? "text-treend-success" : scenario.diffVsCurrent === 0 ? "text-muted-foreground" : "text-treend-danger"}`}>
                {scenario.diffVsCurrent === 0 ? "Sem alteração" : fmtFull(scenario.impactAbs, scenarioCurrency)}
              </p>
            </div>
            <span className={`text-[10px] ${scenario.isBetter ? "text-treend-success" : "text-muted-foreground"}`}>
              {scenario.diffVsCurrent !== 0 ? `(${Math.abs(scenario.diffPct).toFixed(1)}%) vs cotação atual` : ""}
            </span>
          </div>

          {/* Card 3: Economia com Treend */}
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Economia Treend {scenarioPeriodVolumeLabel}
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px] text-xs">
                  Aqui seria a economia que você teria com a taxa estimada da Treend além da sua economia principal.
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-base font-bold text-primary tabular-nums">
              {fmtFull(scenario.treendSaving, scenarioCurrency)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">±0,8% sobre a cotação simulada</p>
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

        // Economy evolution based on economia per transaction * ops * months
        const economyEvolutionData = Array.from({ length: 24 }, (_, i) => ({
          name: `Mês ${i + 1}`,
          economia: Math.abs(metrics.netMonth) * (i + 1),
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

        const economyCurrencySymbol = currencySymbol(currency);

        return (
          <div className="space-y-5">
            {/* Chart 1 - Taxa Atual vs Taxa Estimada pela Treend */}
            <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground">Taxa Atual vs Taxa Estimada pela Treend</span>
                  <p className="text-[11px] text-muted-foreground">Comparação direta entre a cotação comercial do dia e a taxa estimada pela Treend. Quanto menor a taxa (azul), maior a economia.</p>
                </div>
              </div>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barComparisonData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                    <XAxis dataKey="name" tick={{ fill: TEXT_COLOR, fontSize: 12 }} />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fill: TEXT_COLOR, fontSize: 11 }}
                      tickFormatter={(v: number) => v.toFixed(2)}
                    />
                    <RechartsTooltip {...chartTooltipStyle} formatter={(value: number) => value.toFixed(4)} />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                    <Bar dataKey="Taxa Atual" fill={RATE_ORANGE} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Taxa Estimada Treend" fill={TREEND_BLUE} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2 - Evolução da Economia/Lucro */}
            <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground">Evolução da Economia/Lucro</span>
                  <p className="text-[11px] text-muted-foreground">Projeção acumulada com base na economia mensal (já descontando spread).</p>
                </div>
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
                        `${economyCurrencySymbol} ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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

            {/* Chart 3 - Comparativo Treend */}
            <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                  <LineChart className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground">Comparativo Treend</span>
                  <p className="text-[11px] text-muted-foreground">Projeção comparativa ao longo de 24 meses: taxa comercial, taxa estimada pela Treend e taxa efetiva (com spread bancário).</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={comparativoData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                    <XAxis dataKey="name" tick={{ fill: TEXT_COLOR, fontSize: 10 }} interval={1} />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fill: TEXT_COLOR, fontSize: 11 }}
                      tickFormatter={(v: number) => v.toFixed(2)}
                    />
                    <RechartsTooltip
                      {...chartTooltipStyle}
                      formatter={(value: number) => value.toFixed(4)}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                    <Line type="monotone" dataKey="Taxa Atual" stroke={RATE_ORANGE} strokeWidth={2} dot={{ fill: RATE_ORANGE, r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Taxa Estimada Treend" stroke={TREEND_BLUE} strokeWidth={2.5} dot={{ fill: TREEND_BLUE, r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Taxa Efetiva" stroke={EFFECTIVE_RED} strokeWidth={2} strokeDasharray="5 5" dot={{ fill: EFFECTIVE_RED, r: 2.5, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
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
              });
              if (error) throw error;
              toast({ title: "Decisão registrada!", description: "Salva no seu histórico." });
            } catch (err: any) {
              toast({ title: "Erro ao registrar", description: err.message, variant: "destructive" });
            }
          }}
        >
          <Save className="h-4 w-4" />
          Registrar esta decisão
        </Button>
      </div>

      {/* Loss Reduction Simulation - only shown when economy is negative */}
      {!isPositive && curRate > 0 && trdRate > 0 && (
        <div className="rounded-2xl bg-card border border-treend-warning/30 p-5 space-y-4">
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
