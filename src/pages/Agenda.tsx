import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
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
  mentoria: { label: "Live de Mentoria", dot: "bg-primary", className: "bg-primary/15 text-primary" },
  relatorio: { label: "Relatório Semanal", dot: "bg-treend-success", className: "bg-treend-success/15 text-treend-success" },
  macroeconomico: { label: "Evento Macro", dot: "bg-treend-warning", className: "bg-treend-warning/15 text-treend-warning" },
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

  const handlePrev = () => setCurrentDate((d) => (view === "monthly" ? subMonths(d, 1) : subWeeks(d, 1)));
  const handleNext = () => setCurrentDate((d) => (view === "monthly" ? addMonths(d, 1) : addWeeks(d, 1)));
  const handleToday = () => setCurrentDate(new Date());

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedEvents = selectedDateStr ? (eventsByDate[selectedDateStr] || []) : [];

  return (
    <div className="max-w-full mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Agenda</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Eventos e encontros da comunidade</p>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5">
          <button
            onClick={() => setView("monthly")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              view === "monthly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setView("weekly")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              view === "weekly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Semanal
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
        {/* Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-1.5">
            <button onClick={handlePrev} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={handleNext} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={handleToday} className="px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
              Hoje
            </button>
          </div>
          <h2 className="text-sm font-semibold text-foreground capitalize">
            {view === "monthly"
              ? format(currentDate, "MMMM yyyy", { locale: ptBR })
              : `Semana de ${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "dd MMM", { locale: ptBR })}`}
          </h2>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border/40">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
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
                  "relative flex flex-col items-start p-2 sm:p-3 border-b border-r border-border/30 transition-colors duration-150 text-left",
                  view === "monthly" ? "min-h-[80px] sm:min-h-[100px]" : "min-h-[120px] sm:min-h-[160px]",
                  !inMonth && view === "monthly" && "opacity-25",
                  selected && "bg-primary/5",
                  "hover:bg-muted/40"
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center text-xs font-medium w-6 h-6 rounded-full",
                    today && "bg-primary text-primary-foreground",
                    selected && !today && "ring-1.5 ring-primary"
                  )}
                >
                  {format(day, "d")}
                </span>

                <div className="mt-1 space-y-0.5 w-full overflow-hidden">
                  {dayEvents.slice(0, view === "weekly" ? 4 : 2).map((ev) => {
                    const cat = categoryConfig[ev.category];
                    return (
                      <div
                        key={ev.id}
                        className={cn("flex items-center gap-1 rounded px-1 py-0.5 text-[10px] truncate", cat.className)}
                      >
                        <span className={cn("w-1 h-1 rounded-full shrink-0", cat.dot)} />
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
        <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-t border-border/40">
          {Object.entries(categoryConfig).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className={cn("w-2 h-2 rounded-full", val.dot)} />
              {val.label}
            </div>
          ))}
        </div>
      </div>

      {/* Selected date events */}
      {selectedDate && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </h3>
          {selectedEvents.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border/40 py-8 text-center text-sm text-muted-foreground">
              Nenhum evento para esta data.
            </div>
          ) : (
            selectedEvents.map((event) => {
              const cat = categoryConfig[event.category];
              return (
                <div key={event.id} className="rounded-2xl bg-card border border-border/40 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-foreground">{event.title}</h4>
                    <span className={cn("shrink-0 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md", cat.className)}>
                      {cat.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{event.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{event.description}</p>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Agenda;
