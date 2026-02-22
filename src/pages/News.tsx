import { useState, useEffect } from "react";
import { ExternalLink, Newspaper, RefreshCw, Search, DollarSign, Euro, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  currency: "USD" | "EUR" | "general";
}

type CurrencyFilter = "all" | "USD" | "EUR" | "general";

const filters: { value: CurrencyFilter; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "Tudo", icon: Globe },
  { value: "USD", label: "Dólar", icon: DollarSign },
  { value: "EUR", label: "Euro", icon: Euro },
];

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return "";
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

const NewsPage = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>("all");

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("fetch-news");
      if (fnError) throw fnError;
      setNews(data?.news || []);
    } catch (e: any) {
      setError("Não foi possível carregar as notícias. Tente novamente.");
      console.error("fetch-news error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filtered = news
    .filter((n) => currencyFilter === "all" || n.currency === currencyFilter)
    .filter((n) =>
      !searchQuery.trim() ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.source.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleNewsClick = (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
    if (!link || link.includes("news.google.com/rss/articles")) {
      e.preventDefault();
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Notícias</h1>
        <p className="text-sm text-muted-foreground">
          Feed em tempo real de câmbio, dólar e euro
        </p>
      </div>

      {/* Currency Filters */}
      <div className="flex items-center gap-2 justify-center">
        {filters.map((f) => {
          const Icon = f.icon;
          const active = currencyFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setCurrencyFilter(f.value)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Search + Refresh */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notícias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-secondary/50 border-border text-sm rounded-xl"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-10 px-3 rounded-xl border-border"
          onClick={fetchNews}
          disabled={loading}
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Loading skeletons */}
      {loading && news.length === 0 && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="kpi-card p-4 space-y-2">
              <div className="h-4 w-3/4 rounded-md bg-muted animate-pulse" />
              <div className="h-3 w-1/3 rounded-md bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="kpi-card bg-destructive/5 border-destructive/20 p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button size="sm" variant="outline" className="mt-2" onClick={fetchNews}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Nenhuma notícia encontrada.
        </div>
      )}

      {/* News Feed */}
      <div className="space-y-2">
        {filtered.map((item, idx) => (
          <a
            key={idx}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => handleNewsClick(e, item.link)}
            className="kpi-card group flex items-start gap-3 p-4 cursor-pointer"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary mt-0.5">
              {item.currency === "USD" ? (
                <DollarSign className="h-4 w-4" />
              ) : item.currency === "EUR" ? (
                <Euro className="h-4 w-4" />
              ) : (
                <Newspaper className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                {item.title}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="truncate max-w-[160px]">{item.source}</span>
                {item.pubDate && (
                  <>
                    <span>·</span>
                    <span>{timeAgo(item.pubDate)}</span>
                  </>
                )}
              </div>
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 group-hover:text-primary mt-1 transition-colors" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default NewsPage;