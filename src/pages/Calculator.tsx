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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const RATE_RANGES: Record<string, { min: number; max: number; default: number }> = {
  USD: { min: 4.00, max: 6.50, default: 5.12 },
  EUR: { min: 4.50, max: 7.00, default: 5.58 },
  BRL: { min: 0.15, max: 0.30, default: 0.20 },
};

const fmt = (v: number, negative = false) => {
  const prefix = negative ? "-R$ " : "R$ ";
  const abs = Math.abs(v);
  return abs >= 1_000_000
    ? `${prefix}${(abs / 1_000_000).toFixed(1)}M`
    : abs >= 1_000
    ? `${prefix}${(abs / 1_000).toFixed(1)}K`
    : `${prefix}${abs.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtFull = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
}

const MetricCard = ({ title, value, subtitle, icon, highlight, color = "default" }: MetricCardProps) => {
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
        <span className="text-xs text-muted-foreground font-medium">{title}</span>
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
  const [treendRate, setTreendRate] = useState("4.95");
  const [opsPerMonth, setOpsPerMonth] = useState("10");
  const [bankSpread, setBankSpread] = useState("2.5");
  const [projectionMonths, setProjectionMonths] = useState("12");
  const [sliderRate, setSliderRate] = useState([5.12]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [profile, setProfile] = useState<"importador" | "exportador" | "agente_turismo" | "turista" | "freelancer">("importador");
  const { toast } = useToast();
  const { usd: liveUsd, eur: liveEur } = useExchangeRates();

  // Update currentRate when live rates load
  useEffect(() => {
    if (currency === "USD" && liveUsd) {
      setCurrentRate(liveUsd.bid.toFixed(4));
      setSliderRate([liveUsd.bid]);
    } else if (currency === "EUR" && liveEur) {
      setCurrentRate(liveEur.bid.toFixed(4));
      setSliderRate([liveEur.bid]);
    }
  }, [liveUsd?.bid, liveEur?.bid]); // only on first load / rate change

  const rateRange = RATE_RANGES[currency];
  const volume = parseFloat(monthlyVolume) || 0;
  const curRate = parseFloat(currentRate) || 0;
  const trdRate = parseFloat(treendRate) || 0;
  const ops = parseFloat(opsPerMonth) || 1;
  const spread = parseFloat(bankSpread) || 0;
  const projMonths = parseInt(projectionMonths) || 12;
  const sliderRateNum = sliderRate[0];

  const handleCurrencyChange = (val: string) => {
    setCurrency(val);
    const range = RATE_RANGES[val];
    const liveRate = val === "USD" && liveUsd ? liveUsd.bid : val === "EUR" && liveEur ? liveEur.bid : range.default;
    setCurrentRate(liveRate.toFixed(4));
    setSliderRate([liveRate]);
    setTreendRate(val === "USD" ? "4.95" : val === "EUR" ? "5.72" : "0.18");
  };

  const handleReset = () => {
    setMonthlyVolume("50000");
    setCurrentRate(rateRange.default.toFixed(2));
    setTreendRate(currency === "USD" ? "4.95" : currency === "EUR" ? "5.72" : "0.18");
    setOpsPerMonth("10");
    setBankSpread("2.5");
    setProjectionMonths("12");
    setSliderRate([rateRange.default]);
  };

  const metrics = useMemo(() => {
    const curBRL = volume * curRate;
    const trdBRL = volume * trdRate;
    const savingsMonth = curBRL - trdBRL;
    const savingsPct = curBRL > 0 ? (savingsMonth / curBRL) * 100 : 0;
    const savingsPerOp = ops > 0 ? savingsMonth / ops : 0;
    const savingsYear = savingsMonth * 12;
    const spreadCost = curBRL * (spread / 100);
    const effectiveRate = curRate * (1 + spread / 100);
    const rateDiff = curRate - trdRate;
    const rateDiffPct = curRate > 0 ? (rateDiff / curRate) * 100 : 0;

    const proj6m = savingsMonth * 6;
    const proj12m = savingsMonth * 12;
    const proj24m = savingsMonth * 24;

    // Slider scenario
    const sliderBRL = volume * sliderRateNum;
    const sliderDiff = curBRL - sliderBRL;
    const sliderDiffPct = curBRL > 0 ? (sliderDiff / curBRL) * 100 : 0;

    // Break-even (if subscription cost ~R$200/mo)
    const subscriptionCost = 200;
    const breakEvenMonths = savingsMonth > 0 ? subscriptionCost / savingsMonth : Infinity;
    const roi = savingsMonth > 0 ? (savingsYear / (subscriptionCost * 12)) * 100 : 0;

    // Zone info
    const range = rateRange.max - rateRange.min;
    const pct = ((sliderRateNum - rateRange.min) / range) * 100;

    // Health scores - adjusted based on profile perspective
    const prefersLowerRate = ["importador", "agente_turismo", "turista"].includes(profile);
    const effectiveSavings = prefersLowerRate ? savingsMonth : -savingsMonth;
    const effectiveSavingsPct = prefersLowerRate ? savingsPct : -savingsPct;
    const effectiveRoi = effectiveSavings > 0 ? (Math.abs(savingsYear) / (subscriptionCost * 12)) * 100 : 0;

    const savingsHealthStatus: "good" | "warning" | "bad" =
      effectiveSavingsPct >= 2 ? "good" : effectiveSavingsPct >= 0.5 ? "warning" : "bad";
    const spreadHealthStatus: "good" | "warning" | "bad" =
      spread <= 1.5 ? "good" : spread <= 3 ? "warning" : "bad";
    const roiHealthStatus: "good" | "warning" | "bad" =
      effectiveRoi >= 200 ? "good" : effectiveRoi >= 100 ? "warning" : "bad";
    const volumeHealthStatus: "good" | "warning" | "bad" =
      volume >= 50000 ? "good" : volume >= 10000 ? "warning" : "bad";

    const overallHealth =
      [savingsHealthStatus, spreadHealthStatus, roiHealthStatus, volumeHealthStatus].filter(
        (s) => s === "good"
      ).length >= 3
        ? "good"
        : [savingsHealthStatus, spreadHealthStatus, roiHealthStatus, volumeHealthStatus].filter(
            (s) => s === "bad"
          ).length >= 2
        ? "bad"
        : "warning";

    return {
      curBRL, trdBRL, savingsMonth, savingsPct, savingsPerOp, savingsYear,
      spreadCost, effectiveRate, rateDiff, rateDiffPct,
      proj6m, proj12m, proj24m,
      sliderBRL, sliderDiff, sliderDiffPct,
      breakEvenMonths, roi: effectiveRoi, subscriptionCost,
      pct,
      savingsHealthStatus, spreadHealthStatus, roiHealthStatus, volumeHealthStatus,
      overallHealth,
    };
  }, [volume, curRate, trdRate, ops, spread, sliderRateNum, rateRange, profile]);

  const getZoneLabel = (pct: number) => {
    if (pct <= 20) return { label: "Muito Saudável", color: "text-treend-success" };
    if (pct <= 40) return { label: "Saudável", color: "text-treend-success" };
    if (pct <= 60) return { label: "Neutro", color: "text-treend-warning" };
    if (pct <= 80) return { label: "Ruim", color: "text-treend-danger" };
    return { label: "Muito Ruim", color: "text-treend-danger" };
  };

  const zoneInfo = getZoneLabel(metrics.pct);
  const prefersLower = ["importador", "agente_turismo", "turista"].includes(profile);
  const isPositive = prefersLower ? metrics.savingsMonth > 0 : metrics.savingsMonth < 0;
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
                  <SelectItem value="USD">USD — Dólar</SelectItem>
                  <SelectItem value="EUR">EUR — Euro</SelectItem>
                  <SelectItem value="BRL">BRL — Real</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <TooltipLabel label={`Volume Mensal (${currency})`} tip="Total em moeda estrangeira movimentado por mês" />
              <Input type="number" value={monthlyVolume} onChange={(e) => setMonthlyVolume(e.target.value)} className="h-10 text-sm bg-muted/40 border-border/40" />
            </div>
            <div className="space-y-1.5">
              <TooltipLabel label="Operações/Mês" tip="Quantidade de operações de câmbio por mês" />
              <Input type="number" value={opsPerMonth} onChange={(e) => setOpsPerMonth(e.target.value)} className="h-10 text-sm bg-muted/40 border-border/40" />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mt-3">
            <div className="space-y-1.5">
              <TooltipLabel label={`Taxa Atual (${currency === "BRL" ? "R$" : currency === "USD" ? "US$" : "€"})`} tip="Insira a taxa de câmbio comercial do dia abaixo" />
              <Input
                type="number"
                value={currentRate}
                onChange={(e) => { setCurrentRate(e.target.value); setSliderRate([parseFloat(e.target.value) || rateRange.default]); }}
                step="0.01"
                className="h-10 text-sm bg-muted/40 border-border/40"
              />
            </div>
            <div className="space-y-1.5">
              <TooltipLabel label={`Taxa Treend (${currency === "BRL" ? "R$" : currency === "USD" ? "US$" : "€"})`} tip="Taxa Comercial mapeada pela Treend" />
              <Input type="number" value={treendRate} onChange={(e) => setTreendRate(e.target.value)} step="0.01" className="h-10 text-sm bg-muted/40 border-border/40" />
            </div>
            <div className="space-y-1.5">
              <TooltipLabel label="Percentual de Diferença" tip="Diferença percentual entre a Taxa Atual e a Taxa Treend" />
              <div className={`h-10 flex items-center justify-center rounded-md border text-sm font-semibold tabular-nums ${
                curRate > 0 && trdRate > 0
                  ? curRate !== trdRate
                    ? isPositive
                      ? "border-treend-success/30 bg-treend-success/10 text-treend-success"
                      : "border-treend-danger/30 bg-treend-danger/10 text-treend-danger"
                    : "border-border/40 bg-muted/40 text-muted-foreground"
                  : "border-border/40 bg-muted/40 text-muted-foreground"
              }`}>
                {curRate > 0 && trdRate > 0
                  ? `${((curRate - trdRate) / curRate * 100) >= 0 ? "" : "-"}${Math.abs((curRate - trdRate) / curRate * 100).toFixed(2)}%`
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
          {/* Row 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              title="Economia Mensal"
              value={fmt(metrics.savingsMonth, !isPositive)}
              subtitle={isPositive ? "Economia potencial" : "Custo adicional"}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              color={isPositive ? "success" : "danger"}
              highlight={isPositive}
            />
            <MetricCard
              title="Economia Anual"
              value={fmt(metrics.savingsYear, !isPositive)}
              subtitle="Projeção 12 meses"
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
              color={isPositive ? "success" : "danger"}
            />
            <MetricCard
              title="Economia"
              value={fmt(metrics.savingsPerOp, !isPositive)}
              subtitle="Por transação"
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
              color={isPositive ? "success" : "danger"}
            />
            <MetricCard
              title="Diferença de Taxa"
              value={`${Math.abs(metrics.rateDiffPct).toFixed(1)}%`}
              subtitle={`${Math.abs(metrics.rateDiff).toFixed(4)} pts`}
              icon={<Zap className="h-4 w-4 text-muted-foreground" />}
              color={metrics.rateDiff > 0 ? "success" : "danger"}
            />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              title="Percentual Otimizado"
              value={`${Math.abs(metrics.savingsPct).toFixed(2)}%`}
              subtitle="% de economia gerado"
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              color={metrics.savingsPct >= 2 ? "success" : metrics.savingsPct >= 0.5 ? "warning" : "danger"}
            />
            <MetricCard
              title="ROI Anual"
              value={`${metrics.roi.toFixed(0)}%`}
              subtitle="Retorno sobre investimento"
              icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
              color={metrics.roi >= 200 ? "success" : metrics.roi >= 100 ? "warning" : "danger"}
            />
            <MetricCard
              title="Custo Spread"
              value={fmt(metrics.spreadCost)}
              subtitle="/mês (banco)"
              icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
              color="warning"
            />
            <MetricCard
              title="Taxa Efetiva"
              value={metrics.effectiveRate.toFixed(4)}
              subtitle="Com taxa de spread"
              icon={<LineChart className="h-4 w-4 text-muted-foreground" />}
              color="default"
            />
          </div>

          {/* Row 3 - Projections */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              title="Volume BRL"
              value={fmt(metrics.curBRL)}
              subtitle="Total mensal em reais"
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              color="default"
            />
            <MetricCard
              title={`Projeção ${projMonths}m`}
              value={fmt(metrics.savingsMonth * projMonths, !isPositive)}
              subtitle="Economia projetada"
              icon={<ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
              color={isPositive ? "success" : "danger"}
              highlight={isPositive}
            />
            <MetricCard
              title="Projeção 24m"
              value={fmt(metrics.proj24m, !isPositive)}
              subtitle="Economia 2 anos"
              icon={<ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
              color={isPositive ? "success" : "danger"}
            />
            <MetricCard
              title="Variação (%)"
              value={`${Math.abs(metrics.savingsPct).toFixed(1)}%`}
              subtitle={isPositive ? "Economia percentual" : "Custo percentual"}
              icon={<Percent className="h-4 w-4 text-muted-foreground" />}
              color={isPositive ? "success" : "danger"}
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
              value={`${Math.abs(metrics.savingsPct).toFixed(2)}%`}
              description={
                metrics.savingsHealthStatus === "good"
                  ? "Excelente economia sobre operações"
                  : metrics.savingsHealthStatus === "warning"
                  ? "Economia moderada, avalie condições"
                  : "Economia insuficiente ou custo adicional"
              }
              benchmark=">= 2% (ideal: 5%)"
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
              benchmark="<= 1.5% (ideal: 0.5%)"
              status={metrics.spreadHealthStatus}
            />
            <HealthItem
              label="ROI Assinatura"
              value={`${metrics.roi.toFixed(0)}%`}
              description={
                metrics.roiHealthStatus === "good"
                  ? "Excelente retorno sobre o investimento ao assinar a Treend"
                  : metrics.roiHealthStatus === "warning"
                  ? "Retorno moderado ao assinar a Treend"
                  : "Retorno baixo ao assinar a Treend, aumente o volume"
              }
              benchmark=">= 200% (ideal: 500%)"
              status={metrics.roiHealthStatus}
            />
            <HealthItem
              label="Volume Mensal"
              value={fmt(volume)}
              description={
                metrics.volumeHealthStatus === "good"
                  ? "Volume saudável para operações"
                  : metrics.volumeHealthStatus === "warning"
                  ? "Volume moderado de operações"
                  : "Volume baixo, considere consolidar"
              }
              benchmark={`>= ${currency} 50K (ideal: 100K)`}
              status={metrics.volumeHealthStatus}
            />
          </div>
        </div>
      </div>

      {/* Scenario Slider */}
      <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Simular cenário</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Arraste para simular</Label>
            <span className={`text-xs font-semibold ${zoneInfo.color}`}>{zoneInfo.label}</span>
          </div>
          <Slider value={sliderRate} onValueChange={setSliderRate} min={rateRange.min} max={rateRange.max} step={0.01} className="py-2" />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{rateRange.min.toFixed(2)}</span>
            <span className="text-base font-bold text-foreground tabular-nums">{sliderRateNum.toFixed(4)}</span>
            <span>{rateRange.max.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Valor neste cenário</p>
            <p className="text-base font-bold text-foreground tabular-nums">{fmtFull(metrics.sliderBRL)}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Diferença vs atual</p>
            <div className="flex items-center justify-center gap-1">
              {metrics.sliderDiff > 0 ? <TrendingDown className="h-3.5 w-3.5 text-treend-success" /> : <TrendingUp className="h-3.5 w-3.5 text-treend-danger" />}
              <p className={`text-base font-bold tabular-nums ${metrics.sliderDiff > 0 ? "text-treend-success" : "text-treend-danger"}`}>
                {metrics.sliderDiff > 0 ? "−" : "+"}
                {fmtFull(Math.abs(metrics.sliderDiff))}
              </p>
              <span className={`text-xs ${metrics.sliderDiff > 0 ? "text-treend-success" : "text-treend-danger"}`}>
                ({Math.abs(metrics.sliderDiffPct).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => toast({ title: "Decisão registrada!", description: "Salva no seu histórico." })}
        >
          <Save className="h-4 w-4" />
          Registrar esta decisão
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground text-center pb-4">
        Esta simulação é meramente ilustrativa. A decisão final é de responsabilidade do usuário.
      </p>
    </div>
  );
};

export default CalculatorPage;
