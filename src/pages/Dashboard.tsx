import { useState, useMemo, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ScoreGauge from "@/components/ScoreGauge";
import TrialBanner from "@/components/TrialBanner";
import { Calculator, History, Newspaper, DollarSign, Euro, TrendingUp, TrendingDown, ArrowRight, MessageSquare } from "lucide-react";

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

  useEffect(() => {
    if (context?.profile) {
      setScenario(context.profile === "exporter" ? "sell" : "buy");
    }
  }, [context?.profile]);
  const [frequency, setFrequency] = useState<Frequency>("weekly");

  const isExporter = scenario === "sell";

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

  const usdCalc = calcSavings(mockData.usd.rate, mockData.usd.score);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
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

      {/* Filters - compact inline */}
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

      {/* Score Cards - clean panels */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* USD */}
        <div className="rounded-2xl bg-card p-5 border border-border/40">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground tracking-tight">USD / BRL</span>
            <span className="ml-auto text-lg font-bold text-foreground tabular-nums">
              R$ {mockData.usd.rate.toFixed(2)}
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
              R$ {mockData.eur.rate.toFixed(2)}
            </span>
          </div>
          <ScoreGauge score={mockData.eur.score} zone={eurZone} inverted={isExporter} />
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Cotação do dia · {frequencyLabels[frequency]}
          </p>
        </div>
      </div>

      {/* Comment - minimal */}
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

      {/* Quick actions - subtle, no cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Calculadora", icon: Calculator, path: "/calculator" },
          { label: "Histórico", icon: History, path: "/history" },
          { label: "Notícias", icon: Newspaper, path: "/news" },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="group flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/40 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <item.icon className="h-4 w-4" />
            <span className="text-xs font-medium">{item.label}</span>
            <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
