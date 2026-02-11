import { useState, useMemo, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ScoreGauge from "@/components/ScoreGauge";
import TrialBanner from "@/components/TrialBanner";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import {
  Calculator, History, Newspaper, DollarSign, Euro, TrendingUp, TrendingDown,
  ArrowRight, MessageSquare, CalendarDays, BarChart3, ArrowUpRight, ArrowDownRight,
  Activity, Wallet, Clock, Target,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Line, ComposedChart,
} from "recharts";

type Scenario = "buy" | "sell";
type Frequency = "weekly" | "biweekly" | "monthly";

const frequencyLabels: Record<Frequency, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
};

const frequencyDescriptions: Record<Frequency, string> = {
  weekly: "Oscilações de curto prazo",
  biweekly: "Tendência de médio prazo",
  monthly: "Zonas de exaustão de longo prazo",
};

const mockData = {
  usd: { score: 35, rate: 5.12 },
  eur: { score: 62, rate: 5.58 },
  trialDays: 5,
  comments: {
    buy: {
      weekly: "Dólar recuou na semana. Janela de curto prazo pode ser interessante para fechar câmbio em USD.",
      biweekly: "Tendência de queda nos últimos 15 dias. Euro segue pressionado, mas USD abre oportunidade.",
      monthly: "USD em zona favorável no mês. Euro acima da média mensal — cautela para importadores de EUR.",
    },
    sell: {
      weekly: "Semana de alta no dólar. Bom momento para exportadores converterem receita em USD.",
      biweekly: "Tendência de valorização do dólar na quinzena. Exportadores podem aproveitar a janela.",
      monthly: "Dólar acima da média mensal. Momento pode ser interessante para remessas de exportação.",
    },
  },
};

// Mock chart data — exchange rate throughout the week
const chartData = [
  { day: "Seg", usd: 5.08, eur: 5.52 },
  { day: "Ter", usd: 5.14, eur: 5.55 },
  { day: "Qua", usd: 5.10, eur: 5.60 },
  { day: "Qui", usd: 5.18, eur: 5.58 },
  { day: "Sex", usd: 5.12, eur: 5.54 },
  { day: "Sáb", usd: 5.15, eur: 5.62 },
  { day: "Dom", usd: 5.12, eur: 5.58 },
];

// Mock recent decisions
const recentDecisions = [
  { currency: "USD", amount: 25000, rate: 5.08, date: "09/02/2026", type: "buy" as const },
  { currency: "EUR", amount: 15000, rate: 5.55, date: "07/02/2026", type: "buy" as const },
  { currency: "USD", amount: 40000, rate: 5.14, date: "05/02/2026", type: "sell" as const },
];

const getZoneLabel = (score: number, scenario: Scenario) => {
  const isInverted = scenario === "sell";
  const effectiveScore = isInverted ? 100 - score : score;
  if (effectiveScore <= 20) return "Muito Favorável";
  if (effectiveScore <= 40) return "Favorável";
  if (effectiveScore <= 60) return "Neutro";
  if (effectiveScore <= 80) return "Desfavorável";
  return "Muito Desfavorável";
};

