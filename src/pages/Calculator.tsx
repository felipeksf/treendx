import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator as CalcIcon, TrendingDown, TrendingUp, Save, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const mockRates: Record<string, { rate: number; treendRate: number; zone: string }> = {
  USD: { rate: 5.12, treendRate: 4.95, zone: "Barato" },
  EUR: { rate: 5.58, treendRate: 5.72, zone: "Caro" },
};

const CalculatorPage = () => {
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("10000");
  const [targetPercent, setTargetPercent] = useState("");
  const { toast } = useToast();

  const data = mockRates[currency];
  const amountNum = parseFloat(amount) || 0;
  const targetPctNum = parseFloat(targetPercent) || 0;

  const result = useMemo(() => {
    const currentBRL = amountNum * data.rate;
    const treendBRL = amountNum * data.treendRate;
    const savings = currentBRL - treendBRL;
    const savingsPct = currentBRL > 0 ? (savings / currentBRL) * 100 : 0;
    return { currentBRL, treendBRL, savings, savingsPct };
  }, [amountNum, data]);

  const simulation = useMemo(() => {
    if (targetPctNum <= 0) return null;
    const currentBRL = amountNum * data.rate;
    const targetSavings = currentBRL * (targetPctNum / 100);
    const targetBRL = currentBRL - targetSavings;
    const targetRate = amountNum > 0 ? targetBRL / amountNum : 0;
    return { targetSavings, targetBRL, targetRate };
  }, [amountNum, data, targetPctNum]);

  const isPositive = result.savings > 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-foreground">Calculadora de Timing</h1>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <CalcIcon className="h-5 w-5 text-primary" />
            Simular operação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Moeda</Label>
              <Select value={currency} onValueChange={setCurrency}>
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
              <Label>Taxa atual</Label>
              <Input value={data.rate.toFixed(4)} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Taxa zona Treend ({data.zone})</Label>
              <Input value={data.treendRate.toFixed(4)} readOnly className="bg-muted" />
            </div>
          </div>

          {/* Simulação por percentual */}
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

      {/* Result */}
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
    </div>
  );
};

export default CalculatorPage;
