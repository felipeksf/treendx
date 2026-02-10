import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator as CalcIcon, TrendingDown, TrendingUp, Save, Percent, SlidersHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RATE_RANGES: Record<string, { min: number; max: number; default: number }> = {
  USD: { min: 4.00, max: 6.50, default: 5.12 },
  EUR: { min: 4.50, max: 7.00, default: 5.58 },
};

const CalculatorPage = () => {
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("10000");
  const [currentRate, setCurrentRate] = useState("5.12");
  const [treendRate, setTreendRate] = useState("4.95");
  const [targetPercent, setTargetPercent] = useState("");
  const [sliderRate, setSliderRate] = useState([5.12]);
  const { toast } = useToast();

  const rateRange = RATE_RANGES[currency];
  const amountNum = parseFloat(amount) || 0;
  const currentRateNum = parseFloat(currentRate) || 0;
  const treendRateNum = parseFloat(treendRate) || 0;
  const targetPctNum = parseFloat(targetPercent) || 0;
  const sliderRateNum = sliderRate[0];

  const handleCurrencyChange = (val: string) => {
    setCurrency(val);
    const range = RATE_RANGES[val];
    setCurrentRate(range.default.toFixed(2));
    setSliderRate([range.default]);
    setTreendRate(val === "USD" ? "4.95" : "5.72");
  };

  // Main result based on editable rates
  const result = useMemo(() => {
    const currentBRL = amountNum * currentRateNum;
    const treendBRL = amountNum * treendRateNum;
    const savings = currentBRL - treendBRL;
    const savingsPct = currentBRL > 0 ? (savings / currentBRL) * 100 : 0;
    return { currentBRL, treendBRL, savings, savingsPct };
  }, [amountNum, currentRateNum, treendRateNum]);

  // Percentage simulation
  const simulation = useMemo(() => {
    if (targetPctNum <= 0) return null;
    const currentBRL = amountNum * currentRateNum;
    const targetSavings = currentBRL * (targetPctNum / 100);
    const targetBRL = currentBRL - targetSavings;
    const targetRate = amountNum > 0 ? targetBRL / amountNum : 0;
    return { targetSavings, targetBRL, targetRate };
  }, [amountNum, currentRateNum, targetPctNum]);

  // Slider scenario simulation
  const sliderResult = useMemo(() => {
    const sliderBRL = amountNum * sliderRateNum;
    const currentBRL = amountNum * currentRateNum;
    const diff = currentBRL - sliderBRL;
    const diffPct = currentBRL > 0 ? (diff / currentBRL) * 100 : 0;
    return { sliderBRL, diff, diffPct };
  }, [amountNum, currentRateNum, sliderRateNum]);

  const isPositive = result.savings > 0;
  const sliderIsPositive = sliderResult.diff > 0;

  // Zone color for slider
  const getZoneInfo = (rate: number) => {
    const range = rateRange.max - rateRange.min;
    const pct = ((rate - rateRange.min) / range) * 100;
    if (pct <= 20) return { label: "Muito Barato", color: "text-treend-success" };
    if (pct <= 40) return { label: "Barato", color: "text-treend-success" };
    if (pct <= 60) return { label: "Neutro", color: "text-yellow-500" };
    if (pct <= 80) return { label: "Caro", color: "text-treend-danger" };
    return { label: "Muito Caro", color: "text-treend-danger" };
  };

  const zoneInfo = getZoneInfo(sliderRateNum);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-foreground">Calculadora de Simulação</h1>

      {/* Input Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <CalcIcon className="h-5 w-5 text-primary" />
            Parâmetros da simulação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Moeda</Label>
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD — Dólar</SelectItem>
                  <SelectItem value="EUR">EUR — Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor ({currency})</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Taxa atual (editável)</Label>
              <Input
                type="number"
                value={currentRate}
                onChange={(e) => {
                  setCurrentRate(e.target.value);
                  setSliderRate([parseFloat(e.target.value) || rateRange.default]);
                }}
                step="0.01"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Taxa Treend (editável)</Label>
              <Input
                type="number"
                value={treendRate}
                onChange={(e) => setTreendRate(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Percentage simulation */}
          <div className="border-t border-border pt-4 space-y-2">
            <Label className="flex items-center gap-1.5">
              <Percent className="h-4 w-4 text-primary" />
              Simular economia/lucro desejado (%)
            </Label>
            <Input
              type="number"
              placeholder="Ex: 3.5"
              value={targetPercent}
              onChange={(e) => setTargetPercent(e.target.value)}
              min="0"
              max="100"
              step="0.1"
            />
            {simulation && (
              <div className="grid sm:grid-cols-3 gap-3 mt-3">
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Taxa necessária</p>
                  <p className="text-lg font-display font-bold text-primary">
                    {simulation.targetRate.toFixed(4)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Valor alvo (BRL)</p>
                  <p className="text-lg font-display font-bold text-foreground">
                    R$ {simulation.targetBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Economia simulada</p>
                  <p className="text-lg font-display font-bold text-treend-success">
                    R$ {simulation.targetSavings.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rate Slider Scenario */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            Simular cenário de cotação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Arraste para simular a taxa</Label>
              <span className={`text-sm font-display font-bold ${zoneInfo.color}`}>
                {zoneInfo.label}
              </span>
            </div>
            <Slider
              value={sliderRate}
              onValueChange={setSliderRate}
              min={rateRange.min}
              max={rateRange.max}
              step={0.01}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground font-display">
              <span>{rateRange.min.toFixed(2)}</span>
              <span className="text-lg font-bold text-foreground">{sliderRateNum.toFixed(4)}</span>
              <span>{rateRange.max.toFixed(2)}</span>
            </div>
          </div>

          {/* Slider result */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Valor neste cenário (BRL)</p>
              <p className="text-xl font-display font-bold text-foreground">
                R$ {sliderResult.sliderBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Diferença vs taxa atual</p>
              <div className="flex items-center justify-center gap-1.5">
                {sliderIsPositive ? (
                  <TrendingDown className="h-4 w-4 text-treend-success" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-treend-danger" />
                )}
                <p className={`text-xl font-display font-bold ${sliderIsPositive ? "text-treend-success" : "text-treend-danger"}`}>
                  {sliderIsPositive ? "−" : "+"}R$ {Math.abs(sliderResult.diff).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className={`text-sm ${sliderIsPositive ? "text-treend-success" : "text-treend-danger"}`}>
                  ({Math.abs(sliderResult.diffPct).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Result */}
      <Card className={`border ${isPositive ? "border-treend-success/30" : "border-treend-danger/30"} bg-card`}>
        <CardContent className="pt-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Valor na taxa atual</p>
              <p className="text-xl font-display font-bold text-foreground">
                R$ {result.currentBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Valor na taxa Treend</p>
              <p className="text-xl font-display font-bold text-foreground">
                R$ {result.treendBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-4 text-center">
            <div className="flex items-center justify-center gap-2">
              {isPositive ? (
                <TrendingDown className="h-5 w-5 text-treend-success" />
              ) : (
                <TrendingUp className="h-5 w-5 text-treend-danger" />
              )}
              <span className={`text-2xl font-display font-bold ${isPositive ? "text-treend-success" : "text-treend-danger"}`}>
                {isPositive ? "−" : "+"}R$ {Math.abs(result.savings).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-sm ${isPositive ? "text-treend-success" : "text-treend-danger"}`}>
                ({Math.abs(result.savingsPct).toFixed(1)}%)
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isPositive ? "Economia potencial" : "Custo adicional estimado"}
            </p>
          </div>

          <Button
            className="w-full"
            variant="outline"
            onClick={() => toast({ title: "Decisão registrada!", description: "Salva no seu histórico." })}
          >
            <Save className="mr-2 h-4 w-4" />
            Registrar esta decisão
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center px-4">
        Esta simulação é meramente ilustrativa. A decisão final é de responsabilidade do usuário.
      </p>
    </div>
  );
};

export default CalculatorPage;
