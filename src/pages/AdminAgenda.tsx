import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Plus, Pencil, Trash2, CalendarDays, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type AgendaEvent = Tables<"agenda_events">;

const categoryOptions = [
  { value: "relatorio", label: "Report Semanal no Feed" },
  { value: "macroeconomico", label: "Evento Macroeconômico" },
];

const categoryColors: Record<string, string> = {
  mentoria: "bg-primary/15 text-primary",
  relatorio: "bg-treend-success/15 text-treend-success",
  macroeconomico: "bg-treend-warning/15 text-treend-warning",
};

const AdminAgenda = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("agenda_events")
      .select("*")
      .order("event_date", { ascending: false });
    if (error) console.error(error);
    else setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDate(undefined);
    setTime("");
    setCategory("");
    setDescription("");
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!title || !date || !time || !category || !user) {
      toast({ title: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const eventDate = format(date, "yyyy-MM-dd");

    if (editingId) {
      const { error } = await supabase
        .from("agenda_events")
        .update({
          title,
          event_date: eventDate,
          event_time: time,
          category: category as AgendaEvent["category"],
          description,
        })
        .eq("id", editingId);
      setSubmitting(false);
      if (error) {
        toast({ title: "Erro ao atualizar.", variant: "destructive" });
      } else {
        toast({ title: "Evento atualizado com sucesso!" });
        resetForm();
        fetchEvents();
      }
    } else {
      const { error } = await supabase.from("agenda_events").insert({
        title,
        event_date: eventDate,
        event_time: time,
        category: category as AgendaEvent["category"],
        description,
        admin_id: user.id,
      });
      setSubmitting(false);
      if (error) {
        toast({ title: "Erro ao criar evento.", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Evento criado com sucesso!" });
        resetForm();
        fetchEvents();
      }
    }
  };

  const handleEdit = (event: AgendaEvent) => {
    setEditingId(event.id);
    setTitle(event.title);
    setDate(new Date(event.event_date + "T00:00:00"));
    setTime(event.event_time);
    setCategory(event.category);
    setDescription(event.description || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("agenda_events").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover.", variant: "destructive" });
    } else {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Evento removido com sucesso!" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Gestão da Agenda
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Crie e gerencie eventos da plataforma Treend.</p>
      </div>

      {/* Form */}
      <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
            <Plus className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">{editingId ? "Editar Evento" : "Novo Evento"}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do evento" className="h-9 text-sm bg-muted/40 border-border/40" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-sm bg-muted/40 border-border/40"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Data *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-sm bg-muted/40 border-border/40", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {date ? format(date, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} locale={ptBR} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Horário *</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-9 text-sm bg-muted/40 border-border/40" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Descrição</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição do evento..." className="text-sm bg-muted/40 border-border/40 min-h-[70px]" />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSubmit} size="sm" disabled={submitting} className="h-8 text-xs">
            {submitting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
            {editingId ? "Salvar Alterações" : "Criar Evento"}
          </Button>
          {editingId && <Button variant="outline" size="sm" onClick={resetForm} className="h-8 text-xs">Cancelar</Button>}
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/40">
          <span className="text-sm font-semibold text-foreground">Eventos Cadastrados</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 text-sm">Nenhum evento cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="text-xs">Título</TableHead>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Horário</TableHead>
                  <TableHead className="text-xs">Categoria</TableHead>
                  <TableHead className="text-right text-xs">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => {
                  const catLabel = categoryOptions.find((c) => c.value === event.category)?.label || event.category;
                  return (
                    <TableRow key={event.id} className="border-border/40">
                      <TableCell className="text-sm font-medium text-foreground">{event.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(event.event_date + "T00:00:00"), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{event.event_time}</TableCell>
                      <TableCell>
                        <span className={cn("text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md", categoryColors[event.category] || "")}>
                          {catLabel}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleEdit(event)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(event.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAgenda;
