import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { History as HistoryIcon, Download, TrendingDown, TrendingUp, CalendarDays } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const currencySymbol = (c: string) => c === "BRL" ? "R$" : c === "USD" ? "US$" : c === "GBP" ? "£" : c === "EUR" ? "€" : c;
const currencyFlag = (c: string) => c === "USD" ? "🇺🇸" : c === "EUR" ? "🇪🇺" : c === "GBP" ? "🇬🇧" : c === "BRL" ? "🇧🇷" : "";

const formatDateBR = (dateStr: string) => {
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

const HistoryPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filterCurrency, setFilterCurrency] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: decisions = [], isLoading } = useQuery({
    queryKey: ["user-decisions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_decisions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    let result = decisions;
    if (filterCurrency !== "all") {
      result = result.filter((h) => h.currency === filterCurrency);
    }
    if (dateFrom) {
      result = result.filter((h) => h.created_at.slice(0, 10) >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((h) => h.created_at.slice(0, 10) <= dateTo);
    }
    return result;
  }, [decisions, filterCurrency, dateFrom, dateTo]);

  const savingsByCurrency = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((h) => {
      const cur = h.currency || "USD";
      map[cur] = (map[cur] || 0) + (h.savings || 0);
    });
    return map;
  }, [filtered]);

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast({ title: "Nenhum dado para exportar" });
      return;
    }
    const header = "Data,Moeda,Volume,Taxa,Zona,Economia\n";
    const rows = filtered.map((h) =>
      `${formatDateBR(h.created_at)},${h.currency},${h.amount},${h.rate},${h.zone || ""},${h.savings || 0}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `historico-treend-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Histórico de Decisões</h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe suas operações e economia acumulada</p>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="premium-stat-card p-5 text-center">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">Total de decisões</p>
          <p className="text-3xl font-bold text-foreground tabular-nums">{filtered.length}</p>
        </div>
        <div className="premium-stat-card p-5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 text-center">Economia acumulada</p>
          {Object.keys(savingsByCurrency).length === 0 ? (
            <p className="text-3xl font-bold text-foreground tabular-nums text-center">—</p>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              {Object.entries(savingsByCurrency).map(([cur, total]) => (
                <div key={cur} className="flex items-center gap-2">
                  <span className="text-lg">{currencyFlag(cur)}</span>
                  <p className={`text-xl font-bold tabular-nums ${total >= 0 ? "text-treend-success" : "text-treend-danger"}`}>
                    {currencySymbol(cur)} {total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1.5">
          <Label className="text-xs">Moeda</Label>
          <Select value={filterCurrency} onValueChange={setFilterCurrency}>
            <SelectTrigger className="w-28 h-9 text-xs bg-muted/30 border-border/50 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="USD"><span className="flex items-center gap-2">🇺🇸 USD</span></SelectItem>
              <SelectItem value="EUR"><span className="flex items-center gap-2">🇪🇺 EUR</span></SelectItem>
              <SelectItem value="GBP"><span className="flex items-center gap-2">🇬🇧 GBP</span></SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1"><CalendarDays className="h-3 w-3" /> De</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-36 text-xs bg-muted/30 border-border/50 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Até</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-36 text-xs bg-muted/30 border-border/50 rounded-xl" />
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9 text-xs rounded-xl border-border/50">
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Exportar CSV
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma decisão registrada ainda.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((h) => (
            <div key={h.id} className="premium-card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <HistoryIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {h.currency} {Number(h.amount).toLocaleString()} @ {Number(h.rate).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{formatDateBR(h.created_at)} · Zona: {h.zone || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {(h.savings || 0) >= 0 ? (
                  <TrendingDown className="h-3.5 w-3.5 text-treend-success" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5 text-treend-danger" />
                )}
                <span className={`text-sm font-semibold tabular-nums ${(h.savings || 0) >= 0 ? "text-treend-success" : "text-treend-danger"}`}>
                  {(h.savings || 0) >= 0 ? "+" : ""}{currencySymbol(h.currency)} {(h.savings || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;