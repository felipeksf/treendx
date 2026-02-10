import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-foreground">Histórico de Decisões</h1>

      {/* Summary */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Total de decisões</p>
            <p className="text-3xl font-display font-bold text-foreground">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card className={`border ${totalSavings >= 0 ? "border-treend-success/20" : "border-treend-danger/20"} bg-card`}>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground">Economia acumulada</p>
            <p className={`text-3xl font-display font-bold ${totalSavings >= 0 ? "text-treend-success" : "text-treend-danger"}`}>
              R$ {totalSavings.toLocaleString("pt-BR")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Moeda</Label>
          <Select value={filterCurrency} onValueChange={setFilterCurrency}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" disabled>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((h) => (
          <Card key={h.id} className="bg-card border-border">
            <CardContent className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <HistoryIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {h.currency} {h.amount.toLocaleString()} @ {h.rate.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">{h.date} · Zona: {h.zone}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {h.savings >= 0 ? (
                  <TrendingDown className="h-4 w-4 text-treend-success" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-treend-danger" />
                )}
                <span className={`text-sm font-semibold ${h.savings >= 0 ? "text-treend-success" : "text-treend-danger"}`}>
                  {h.savings >= 0 ? "+" : ""}R$ {h.savings.toLocaleString("pt-BR")}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HistoryPage;
