import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Trash2, BadgeCheck, Loader2, ImagePlus, X, MailCheck, Clock, Pencil, Check, ThermometerSun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import HeatmapBlock from "@/components/HeatmapBlock";

type FeedPost = Tables<"feed_posts">;

const HEATMAP_CURRENCIES = [
  { value: "USD", label: "Dólar", flag: "🇺🇸" },
  { value: "EUR", label: "Euro", flag: "🇪🇺" },
  { value: "GBP", label: "Libra", flag: "🇬🇧" },
];

const HEATMAP_PROFILES = [
  { value: "importador", label: "Importador" },
  { value: "exportador", label: "Exportador" },
  { value: "agente_turismo", label: "Agente de Turismo" },
  { value: "freelancer", label: "Freelancer" },
];

const HEATMAP_FREQUENCIES = [
  { value: "weekly", label: "Semanal" },
  { value: "biweekly", label: "Quinzenal" },
  { value: "monthly", label: "Mensal" },
];

const getHeatColor = (x: number, y: number): string => {
  const favorability = (x + y) / 2;
  if (favorability >= 75) return "hsl(142, 71%, 45%)";
  if (favorability >= 50) return "hsl(80, 80%, 45%)";
  if (favorability >= 35) return "hsl(48, 96%, 53%)";
  if (favorability >= 20) return "hsl(25, 95%, 53%)";
  return "hsl(0, 84%, 55%)";
};

