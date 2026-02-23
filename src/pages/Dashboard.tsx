import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, History, Newspaper, CalendarDays, HelpCircle, TrendingUp, TrendingDown, Activity, ArrowUpRight, Bookmark, BookmarkCheck } from "lucide-react";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { useHeatmapScores } from "@/hooks/useHeatmap";
import HeatmapBlock from "@/components/HeatmapBlock";
import TrialBanner from "@/components/TrialBanner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import QuickConverter from "@/components/QuickConverter";

type ProfileFilter = "all" | "importador" | "exportador" | "agente_turismo" | "freelancer";
type Currency = "USD" | "EUR" | "GBP";
type Frequency = "weekly" | "biweekly" | "monthly";

const PROFILES = [
  {
    key: "importador" as const,
    label: "Importador",
    description: "Para quem importa produtos do exterior e deseja que o dólar/euro/libra estejam o mais barato possível no momento.",
  },
  {
    key: "exportador" as const,
    label: "Exportador",
    description: "Para quem exporta produtos do exterior e deseja fechar câmbio. Aqui nós mapeamos cenários aonde o dólar/euro/libra esteja o mais caro possível no momento.",
  },
  {
    key: "agente_turismo" as const,
    label: "Agente de Turismo",
    description: "Para quem precifica pacotes de viagem e deseja que dólar/euro/libra esteja o mais barato possível no momento.",
  },
  {
    key: "freelancer" as const,
    label: "Freelancer",
    description: "Para quem recebe do exterior e precisa fazer remessa online para o Brasil e precisa que o dólar/euro/libra esteja o mais caro possível.",
  },
];

const CURRENCY_OPTIONS: { value: Currency; label: string; flag: string }[] = [
  { value: "USD", label: "USD - Dólar", flag: "🇺🇸" },
  { value: "EUR", label: "EUR - Euro", flag: "🇪🇺" },
  { value: "GBP", label: "GBP - Libra", flag: "🇬🇧" },
];

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "1x na semana" },
  { value: "biweekly", label: "2x no mês" },
  { value: "monthly", label: "1x ao mês" },
];

const HEATMAP_PREF_KEY = "treend_heatmap_pref";

interface HeatmapPref {
  profileFilter: ProfileFilter;
  currency: Currency;
  frequency: Frequency;
}

