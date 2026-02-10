import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Send } from "lucide-react";

const zones = ["Muito Barato", "Barato", "Neutro", "Caro", "Muito Caro"];

const mockHistory = [
  { date: "2026-02-09", scoreUSD: 35, scoreEUR: 62, zoneUSD: "Barato", zoneEUR: "Caro", rateUSD: 5.12, rateEUR: 5.58 },
  { date: "2026-02-08", scoreUSD: 28, scoreEUR: 55, zoneUSD: "Barato", zoneEUR: "Neutro", rateUSD: 5.08, rateEUR: 5.52 },
  { date: "2026-02-07", scoreUSD: 42, scoreEUR: 48, zoneUSD: "Neutro", zoneEUR: "Neutro", rateUSD: 5.18, rateEUR: 5.50 },
];

const AdminScores = () => {
  const [scoreUSD, setScoreUSD] = useState("");
  const [scoreEUR, setScoreEUR] = useState("");
  const [zoneUSD, setZoneUSD] = useState("");
  const [zoneEUR, setZoneEUR] = useState("");
  const [rateUSD, setRateUSD] = useState("");
  const [rateEUR, setRateEUR] = useState("");
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Dados do dia salvos!", description: "Os scores e cotações foram atualizados." });
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Scores & Cotações
        </h1>
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
