import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePublishHeatmap } from "@/hooks/useHeatmap";
import HeatmapEditor from "@/components/HeatmapEditor";
import { Upload, Loader2, Eye, Send, ImageIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Currency = "USD" | "EUR" | "GBP";
type ProfileType = "importador" | "exportador" | "agente_turismo" | "freelancer";
type Frequency = "weekly" | "biweekly" | "monthly";

const CURRENCY_OPTIONS: { value: Currency; label: string; flag: string }[] = [
  { value: "USD", label: "Dólar", flag: "🇺🇸" },
  { value: "EUR", label: "Euro", flag: "🇪🇺" },
  { value: "GBP", label: "Libra", flag: "🇬🇧" },
];

const PROFILE_OPTIONS: { value: ProfileType; label: string }[] = [
  { value: "importador", label: "Importador" },
  { value: "exportador", label: "Exportador" },
  { value: "agente_turismo", label: "Agente de Turismo" },
  { value: "freelancer", label: "Freelancer" },
];

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "1x por semana" },
  { value: "biweekly", label: "2x por mês" },
  { value: "monthly", label: "1x por mês" },
];

interface RsiAnalysis {
  rsi_value: number;
  rsi_zone: "oversold" | "neutral" | "overbought";
  currency_pair: string;
  confidence: "high" | "medium" | "low";
  analysis_summary: string;
  suggested_score: number;
}

