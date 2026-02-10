import { useState, useMemo } from "react";
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

  const result = useMemo(() => {
    const currentBRL = amountNum * currentRateNum;
    const treendBRL = amountNum * treendRateNum;
    const savings = currentBRL - treendBRL;
    const savingsPct = currentBRL > 0 ? (savings / currentBRL) * 100 : 0;
    return { currentBRL, treendBRL, savings, savingsPct };
  }, [amountNum, currentRateNum, treendRateNum]);

  const simulation = useMemo(() => {
    if (targetPctNum <= 0) return null;
    const currentBRL = amountNum * currentRateNum;
    const targetSavings = currentBRL * (targetPctNum / 100);
    const targetBRL = currentBRL - targetSavings;
    const targetRate = amountNum > 0 ? targetBRL / amountNum : 0;
    return { targetSavings, targetBRL, targetRate };
  }, [amountNum, currentRateNum, targetPctNum]);

  const sliderResult = useMemo(() => {
    const sliderBRL = amountNum * sliderRateNum;
    const currentBRL = amountNum * currentRateNum;
    const diff = currentBRL - sliderBRL;
    const diffPct = currentBRL > 0 ? (diff / currentBRL) * 100 : 0;
    return { sliderBRL, diff, diffPct };
  }, [amountNum, currentRateNum, sliderRateNum]);

  const isPositive = result.savings > 0;
  const sliderIsPositive = sliderResult.diff > 0;

  const getZoneInfo = (rate: number) => {
    const range = rateRange.max - rateRange.min;
    const pct = ((rate - rateRange.min) / range) * 100;
    if (pct <= 20) return { label: "Muito Barato", color: "text-treend-success" };
    if (pct <= 40) return { label: "Barato", color: "text-treend-success" };
    if (pct <= 60) return { label: "Neutro", color: "text-treend-warning" };
    if (pct <= 80) return { label: "Caro", color: "text-treend-danger" };
    return { label: "Muito Caro", color: "text-treend-danger" };
  };

  const zoneInfo = getZoneInfo(sliderRateNum);

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Calculadora de Simulação</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Simule cenários e tome decisões com confiança</p>
      </div>

      {/* Parameters */}
      <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
            <CalcIcon className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Parâmetros</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Moeda</Label>
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="h-9 text-sm bg-muted/40 border-border/40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD — Dólar</SelectItem>
                <SelectItem value="EUR">EUR — Euro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Valor ({currency})</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" className="h-9 text-sm bg-muted/40 border-border/40" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Taxa atual</Label>
            <Input
              type="number"
              value={currentRate}
              onChange={(e) => { setCurrentRate(e.target.value); setSliderRate([parseFloat(e.target.value) || rateRange.default]); }}
              step="0.01"
              className="h-9 text-sm bg-muted/40 border-border/40"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Taxa Treend</Label>
            <Input type="number" value={treendRate} onChange={(e) => setTreendRate(e.target.value)} step="0.01" className="h-9 text-sm bg-muted/40 border-border/40" />
          </div>
        </div>

        {/* Percentage simulation */}
        <div className="border-t border-border/40 pt-4 space-y-2">
          <Label className="flex items-center gap-1.5 text-xs">
            <Percent className="h-3.5 w-3.5 text-primary" />
            Simular economia/lucro desejado (%)
          </Label>
          <Input
            type="number"
            placeholder="Ex: 3.5"
            value={targetPercent}
            onChange={(e) => setTargetPercent(e.target.value)}
            min="0" max="100" step="0.1"
            className="h-9 text-sm bg-muted/40 border-border/40"
          />
          {simulation && (
            <div className="grid sm:grid-cols-3 gap-2 mt-3">
              <div className="rounded-xl bg-muted/40 p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Taxa necessária</p>
                <p className="text-base font-bold text-primary tabular-nums">{simulation.targetRate.toFixed(4)}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Valor alvo</p>
                <p className="text-base font-bold text-foreground tabular-nums">R$ {simulation.targetBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="rounded-xl bg-primary/5 p-3 text-center border border-primary/10">
                <p className="text-[10px] text-primary uppercase tracking-wider mb-1 font-medium">Economia</p>
                <p className="text-base font-bold text-primary tabular-nums">R$ {simulation.targetSavings.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rate Slider */}
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
            <p className="text-base font-bold text-foreground tabular-nums">
              R$ {sliderResult.sliderBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Diferença vs atual</p>
            <div className="flex items-center justify-center gap-1">
              {sliderIsPositive ? <TrendingDown className="h-3.5 w-3.5 text-treend-success" /> : <TrendingUp className="h-3.5 w-3.5 text-treend-danger" />}
              <p className={`text-base font-bold tabular-nums ${sliderIsPositive ? "text-treend-success" : "text-treend-danger"}`}>
                {sliderIsPositive ? "−" : "+"}R$ {Math.abs(sliderResult.diff).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className={`text-xs ${sliderIsPositive ? "text-treend-success" : "text-treend-danger"}`}>
                ({Math.abs(sliderResult.diffPct).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Result */}
      <div className={`rounded-2xl p-5 space-y-4 border ${isPositive ? "border-treend-success/20 bg-card" : "border-treend-danger/20 bg-card"}`}>
        <div className="grid sm:grid-cols-2 gap-3 text-center">
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Valor taxa atual</p>
            <p className="text-base font-bold text-foreground tabular-nums">
              R$ {result.currentBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Valor taxa Treend</p>
            <p className="text-base font-bold text-foreground tabular-nums">
              R$ {result.treendBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="border-t border-border/40 pt-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            {isPositive ? <TrendingDown className="h-4 w-4 text-treend-success" /> : <TrendingUp className="h-4 w-4 text-treend-danger" />}
            <span className={`text-xl font-bold tabular-nums ${isPositive ? "text-treend-success" : "text-treend-danger"}`}>
              {isPositive ? "−" : "+"}R$ {Math.abs(result.savings).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-xs ${isPositive ? "text-treend-success" : "text-treend-danger"}`}>
              ({Math.abs(result.savingsPct).toFixed(1)}%)
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {isPositive ? "Economia potencial" : "Custo adicional estimado"}
          </p>
        </div>

        <Button
          className="w-full"
          variant="outline"
          size="sm"
          onClick={() => toast({ title: "Decisão registrada!", description: "Salva no seu histórico." })}
        >
          <Save className="mr-2 h-4 w-4" />
          Registrar esta decisão
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Esta simulação é meramente ilustrativa. A decisão final é de responsabilidade do usuário.
      </p>
    </div>
  );
};

export default CalculatorPage;
