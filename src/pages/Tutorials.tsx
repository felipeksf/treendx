import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Play, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const CATEGORIES = [
  { value: "introducao", label: "Introdução" },
  { value: "importadores", label: "Para Importadores" },
  { value: "exportadores", label: "Para Exportadores" },
  { value: "agentes_turismo", label: "Para Agentes de Turismo" },
  { value: "turistas", label: "Para Turistas" },
  { value: "freelancers", label: "Para Freelancers" },
] as const;

interface Tutorial {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
  sort_order: number;
  category: string;
}

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
};

const getCategoryLabel = (val: string) => CATEGORIES.find((c) => c.value === val)?.label ?? val;

const Tutorials = () => {
  const [search, setSearch] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<Tutorial | null>(null);

  const { data: tutorials = [], isLoading } = useQuery({
    queryKey: ["tutorials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tutorials").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Tutorial[];
    },
  });

  const filtered = tutorials.filter(
    (t) => t.title.toLowerCase().includes(search.toLowerCase()) || (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    tutorials: filtered.filter((t) => t.category === cat.value),
  })).filter((g) => g.tutorials.length > 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Tutoriais</h1>
          <p className="text-sm text-muted-foreground mt-1">Aprenda a usar a plataforma com nossos vídeos</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar tutorial..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 text-sm bg-muted/30 border-border/50 rounded-xl" />
        </div>
      </div>

      {/* Selected video player */}
      {selectedVideo && (
        <div className="premium-card overflow-hidden animate-fade-in">
          <div className="aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${extractYouTubeId(selectedVideo.youtube_url)}?autoplay=1`}
              title={selectedVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="secondary" className="text-[10px] h-5">{getCategoryLabel(selectedVideo.category)}</Badge>
            </div>
            <h2 className="text-base font-semibold text-foreground">{selectedVideo.title}</h2>
            {selectedVideo.description && <p className="text-xs text-muted-foreground mt-1">{selectedVideo.description}</p>}
          </div>
        </div>
      )}

      {/* Grouped by category */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="premium-card animate-pulse">
              <div className="aspect-video bg-muted rounded-t-2xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="premium-card py-12 text-center text-sm text-muted-foreground">
          {tutorials.length === 0 ? "Nenhum tutorial disponível ainda." : "Nenhum tutorial encontrado."}
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.value} className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{group.label}</h2>
                <Badge variant="secondary" className="text-[10px] h-5">{group.tutorials.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.tutorials.map((tutorial) => {
                  const ytId = extractYouTubeId(tutorial.youtube_url);
                  const thumb = tutorial.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null);
                  return (
                    <div key={tutorial.id} className="premium-card cursor-pointer group overflow-hidden" onClick={() => setSelectedVideo(tutorial)}>
                      <div className="relative aspect-video bg-muted overflow-hidden">
                        {thumb && <img src={thumb} alt={tutorial.title} className="w-full h-full object-cover" loading="lazy" />}
                        <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Play className="h-10 w-10 text-foreground fill-foreground" />
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2">{tutorial.title}</h3>
                        {tutorial.description && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{tutorial.description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tutorials;