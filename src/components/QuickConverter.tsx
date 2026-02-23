import { useState } from "react";
import { Calculator as CalcIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExchangeRates } from "@/hooks/useExchangeRates";

const currencyFlag = (c: string) =>
  c === "USD" ? "🇺🇸" : c === "EUR" ? "🇪🇺" : "🇬🇧";

const fmtFull = (v: number, cur: string) => {
  if (cur === "BRL") return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const symbol = cur === "USD" ? "US$" : cur === "EUR" ? "€" : "£";
  return `${symbol} ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const QuickConverter = () => {
  const [converterCurrency, setConverterCurrency] = useState("USD");
  const [converterAmount, setConverterAmount] = useState("1000");
  const [converterResultCurrency, setConverterResultCurrency] = useState<"foreign" | "BRL">("foreign");

  const { usd, eur, gbp } = useExchangeRates();

  const convRate = converterCurrency === "USD" ? usd?.bid : converterCurrency === "EUR" ? eur?.bid : gbp?.bid;
  const convAmount = parseFloat(converterAmount.replace(/\./g, "").replace(",", ".")) || 0;
  const convSymbol = converterCurrency === "USD" ? "US$" : converterCurrency === "EUR" ? "€" : "£";

  return (
    <div className="kpi-card p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
          <CalcIcon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground">Conversor Rápido</span>
        <span className="text-xs text-muted-foreground ml-1">
          ({converterCurrency} → {converterResultCurrency === "BRL" ? "BRL" : converterCurrency} com cotação do dia)
        </span>
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
              let raw = e.target.value.replace(/\./g, "");
              raw = raw.replace(/[^0-9,]/g, "");
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
};

export default QuickConverter;
