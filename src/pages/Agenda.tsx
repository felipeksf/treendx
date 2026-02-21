import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, addWeeks, subWeeks, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type AgendaEvent = Tables<"agenda_events">;
const categoryConfig: Record<string, { label: string; dot: string; className: string }> = {
  relatorio: { label: "Report Semanal no Feed", dot: "bg-treend-success", className: "bg-treend-success/15 text-treend-success" },
  macroeconomico: { label: "Evento Macroeconômico", dot: "bg-treend-warning", className: "bg-treend-warning/15 text-treend-warning" },
};
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
type ViewMode = "monthly" | "weekly";

const Agenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<ViewMode>("monthly");
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase.from("agenda_events").select("*").order("event_date", { ascending: true });
      if (error) console.error(error); else setEvents(data || []);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const eventsByDate = useMemo(() => {
    const map: Record<string, AgendaEvent[]> = {};
    events.forEach(e => { if (!map[e.event_date]) map[e.event_date] = []; map[e.event_date].push(e); });
    return map;
  }, [events]);

  const calendarDays = useMemo(() => {
    if (view === "monthly") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      const days: Date[] = [];
      let day = gridStart;
      while (day <= gridEnd) { days.push(day); day = addDays(day, 1); }
      return days;
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const days: Date[] = [];
      for (let i = 0; i < 7; i++) days.push(addDays(weekStart, i));
      return days;
    }
  }, [currentDate, view]);

  const handlePrev = () => setCurrentDate(d => view === "monthly" ? subMonths(d, 1) : subWeeks(d, 1));
  const handleNext = () => setCurrentDate(d => view === "monthly" ? addMonths(d, 1) : addWeeks(d, 1));
  const handleToday = () => setCurrentDate(new Date());
  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedEvents = selectedDateStr ? eventsByDate[selectedDateStr] || [] : [];

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground mt-1">Eventos e encontros da comunidade</p>
        </div>
        <div className="flex items-center gap-0.5 rounded-xl bg-muted/40 border border-border/50 p-1">
          <button onClick={() => setView("monthly")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", view === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            Mensal
          </button>
          <button onClick={() => setView("weekly")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", view === "weekly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            Semanal
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="premium-card overflow-hidden">
        {/* Controls */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-1.5">
            <button onClick={handlePrev} className="p-2 rounded-xl hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={handleNext} className="p-2 rounded-xl hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={handleToday} className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
              Hoje
            </button>
          </div>
          <h2 className="text-sm font-semibold text-foreground capitalize">
            {view === "monthly" ? format(currentDate, "MMMM yyyy", { locale: ptBR }) : `Semana de ${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "dd MMM", { locale: ptBR })}`}
          </h2>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border/40">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2.5 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{d}</div>
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
              <button key={i} onClick={() => setSelectedDate(day)} className={cn(
                "relative flex flex-col items-start p-2 sm:p-3 border-b border-r border-border/20 transition-colors duration-150 text-left",
                view === "monthly" ? "min-h-[80px] sm:min-h-[100px]" : "min-h-[120px] sm:min-h-[160px]",
                !inMonth && view === "monthly" && "opacity-25",
                selected && "bg-primary/5",
                "hover:bg-muted/30"
              )}>
                <span className={cn(
                  "inline-flex items-center justify-center text-xs font-medium w-6 h-6 rounded-full",
                  today && "bg-primary text-primary-foreground",
                  selected && !today && "ring-1.5 ring-primary"
                )}>
                  {format(day, "d")}
                </span>
                <div className="mt-1 space-y-0.5 w-full overflow-hidden">
                  {dayEvents.slice(0, view === "weekly" ? 4 : 2).map(ev => {
                    const cat = categoryConfig[ev.category];
                    return (
                      <div key={ev.id} className={cn("flex items-center gap-1 rounded px-1 py-0.5 text-[10px] truncate", cat?.className)}>
                        <span className={cn("w-1 h-1 rounded-full shrink-0", cat?.dot)} />
                        <span className="truncate">{ev.title}</span>
                      </div>
                    );
                  })}
                  {dayEvents.length > (view === "weekly" ? 4 : 2) && <span className="text-[10px] text-muted-foreground">+{dayEvents.length - (view === "weekly" ? 4 : 2)} mais</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 px-5 py-3 border-t border-border/40">
          {Object.entries(categoryConfig).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className={`w-2.5 h-2.5 rounded-full ${val.dot}`} />
              <span>{val.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected date events */}
      {selectedDate && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}</h3>
          {selectedEvents.length === 0 ? (
            <div className="premium-card py-8 text-center text-sm text-muted-foreground">Nenhum evento para esta data.</div>
          ) : selectedEvents.map(event => {
            const cat = categoryConfig[event.category];
            return (
              <div key={event.id} className="premium-card p-5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground">{event.title}</h4>
                  <span className={cn("shrink-0 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md", cat?.className)}>{cat?.label}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{event.event_time}</span>
                </div>
                {event.description && <p className="text-xs text-muted-foreground leading-relaxed">{event.description}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Agenda;