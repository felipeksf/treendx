import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Plus, Pencil, Trash2, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AgendaEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  category: string;
  description: string;
}

const categoryOptions = [
  { value: "mentoria", label: "Live de Mentoria" },
  { value: "relatorio", label: "Relatório Semanal" },
  { value: "macroeconomico", label: "Evento Macroeconômico" },
];

const categoryColors: Record<string, string> = {
  mentoria: "bg-primary/20 text-primary border-primary/30",
  relatorio: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  macroeconomico: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const initialEvents: AgendaEvent[] = [
  { id: "1", title: "Live: Cenário do Dólar em Fevereiro", date: new Date("2026-02-10"), time: "19:00", category: "mentoria", description: "Análise ao vivo do cenário cambial." },
  { id: "2", title: "Relatório Semanal USD/BRL", date: new Date("2026-02-10"), time: "08:00", category: "relatorio", description: "Resumo da semana com principais movimentações." },
  { id: "3", title: "Decisão de Juros – FOMC", date: new Date("2026-02-12"), time: "15:00", category: "macroeconomico", description: "Reunião do Federal Reserve." },
];

const AdminAgenda = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<AgendaEvent[]>(initialEvents);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setTitle("");
    setDate(undefined);
    setTime("");
    setCategory("");
    setDescription("");
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!title || !date || !time || !category) {
      toast({ title: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    if (editingId) {
      setEvents((prev) =>
        prev.map((e) => (e.id === editingId ? { ...e, title, date, time, category, description } : e))
      );
      toast({ title: "Evento atualizado com sucesso!" });
    } else {
      const newEvent: AgendaEvent = {
        id: Date.now().toString(),
        title,
        date,
        time,
        category,
        description,
      };
      setEvents((prev) => [newEvent, ...prev]);
      toast({ title: "Evento criado com sucesso!" });
    }
    resetForm();
  };

  const handleEdit = (event: AgendaEvent) => {
    setEditingId(event.id);
    setTitle(event.title);
    setDate(event.date);
    setTime(event.time);
    setCategory(event.category);
    setDescription(event.description);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast({ title: "Evento removido com sucesso!" });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          Gestão da Agenda
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Crie e gerencie eventos da plataforma Treend.</p>
      </div>

      {/* Form */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">{editingId ? "Editar Evento" : "Novo Evento"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do evento" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-secondary border-border", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} locale={ptBR} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Horário *</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="bg-secondary border-border" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição do evento..." className="bg-secondary border-border min-h-[80px]" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-1" />
              {editingId ? "Salvar Alterações" : "Criar Evento"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Eventos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">Nenhum evento cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Título</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => {
                    const catLabel = categoryOptions.find((c) => c.value === event.category)?.label || event.category;
                    return (
                      <TableRow key={event.id} className="border-border">
                        <TableCell className="font-medium text-foreground">{event.title}</TableCell>
                        <TableCell className="text-muted-foreground">{format(event.date, "dd/MM/yyyy")}</TableCell>
                        <TableCell className="text-muted-foreground">{event.time}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs", categoryColors[event.category] || "")}>
                            {catLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                              <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)}>
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAgenda;
