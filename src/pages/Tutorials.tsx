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
  youtube_url: string | null;
  video_url: string | null;
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

  const renderPlayer = (tutorial: Tutorial) => {
    if (tutorial.video_url) {
      return (
        <video
          src={tutorial.video_url}
          controls
          autoPlay
          className="w-full h-full"
        />
      );
    }
    if (tutorial.youtube_url) {
      const ytId = extractYouTubeId(tutorial.youtube_url);
      if (ytId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
            title={tutorial.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        );
      }
    }
    return null;
  };

  const getThumbnail = (tutorial: Tutorial) => {
    if (tutorial.thumbnail_url) return tutorial.thumbnail_url;
    if (tutorial.youtube_url) {
      const ytId = extractYouTubeId(tutorial.youtube_url);
      if (ytId) return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Tutoriais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Aprenda a usar a plataforma com nossos vídeos</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar tutorial..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 text-sm bg-secondary/50 border-border rounded-xl" />
        </div>
      </div>

      {/* Selected video player */}
      {selectedVideo && (
        <div className="kpi-card overflow-hidden">
          <div className="aspect-video w-full bg-black">
            {renderPlayer(selectedVideo)}
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
            <div key={i} className="kpi-card animate-pulse">
              <div className="aspect-video bg-muted rounded-t-2xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="kpi-card py-12 text-center text-sm text-muted-foreground">
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
                  const thumb = getThumbnail(tutorial);
                  const isUpload = !!tutorial.video_url;
                  return (
                    <div key={tutorial.id} className="kpi-card cursor-pointer group overflow-hidden" onClick={() => setSelectedVideo(tutorial)}>
                      <div className="relative aspect-video bg-muted overflow-hidden">
                        {thumb ? (
                          <img src={thumb} alt={tutorial.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : isUpload ? (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Play className="h-12 w-12 text-muted-foreground/50" />
                          </div>
                        ) : null}
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
