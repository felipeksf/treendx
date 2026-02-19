import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, History, Newspaper, CalendarDays, HelpCircle } from "lucide-react";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { useHeatmapScores } from "@/hooks/useHeatmap";
import HeatmapBlock from "@/components/HeatmapBlock";
import TrialBanner from "@/components/TrialBanner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

const Dashboard = () => {
  const [profileFilter, setProfileFilter] = useState<ProfileFilter>("all");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [frequency, setFrequency] = useState<Frequency>("weekly");

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
          <h1 className="text-xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitoramento de Câmbio 24h por dia
          </p>
        </div>
      </div>

      <TrialBanner daysLeft={5} />

      {/* Top Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Calculadora", desc: "Simular câmbio", icon: Calculator, path: "/calculator" },
          { label: "Histórico", desc: "Decisões passadas", icon: History, path: "/history" },
          { label: "Feed", desc: "Reports Semanais", icon: Newspaper, path: "/news" },
          { label: "Agenda", desc: "Próximos eventos", icon: CalendarDays, path: "/agenda" },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="group relative flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/40 transition-all duration-300"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground tracking-tight">{item.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl border border-primary/30 bg-primary/5 group-hover:bg-primary/10 transition-colors shrink-0">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
          </Link>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 rounded-2xl bg-card border border-border/40 p-4 overflow-hidden">
        {/* Profile filter */}
        <div className="flex-1 min-w-0">
          <Select value={profileFilter} onValueChange={(v) => setProfileFilter(v as ProfileFilter)}>
            <SelectTrigger className="h-9 text-xs bg-muted/40 border-border/40 w-full">
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

        {/* Currency filter */}
        <div className="flex-1 min-w-0">
          <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
            <SelectTrigger className="h-9 text-xs bg-muted/40 border-border/40 w-full">
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

        {/* Frequency filter */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
            <SelectTrigger className="h-9 text-xs bg-muted/40 border-border/40 w-full">
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

        {/* Live rates display - all 3 currencies */}
        <div className="w-full flex flex-wrap justify-center gap-2 mt-2">
          {([
            { rate: liveUsd, flag: "🇺🇸", label: "USD" },
            { rate: liveEur, flag: "🇪🇺", label: "EUR" },
            { rate: liveGbp, flag: "🇬🇧", label: "GBP" },
          ] as const).map(({ rate, flag, label }) => rate && (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all bg-muted/30 border-border/40 hover:bg-primary/10 hover:border-primary/30"
            >
              <span className="text-base">{flag}</span>
              <div>
                <p className="text-xs font-bold text-foreground tabular-nums">
                  R$ {rate.bid.toFixed(4)}
                </p>
                <p className="text-[9px] text-muted-foreground">
                  {new Date(rate.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span className={`text-[11px] font-semibold ${rate.pctChange >= 0 ? "text-treend-danger" : "text-treend-success"}`}>
                {rate.pctChange >= 0 ? "+" : ""}{rate.pctChange.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap Grid - 4 blocks */}
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
