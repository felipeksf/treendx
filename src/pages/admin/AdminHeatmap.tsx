import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, X, Send, HelpCircle, CalendarDays } from "lucide-react";
import { useHeatmapScores, useHeatmapHistory, usePublishHeatmap, useToggleAccurate } from "@/hooks/useHeatmap";
import HeatmapEditor from "@/components/HeatmapEditor";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Currency = "USD" | "EUR" | "GBP";
type Frequency = "weekly" | "biweekly" | "monthly";

const PROFILES = [
  { key: "importador", label: "Importador" },
  { key: "exportador", label: "Exportador" },
  { key: "agente_turismo", label: "Agente de Turismo" },
  { key: "freelancer", label: "Freelancer" },
];

const CURRENCY_OPTIONS: { value: Currency; label: string; flag: string }[] = [
  { value: "USD", label: "USD - Dólar", flag: "🇺🇸" },
  { value: "EUR", label: "EUR - Euro", flag: "🇪🇺" },
  { value: "GBP", label: "GBP - Libra", flag: "🇬🇧" },
];

const FREQUENCY_OPTIONS: { value: Frequency; label: string; publishLabel: string }[] = [
  { value: "weekly", label: "1x na semana", publishLabel: "Publicar (1x na semana)" },
  { value: "biweekly", label: "2x no mês", publishLabel: "Publicar (2x ao mês)" },
  { value: "monthly", label: "1x ao mês", publishLabel: "Publicar (1x ao mês)" },
];