// Map RSI to heatmap position based on profile rules
function mapRsiToHeatmap(
  rsi: number,
  rsiZone: string,
  profile: ProfileType,
  frequency: Frequency
): { x: number; y: number } {
  const isImportadorGroup = profile === "importador" || profile === "agente_turismo";

  let x: number;
  let y: number;

  if (isImportadorGroup) {
    // Importador/Agente: sobrevenda (RSI baixo) é FAVORÁVEL → zona verde (x alto, y baixo)
    // RSI 0 → x=100 (extremo verde), RSI 100 → x=0 (extremo vermelho)
    x = 100 - rsi;

    // Y axis: quanto mais em sobrevenda, mais alto (y baixo = topo = verde)
    if (rsi <= 30) {
      // Sobrevenda forte: y entre 5-15 (topo verde), mais baixo = mais verde
      y = 5 + (rsi / 30) * 10; // RSI 0→y=5, RSI 30→y=15
    } else if (rsi <= 45) {
      // Transição sobrevenda→neutro
      y = 15 + ((rsi - 30) / 15) * 25; // RSI 30→y=15, RSI 45→y=40
    } else if (rsi <= 55) {
      // Neutro
      y = 40 + ((rsi - 45) / 10) * 20; // RSI 45→y=40, RSI 55→y=60
    } else if (rsi <= 70) {
      // Transição neutro→sobrecompra (ruim para importador)
      y = 60 + ((rsi - 55) / 15) * 20; // RSI 55→y=60, RSI 70→y=80
    } else {
      // Sobrecompra: zona vermelha (y alto = fundo)
      y = 80 + ((rsi - 70) / 30) * 15; // RSI 70→y=80, RSI 100→y=95
    }
  } else {
    // Exportador/Freelancer: sobrecompra (RSI alto) é FAVORÁVEL → zona verde (x alto, y baixo)
    // RSI 100 → x=100 (extremo verde), RSI 0 → x=0 (extremo vermelho)
    x = rsi;

    // Y axis: quanto mais em sobrecompra, mais alto (y baixo = topo = verde)
    if (rsi >= 70) {
      // Sobrecompra forte: y entre 5-15 (topo verde)
      y = 5 + ((100 - rsi) / 30) * 10; // RSI 100→y=5, RSI 70→y=15
    } else if (rsi >= 55) {
      // Transição sobrecompra→neutro
      y = 15 + ((70 - rsi) / 15) * 25; // RSI 70→y=15, RSI 55→y=40
    } else if (rsi >= 45) {
      // Neutro
      y = 40 + ((55 - rsi) / 10) * 20; // RSI 55→y=40, RSI 45→y=60
    } else if (rsi >= 30) {
      // Transição neutro→sobrevenda (ruim para exportador)
      y = 60 + ((45 - rsi) / 15) * 20; // RSI 45→y=60, RSI 30→y=80
    } else {
      // Sobrevenda: zona vermelha (y alto = fundo)
      y = 80 + ((30 - rsi) / 30) * 15; // RSI 30→y=80, RSI 0→y=95
    }
  }

  x = Math.max(0, Math.min(100, x));
  y = Math.max(0, Math.min(100, y));

  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

function getTimeframeLabel(profile: ProfileType, frequency: Frequency): string {
  const isImportadorGroup = profile === "importador" || profile === "agente_turismo";
  if (frequency === "monthly") return "1 hora";
  return isImportadorGroup ? "30 minutos" : "15 minutos";
}

function getRsiZoneLabel(zone: string): string {
  switch (zone) {
    case "oversold": return "Sobrevenda";
    case "overbought": return "Sobrecompra";
    default: return "Neutro";
  }
}

function getRsiZoneColor(zone: string): string {
  switch (zone) {
    case "oversold": return "text-emerald-500";
    case "overbought": return "text-red-500";
    default: return "text-yellow-500";
  }
}

const AdminAnalise = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const publishMutation = usePublishHeatmap();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currency, setCurrency] = useState<Currency>("USD");
  const [profile, setProfile] = useState<ProfileType>("importador");
  const [frequency, setFrequency] = useState<Frequency>("weekly");

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<RsiAnalysis | null>(null);

  const [heatX, setHeatX] = useState(50);
  const [heatY, setHeatY] = useState(50);
  const [publishing, setPublishing] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setAnalysis(null);
    try {
      const sanitizedName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `analysis/${Date.now()}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("chart-uploads")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("chart-uploads")
        .getPublicUrl(filePath);

      setImageUrl(urlData.publicUrl);
      toast({ title: "Imagem enviada com sucesso" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!imageUrl) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-chart", {
        body: { imageUrl },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAnalysis(data);

      // Auto-map RSI to heatmap
      const { x, y } = mapRsiToHeatmap(data.rsi_value, data.rsi_zone, profile, frequency);
      setHeatX(x);
      setHeatY(y);

      toast({ title: "Análise concluída", description: `RSI: ${data.rsi_value} — ${getRsiZoneLabel(data.rsi_zone)}` });
    } catch (err: any) {
      toast({ title: "Erro na análise", description: err.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePublish = async () => {
    if (!user) return;
    setPublishing(true);

    // Publish for the selected profile
    const profilesToPublish: ProfileType[] = [profile];

    // Mirror logic: importador ↔ agente_turismo, exportador ↔ freelancer
    if (profile === "importador") profilesToPublish.push("agente_turismo");
    else if (profile === "agente_turismo") profilesToPublish.push("importador");
    else if (profile === "exportador") profilesToPublish.push("freelancer");
    else if (profile === "freelancer") profilesToPublish.push("exportador");

    try {
      for (const p of profilesToPublish) {
        // Mirror: same profile gets same values, mirrored profile gets inverted
        const isMirror = p !== profile;
        const finalX = isMirror ? (100 - heatX) : heatX;
        const finalY = isMirror ? (100 - heatY) : heatY;

        await publishMutation.mutateAsync({
          profileType: p,
          currency,
          frequency,
          heatX: finalX,
          heatY: finalY,
        });
      }
      toast({ title: "Heatmap publicado!", description: `${profilesToPublish.join(" + ")} atualizado(s)` });
    } catch (err: any) {
      toast({ title: "Erro ao publicar", description: err.message, variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  const selectedCurrency = CURRENCY_OPTIONS.find(c => c.value === currency);
  const selectedProfile = PROFILE_OPTIONS.find(p => p.value === profile);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Análise</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload de gráfico, análise OCR do RSI e publicação no heatmap
        </p>
      </div>

      {/* Dropdowns */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Configuração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Currency */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Moeda</label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {CURRENCY_OPTIONS.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{c.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Profile */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Perfil</label>
              <Select value={profile} onValueChange={(v) => setProfile(v as ProfileType)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {PROFILE_OPTIONS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Frequency */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Sazonalidade</label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {FREQUENCY_OPTIONS.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>
              Timeframe: <strong>{getTimeframeLabel(profile, frequency)}</strong> — 
              {profile === "importador" || profile === "agente_turismo"
                ? " Sobrevenda → zona verde"
                : " Sobrecompra → zona verde"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Upload */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Upload do Gráfico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Enviando...</span>
              </div>
            ) : imageUrl ? (
              <div className="space-y-3">
                <img src={imageUrl} alt="Gráfico" className="max-h-48 mx-auto rounded-lg" />
                <p className="text-xs text-muted-foreground">Clique para trocar a imagem</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="h-8 w-8 text-muted-foreground/60" />
                <span className="text-sm text-muted-foreground">Clique ou arraste para enviar</span>
              </div>
            )}
          </div>

          {imageUrl && (
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full gap-2"
            >
              {analyzing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analisando...</>
              ) : (
                <><Eye className="h-4 w-4" /> Analisar com OCR</>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Analysis Result */}
      {analysis && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Resultado da Análise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">RSI</p>
                <p className="text-lg font-bold">{analysis.rsi_value}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Zona</p>
                <p className={`text-lg font-bold ${getRsiZoneColor(analysis.rsi_zone)}`}>
                  {getRsiZoneLabel(analysis.rsi_zone)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Par</p>
                <p className="text-sm font-medium">{analysis.currency_pair}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Confiança</p>
                <Badge variant={analysis.confidence === "high" ? "default" : "secondary"}>
                  {analysis.confidence}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{analysis.analysis_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Heatmap Preview + Publish */}
      {analysis && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Pré-visualização do Heatmap — {selectedProfile?.label} ({selectedCurrency?.flag} {selectedCurrency?.label})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <HeatmapEditor
              heatX={heatX}
              heatY={heatY}
              onChange={(x, y) => { setHeatX(x); setHeatY(y); }}
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>X: {heatX.toFixed(1)} | Y: {heatY.toFixed(1)}</span>
              <span>
                Espelhado: {profile === "importador" ? "Agente de Turismo" : 
                  profile === "agente_turismo" ? "Importador" :
                  profile === "exportador" ? "Freelancer" : "Exportador"}
              </span>
            </div>

            <Button
              onClick={handlePublish}
              disabled={publishing}
              className="w-full gap-2"
              size="lg"
            >
              {publishing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Publicando...</>
              ) : (
                <><Send className="h-4 w-4" /> Publicar Heatmap</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminAnalise;
