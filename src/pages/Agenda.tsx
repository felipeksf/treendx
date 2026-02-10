import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, Tag } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  addWeeks,
  subWeeks,
  isToday,
} from "date-fns";
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

const categoryConfig: Record<string, { label: string; dot: string; className: string }> = {
  mentoria: { label: "Live de Mentoria", dot: "bg-primary", className: "bg-primary/20 text-primary border-primary/30" },
  relatorio: { label: "Relatório Semanal", dot: "bg-emerald-500", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  macroeconomico: { label: "Evento Macroeconômico", dot: "bg-amber-500", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
};

const mockEvents: AgendaEvent[] = [
  { id: "1", title: "Live: Cenário do Dólar em Fevereiro", date: "2026-02-10", time: "19:00", category: "mentoria", description: "Análise ao vivo do cenário cambial com projeções para importadores e exportadores." },
  { id: "2", title: "Relatório Semanal USD/BRL", date: "2026-02-10", time: "08:00", category: "relatorio", description: "Resumo da semana com principais movimentações e zonas de score." },
  { id: "3", title: "Decisão de Juros – FOMC", date: "2026-02-12", time: "15:00", category: "macroeconomico", description: "Reunião do Federal Reserve com potencial impacto direto nas cotações." },
  { id: "4", title: "Live: Estratégias para Exportadores", date: "2026-02-14", time: "20:00", category: "mentoria", description: "Como usar o Score Treend para identificar momentos ideais de venda." },
  { id: "5", title: "IPCA – Inflação Brasileira", date: "2026-02-12", time: "09:00", category: "macroeconomico", description: "Divulgação do índice de inflação com reflexos no câmbio." },
];

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type ViewMode = "monthly" | "weekly";

const Agenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<ViewMode>("monthly");

  const eventsByDate = useMemo(() => {
    const map: Record<string, AgendaEvent[]> = {};
    mockEvents.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, []);

  // Generate calendar grid days
  const calendarDays = useMemo(() => {
    if (view === "monthly") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      const days: Date[] = [];
      let day = gridStart;
      while (day <= gridEnd) {
        days.push(day);
        day = addDays(day, 1);
      }
      return days;
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const days: Date[] = [];
      for (let i = 0; i < 7; i++) {
        days.push(addDays(weekStart, i));
      }
      return days;
    }
  }, [currentDate, view]);

  const handlePrev = () => {
    setCurrentDate((d) => (view === "monthly" ? subMonths(d, 1) : subWeeks(d, 1)));
  };
  const handleNext = () => {
    setCurrentDate((d) => (view === "monthly" ? addMonths(d, 1) : addWeeks(d, 1)));
  };
  const handleToday = () => setCurrentDate(new Date());

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedEvents = selectedDateStr ? (eventsByDate[selectedDateStr] || []) : [];

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground text-sm mt-1">Eventos e encontros da comunidade</p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border p-1">
          <button
            onClick={() => setView("monthly")}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-display font-medium transition-colors duration-200",
              view === "monthly"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setView("weekly")}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-display font-medium transition-colors duration-200",
              view === "weekly"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Semanal
          </button>
        </div>
      </div>

      {/* Calendar Card */}
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="rounded-full h-9 w-9" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full h-9 w-9" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="font-display text-sm" onClick={handleToday}>
                Hoje
              </Button>
            </div>
            <h2 className="text-lg sm:text-xl font-display font-semibold text-foreground capitalize">
              {view === "monthly"
                ? format(currentDate, "MMMM yyyy", { locale: ptBR })
                : `Semana de ${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "dd MMM", { locale: ptBR })}`}
            </h2>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-display font-medium text-muted-foreground uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className={cn("grid grid-cols-7", view === "weekly" ? "" : "")}>
            {calendarDays.map((day, i) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDate[dateStr] || [];
              const inMonth = isSameMonth(day, currentDate);
              const today = isToday(day);
              const selected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative flex flex-col items-start p-2 sm:p-3 border-b border-r border-border transition-colors duration-150 text-left",
                    view === "monthly" ? "min-h-[80px] sm:min-h-[100px]" : "min-h-[120px] sm:min-h-[160px]",
                    !inMonth && view === "monthly" && "opacity-30",
                    selected && "bg-primary/5",
                    "hover:bg-muted/50"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center justify-center text-sm font-display font-medium w-7 h-7 rounded-full",
                      today && "bg-primary text-primary-foreground",
                      selected && !today && "ring-2 ring-primary"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Event dots / pills */}
                  <div className="mt-1 space-y-0.5 w-full overflow-hidden">
                    {dayEvents.slice(0, view === "weekly" ? 4 : 2).map((ev) => {
                      const cat = categoryConfig[ev.category];
                      return (
                        <div
                          key={ev.id}
                          className={cn(
                            "flex items-center gap-1 rounded px-1 py-0.5 text-[10px] sm:text-xs truncate",
                            cat.className
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cat.dot)} />
                          <span className="truncate">{ev.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > (view === "weekly" ? 4 : 2) && (
                      <span className="text-[10px] text-muted-foreground">+{dayEvents.length - (view === "weekly" ? 4 : 2)} mais</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border">
            {Object.entries(categoryConfig).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("w-2.5 h-2.5 rounded-sm", val.dot)} />
                {val.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected date events */}
      {selectedDate && (
        <div className="space-y-3 animate-fade-in">
          <h3 className="text-lg font-display font-semibold text-foreground">
            {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </h3>
          {selectedEvents.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Nenhum evento para esta data.
              </CardContent>
            </Card>
          ) : (
            selectedEvents.map((event) => {
              const cat = categoryConfig[event.category];
              return (
                <Card key={event.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-base font-semibold text-foreground">{event.title}</h4>
                      <Badge variant="outline" className={cn("shrink-0 text-xs", cat.className)}>
                        <Tag className="h-3 w-3 mr-1" />
                        {cat.label}
                      </Badge>
                    </div>
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
      )}
    </div>
  );
};

export default Agenda;
