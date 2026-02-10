import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ScoreGauge from "@/components/ScoreGauge";
import TrialBanner from "@/components/TrialBanner";
import { Calculator, History, Newspaper, DollarSign, Euro, MessageSquare, TrendingUp, TrendingDown } from "lucide-react";

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
  const [scenario, setScenario] = useState<Scenario>("buy");
  const [frequency, setFrequency] = useState<Frequency>("weekly");

  const isExporter = scenario === "sell";

  const comment = useMemo(
    () => mockData.comments[scenario][frequency],
    [scenario, frequency]
  );

  const scenarioIcon = isExporter ? TrendingUp : TrendingDown;
  const scenarioLabel = isExporter ? "Exportador (Vender)" : "Importador (Comprar)";

  const usdZone = getZoneLabel(mockData.usd.score, scenario);
  const eurZone = getZoneLabel(mockData.eur.score, scenario);

  // Mini calculator simulation
  const calcSavings = (rate: number, score: number) => {
    const baseAmount = 10000; // USD or EUR
    const spreadFactor = isExporter
      ? 1 + (score / 100) * 0.03
      : 1 - ((100 - score) / 100) * 0.03;
    const treendRate = rate * spreadFactor;
    const diff = isExporter ? treendRate - rate : rate - treendRate;
    return { current: rate * baseAmount, treend: treendRate * baseAmount, savings: Math.abs(diff * baseAmount) };
  };

  const usdCalc = calcSavings(mockData.usd.rate, mockData.usd.score);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>

      <TrialBanner daysLeft={mockData.trialDays} />

      {/* Scenario & Frequency Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={scenario} onValueChange={(v) => setScenario(v as Scenario)} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-2 sm:w-[340px] bg-muted">
            <TabsTrigger value="buy" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TrendingDown className="h-4 w-4" />
              Quero Comprar
            </TabsTrigger>
            <TabsTrigger value="sell" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TrendingUp className="h-4 w-4" />
              Quero Vender
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
          <SelectTrigger className="w-full sm:w-[180px] bg-muted border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="biweekly">Quinzenal</SelectItem>
            <SelectItem value="monthly">Mensal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Frequency context label */}
      <p className="text-xs text-muted-foreground -mt-3">
        Análise: <span className="text-primary font-medium">{frequencyDescriptions[frequency]}</span> · Perfil: <span className="text-primary font-medium">{scenarioLabel}</span>
      </p>

      {/* Score Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-display">
              <DollarSign className="h-5 w-5 text-primary" />
              USD/BRL
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ScoreGauge score={mockData.usd.score} zone={usdZone} inverted={isExporter} />
            <p className="mt-3 text-2xl font-display font-bold text-foreground">R$ {mockData.usd.rate.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Cotação do dia · {frequencyLabels[frequency]}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-display">
              <Euro className="h-5 w-5 text-primary" />
              EUR/BRL
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ScoreGauge score={mockData.eur.score} zone={eurZone} inverted={isExporter} />
            <p className="mt-3 text-2xl font-display font-bold text-foreground">R$ {mockData.eur.rate.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Cotação do dia · {frequencyLabels[frequency]}</p>
          </CardContent>
        </Card>
      </div>

      {/* Adaptive Comment */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <MessageSquare className="h-5 w-5 text-primary" />
            Comentário do dia
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              {isExporter ? "Exportador" : "Importador"} · {frequencyLabels[frequency]}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{comment}</p>
        </CardContent>
      </Card>

      {/* Mini Savings Simulator */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <Calculator className="h-5 w-5 text-primary" />
            Simulação rápida (USD 10.000)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Taxa atual</p>
              <p className="text-lg font-display font-bold text-foreground">
                R$ {usdCalc.current.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Taxa Treend</p>
              <p className="text-lg font-display font-bold text-foreground">
                R$ {usdCalc.treend.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {isExporter ? "Ganho potencial" : "Economia potencial"}
              </p>
              <p className="text-lg font-display font-bold text-success">
                R$ {usdCalc.savings.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Calculadora", icon: Calculator, path: "/calculator" },
          { label: "Histórico", icon: History, path: "/history" },
          { label: "Notícias", icon: Newspaper, path: "/news" },
        ].map((item) => (
          <Link key={item.path} to={item.path}>
            <Card className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="pt-4 pb-4 flex flex-col items-center gap-2">
                <item.icon className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
