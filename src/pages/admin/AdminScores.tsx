import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" />
        Scores & Cotações
      </h1>

      {/* Daily Input Form */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-display">Dados do dia</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Score USD (1-100)</Label>
                <Input type="number" min="1" max="100" value={scoreUSD} onChange={(e) => setScoreUSD(e.target.value)} placeholder="35" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Score EUR (1-100)</Label>
                <Input type="number" min="1" max="100" value={scoreEUR} onChange={(e) => setScoreEUR(e.target.value)} placeholder="62" className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Zona USD</Label>
                <Select value={zoneUSD} onValueChange={setZoneUSD}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {zones.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zona EUR</Label>
                <Select value={zoneEUR} onValueChange={setZoneEUR}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {zones.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cotação USD/BRL</Label>
                <Input type="number" step="0.01" value={rateUSD} onChange={(e) => setRateUSD(e.target.value)} placeholder="5.12" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Cotação EUR/BRL</Label>
                <Input type="number" step="0.01" value={rateEUR} onChange={(e) => setRateEUR(e.target.value)} placeholder="5.58" className="bg-secondary border-border" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comentário do dia</Label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Análise do mercado cambial de hoje..." rows={3} className="bg-secondary border-border" />
            </div>
            <Button type="submit">
              <Send className="mr-2 h-4 w-4" />
              Publicar dados do dia
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-display">Histórico de inputs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>USD</TableHead>
                  <TableHead>EUR</TableHead>
                  <TableHead>Cotação USD</TableHead>
                  <TableHead>Cotação EUR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockHistory.map((h) => (
                  <TableRow key={h.date}>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminScores;