const Dashboard = () => {
  const context = useOutletContext<{ profile?: "importer" | "exporter" } | undefined>();
  const [scenario, setScenario] = useState<Scenario>(context?.profile === "exporter" ? "sell" : "buy");
  const { usd: liveUsd, eur: liveEur, isLoading: ratesLoading } = useExchangeRates();

  useEffect(() => {
    if (context?.profile) {
      setScenario(context.profile === "exporter" ? "sell" : "buy");
    }
  }, [context?.profile]);
  const [frequency, setFrequency] = useState<Frequency>("weekly");

  const isExporter = scenario === "sell";

  const usdRate = liveUsd?.bid ?? mockData.usd.rate;
  const eurRate = liveEur?.bid ?? mockData.eur.rate;
  const usdPctChange = liveUsd?.pctChange ?? 0;
  const eurPctChange = liveEur?.pctChange ?? 0;

  const comment = useMemo(
    () => mockData.comments[scenario][frequency],
    [scenario, frequency]
  );

  const scenarioLabel = isExporter ? "Exportador" : "Importador";

  const usdZone = getZoneLabel(mockData.usd.score, scenario);
  const eurZone = getZoneLabel(mockData.eur.score, scenario);

  // Mini calculator simulation
  const calcSavings = (rate: number, score: number) => {
    const baseAmount = 10000;
    const spreadFactor = isExporter
      ? 1 + (score / 100) * 0.03
      : 1 - ((100 - score) / 100) * 0.03;
    const treendRate = rate * spreadFactor;
    const diff = isExporter ? treendRate - rate : rate - treendRate;
    return { current: rate * baseAmount, treend: treendRate * baseAmount, savings: Math.abs(diff * baseAmount) };
  };

  const usdCalc = calcSavings(usdRate, mockData.usd.score);

  const usdChange = usdPctChange;
  const eurChange = eurPctChange;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitoramento de Câmbio 24h por dia
          </p>
        </div>
      </div>

      <TrialBanner daysLeft={mockData.trialDays} />

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Tabs value={scenario} onValueChange={(v) => setScenario(v as Scenario)} className="w-auto">
          <TabsList className="h-8 bg-muted/60 p-0.5">
            <TabsTrigger value="buy" className="h-7 px-3 text-xs gap-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <TrendingDown className="h-3 w-3" />
              Importador
            </TabsTrigger>
            <TabsTrigger value="sell" className="h-7 px-3 text-xs gap-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <TrendingUp className="h-3 w-3" />
              Exportador
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
          <SelectTrigger className="w-[130px] h-8 text-xs bg-muted/60 border-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="biweekly">Quinzenal</SelectItem>
            <SelectItem value="monthly">Mensal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* === TOP ACTION CARDS — 4 cards like the reference === */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Calculadora", desc: "Simular câmbio", icon: Calculator, path: "/calculator" },
          { label: "Histórico", desc: "Decisões passadas", icon: History, path: "/history" },
          { label: "Feed", desc: "Reports Semanais", icon: Newspaper, path: "/news" },
          { label: "Agenda", desc: "Próximos eventos", icon: CalendarDays, path: "/agenda" },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="group relative flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/40 transition-all duration-300"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground tracking-tight">{item.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl border border-primary/30 bg-primary/5 group-hover:bg-primary/10 transition-colors shrink-0">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
          </Link>
        ))}
      </div>

      {/* === MAIN SECTION: Chart + Side Metrics === */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        {/* Chart Card */}
        <div className="rounded-2xl bg-card p-5 border border-border/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground">Cotação Semanal · USD</p>
              <p className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
                R$ {usdRate.toFixed(3)}
              </p>
              {liveUsd && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Atualizado: {new Date(liveUsd.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-[11px] text-muted-foreground">USD</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(var(--treend-warning))" }} />
                <span className="text-[11px] text-muted-foreground">EUR</span>
              </div>
              <Select defaultValue="weekly">
                <SelectTrigger className="w-[90px] h-7 text-[11px] bg-muted/60 border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="weekly">Semana</SelectItem>
                  <SelectItem value="monthly">Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="usdGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="eurGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--treend-warning))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--treend-warning))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis domain={["dataMin - 0.1", "dataMax + 0.1"]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `R$${v.toFixed(2)}`} />
              <ReTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "hsl(var(--foreground))",
                }}
                formatter={(value: number, name: string) => [`R$ ${value.toFixed(2)}`, name === "usd" ? "USD" : "EUR"]}
              />
              <Area type="monotone" dataKey="usd" stroke="hsl(var(--primary))" fill="url(#usdGrad)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--primary))" }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="eur" stroke="hsl(var(--treend-warning))" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: "hsl(var(--treend-warning))" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Side Panel — Key Metrics */}
        <div className="flex flex-col gap-3">
          {/* USD variation */}
          <div className="rounded-2xl bg-card p-4 border border-border/40 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl border border-primary/20 bg-primary/5">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">USD / BRL</p>
              <p className="text-sm font-bold text-foreground tabular-nums">R$ {usdRate.toFixed(4)}</p>
            </div>
            <div className={`flex items-center gap-0.5 text-xs font-semibold ${usdChange >= 0 ? "text-treend-danger" : "text-treend-success"}`}>
              {usdChange >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(usdChange).toFixed(2)}%
            </div>
          </div>

          {/* EUR variation */}
          <div className="rounded-2xl bg-card p-4 border border-border/40 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl border border-primary/20 bg-primary/5">
              <Euro className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">EUR / BRL</p>
              <p className="text-sm font-bold text-foreground tabular-nums">R$ {eurRate.toFixed(4)}</p>
            </div>
            <div className={`flex items-center gap-0.5 text-xs font-semibold ${eurChange >= 0 ? "text-treend-danger" : "text-treend-success"}`}>
              {eurChange >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(eurChange).toFixed(2)}%
            </div>
          </div>

          {/* Savings snapshot */}
          <div className="rounded-2xl bg-card p-4 border border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">Economia estimada</p>
            </div>
            <p className="text-2xl font-bold text-primary tabular-nums">
              R$ {usdCalc.savings.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">em USD 10.000 · com a Treend</p>
          </div>

          {/* Score snapshot */}
          <div className="rounded-2xl bg-card p-4 border border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">Score do dia</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{mockData.usd.score}</p>
                <p className="text-[10px] text-muted-foreground">USD</p>
              </div>
              <div className="h-8 w-px bg-border/60" />
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{mockData.eur.score}</p>
                <p className="text-[10px] text-muted-foreground">EUR</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === SCORE GAUGES === */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* USD */}
        <div className="rounded-2xl bg-card p-5 border border-border/40">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground tracking-tight">USD / BRL</span>
            <span className="ml-auto text-lg font-bold text-foreground tabular-nums">
              R$ {usdRate.toFixed(4)}
            </span>
          </div>
          <ScoreGauge score={mockData.usd.score} zone={usdZone} inverted={isExporter} />
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Cotação do dia · {frequencyLabels[frequency]}
          </p>
        </div>

        {/* EUR */}
        <div className="rounded-2xl bg-card p-5 border border-border/40">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
              <Euro className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground tracking-tight">EUR / BRL</span>
            <span className="ml-auto text-lg font-bold text-foreground tabular-nums">
              R$ {eurRate.toFixed(4)}
            </span>
          </div>
          <ScoreGauge score={mockData.eur.score} zone={eurZone} inverted={isExporter} />
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Cotação do dia · {frequencyLabels[frequency]}
          </p>
        </div>
      </div>

      {/* === BOTTOM ROW: Comment + Recent Decisions === */}
      <div className="grid lg:grid-cols-[1fr_1fr] gap-4">
        {/* Comment */}
        <div className="rounded-2xl bg-card p-4 border border-border/40">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 shrink-0 mt-0.5">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground mb-1">
                Análise do dia
                <span className="font-normal text-muted-foreground ml-2">
                  {scenarioLabel} · {frequencyLabels[frequency]}
                </span>
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{comment}</p>
            </div>
          </div>
        </div>

        {/* Recent Decisions */}
        <div className="rounded-2xl bg-card p-4 border border-border/40">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-semibold text-foreground">Decisões Recentes</span>
          </div>
          <div className="space-y-2.5">
            {recentDecisions.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${d.type === "buy" ? "bg-treend-success" : "bg-treend-warning"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    {d.currency} {d.amount.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{d.date}</p>
                </div>
                <p className={`text-xs font-bold tabular-nums ${d.type === "buy" ? "text-treend-danger" : "text-treend-success"}`}>
                  {d.type === "buy" ? "-" : "+"} R$ {(d.amount * d.rate).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                </p>
              </div>
            ))}
          </div>
          <Link to="/history" className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-border/40 text-xs text-primary hover:text-primary/80 transition-colors">
            Ver histórico completo
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Savings Simulator - compact */}
      <div className="rounded-2xl bg-card p-4 border border-border/40">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
            <Calculator className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs font-semibold text-foreground">Simulação rápida</span>
          <span className="text-[11px] text-muted-foreground">USD 10.000</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Taxa atual</p>
            <p className="text-base font-bold text-foreground tabular-nums">
              R$ {usdCalc.current.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Taxa Treend</p>
            <p className="text-base font-bold text-foreground tabular-nums">
              R$ {usdCalc.treend.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="rounded-xl bg-primary/5 p-3 text-center border border-primary/10">
            <p className="text-[10px] text-primary uppercase tracking-wider mb-1 font-medium">
              {isExporter ? "Ganho" : "Economia"}
            </p>
            <p className="text-base font-bold text-primary tabular-nums">
              R$ {usdCalc.savings.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
