import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, GripVertical, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Tutorial {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
  sort_order: number;
  admin_id: string;
}

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
};

const AdminTutorials = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", youtube_url: "", sort_order: "0" });

  const { data: tutorials = [], isLoading } = useQuery({
    queryKey: ["admin-tutorials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tutorials")
        .select("*")
        .order("sort_order", { ascending: true });
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

  const resetForm = () => {
    setForm({ title: "", description: "", youtube_url: "", sort_order: "0" });
    setEditingId(null);
    setDialogOpen(false);
  };

  const openEdit = (t: Tutorial) => {
    setForm({
      title: t.title,
      description: t.description || "",
      youtube_url: t.youtube_url,
      sort_order: String(t.sort_order),
    });
    setEditingId(t.id);
    setDialogOpen(true);
  };

  const isValid = form.title.trim().length > 0 && extractYouTubeId(form.youtube_url) !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Tutoriais</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os vídeos tutoriais da plataforma</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); setDialogOpen(v); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Tutorial
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">{editingId ? "Editar Tutorial" : "Novo Tutorial"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Como usar o Dashboard" maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label>URL do YouTube *</Label>
                <Input value={form.youtube_url} onChange={(e) => setForm((f) => ({ ...f, youtube_url: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." />
                {form.youtube_url && !extractYouTubeId(form.youtube_url) && (
                  <p className="text-xs text-destructive">URL do YouTube inválida</p>
                )}
                {extractYouTubeId(form.youtube_url) && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted mt-2">
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYouTubeId(form.youtube_url)}`}
                      title="Preview"
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Breve descrição do vídeo..." maxLength={500} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Ordem de exibição</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} min="0" />
              </div>
              <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!isValid || saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : editingId ? "Salvar alterações" : "Adicionar tutorial"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="bg-card border-border animate-pulse">
              <CardContent className="h-20" />
            </Card>
          ))}
        </div>
      ) : tutorials.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Video className="h-10 w-10 mx-auto mb-3 opacity-50" />
            Nenhum tutorial cadastrado ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tutorials.map((t) => {
            const ytId = extractYouTubeId(t.youtube_url);
            const thumb = t.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null);
            return (
              <Card key={t.id} className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
                  {thumb && (
                    <img src={thumb} alt={t.title} className="w-24 h-14 rounded object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-foreground truncate">{t.title}</p>
                    {t.description && <p className="text-xs text-muted-foreground truncate">{t.description}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">Ordem: {t.sort_order}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminTutorials;
