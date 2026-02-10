import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, BarChart3, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const zones = ["Muito Barato", "Barato", "Neutro", "Caro", "Muito Caro"];

const mockHistory = [
  { date: "2026-02-09", scoreUSD: 35, scoreEUR: 62, zoneUSD: "Barato", zoneEUR: "Caro", rateUSD: 5.12, rateEUR: 5.58 },
  { date: "2026-02-08", scoreUSD: 28, scoreEUR: 55, zoneUSD: "Barato", zoneEUR: "Neutro", rateUSD: 5.08, rateEUR: 5.52 },
  { date: "2026-02-07", scoreUSD: 42, scoreEUR: 48, zoneUSD: "Neutro", zoneEUR: "Neutro", rateUSD: 5.18, rateEUR: 5.50 },
];

const mockUsers = [
  { name: "João Silva", email: "joao@email.com", status: "trial" },
  { name: "Maria Santos", email: "maria@email.com", status: "ativo" },
  { name: "Pedro Costa", email: "pedro@email.com", status: "expirado" },
  { name: "Ana Souza", email: "ana@email.com", status: "trial" },
];

const AdminPage = () => {
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

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      trial: "bg-primary/10 text-primary border-primary/20",
      ativo: "bg-treend-success/10 text-treend-success border-treend-success/20",
      expirado: "bg-treend-danger/10 text-treend-danger border-treend-danger/20",
    };
    return map[status] || "";
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        Painel Admin
      </h1>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4 text-center">
            <Users className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-display font-bold text-foreground">{mockUsers.length}</p>
            <p className="text-xs text-muted-foreground">Total de usuários</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4 text-center">
            <BarChart3 className="h-5 w-5 text-treend-success mx-auto mb-1" />
            <p className="text-2xl font-display font-bold text-foreground">
              {mockUsers.filter((u) => u.status !== "expirado").length}
            </p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4 text-center">
            <BarChart3 className="h-5 w-5 text-treend-warning mx-auto mb-1" />
            <p className="text-2xl font-display font-bold text-foreground">
              {mockUsers.filter((u) => u.status === "trial").length}
            </p>
            <p className="text-xs text-muted-foreground">Em trial</p>
          </CardContent>
        </Card>
      </div>

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
                <Input type="number" min="1" max="100" value={scoreUSD} onChange={(e) => setScoreUSD(e.target.value)} placeholder="35" />
              </div>
              <div className="space-y-2">
                <Label>Score EUR (1-100)</Label>
                <Input type="number" min="1" max="100" value={scoreEUR} onChange={(e) => setScoreEUR(e.target.value)} placeholder="62" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Zona USD</Label>
                <Select value={zoneUSD} onValueChange={setZoneUSD}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {zones.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zona EUR</Label>
                <Select value={zoneEUR} onValueChange={setZoneEUR}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {zones.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cotação USD/BRL</Label>
                <Input type="number" step="0.01" value={rateUSD} onChange={(e) => setRateUSD(e.target.value)} placeholder="5.12" />
              </div>
              <div className="space-y-2">
                <Label>Cotação EUR/BRL</Label>
                <Input type="number" step="0.01" value={rateEUR} onChange={(e) => setRateEUR(e.target.value)} placeholder="5.58" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comentário do dia</Label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Análise do mercado cambial de hoje..." rows={3} />
            </div>
            <Button type="submit">
              <Send className="mr-2 h-4 w-4" />
              Publicar dados do dia
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Input History */}
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

      {/* Users */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-display">Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockUsers.map((u) => (
                  <TableRow key={u.email}>
                    <TableCell className="text-sm">{u.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadge(u.status)}>
                        {u.status}
                      </Badge>
                    </TableCell>
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

export default AdminPage;
