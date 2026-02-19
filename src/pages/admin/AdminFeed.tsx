import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Trash2, BadgeCheck, Loader2, ImagePlus, X, Mail, MailCheck, Clock, Pencil, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type FeedPost = Tables<"feed_posts">;

const AdminFeed = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newText, setNewText] = useState("");
  const [currency, setCurrency] = useState<"USD" | "EUR" | "general">("USD");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const compressImage = async (file: File, maxSizeKB = 100): Promise<File> => {
    if (file.size <= maxSizeKB * 1024) return file;

    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Scale down proportionally
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.7;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (blob && (blob.size <= maxSizeKB * 1024 || quality <= 0.1)) {
                resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
              } else {
                quality -= 0.1;
                tryCompress();
              }
            },
            "image/jpeg",
            quality
          );
        };
        tryCompress();
      };
      img.src = url;
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Selecione apenas imagens.", variant: "destructive" });
      return;
    }
    const compressed = await compressImage(file);
    setImageFile(compressed);
    setImagePreview(URL.createObjectURL(compressed));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("feed_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePost = async () => {
    if (!newText.trim() || !user) return;
    setSubmitting(true);

    let imageUrl: string | null = null;

    if (imageFile) {
      const sanitizedName = imageFile.name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${Date.now()}_${sanitizedName}`;
      const { error: uploadError } = await supabase.storage
        .from("feed-images")
        .upload(filePath, imageFile);
      if (uploadError) {
        toast({ title: "Erro ao enviar imagem.", description: uploadError.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }
      const { data: publicData } = supabase.storage.from("feed-images").getPublicUrl(filePath);
      imageUrl = publicData.publicUrl;
    }

    const postBody = newText.trim();
    const { data: insertedData, error } = await supabase.from("feed_posts").insert({
      body: postBody,
      currency,
      admin_id: user.id,
      image_url: imageUrl,
    }).select().single();
    
    if (error) {
      setSubmitting(false);
      toast({ title: "Erro ao publicar.", description: error.message, variant: "destructive" });
      return;
    }

    // Enviar e-mail imediatamente
    try {
      const { data: emailResult, error: emailError } = await supabase.functions.invoke("send-weekly-report", {
        body: {
          post_id: insertedData.id,
          body: postBody,
          image_url: imageUrl,
          created_at: insertedData.created_at,
        },
      });

      if (emailError) {
        console.error("Erro ao enviar e-mail:", emailError);
        toast({ title: "Post publicado, mas erro ao enviar e-mail.", description: String(emailError.message || emailError), variant: "destructive" });
      } else {
        // Marcar como enviado
        await supabase.from("feed_posts").update({ report_email_sent: true } as any).eq("id", insertedData.id);
        console.log("E-mail enviado:", emailResult);
        toast({ title: "Publicação criada e e-mail enviado!" });
      }
    } catch (err) {
      console.error("Erro ao disparar e-mail:", err);
      toast({ title: "Post publicado, mas falha ao enviar e-mail.", variant: "destructive" });
    }

    setSubmitting(false);
    setNewText("");
    clearImage();
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("feed_posts").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover.", variant: "destructive" });
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Publicação removida." });
    }
  };

  const startEdit = (post: FeedPost) => {
    setEditingId(post.id);
    setEditText(post.body);
    setEditImageFile(null);
    setEditImagePreview(post.image_url || null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditImageFile(null);
    setEditImagePreview(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const handleEditImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Selecione apenas imagens.", variant: "destructive" });
      return;
    }
    const compressed = await compressImage(file);
    setEditImageFile(compressed);
    setEditImagePreview(URL.createObjectURL(compressed));
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    setSaving(true);

    let imageUrl: string | null = editImagePreview;

    // If a new image was selected, upload it
    if (editImageFile) {
      const sanitizedName = editImageFile.name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${Date.now()}_${sanitizedName}`;
      const { error: uploadError } = await supabase.storage
        .from("feed-images")
        .upload(filePath, editImageFile);
      if (uploadError) {
        toast({ title: "Erro ao enviar imagem.", description: uploadError.message, variant: "destructive" });
        setSaving(false);
        return;
      }
      const { data: publicData } = supabase.storage.from("feed-images").getPublicUrl(filePath);
      imageUrl = publicData.publicUrl;
    }

    const { error } = await supabase
      .from("feed_posts")
      .update({ body: editText.trim(), image_url: imageUrl })
      .eq("id", editingId);

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar.", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Publicação editada com sucesso!" });
      cancelEdit();
      fetchPosts();
    }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Gestão do Feed
        </h1>
      </div>

      {/* Composer */}
      <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">TA</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">Treend Admin</span>
            <BadgeCheck className="h-4 w-4 text-primary" />
          </div>
        </div>
        <Textarea
          placeholder="Escreva uma análise para o feed..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="resize-none bg-muted/40 border-border/40 min-h-[100px] text-sm"
        />

        {/* Image preview */}
        {imagePreview && (
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg border border-border/40 object-cover" />
            <button
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5 border-border/40"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-3.5 w-3.5" />
              Imagem
            </Button>
            <div className="flex items-center gap-2">
              <Label className="text-[11px] text-muted-foreground">Moeda:</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as "USD" | "EUR" | "general")}>
                <SelectTrigger className="h-7 w-20 text-xs bg-muted/40 border-border/40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">Dólar</SelectItem>
                  <SelectItem value="EUR">Euro</SelectItem>
                  <SelectItem value="general">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button size="sm" onClick={handlePost} disabled={!newText.trim() || submitting} className="gap-1.5 h-8 text-xs">
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Publicar
          </Button>
        </div>
      </div>

      {/* Posts */}
      <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/40">
          <span className="text-sm font-semibold text-foreground">Publicações anteriores</span>
        </div>
        <div className="divide-y divide-border/30">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">Nenhuma publicação.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="p-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {post.currency === "general" ? "Geral" : post.currency}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  {(post as FeedPost & { report_email_sent?: boolean }).report_email_sent ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-md">
                      <MailCheck className="h-3 w-3" />
                      E-mail enviado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                      <Clock className="h-3 w-3" />
                      Aguardando envio
                    </span>
                  )}
                </div>

                {editingId === post.id ? (
                  <div className="space-y-3 mt-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="resize-none bg-muted/40 border-border/40 min-h-[80px] text-sm"
                    />
                    {editImagePreview && (
                      <div className="relative inline-block">
                        <img src={editImagePreview} alt="Preview" className="max-h-32 rounded-lg border border-border/40 object-cover" />
                        <button
                          onClick={() => { setEditImageFile(null); setEditImagePreview(null); }}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageSelect}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5 border-border/40"
                        onClick={() => editFileInputRef.current?.click()}
                      >
                        <ImagePlus className="h-3.5 w-3.5" />
                        Imagem
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit} disabled={!editText.trim() || saving} className="h-7 text-xs gap-1.5">
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 text-xs">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 mt-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/85 line-clamp-2">{post.body}</p>
                      {post.image_url && (
                        <img src={post.image_url} alt="Post" className="mt-2 max-h-32 rounded-lg border border-border/40 object-cover" />
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {!(post as FeedPost & { report_email_sent?: boolean }).report_email_sent && (
                        <button
                          onClick={() => startEdit(post)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Editar publicação"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(post.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFeed;
