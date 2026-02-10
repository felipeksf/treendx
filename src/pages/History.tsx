import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { History as HistoryIcon, Download, TrendingDown, TrendingUp } from "lucide-react";

const mockHistory = [
  { id: 1, date: "2026-02-08", currency: "USD", amount: 10000, rate: 5.12, zone: "Barato", savings: 1700 },
  { id: 2, date: "2026-02-05", currency: "EUR", amount: 5000, rate: 5.58, zone: "Caro", savings: -400 },
  { id: 3, date: "2026-01-28", currency: "USD", amount: 25000, rate: 4.98, zone: "Muito Barato", savings: 3200 },
  { id: 4, date: "2026-01-20", currency: "USD", amount: 8000, rate: 5.25, zone: "Neutro", savings: 120 },
  { id: 5, date: "2026-01-15", currency: "EUR", amount: 15000, rate: 5.45, zone: "Neutro", savings: 890 },
];

const HistoryPage = () => {
  const [filterCurrency, setFilterCurrency] = useState("all");

  const filtered = filterCurrency === "all" ? mockHistory : mockHistory.filter((h) => h.currency === filterCurrency);
  const totalSavings = filtered.reduce((acc, h) => acc + h.savings, 0);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Histórico de Decisões</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Acompanhe suas operações e economia acumulada</p>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card border border-border/40 p-4 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total de decisões</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">{filtered.length}</p>
        </div>
        <div className={`rounded-2xl border p-4 text-center ${totalSavings >= 0 ? "border-treend-success/20 bg-card" : "border-treend-danger/20 bg-card"}`}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Economia acumulada</p>
          <p className={`text-2xl font-bold tabular-nums ${totalSavings >= 0 ? "text-treend-success" : "text-treend-danger"}`}>
            R$ {totalSavings.toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Moeda</Label>
          <Select value={filterCurrency} onValueChange={setFilterCurrency}>
            <SelectTrigger className="w-28 h-8 text-xs bg-muted/40 border-border/40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" disabled className="h-8 text-xs mt-auto">
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Exportar CSV
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((h) => (
          <div key={h.id} className="rounded-2xl bg-card border border-border/40 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <HistoryIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {h.currency} {h.amount.toLocaleString()} @ {h.rate.toFixed(2)}
                </p>
                <p className="text-[11px] text-muted-foreground">{h.date} · Zona: {h.zone}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {h.savings >= 0 ? (
                <TrendingDown className="h-3.5 w-3.5 text-treend-success" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5 text-treend-danger" />
              )}
              <span className={`text-sm font-semibold tabular-nums ${h.savings >= 0 ? "text-treend-success" : "text-treend-danger"}`}>
                {h.savings >= 0 ? "+" : ""}R$ {h.savings.toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryPage;
