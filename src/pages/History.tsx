import { useState, useMemo, useCallback } from "react";
import treendLogo from "@/assets/treend-logo.png";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { History as HistoryIcon, Download, TrendingDown, TrendingUp, CalendarDays, Trash2, FileDown, Eye, DollarSign, Target, BarChart3, Wallet, Activity, Percent, Users, Clock, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTreendRate } from "@/hooks/useTreendRate";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const currencySymbol = (c: string) => c === "BRL" ? "R$" : c === "USD" ? "US$" : c === "GBP" ? "£" : c === "EUR" ? "€" : c;
const currencyFlag = (c: string) => c === "USD" ? "🇺🇸" : c === "EUR" ? "🇪🇺" : c === "GBP" ? "🇬🇧" : c === "BRL" ? "🇧🇷" : "";

const formatDateBR = (dateStr: string) => {
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

const RATE_RANGES: Record<string, { min: number; max: number }> = {
  USD: { min: 4.00, max: 6.50 },
  EUR: { min: 4.50, max: 7.00 },
  GBP: { min: 5.00, max: 8.00 },
  BRL: { min: 0.15, max: 0.30 },
};

const getZoneLabel = (pct: number) => {
  if (pct <= 20) return { label: "Zona muito interessante", color: "text-treend-success", bg: "bg-treend-success/10" };
  if (pct <= 40) return { label: "Zona interessante", color: "text-treend-success", bg: "bg-treend-success/10" };
  if (pct <= 60) return { label: "Zona neutra", color: "text-treend-warning", bg: "bg-treend-warning/10" };
  if (pct <= 80) return { label: "Zona de pressão", color: "text-treend-danger", bg: "bg-treend-danger/10" };
  return { label: "Zona de alta pressão", color: "text-treend-danger", bg: "bg-treend-danger/10" };
};

const HistoryPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filterCurrency, setFilterCurrency] = useState("all");
  const queryClient = useQueryClient();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewDecision, setViewDecision] = useState<any | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const { data: treendRateData } = useTreendRate();
  const treendFraction = treendRateData?.rateFraction ?? 0.008;

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

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("user_decisions").delete().eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["user-decisions", user?.id] });
      toast({ title: "Registro excluído com sucesso" });
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    }
  };

  const getSimData = useCallback((d: any) => {
    const rate = Number(d.rate);
    const amount = Number(d.amount);
    const savings = d.savings || 0;
    const savedTreendRate = d.treend_rate ? Number(d.treend_rate) : rate * (1 - treendFraction);
    const savedSpread = d.spread != null ? Number(d.spread) : 1.0;
    const savedProfile = d.profile || "importador";
    const savedOps = d.ops_per_month ? Number(d.ops_per_month) : 10;
    const savedFreq = d.ops_frequency || "month";
    const savedProjMonths = d.projection_months ? Number(d.projection_months) : 12;
    const curBRL = amount * rate;
    const trdBRL = amount * savedTreendRate;
    const rateDiff = rate - savedTreendRate;
    const rateDiffPct = rate > 0 ? (Math.abs(rateDiff) / rate) * 100 : 0;
    const spreadCost = curBRL * (savedSpread / 100);
    const profileLabels: Record<string, string> = {
      importador: "Importador", exportador: "Exportador",
      agente_turismo: "Agente de Turismo", turista: "Turista", freelancer: "Freelancer",
    };
    const freqLabels: Record<string, string> = { month: "Mensal", week: "Semanal", day: "Diário" };
    return { rate, amount, savings, savedTreendRate, savedSpread, savedProfile, savedOps, savedFreq, savedProjMonths, curBRL, trdBRL, rateDiff, rateDiffPct, spreadCost, profileLabels, freqLabels };
  }, [treendFraction]);

  const handleDownloadPDF = useCallback(async (decision: any) => {
    setDownloadingPDF(true);
    try {
      setViewDecision(decision);
      await new Promise((r) => setTimeout(r, 400));

      const el = document.getElementById("simulation-detail-content");
      if (!el) throw new Error("Conteúdo não encontrado");

      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF } = await import("jspdf");

      // Temporarily compact spacing and force light mode for PDF
      const htmlEl = document.documentElement;
      const wasDark = htmlEl.classList.contains("dark");
      if (wasDark) htmlEl.classList.remove("dark");

      el.classList.remove("space-y-5");
      el.classList.add("space-y-1");
      el.style.fontSize = "10px";
      el.style.lineHeight = "1.25";
      el.style.padding = "0";

      await new Promise((r) => setTimeout(r, 150));

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // Restore original styles and theme
      el.classList.remove("space-y-1");
      el.classList.add("space-y-5");
      el.style.fontSize = "";
      el.style.lineHeight = "";
      el.style.padding = "";
      if (wasDark) htmlEl.classList.add("dark");

      const imgData = canvas.toDataURL("image/png");
      const imgW = canvas.width;
      const imgH = canvas.height;

      const A4_W = 210;
      const A4_H = 297;
      const MARGIN = 10;
      const contentW = A4_W - MARGIN * 2;
      const maxH = A4_H - MARGIN * 2;
      const naturalH = (imgH / imgW) * contentW;

      let finalW = contentW;
      let finalH = naturalH;
      if (finalH > maxH) {
        const shrink = maxH / finalH;
        finalW *= shrink;
        finalH = maxH;
      }

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const offsetX = (A4_W - finalW) / 2;
      doc.addImage(imgData, "PNG", offsetX, MARGIN, finalW, finalH);

      doc.save(`simulacao-treend-${decision.currency}-${formatDateBR(decision.created_at).replace(/\//g, "-")}.pdf`);
    } finally {
      setDownloadingPDF(false);
    }
  }, [getSimData]);

  const handleSendEmail = useCallback(async (decision: any) => {
    setSendingEmail(true);
    try {
      const s = getSimData(decision);
      const { error } = await supabase.functions.invoke("send-simulation-email", {
        body: {
          currency: decision.currency,
          profile: s.savedProfile,
          volume: s.amount,
          currentRate: s.rate,
          treendRate: s.savedTreendRate,
          opsPerMonth: s.savedOps,
          opsFrequency: s.savedFreq,
          bankSpread: s.savedSpread,
          projectionMonths: s.savedProjMonths,
          netMonth: s.savings,
          netYear: s.savings * 12,
          grossMonth: (s.rateDiffPct / 100) * s.curBRL,
          spreadCost: s.spreadCost,
          effectiveRate: s.rate * (1 + s.savedSpread / 100),
          rateDiffPct: s.rateDiffPct,
          netPct: s.rateDiffPct - s.savedSpread,
          economiaMinusSpread: (s.rateDiffPct / 100) * s.curBRL - s.spreadCost,
          overallHealth: "good",
          zone: decision.zone || "",
          date: formatDateBR(decision.created_at),
          projections: [
            { label: "6 meses", value: s.savings * 6 },
            { label: "12 meses", value: s.savings * 12 },
            { label: "24 meses", value: s.savings * 24 },
          ],
        },
      });
      if (error) throw error;
      toast({ title: "E-mail enviado!", description: "Verifique sua caixa de entrada." });
    } catch (err: any) {
      toast({ title: "Erro ao enviar e-mail", description: err.message, variant: "destructive" });
    } finally {
      setSendingEmail(false);
    }
  }, [getSimData, toast]);


  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Histórico de Decisões</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Acompanhe suas operações e economia acumulada</p>
      </div>

      {/* Summary – KPI stat style */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="kpi-stat p-5 text-center">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">Total de decisões</p>
          <p className="text-4xl font-bold text-foreground tabular-nums">{filtered.length}</p>
        </div>
        <div className="kpi-stat p-5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 text-center">Economia acumulada</p>
          {Object.keys(savingsByCurrency).length === 0 ? (
            <p className="text-4xl font-bold text-foreground tabular-nums text-center">—</p>
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
            <SelectTrigger className="w-28 h-9 text-xs bg-secondary/50 border-border rounded-xl"><SelectValue /></SelectTrigger>
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
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-36 text-xs bg-secondary/50 border-border rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Até</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-36 text-xs bg-secondary/50 border-border rounded-xl" />
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9 text-xs rounded-xl border-border">
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
            <div key={h.id} className="kpi-card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                  <HistoryIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {h.currency} {Number(h.amount).toLocaleString()} @ {Number(h.rate).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{formatDateBR(h.created_at)} · Zona: {h.zone || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  {(h.savings || 0) >= 0 ? (
                    <TrendingDown className="h-3.5 w-3.5 text-treend-success" />
                  ) : (
                    <TrendingUp className="h-3.5 w-3.5 text-treend-danger" />
                  )}
                  <span className={`text-sm font-semibold tabular-nums ${(h.savings || 0) >= 0 ? "text-treend-success" : "text-treend-danger"}`}>
                    {(h.savings || 0) >= 0 ? "+" : ""}{currencySymbol(h.currency)} {(h.savings || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setViewDecision(h)} title="Ver simulação">
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleDownloadPDF(h)} title="Baixar PDF">
                  <FileDown className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-treend-danger">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir registro</AlertDialogTitle>
                      <AlertDialogDescription>Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(h.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Simulation Detail Modal */}
      <Dialog open={!!viewDecision} onOpenChange={(open) => !open && setViewDecision(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {viewDecision && (() => {
            const d = viewDecision;
            const sym = currencySymbol(d.currency);
            const flag = currencyFlag(d.currency);
            const s = getSimData(d);
            const { rate, amount, savings, savedTreendRate, savedSpread, savedProfile, savedOps, savedFreq, savedProjMonths, curBRL, trdBRL, rateDiff, rateDiffPct, spreadCost, profileLabels, freqLabels } = s;
            const range = RATE_RANGES[d.currency] || RATE_RANGES.USD;
            const rawPct = ((rate - range.min) / (range.max - range.min)) * 100;
            const zoneInfo = getZoneLabel(rawPct);

            // Health computations (mirror Calculator logic)
            const grossPct = rate > 0 ? (Math.abs(rateDiff) / rate) * 100 : 0;
            const netPct = grossPct - savedSpread;
            const savingsHealthStatus: "good" | "warning" | "bad" =
              grossPct <= 0.8 && grossPct > 0 ? "good" : grossPct <= 1.2 ? "warning" : "bad";
            const spreadHealthStatus: "good" | "warning" | "bad" =
              savedSpread <= 0.5 ? "good" : savedSpread <= 1.2 ? "warning" : "bad";
            const netHealthStatus: "good" | "warning" | "bad" =
              netPct >= 0.1 ? "good" : netPct >= 0 ? "warning" : "bad";
            const volumeHealthStatus: "good" | "warning" | "bad" =
              amount >= 2000 ? "good" : amount >= 1000 ? "warning" : "bad";
            const overallHealth =
              [savingsHealthStatus, spreadHealthStatus, netHealthStatus, volumeHealthStatus].filter(s => s === "good").length >= 3
                ? "good"
                : [savingsHealthStatus, spreadHealthStatus, netHealthStatus, volumeHealthStatus].filter(s => s === "bad").length >= 2
                ? "bad"
                : "warning";
            const healthColors: Record<string, string> = {
              good: "text-treend-success border-treend-success/30 bg-treend-success/10",
              warning: "text-treend-warning border-treend-warning/30 bg-treend-warning/10",
              bad: "text-treend-danger border-treend-danger/30 bg-treend-danger/10",
            };
            const healthLabels: Record<string, string> = { good: "Saudável", warning: "Atenção", bad: "Crítico" };
            const dotColors: Record<string, string> = { good: "bg-treend-success", warning: "bg-treend-warning", bad: "bg-treend-danger" };
            const healthItemColors: Record<string, string> = {
              good: "text-treend-success border-treend-success/20 bg-treend-success/5",
              warning: "text-treend-warning border-treend-warning/20 bg-treend-warning/5",
              bad: "text-treend-danger border-treend-danger/20 bg-treend-danger/5",
            };

            return (
              <div id="simulation-detail-content" className="space-y-5">
                {/* PDF header: logo + date */}
                <div className="flex flex-col items-center gap-1 pb-4 border-b border-border/30">
                  <img src={treendLogo} alt="Treend" className="h-24 object-contain" />
                  <p className="text-xs text-muted-foreground mt-1">{formatDateBR(d.created_at)}</p>
                </div>

                <DialogHeader className="mb-4">
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <span className="text-xl">{flag}</span>
                    Simulação — {d.currency}
                  </DialogTitle>
                </DialogHeader>

                {/* Parameters */}
                <div className="kpi-stat p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Parâmetros</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Volume</p>
                        <p className="text-sm font-bold tabular-nums">{sym} {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Target className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Taxa no momento</p>
                        <p className="text-sm font-bold tabular-nums">{rate.toFixed(4)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-treend-success/10 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-treend-success" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Taxa Treend estimada</p>
                        <p className="text-sm font-bold tabular-nums text-treend-success">{savedTreendRate.toFixed(4)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-lg ${zoneInfo.bg} flex items-center justify-center`}>
                        <BarChart3 className={`h-4 w-4 ${zoneInfo.color}`} />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Zona</p>
                        <p className={`text-sm font-bold ${zoneInfo.color}`}>{d.zone || zoneInfo.label}</p>
                      </div>
                    </div>
                  </div>
                  {/* Extra params */}
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Perfil</p>
                        <p className="text-sm font-bold">{profileLabels[savedProfile] || savedProfile}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Percent className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Spread bancário</p>
                        <p className="text-sm font-bold tabular-nums">{savedSpread.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Operações</p>
                        <p className="text-sm font-bold tabular-nums">{savedOps} / {freqLabels[savedFreq] || savedFreq}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Projeção</p>
                        <p className="text-sm font-bold tabular-nums">{savedProjMonths} meses</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Results */}
                <div className="kpi-stat p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resultado da Simulação</p>
                  <div className="grid grid-cols-1 gap-2.5">
                    <div className="flex items-center justify-between rounded-xl border border-border/40 p-3">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Volume em BRL</span>
                      </div>
                      <span className="text-sm font-bold tabular-nums">R$ {curBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border/40 p-3">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-treend-success" />
                        <span className="text-xs text-muted-foreground">Volume com Treend</span>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-treend-success">R$ {trdBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border/40 p-3">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Diferença de taxa</span>
                      </div>
                      <span className="text-sm font-bold tabular-nums">{rateDiff.toFixed(4)} ({rateDiffPct.toFixed(2)}%)</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border/40 p-3">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Custo do spread ({savedSpread.toFixed(1)}%)</span>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-treend-danger">-R$ {spreadCost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Economy highlight */}
                <div className={`rounded-xl border p-4 ${savings >= 0 ? "border-treend-success/30 bg-treend-success/5" : "border-treend-danger/30 bg-treend-danger/5"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {savings >= 0 ? (
                        <TrendingDown className="h-5 w-5 text-treend-success" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-treend-danger" />
                      )}
                      <span className="text-sm font-medium text-foreground">
                        {savings >= 0 ? "Economia estimada" : "Custo adicional estimado"}
                      </span>
                    </div>
                    <span className={`text-xl font-bold tabular-nums ${savings >= 0 ? "text-treend-success" : "text-treend-danger"}`}>
                      {savings >= 0 ? "+" : ""}{sym} {savings.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Projections */}
                <div className="kpi-stat p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projeções</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "6 meses", value: savings * 6 },
                      { label: "12 meses", value: savings * 12 },
                      { label: "24 meses", value: savings * 24 },
                    ].map((proj) => (
                      <div key={proj.label} className="text-center rounded-xl border border-border/40 p-3">
                        <p className="text-[10px] text-muted-foreground mb-1">{proj.label}</p>
                        <p className={`text-sm font-bold tabular-nums ${proj.value >= 0 ? "text-treend-success" : "text-treend-danger"}`}>
                          {sym} {Math.abs(proj.value).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Health Panel */}
                <div className="kpi-stat p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saúde da Operação</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${healthColors[overallHealth]}`}>
                        {healthLabels[overallHealth]}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {([
                      {
                        label: "Economia", value: `${grossPct.toFixed(2)}%`, status: savingsHealthStatus,
                        description: savingsHealthStatus === "good" ? "Excelente diferencial cambial" : savingsHealthStatus === "warning" ? "Diferencial moderado" : "Diferencial insuficiente",
                        benchmark: "<= 0,8% (ideal)",
                      },
                      {
                        label: "Taxa de Spread", value: `${savedSpread.toFixed(2)}%`, status: spreadHealthStatus,
                        description: spreadHealthStatus === "good" ? "Spread competitivo" : spreadHealthStatus === "warning" ? "Spread aceitável" : "Spread elevado",
                        benchmark: "<= 1,2% (ideal: 0,5%)",
                      },
                      {
                        label: "Economia Líquida", value: `${netPct.toFixed(2)}%`, status: netHealthStatus,
                        description: netHealthStatus === "good" ? "Resultado líquido excelente" : netHealthStatus === "warning" ? "Margem apertada" : "Spread consome a economia",
                        benchmark: ">= 0,1% (ideal)",
                      },
                      {
                        label: "Volume Mensal", value: `${sym} ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, status: volumeHealthStatus,
                        description: "Volume mensal projetado.",
                        benchmark: `>= ${sym} 2K`,
                      },
                    ] as { label: string; value: string; status: "good" | "warning" | "bad"; description: string; benchmark: string }[]).map((item) => (
                      <div key={item.label} className={`rounded-xl border p-3 transition-all ${healthItemColors[item.status]}`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${dotColors[item.status]}`} />
                            <span className="text-xs font-semibold text-foreground">{item.label}</span>
                          </div>
                          <span className="text-xs font-bold tabular-nums text-foreground">{item.value}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground ml-4">{item.description}</p>
                        <p className="text-[9px] text-muted-foreground/70 ml-4 mt-0.5">Benchmark: {item.benchmark}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2 border-t border-border/30" data-html2canvas-ignore="true">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => handleDownloadPDF(d)} disabled={downloadingPDF}>
                    {downloadingPDF ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                    Baixar PDF
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => handleSendEmail(d)} disabled={sendingEmail}>
                    {sendingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                    Enviar por e-mail
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryPage;