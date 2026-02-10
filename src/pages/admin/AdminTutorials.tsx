import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, GripVertical, Video, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { value: "introducao", label: "Introdução" },
  { value: "importadores", label: "Para Importadores" },
  { value: "exportadores", label: "Para Exportadores" },
  { value: "agentes_turismo", label: "Para Agentes de Turismo" },
  { value: "turistas", label: "Para Turistas" },
  { value: "freelancers", label: "Para Freelancers" },
] as const;

type TutorialCategory = typeof CATEGORIES[number]["value"];

interface Tutorial {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
  sort_order: number;
  admin_id: string;
  category: TutorialCategory;
}

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
};

const getCategoryLabel = (val: string) => CATEGORIES.find((c) => c.value === val)?.label ?? val;

const AdminTutorials = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", youtube_url: "", sort_order: "0", category: "introducao" as TutorialCategory });

  const { data: tutorials = [], isLoading } = useQuery({
    queryKey: ["admin-tutorials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tutorials").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Tutorial[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const ytId = extractYouTubeId(form.youtube_url);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        youtube_url: form.youtube_url.trim(),
        thumbnail_url: ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null,
        sort_order: parseInt(form.sort_order) || 0,
        category: form.category,
        admin_id: user.id,
      };
      if (editingId) {
        const { error } = await supabase.from("tutorials").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tutorials").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tutorials"] });
      toast({ title: editingId ? "Tutorial atualizado!" : "Tutorial adicionado!" });
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tutorials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tutorials"] });
      toast({ title: "Tutorial removido!" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (t: Tutorial) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("tutorials").insert({
        title: `${t.title} (cópia)`,
        description: t.description,
        youtube_url: t.youtube_url,
        thumbnail_url: t.thumbnail_url,
        sort_order: t.sort_order + 1,
        category: t.category,
        admin_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tutorials"] });
      toast({ title: "Tutorial duplicado!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });


  const resetForm = () => {
    setForm({ title: "", description: "", youtube_url: "", sort_order: "0", category: "introducao" });
    setEditingId(null);
    setDialogOpen(false);
  };

  const openEdit = (t: Tutorial) => {
    setForm({ title: t.title, description: t.description || "", youtube_url: t.youtube_url, sort_order: String(t.sort_order), category: t.category || "introducao" });
    setEditingId(t.id);
    setDialogOpen(true);
  };

  const isValid = form.title.trim().length > 0 && extractYouTubeId(form.youtube_url) !== null;

  // Group tutorials by category
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    tutorials: tutorials.filter((t) => t.category === cat.value),
  })).filter((g) => g.tutorials.length > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Tutoriais</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Gerencie os vídeos tutoriais da plataforma</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); setDialogOpen(v); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Novo Tutorial
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Tutorial" : "Novo Tutorial"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria *</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as TutorialCategory }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Título *</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Como usar o Dashboard" className="h-9 text-sm" maxLength={200} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">URL do YouTube *</Label>
                <Input value={form.youtube_url} onChange={(e) => setForm((f) => ({ ...f, youtube_url: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." className="h-9 text-sm" />
                {form.youtube_url && !extractYouTubeId(form.youtube_url) && (
                  <p className="text-xs text-destructive">URL do YouTube inválida</p>
                )}
                {extractYouTubeId(form.youtube_url) && (
                  <div className="aspect-video rounded-xl overflow-hidden bg-muted mt-2">
                    <iframe src={`https://www.youtube.com/embed/${extractYouTubeId(form.youtube_url)}`} title="Preview" className="w-full h-full" allowFullScreen />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Breve descrição do vídeo..." maxLength={500} rows={3} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ordem de exibição</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} min="0" className="h-9 text-sm" />
                <p className="text-[11px] text-muted-foreground">Menor número = aparece primeiro dentro da categoria</p>
              </div>
              <Button className="w-full" size="sm" onClick={() => saveMutation.mutate()} disabled={!isValid || saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : editingId ? "Salvar alterações" : "Adicionar tutorial"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl bg-card border border-border/40 h-20 animate-pulse" />
          ))}
        </div>
      ) : tutorials.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border/40 py-12 text-center text-sm text-muted-foreground">
          <Video className="h-10 w-10 mx-auto mb-3 opacity-50" />
          Nenhum tutorial cadastrado ainda.
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.value} className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">{group.label}</h2>
                <Badge variant="secondary" className="text-[10px] h-5">{group.tutorials.length}</Badge>
              </div>
              <div className="space-y-2">
                {group.tutorials.map((t) => {
                  const ytId = extractYouTubeId(t.youtube_url);
                  const thumb = t.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null);
                  return (
                    <div key={t.id} className="rounded-2xl bg-card border border-border/40 p-4 flex items-center gap-4">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      {thumb && <img src={thumb} alt={t.title} className="w-20 h-12 rounded-lg object-cover shrink-0" loading="lazy" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{t.title}</p>
                        {t.description && <p className="text-[11px] text-muted-foreground truncate">{t.description}</p>}
                        <p className="text-[11px] text-muted-foreground mt-0.5">Ordem: {t.sort_order}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => duplicateMutation.mutate(t)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Duplicar">
                          <Copy className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteMutation.mutate(t.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
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

export default AdminTutorials;
