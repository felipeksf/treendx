import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Tag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AgendaEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  category: "mentoria" | "relatorio" | "macroeconomico";
  description: string;
}

const categoryConfig: Record<string, { label: string; className: string }> = {
  mentoria: { label: "Live de Mentoria", className: "bg-primary/20 text-primary border-primary/30" },
  relatorio: { label: "Relatório Semanal", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  macroeconomico: { label: "Evento Macroeconômico", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
};

const mockEvents: AgendaEvent[] = [
  { id: "1", title: "Live: Cenário do Dólar em Fevereiro", date: "2026-02-10", time: "19:00", category: "mentoria", description: "Análise ao vivo do cenário cambial com projeções para importadores e exportadores." },
  { id: "2", title: "Relatório Semanal USD/BRL", date: "2026-02-10", time: "08:00", category: "relatorio", description: "Resumo da semana com principais movimentações e zonas de score." },
  { id: "3", title: "Decisão de Juros – FOMC", date: "2026-02-12", time: "15:00", category: "macroeconomico", description: "Reunião do Federal Reserve com potencial impacto direto nas cotações." },
  { id: "4", title: "Live: Estratégias para Exportadores", date: "2026-02-14", time: "20:00", category: "mentoria", description: "Como usar o Score Treend para identificar momentos ideais de venda." },
  { id: "5", title: "IPCA – Inflação Brasileira", date: "2026-02-12", time: "09:00", category: "macroeconomico", description: "Divulgação do índice de inflação com reflexos no câmbio." },
];

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const eventsForDate = mockEvents.filter((e) => e.date === selectedDateStr);
  const eventDates = mockEvents.map((e) => new Date(e.date + "T12:00:00"));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Agenda de Eventos</h1>
        <p className="text-muted-foreground text-sm mt-1">Confira os próximos eventos, lives e datas macroeconômicas relevantes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
        {/* Calendar */}
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
              modifiers={{ hasEvent: eventDates }}
              modifiersClassNames={{ hasEvent: "border-2 border-primary rounded-md" }}
            />
          </CardContent>
        </Card>

        {/* Events list */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            {selectedDate
              ? format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })
              : "Selecione uma data"}
          </h2>

          {eventsForDate.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-10 text-center text-muted-foreground">
                Nenhum evento para esta data.
              </CardContent>
            </Card>
          ) : (
            eventsForDate.map((event) => {
              const cat = categoryConfig[event.category];
              return (
                <Card key={event.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold text-foreground">{event.title}</CardTitle>
                      <Badge variant="outline" className={cn("shrink-0 text-xs", cat.className)}>
                        <Tag className="h-3 w-3 mr-1" />
                        {cat.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{event.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Agenda;