const loadPref = (): HeatmapPref | null => {
  try {
    const raw = localStorage.getItem(HEATMAP_PREF_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const Dashboard = () => {
  const saved = loadPref();
  const [profileFilter, setProfileFilter] = useState<ProfileFilter>(saved?.profileFilter ?? "all");
  const [currency, setCurrency] = useState<Currency>(saved?.currency ?? "USD");
  const [frequency, setFrequency] = useState<Frequency>(saved?.frequency ?? "weekly");
  const [hasSavedPref, setHasSavedPref] = useState(!!saved);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const { user, subscription } = useAuth();

  const currentMatchesSaved = useMemo(() => {
    if (!saved) return false;
    return saved.profileFilter === profileFilter && saved.currency === currency && saved.frequency === frequency;
  }, [profileFilter, currency, frequency, saved]);

  const handleSavePref = () => {
    const pref: HeatmapPref = { profileFilter, currency, frequency };
    localStorage.setItem(HEATMAP_PREF_KEY, JSON.stringify(pref));
    setHasSavedPref(true);
  };

  const handleRemovePref = () => {
    localStorage.removeItem(HEATMAP_PREF_KEY);
    setHasSavedPref(false);
  };

  useEffect(() => {
    const fetchTrialDays = async () => {
      if (!user) return;
      if (subscription.subscribed) {
        setTrialDaysLeft(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("trial_expires_at, subscription_status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.trial_expires_at && data.subscription_status === "trial") {
        const expires = new Date(data.trial_expires_at);
        const now = new Date();
        const diff = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setTrialDaysLeft(Math.max(0, diff));
      } else {
        setTrialDaysLeft(null);
      }
    };
    fetchTrialDays();
  }, [user, subscription.subscribed]);

  const { usd: liveUsd, eur: liveEur, gbp: liveGbp, isLoading: ratesLoading } = useExchangeRates();
  const { data: heatmapScores, isLoading: heatmapLoading } = useHeatmapScores(currency, frequency);

  const currentRate = useMemo(() => {
    if (currency === "USD") return liveUsd;
    if (currency === "EUR") return liveEur;
    if (currency === "GBP") return liveGbp;
    return null;
  }, [currency, liveUsd, liveEur, liveGbp]);

  const filteredProfiles = useMemo(() => {
    if (profileFilter === "all") return PROFILES;
    return PROFILES.filter((p) => p.key === profileFilter);
  }, [profileFilter]);

  const getHeatmapData = (profileKey: string) => {
    const score = heatmapScores?.find((s) => s.profile_type === profileKey);
    return {
      heatX: score?.heat_x ?? 50,
      heatY: score?.heat_y ?? 50,
      updatedAt: score?.published_at
        ? new Date(score.published_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
    };
  };

  const currencyFlag = CURRENCY_OPTIONS.find((c) => c.value === currency)?.flag;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitoramento de Câmbio 24h por dia
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Live</span>
        </div>
      </div>

      {trialDaysLeft !== null && trialDaysLeft > 0 && <TrialBanner daysLeft={trialDaysLeft} />}

      {/* Live Rates – KPI stat style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {([
          { rate: liveUsd, flag: "🇺🇸", label: "USD", name: "Dólar" },
          { rate: liveEur, flag: "🇪🇺", label: "EUR", name: "Euro" },
          { rate: liveGbp, flag: "🇬🇧", label: "GBP", name: "Libra" },
        ] as const).map(({ rate, flag, label, name }) => rate && (
          <div key={label} className="kpi-stat p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-muted-foreground font-medium">{name}</p>
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                rate.pctChange >= 0 
                  ? "text-treend-danger bg-treend-danger/10" 
                  : "text-treend-success bg-treend-success/10"
              }`}>
                {rate.pctChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {rate.pctChange >= 0 ? "+" : ""}{rate.pctChange.toFixed(2)}%
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums tracking-tight">
              R$ {rate.bid.toFixed(4)}
            </p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] text-muted-foreground">{label}/BRL</p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(rate.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Converter */}
      <QuickConverter />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Notícias", desc: "Reports Semanais", icon: Newspaper, path: "/news" },
          { label: "Agenda", desc: "Próximos eventos", icon: CalendarDays, path: "/agenda" },
          { label: "Calculadora", desc: "Simular câmbio", icon: Calculator, path: "/calculator" },
          { label: "Histórico", desc: "Decisões passadas", icon: History, path: "/history" },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="kpi-card group flex items-center gap-3 p-4"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/8 group-hover:bg-primary/15 transition-colors shrink-0">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground tracking-tight">{item.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Filters */}
      <div className="kpi-card p-4">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <Select value={profileFilter} onValueChange={(v) => setProfileFilter(v as ProfileFilter)}>
              <SelectTrigger className="h-10 text-sm bg-secondary/50 border-border w-full rounded-xl">
                <SelectValue placeholder="Filtrar por perfil" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="all">Todos os cenários</SelectItem>
                <SelectItem value="importador">Importador</SelectItem>
                <SelectItem value="exportador">Exportador</SelectItem>
                <SelectItem value="agente_turismo">Agente de Turismo</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-0">
            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
              <SelectTrigger className="h-10 text-sm bg-secondary/50 border-border w-full rounded-xl">
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

          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
              <SelectTrigger className="h-10 text-sm bg-secondary/50 border-border w-full rounded-xl">
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
                  Selecione quantas vezes você tem o costume de tomar decisões cambiais.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Save/Remove preference button */}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={hasSavedPref && currentMatchesSaved ? handleRemovePref : handleSavePref}
                  className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl border border-border bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  {hasSavedPref && currentMatchesSaved ? (
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                  ) : (
                    <Bookmark className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {hasSavedPref && currentMatchesSaved ? "Remover preferência salva" : "Salvar como preferência padrão"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className={`grid gap-4 ${filteredProfiles.length === 1 ? "grid-cols-1 max-w-4xl mx-auto" : "grid-cols-1 md:grid-cols-2"}`}>
        {filteredProfiles.map((profile) => {
          const data = getHeatmapData(profile.key);
          const isExpanded = filteredProfiles.length === 1;
          return (
            <HeatmapBlock
              key={profile.key}
              profileType={profile.key}
              profileLabel={profile.label}
              profileDescription={profile.description}
              heatX={data.heatX}
              heatY={data.heatY}
              updatedAt={data.updatedAt}
              expanded={isExpanded}
            />
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground/70 mt-4 italic">
        Importante: não fazemos nenhum tipo de recomendação cambial/financeira. As informações exibidas são meramente indicativas e a decisão final é de total responsabilidade do usuário. A Treend atualiza as informações do Mapa de Calor de acordo com identificações no mercado.
      </p>
    </div>
  );
};

export default Dashboard;