function generateHeatmapImage(
  heatX: number,
  heatY: number,
  profileLabel: string,
  currencyLabel: string,
  frequencyLabel: string,
  updatedAt: string
): Promise<File> {
  return new Promise((resolve) => {
    const W = 600;
    const H = 400;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, W, H);

    // Heatmap area
    const mapX = 20, mapY = 60, mapW = W - 40, mapH = H - 120;

    // Gradient
    const gradH = ctx.createLinearGradient(mapX, 0, mapX + mapW, 0);
    gradH.addColorStop(0, "hsla(0, 84%, 55%, 0.85)");
    gradH.addColorStop(0.25, "hsla(25, 95%, 53%, 0.75)");
    gradH.addColorStop(0.5, "hsla(48, 96%, 53%, 0.75)");
    gradH.addColorStop(0.75, "hsla(80, 80%, 45%, 0.75)");
    gradH.addColorStop(1, "hsla(142, 71%, 45%, 0.85)");
    ctx.fillStyle = gradH;
    ctx.beginPath();
    ctx.roundRect(mapX, mapY, mapW, mapH, 12);
    ctx.fill();

    const gradV = ctx.createLinearGradient(0, mapY, 0, mapY + mapH);
    gradV.addColorStop(0, "hsla(142, 71%, 45%, 0.35)");
    gradV.addColorStop(1, "hsla(0, 84%, 55%, 0.35)");
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = gradV;
    ctx.beginPath();
    ctx.roundRect(mapX, mapY, mapW, mapH, 12);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const gx = mapX + (mapW * i) / 5;
      ctx.beginPath(); ctx.moveTo(gx, mapY); ctx.lineTo(gx, mapY + mapH); ctx.stroke();
    }
    for (let i = 1; i < 4; i++) {
      const gy = mapY + (mapH * i) / 4;
      ctx.beginPath(); ctx.moveTo(mapX, gy); ctx.lineTo(mapX + mapW, gy); ctx.stroke();
    }

    // Dot
    const dotPx = mapX + (heatX / 100) * mapW;
    const dotPy = mapY + (heatY / 100) * mapH;
    const color = getHeatColor(heatX, heatY);

    // Glow
    const glow = ctx.createRadialGradient(dotPx, dotPy, 0, dotPx, dotPy, 40);
    glow.addColorStop(0, color.replace(")", ", 0.5)").replace("hsl", "hsla"));
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(dotPx - 50, dotPy - 50, 100, 100);

    // Dot circle
    ctx.beginPath();
    ctx.arc(dotPx, dotPy, 10, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner highlight
    ctx.beginPath();
    ctx.arc(dotPx, dotPy, 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fill();

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${profileLabel} • ${currencyLabel} • ${frequencyLabel}`, mapX, 35);

    // Subtitle
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`Atualizado: ${updatedAt}`, W - mapX, 35);

    // Legend
    const legendY = H - 30;
    const legends = [
      { color: "hsl(0, 84%, 55%)", text: "Zona de pressão" },
      { color: "hsl(48, 96%, 53%)", text: "Equilíbrio" },
      { color: "hsl(142, 71%, 45%)", text: "Zona interessante" },
    ];
    ctx.textAlign = "left";
    let lx = mapX;
    legends.forEach(({ color: c, text }) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(lx + 5, legendY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillText(text, lx + 14, legendY + 4);
      lx += ctx.measureText(text).width + 34;
    });

    canvas.toBlob(
      (blob) => {
        resolve(new File([blob!], `heatmap-${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  });
}

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

  // Heatmap selectors
  const [hmCurrency, setHmCurrency] = useState<string>("");
  const [hmProfile, setHmProfile] = useState<string>("");
  const [hmFrequency, setHmFrequency] = useState<string>("");
  const [hmData, setHmData] = useState<{ heat_x: number; heat_y: number; published_at: string } | null>(null);
  const [hmLoading, setHmLoading] = useState(false);

  // Fetch heatmap when all 3 selectors are filled
  const fetchHeatmap = useCallback(async (cur: string, prof: string, freq: string) => {
    if (!cur || !prof || !freq) {
      setHmData(null);
      return;
    }
    setHmLoading(true);
    const { data, error } = await supabase
      .from("heatmap_scores")
      .select("heat_x, heat_y, published_at")
      .eq("currency", cur)
      .eq("profile_type", prof)
      .eq("frequency", freq)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Heatmap fetch error:", error);
      setHmData(null);
    } else {
      setHmData(data);
    }
    setHmLoading(false);
  }, []);

  useEffect(() => {
    fetchHeatmap(hmCurrency, hmProfile, hmFrequency);
  }, [hmCurrency, hmProfile, hmFrequency, fetchHeatmap]);

  // Attach heatmap as image
  const attachHeatmap = async () => {
    if (!hmData) return;
    const profLabel = HEATMAP_PROFILES.find(p => p.value === hmProfile)?.label || hmProfile;
    const curLabel = HEATMAP_CURRENCIES.find(c => c.value === hmCurrency)?.label || hmCurrency;
    const freqLabel = HEATMAP_FREQUENCIES.find(f => f.value === hmFrequency)?.label || hmFrequency;
    const updatedAt = new Date(hmData.published_at).toLocaleDateString("pt-BR");

    const file = await generateHeatmapImage(hmData.heat_x, hmData.heat_y, profLabel, curLabel, freqLabel, updatedAt);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    toast({ title: "Heatmap anexado à postagem!" });
  };

  const compressImage = async (file: File, maxSizeKB = 100): Promise<File> => {
    if (file.size <= maxSizeKB * 1024) return file;

    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        let { width, height } = img;
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

  const profileLabel = HEATMAP_PROFILES.find(p => p.value === hmProfile)?.label || "";
  const profileDescription = hmProfile === "importador" ? "Compra moeda estrangeira" :
    hmProfile === "exportador" ? "Vende moeda estrangeira" :
    hmProfile === "agente_turismo" ? "Opera câmbio turismo" :
    hmProfile === "freelancer" ? "Recebe em moeda estrangeira" : "";

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

        {/* Heatmap selectors */}
        <div className="rounded-xl border border-border/40 bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <ThermometerSun className="h-3.5 w-3.5" />
            Anexar Heatmap
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Moeda</Label>
              <Select value={hmCurrency} onValueChange={setHmCurrency}>
                <SelectTrigger className="h-8 text-xs bg-background border-border/50">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {HEATMAP_CURRENCIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">{c.flag} {c.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Perfil</Label>
              <Select value={hmProfile} onValueChange={setHmProfile}>
                <SelectTrigger className="h-8 text-xs bg-background border-border/50">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {HEATMAP_PROFILES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Sazonalidade</Label>
              <Select value={hmFrequency} onValueChange={setHmFrequency}>
                <SelectTrigger className="h-8 text-xs bg-background border-border/50">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {HEATMAP_FREQUENCIES.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Heatmap preview */}
          {hmLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {hmData && !hmLoading && (
            <div className="space-y-3">
              <HeatmapBlock
                profileType={hmProfile}
                profileLabel={profileLabel}
                profileDescription={profileDescription}
                heatX={hmData.heat_x}
                heatY={hmData.heat_y}
                updatedAt={new Date(hmData.published_at).toLocaleDateString("pt-BR")}
                compact
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5 w-full border-primary/30 text-primary hover:bg-primary/10"
                onClick={attachHeatmap}
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Anexar este Heatmap à postagem
              </Button>
            </div>
          )}
          {!hmData && !hmLoading && hmCurrency && hmProfile && hmFrequency && (
            <p className="text-xs text-muted-foreground text-center py-2">Nenhum heatmap encontrado para esta combinação.</p>
          )}
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
              <Label className="text-[11px] text-muted-foreground">Moeda post:</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as "USD" | "EUR" | "general")}>
                <SelectTrigger className="h-7 w-20 text-xs bg-muted/40 border-border/40"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
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
                      Enviado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                      <Clock className="h-3 w-3" />
                      Aguardando
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
