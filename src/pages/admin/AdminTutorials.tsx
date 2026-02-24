import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, GripVertical, Video, Copy, Upload, Youtube, FileVideo } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  youtube_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  admin_id: string;
  category: TutorialCategory;
}

type VideoSource = "youtube" | "upload";

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
};

const getCategoryLabel = (val: string) => CATEGORIES.find((c) => c.value === val)?.label ?? val;

const sanitizeFileName = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");

// Sortable tutorial row component
const SortableTutorialRow = ({
  tutorial,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  tutorial: Tutorial;
  onEdit: (t: Tutorial) => void;
  onDuplicate: (t: Tutorial) => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tutorial.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const isUpload = !!tutorial.video_url;
  const ytId = tutorial.youtube_url ? extractYouTubeId(tutorial.youtube_url) : null;
  const thumb = tutorial.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null);

  return (
    <div ref={setNodeRef} style={style} className="rounded-2xl bg-card border border-border/40 p-4 flex items-center gap-4">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-0.5 touch-none">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>
      {thumb ? (
        <img src={thumb} alt={tutorial.title} className="w-20 h-12 rounded-lg object-cover shrink-0" loading="lazy" />
      ) : isUpload ? (
        <div className="w-20 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <FileVideo className="h-5 w-5 text-muted-foreground" />
        </div>
      ) : null}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground truncate">{tutorial.title}</p>
          {isUpload ? (
            <Badge variant="outline" className="text-[9px] h-4 shrink-0"><Upload className="h-2.5 w-2.5 mr-0.5" />Upload</Badge>
          ) : (
            <Badge variant="outline" className="text-[9px] h-4 shrink-0"><Youtube className="h-2.5 w-2.5 mr-0.5" />YouTube</Badge>
          )}
        </div>
        {tutorial.description && <p className="text-[11px] text-muted-foreground truncate">{tutorial.description}</p>}
        <p className="text-[11px] text-muted-foreground mt-0.5">Ordem: {tutorial.sort_order}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onEdit(tutorial)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={() => onDuplicate(tutorial)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Duplicar">
          <Copy className="h-4 w-4" />
        </button>
        <button onClick={() => onDelete(tutorial.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const AdminTutorials = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [videoSource, setVideoSource] = useState<VideoSource>("upload");
  const [form, setForm] = useState({ title: "", description: "", youtube_url: "", sort_order: "0", category: "introducao" as TutorialCategory });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { data: tutorials = [], isLoading } = useQuery({
    queryKey: ["admin-tutorials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tutorials").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Tutorial[];
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      // Update all sort_orders in parallel
      const promises = updates.map(({ id, sort_order }) =>
        supabase.from("tutorials").update({ sort_order }).eq("id", id)
      );
      const results = await Promise.all(promises);
      const error = results.find((r) => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tutorials"] });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao reordenar", description: err.message, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["admin-tutorials"] });
    },
  });

  const handleDragEnd = (categoryValue: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const categoryTutorials = tutorials.filter((t) => t.category === categoryValue);
    const oldIndex = categoryTutorials.findIndex((t) => t.id === active.id);
    const newIndex = categoryTutorials.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(categoryTutorials, oldIndex, newIndex);
    const updates = reordered.map((t, i) => ({ id: t.id, sort_order: i }));

    // Optimistic update
    queryClient.setQueryData(["admin-tutorials"], (old: Tutorial[] | undefined) => {
      if (!old) return old;
      const otherTutorials = old.filter((t) => t.category !== categoryValue);
      const updatedCategory = reordered.map((t, i) => ({ ...t, sort_order: i }));
      return [...otherTutorials, ...updatedCategory].sort((a, b) => a.sort_order - b.sort_order);
    });

    reorderMutation.mutate(updates);
  };

  const uploadVideo = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "mp4";
    const safeName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ""));
    const path = `${Date.now()}_${safeName}.${ext}`;

    setIsUploading(true);
    setUploadProgress(10);

    const { error } = await supabase.storage
      .from("tutorial-videos")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    setUploadProgress(90);

    const { data: urlData } = supabase.storage.from("tutorial-videos").getPublicUrl(path);
    setUploadProgress(100);
    setIsUploading(false);

    return urlData.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      let videoUrl: string | null = existingVideoUrl;
      let youtubeUrl: string | null = null;
      let thumbnailUrl: string | null = null;

      if (videoSource === "upload") {
        if (videoFile) {
          videoUrl = await uploadVideo(videoFile);
        }
        if (!videoUrl) throw new Error("Selecione um arquivo de vídeo");
      } else {
        youtubeUrl = form.youtube_url.trim();
        const ytId = extractYouTubeId(youtubeUrl);
        if (!ytId) throw new Error("URL do YouTube inválida");
        thumbnailUrl = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
        videoUrl = null;
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        youtube_url: youtubeUrl,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
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
      setIsUploading(false);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Also delete video file from storage if exists
      const tutorial = tutorials.find((t) => t.id === id);
      if (tutorial?.video_url) {
        const path = tutorial.video_url.split("/tutorial-videos/")[1];
        if (path) {
          await supabase.storage.from("tutorial-videos").remove([path]);
        }
      }
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
        video_url: t.video_url,
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
    setVideoFile(null);
    setExistingVideoUrl(null);
    setVideoSource("upload");
    setUploadProgress(0);
    setIsUploading(false);
  };

  const openEdit = (t: Tutorial) => {
    const source: VideoSource = t.video_url ? "upload" : "youtube";
    setForm({ title: t.title, description: t.description || "", youtube_url: t.youtube_url || "", sort_order: String(t.sort_order), category: t.category || "introducao" });
    setEditingId(t.id);
    setVideoSource(source);
    setExistingVideoUrl(t.video_url || null);
    setVideoFile(null);
    setDialogOpen(true);
  };

  const isValid = form.title.trim().length > 0 && (
    videoSource === "upload"
      ? !!(videoFile || existingVideoUrl)
      : extractYouTubeId(form.youtube_url) !== null
  );

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

              {/* Video source toggle */}
              <div className="space-y-1.5">
                <Label className="text-xs">Fonte do vídeo *</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={videoSource === "upload" ? "default" : "outline"}
                    className="flex-1 h-9 text-xs"
                    onClick={() => setVideoSource("upload")}
                  >
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    Upload direto
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={videoSource === "youtube" ? "default" : "outline"}
                    className="flex-1 h-9 text-xs"
                    onClick={() => setVideoSource("youtube")}
                  >
                    <Youtube className="mr-1.5 h-3.5 w-3.5" />
                    YouTube
                  </Button>
                </div>
              </div>

              {videoSource === "upload" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs">Arquivo de vídeo *</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 200 * 1024 * 1024) {
                          toast({ title: "Arquivo muito grande", description: "O limite é 200MB por vídeo.", variant: "destructive" });
                          return;
                        }
                        setVideoFile(file);
                        setExistingVideoUrl(null);
                      }
                    }}
                  />
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {videoFile ? (
                      <div className="space-y-1">
                        <FileVideo className="h-8 w-8 mx-auto text-primary" />
                        <p className="text-sm font-medium text-foreground">{videoFile.name}</p>
                        <p className="text-[11px] text-muted-foreground">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    ) : existingVideoUrl ? (
                      <div className="space-y-1">
                        <FileVideo className="h-8 w-8 mx-auto text-primary" />
                        <p className="text-sm font-medium text-foreground">Vídeo já enviado</p>
                        <p className="text-[11px] text-muted-foreground">Clique para substituir</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Clique para selecionar um vídeo</p>
                        <p className="text-[11px] text-muted-foreground">MP4, MOV, WEBM • Máx. 200MB</p>
                      </div>
                    )}
                  </div>
                  {isUploading && (
                    <div className="space-y-1">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-[11px] text-muted-foreground text-center">Enviando vídeo... {uploadProgress}%</p>
                    </div>
                  )}
                  {(videoFile || existingVideoUrl) && (
                    <div className="aspect-video rounded-xl overflow-hidden bg-muted mt-2">
                      <video
                        src={videoFile ? URL.createObjectURL(videoFile) : existingVideoUrl!}
                        controls
                        className="w-full h-full"
                      />
                    </div>
                  )}
                </div>
              ) : (
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
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Breve descrição do vídeo..." maxLength={500} rows={3} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ordem de exibição</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} min="0" className="h-9 text-sm" />
                <p className="text-[11px] text-muted-foreground">Menor número = aparece primeiro dentro da categoria</p>
              </div>
              <Button className="w-full" size="sm" onClick={() => saveMutation.mutate()} disabled={!isValid || saveMutation.isPending || isUploading}>
                {isUploading ? "Enviando vídeo..." : saveMutation.isPending ? "Salvando..." : editingId ? "Salvar alterações" : "Adicionar tutorial"}
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(group.value, event)}
              >
                <SortableContext items={group.tutorials.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {group.tutorials.map((t) => (
                      <SortableTutorialRow
                        key={t.id}
                        tutorial={t}
                        onEdit={openEdit}
                        onDuplicate={(tutorial) => duplicateMutation.mutate(tutorial)}
                        onDelete={(id) => deleteMutation.mutate(id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTutorials;
