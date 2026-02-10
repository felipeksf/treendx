import { useState, useEffect } from "react";
import { ExternalLink, Newspaper, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

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
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filtered = searchQuery.trim()
    ? news.filter((n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.source.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : news;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Notícias</h1>
        <p className="text-sm text-muted-foreground">
          Feed em tempo real de câmbio, dólar e euro
        </p>
      </div>

      {/* Search + Refresh */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notícias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/50 border-border/40 text-sm"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-9 px-3"
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
            <div key={i} className="rounded-2xl bg-card border border-border/40 p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button size="sm" variant="outline" className="mt-2" onClick={fetchNews}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* News Feed */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Nenhuma notícia encontrada.
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((item, idx) => (
          <a
            key={idx}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 rounded-2xl bg-card border border-border/40 p-4 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary mt-0.5">
              <Newspaper className="h-4 w-4" />
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