const AdminHeatmap = () => {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const { toast } = useToast();

  const { data: scores } = useHeatmapScores(currency, frequency);
  const { data: history } = useHeatmapHistory();
  const publishMutation = usePublishHeatmap();
  const toggleAccurateMutation = useToggleAccurate();

  // Local editable state for each profile's heatmap
  const [localValues, setLocalValues] = useState<Record<string, { x: number; y: number }>>({});
  const [histDateFrom, setHistDateFrom] = useState("");
  const [histDateTo, setHistDateTo] = useState("");

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    let result = history;
    if (histDateFrom) {
      result = result.filter((h) => h.published_at.slice(0, 10) >= histDateFrom);
    }
    if (histDateTo) {
      result = result.filter((h) => h.published_at.slice(0, 10) <= histDateTo);
    }
    return result;
  }, [history, histDateFrom, histDateTo]);

  const getValues = (profileKey: string) => {
    const local = localValues[`${profileKey}-${currency}-${frequency}`];
    if (local) return local;
    const score = scores?.find((s) => s.profile_type === profileKey);
    return { x: score?.heat_x ?? 50, y: score?.heat_y ?? 50 };
  };

  const setValues = (profileKey: string, x: number, y: number) => {
    setLocalValues((prev) => {
      const next = {
        ...prev,
        [`${profileKey}-${currency}-${frequency}`]: { x, y },
      };
      // Mirror: importador ↔ agente_turismo, exportador ↔ freelancer
      if (profileKey === "importador") {
        next[`agente_turismo-${currency}-${frequency}`] = { x, y };
      } else if (profileKey === "agente_turismo") {
        next[`importador-${currency}-${frequency}`] = { x, y };
      } else if (profileKey === "exportador") {
        next[`freelancer-${currency}-${frequency}`] = { x, y };
      } else if (profileKey === "freelancer") {
        next[`exportador-${currency}-${frequency}`] = { x, y };
      }
      return next;
    });
  };

  const handlePublish = async (profileKey: string) => {
    const vals = getValues(profileKey);
    try {
      await publishMutation.mutateAsync({
        profileType: profileKey,
        currency,
        frequency,
        heatX: vals.x,
        heatY: vals.y,
      });
      // Clear local state for this combo
      setLocalValues((prev) => {
        const next = { ...prev };
        delete next[`${profileKey}-${currency}-${frequency}`];
        return next;
      });
      toast({ title: "Heatmap publicado com sucesso!" });
    } catch {
      toast({ title: "Erro ao publicar", variant: "destructive" });
    }
  };

  const currentFreqOption = FREQUENCY_OPTIONS.find((f) => f.value === frequency)!;

  const handleToggleAccurate = async (id: string, current: boolean | null) => {
    const next = current === true ? null : true;
    await toggleAccurateMutation.mutateAsync({ id, isAccurate: next });
  };

  const profileLabels: Record<string, string> = {
    importador: "Importador",
    exportador: "Exportador",
    agente_turismo: "Agente de Turismo",
    freelancer: "Freelancer",
  };

  const frequencyLabels: Record<string, string> = {
    weekly: "1x na semana",
    biweekly: "2x no mês",
    monthly: "1x ao mês",
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Heatmap</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Gerencie os indicadores visuais de cada perfil
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-2 italic">
          Importante: não fazemos nenhum tipo de recomendação cambial/financeira. As informações exibidas são meramente indicativas e a decisão final é de total responsabilidade do usuário. A Treend atualiza as informações do Mapa de Calor de acordo com identificações no mercado.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-card border border-border/40 p-4">
        <div className="min-w-[170px]">
          <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
            <SelectTrigger className="h-9 text-xs bg-muted/40 border-border/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {CURRENCY_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  <span className="flex items-center gap-2">
                    <span className="text-base">{c.flag}</span>
                    <span>{c.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5 min-w-[180px]">
          <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
            <SelectTrigger className="h-9 text-xs bg-muted/40 border-border/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {FREQUENCY_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground/60 cursor-help shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[240px] text-xs">
                Selecione a sazonalidade para editar o heatmap correspondente.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* 4 Editor Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROFILES.map((profile) => {
          const vals = getValues(profile.key);
          const score = scores?.find((s) => s.profile_type === profile.key);
          const lastUpdated = score?.published_at
            ? new Date(score.published_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : null;

          return (
            <div
              key={profile.key}
              className="rounded-2xl bg-card border border-border/40 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">{profile.label}</h3>
                  {lastUpdated && (
                    <p className="text-[10px] text-muted-foreground">
                      Última publicação: {lastUpdated}
                    </p>
                  )}
                </div>
              </div>

              <HeatmapEditor
                heatX={vals.x}
                heatY={vals.y}
                onChange={(x, y) => setValues(profile.key, x, y)}
              />

              <Button
                onClick={() => handlePublish(profile.key)}
                disabled={publishMutation.isPending}
                className="w-full gap-2"
              >
                <Send className="h-4 w-4" />
                {currentFreqOption.publishLabel}
              </Button>
            </div>
          );
        })}
      </div>

      {/* History */}
      {history && history.length > 0 && (
        <div className="rounded-2xl bg-card border border-border/40 p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground">Histórico de Atualizações</h3>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><CalendarDays className="h-3 w-3" /> De</Label>
              <Input type="date" value={histDateFrom} onChange={(e) => setHistDateFrom(e.target.value)} className="h-9 w-36 text-xs bg-secondary/50 border-border rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Até</Label>
              <Input type="date" value={histDateTo} onChange={(e) => setHistDateTo(e.target.value)} className="h-9 w-36 text-xs bg-secondary/50 border-border rounded-xl" />
            </div>
            <span className="text-[11px] text-muted-foreground pb-2">{filteredHistory.length} registro(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground">
                  <th className="text-left py-2 px-2 font-medium">Data</th>
                  <th className="text-left py-2 px-2 font-medium">Horário</th>
                  <th className="text-left py-2 px-2 font-medium">Moeda</th>
                  <th className="text-left py-2 px-2 font-medium">Perfil</th>
                  <th className="text-left py-2 px-2 font-medium">Tempo</th>
                  <th className="text-center py-2 px-2 font-medium">Acertou?</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => {
                  const date = new Date(item.published_at);
                  return (
                    <tr key={item.id} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-2 tabular-nums">
                        {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </td>
                      <td className="py-2 px-2 tabular-nums">
                        {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-2 px-2 font-medium">
                        {CURRENCY_OPTIONS.find((c) => c.value === item.currency)?.flag}{" "}
                        {item.currency}
                      </td>
                      <td className="py-2 px-2">{profileLabels[item.profile_type] ?? item.profile_type}</td>
                      <td className="py-2 px-2">{frequencyLabels[item.frequency] ?? item.frequency}</td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => handleToggleAccurate(item.id, item.is_accurate)}
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                            item.is_accurate === true
                              ? "bg-treend-success/20 text-treend-success"
                              : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                          }`}
                        >
                          {item.is_accurate === true ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHeatmap;
