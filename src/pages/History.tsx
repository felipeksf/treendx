import { useState, useMemo, useCallback } from "react";
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
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const sym = currencySymbol(decision.currency);
      const flag = currencyFlag(decision.currency);
      const s = getSimData(decision);

      // Header
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 40, "F");
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255);
      doc.text("treend", 105, 22, { align: "center" });
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Resumo da Simulação", 105, 32, { align: "center" });

      doc.setTextColor(30, 41, 59);
      let y = 55;

      // Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`${flag} Simulação — ${decision.currency}`, 20, y);
      y += 8;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(formatDateBR(decision.created_at), 20, y);
      y += 14;

      // Parameters section
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("PARÂMETROS", 20, y);
      y += 8;

      doc.setFontSize(9);
      const params = [
        ["Moeda", `${flag} ${decision.currency}`],
        ["Perfil", s.profileLabels[s.savedProfile] || s.savedProfile],
        ["Volume", `${sym} ${s.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
        ["Taxa no momento", s.rate.toFixed(4)],
        ["Taxa Treend estimada", s.savedTreendRate.toFixed(4)],
        ["Zona", decision.zone || "—"],
        ["Spread bancário", `${s.savedSpread.toFixed(1)}%`],
        ["Operações", `${s.savedOps} / ${s.freqLabels[s.savedFreq] || s.savedFreq}`],
        ["Projeção", `${s.savedProjMonths} meses`],
      ];
      params.forEach(([label, value]) => {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text(String(label), 20, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(String(value), 100, y);
        y += 7;
      });

      y += 6;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("RESULTADO DA SIMULAÇÃO", 20, y);
      y += 8;

      doc.setFontSize(9);
      const results = [
        ["Volume em BRL", `R$ ${s.curBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ["Volume com Treend", `R$ ${s.trdBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ["Diferença de taxa", `${s.rateDiff.toFixed(4)} (${s.rateDiffPct.toFixed(2)}%)`],
        ["Custo do spread", `-R$ ${s.spreadCost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ];
      results.forEach(([label, value]) => {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text(String(label), 20, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(String(value), 100, y);
        y += 7;
      });

      // Economy highlight
      y += 6;
      const isPos = s.savings >= 0;
      doc.setFillColor(isPos ? 240 : 254, isPos ? 253 : 242, isPos ? 244 : 242);
      doc.roundedRect(20, y - 4, 170, 16, 4, 4, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(isPos ? 22 : 153, isPos ? 101 : 27, isPos ? 52 : 27);
      doc.text(isPos ? "Economia estimada" : "Custo adicional estimado", 25, y + 5);
      doc.text(`${isPos ? "+" : ""}${sym} ${s.savings.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 185, y + 5, { align: "right" });

      // Projections
      y += 24;
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("PROJEÇÕES", 20, y);
      y += 8;
      doc.setFontSize(9);
      [
        { label: "6 meses", value: s.savings * 6 },
        { label: "12 meses", value: s.savings * 12 },
        { label: "24 meses", value: s.savings * 24 },
      ].forEach((proj) => {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text(proj.label, 20, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(proj.value >= 0 ? 22 : 153, proj.value >= 0 ? 101 : 27, proj.value >= 0 ? 52 : 27);
        doc.text(`${sym} ${Math.abs(proj.value).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 100, y);
        y += 7;
      });

      // Footer
      y += 10;
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(148, 163, 184);
      doc.text("Esta simulação é meramente ilustrativa. A decisão final é de responsabilidade do usuário.", 105, y, { align: "center" });

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

            return (
              <div className="space-y-5">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <span className="text-xl">{flag}</span>
                    Simulação — {d.currency}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">{formatDateBR(d.created_at)}</p>
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
                {/* Action buttons */}
                <div className="flex gap-2 pt-2 border-t border-border/30">
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