import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Send, Upload, ImageIcon, Loader2, Brain, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const zones = ["Muito Barato", "Barato", "Neutro", "Caro", "Muito Caro"];

const mockHistory = [
  { date: "2026-02-09", scoreUSD: 35, scoreEUR: 62, zoneUSD: "Barato", zoneEUR: "Caro", rateUSD: 5.12, rateEUR: 5.58 },
  { date: "2026-02-08", scoreUSD: 28, scoreEUR: 55, zoneUSD: "Barato", zoneEUR: "Neutro", rateUSD: 5.08, rateEUR: 5.52 },
  { date: "2026-02-07", scoreUSD: 42, scoreEUR: 48, zoneUSD: "Neutro", zoneEUR: "Neutro", rateUSD: 5.18, rateEUR: 5.50 },
];

type RsiAnalysis = {
  rsi_value: number;
  rsi_zone: "oversold" | "neutral" | "overbought";
  currency_pair: string;
  confidence: "high" | "medium" | "low";
  analysis_summary: string;
  suggested_score: number;
};

const AdminScores = () => {
  const [scoreUSD, setScoreUSD] = useState("");
  const [scoreEUR, setScoreEUR] = useState("");
  const [zoneUSD, setZoneUSD] = useState("");
  const [zoneEUR, setZoneEUR] = useState("");
  const [rateUSD, setRateUSD] = useState("");
  const [rateEUR, setRateEUR] = useState("");
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RsiAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem.", variant: "destructive" });
      return;
    }

    setUploading(true);
    setAnalysis(null);

    try {
      const sanitizedName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `${Date.now()}-${sanitizedName}`;
      const { data, error } = await supabase.storage
        .from("chart-uploads")
        .upload(fileName, file, { contentType: file.type });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("chart-uploads")
        .getPublicUrl(data.path);

      setUploadedImageUrl(urlData.publicUrl);
      toast({ title: "Upload concluído!", description: "Imagem enviada. Clique em 'Analisar com IA' para processar." });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ title: "Erro no upload", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedImageUrl) return;

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-chart", {
        body: { imageUrl: uploadedImageUrl },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnalysis(data as RsiAnalysis);
      toast({ title: "Análise concluída!", description: `RSI: ${data.rsi_value} - ${data.rsi_zone}` });
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast({ title: "Erro na análise", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const applyAnalysisToScore = () => {
    if (!analysis) return;

    const pair = analysis.currency_pair.toUpperCase();
    if (pair.includes("USD")) {
      setScoreUSD(String(analysis.suggested_score));
      const zone = analysis.rsi_zone === "oversold" ? "Barato" : analysis.rsi_zone === "overbought" ? "Caro" : "Neutro";
      setZoneUSD(zone);
    }
    if (pair.includes("EUR")) {
      setScoreEUR(String(analysis.suggested_score));
      const zone = analysis.rsi_zone === "oversold" ? "Barato" : analysis.rsi_zone === "overbought" ? "Caro" : "Neutro";
      setZoneEUR(zone);
    }

    toast({ title: "Score aplicado!", description: "Os valores da análise foram preenchidos nos campos." });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const today = new Date().toISOString().split("T")[0];

      // Check if there's already a score for today
      const { data: existing } = await supabase
        .from("daily_scores")
        .select("id")
        .eq("score_date", today)
        .maybeSingle();

      const scoreData = {
        admin_id: user.id,
        score_date: today,
        usd_score: scoreUSD ? parseInt(scoreUSD) : null,
        eur_score: scoreEUR ? parseInt(scoreEUR) : null,
        zone_usd: zoneUSD || null,
        zone_eur: zoneEUR || null,
        rate_usd: rateUSD ? parseFloat(rateUSD) : null,
        rate_eur: rateEUR ? parseFloat(rateEUR) : null,
        comment_buy: comment || null,
      };

      let error;
      if (existing) {
        ({ error } = await supabase
          .from("daily_scores")
          .update(scoreData)
          .eq("id", existing.id));
      } else {
        ({ error } = await supabase
          .from("daily_scores")
          .insert(scoreData));
      }

      if (error) throw error;

      toast({ title: "Dados do dia salvos!", description: "Os scores e cotações foram atualizados no banco de dados." });
    } catch (err: any) {
      console.error("Save error:", err);
      toast({ title: "Erro ao salvar", description: err.message || "Tente novamente.", variant: "destructive" });
    }
  };

  const getRsiZoneLabel = (zone: string) => {
    switch (zone) {
      case "oversold": return "Sobrevendido (RSI < 30)";
      case "overbought": return "Sobrecomprado (RSI > 70)";
      default: return "Neutro (30 ≤ RSI ≤ 70)";
    }
  };

  const getRsiZoneColor = (zone: string) => {
    switch (zone) {
      case "oversold": return "text-emerald-500";
      case "overbought": return "text-red-500";
      default: return "text-yellow-500";
    }
  };

  const getRsiIcon = (zone: string) => {
    switch (zone) {
      case "oversold": return <TrendingDown className="h-4 w-4 text-emerald-500" />;
      case "overbought": return <TrendingUp className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getScoreInterpretation = (zone: string) => {
    if (zone === "oversold") {
      return "RSI abaixo de 30 → Zona interessante para Importadores (câmbio barato). Score baixo = bom para compra.";
    }
    if (zone === "overbought") {
      return "RSI acima de 70 → Zona interessante para Exportadores (câmbio caro). Score alto = bom para venda.";
    }
    return "RSI neutro → Sem sinal claro de oportunidade.";
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Scores & Cotações
        </h1>
      </div>

      {/* Chart Upload & AI Analysis */}
      <div className="rounded-2xl bg-card border border-border/40 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Análise de Gráfico com IA</span>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Enviando...</>
              ) : (
                <><Upload className="mr-1.5 h-3.5 w-3.5" /> Upload TradingView</>
              )}
            </Button>

            {uploadedImageUrl && (
              <Button
                type="button"
                size="sm"
                className="h-9 text-xs"
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                {analyzing ? (
                  <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Analisando...</>
                ) : (
                  <><Brain className="mr-1.5 h-3.5 w-3.5" /> Analisar com IA</>
                )}
              </Button>
            )}
          </div>

          {uploadedImageUrl && (
            <div className="rounded-xl border border-border/40 overflow-hidden bg-muted/20">
              <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Imagem enviada</span>
              </div>
              <img
                src={uploadedImageUrl}
                alt="TradingView Chart"
                className="w-full max-h-64 object-contain"
              />
            </div>
          )}

          {analysis && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Resultado da Análise</span>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-lg bg-background/60 p-3 space-y-1">
                  <span className="text-xs text-muted-foreground">RSI</span>
                  <div className="flex items-center gap-2">
                    {getRsiIcon(analysis.rsi_zone)}
                    <span className={`text-lg font-bold ${getRsiZoneColor(analysis.rsi_zone)}`}>
                      {analysis.rsi_value.toFixed(1)}
                    </span>
                  </div>
                  <span className={`text-xs ${getRsiZoneColor(analysis.rsi_zone)}`}>
                    {getRsiZoneLabel(analysis.rsi_zone)}
                  </span>
                </div>

                <div className="rounded-lg bg-background/60 p-3 space-y-1">
                  <span className="text-xs text-muted-foreground">Par</span>
                  <p className="text-sm font-semibold text-foreground">{analysis.currency_pair}</p>
                  <span className="text-xs text-muted-foreground">Confiança: {analysis.confidence}</span>
                </div>

                <div className="rounded-lg bg-background/60 p-3 space-y-1">
                  <span className="text-xs text-muted-foreground">Score sugerido</span>
                  <p className="text-lg font-bold text-primary">{analysis.suggested_score}</p>
                  <span className="text-xs text-muted-foreground">1-100</span>
                </div>
              </div>

              <div className="rounded-lg bg-background/60 p-3 space-y-1">
                <span className="text-xs text-muted-foreground">Interpretação</span>
                <p className="text-xs text-foreground">{getScoreInterpretation(analysis.rsi_zone)}</p>
              </div>

              <p className="text-xs text-muted-foreground">{analysis.analysis_summary}</p>

              <Button type="button" size="sm" className="h-8 text-xs" onClick={applyAnalysisToScore}>
                Aplicar score nos campos abaixo
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl bg-card border border-border/40 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
            <Send className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Dados do dia</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Score USD (1-100)</Label>
              <Input type="number" min="1" max="100" value={scoreUSD} onChange={(e) => setScoreUSD(e.target.value)} placeholder="35" className="h-9 text-sm bg-muted/40 border-border/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Score EUR (1-100)</Label>
              <Input type="number" min="1" max="100" value={scoreEUR} onChange={(e) => setScoreEUR(e.target.value)} placeholder="62" className="h-9 text-sm bg-muted/40 border-border/40" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Zona USD</Label>
              <Select value={zoneUSD} onValueChange={setZoneUSD}>
                <SelectTrigger className="h-9 text-sm bg-muted/40 border-border/40"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{zones.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Zona EUR</Label>
              <Select value={zoneEUR} onValueChange={setZoneEUR}>
                <SelectTrigger className="h-9 text-sm bg-muted/40 border-border/40"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{zones.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Cotação USD/BRL</Label>
              <Input type="number" step="0.01" value={rateUSD} onChange={(e) => setRateUSD(e.target.value)} placeholder="5.12" className="h-9 text-sm bg-muted/40 border-border/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cotação EUR/BRL</Label>
              <Input type="number" step="0.01" value={rateEUR} onChange={(e) => setRateEUR(e.target.value)} placeholder="5.58" className="h-9 text-sm bg-muted/40 border-border/40" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Comentário do dia</Label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Análise do mercado cambial de hoje..." rows={3} className="text-sm bg-muted/40 border-border/40" />
          </div>
          <Button type="submit" size="sm" className="h-8 text-xs">
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Publicar dados do dia
          </Button>
        </form>
      </div>

      {/* History */}
      <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/40">
          <span className="text-sm font-semibold text-foreground">Histórico de inputs</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40">
                <TableHead className="text-xs">Data</TableHead>
                <TableHead className="text-xs">USD</TableHead>
                <TableHead className="text-xs">EUR</TableHead>
                <TableHead className="text-xs">Cotação USD</TableHead>
                <TableHead className="text-xs">Cotação EUR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockHistory.map((h) => (
                <TableRow key={h.date} className="border-border/40">
                  <TableCell className="text-sm">{h.date}</TableCell>
                  <TableCell className="text-sm">{h.scoreUSD} ({h.zoneUSD})</TableCell>
                  <TableCell className="text-sm">{h.scoreEUR} ({h.zoneEUR})</TableCell>
                  <TableCell className="text-sm">{h.rateUSD.toFixed(2)}</TableCell>
                  <TableCell className="text-sm">{h.rateEUR.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminScores;
