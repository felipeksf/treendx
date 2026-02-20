import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Percent, Save, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminTaxa = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newRate, setNewRate] = useState("");

  const { data: currentRate, isLoading } = useQuery({
    queryKey: ["treend-rate"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treend_rate" as any)
        .select("*")
        .order("published_at", { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: history } = useQuery({
    queryKey: ["treend-rate-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treend_rate" as any)
        .select("*")
        .order("published_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (ratePct: number) => {
      const { error } = await supabase
        .from("treend_rate" as any)
        .insert({ rate_pct: ratePct, admin_id: user?.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treend-rate"] });
      queryClient.invalidateQueries({ queryKey: ["treend-rate-history"] });
      setNewRate("");
      toast({ title: "Taxa publicada!", description: "Todos os cálculos do app foram atualizados." });
    },
    onError: () => {
      toast({ title: "Erro ao publicar taxa", variant: "destructive" });
    },
  });

  const handlePublish = () => {
    const val = parseFloat(newRate.replace(",", "."));
    if (isNaN(val) || val <= 0 || val > 10) {
      toast({ title: "Taxa inválida", description: "Insira um valor entre 0,01% e 10%.", variant: "destructive" });
      return;
    }
    publishMutation.mutate(val);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Taxa Treend</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Defina a taxa-rainha que rege todos os cálculos de estimativa do app.
        </p>
      </div>

      {/* Current rate */}
      <div className="rounded-2xl bg-card border border-border/40 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Percent className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Taxa Atual</p>
            <p className="text-xs text-muted-foreground">Valor aplicado em todo o app</p>
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-primary tabular-nums">
            {isLoading ? "..." : `${Number(currentRate?.rate_pct).toFixed(1)}%`}
          </span>
          {currentRate?.published_at && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Publicada em {format(new Date(currentRate.published_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          )}
        </div>
      </div>

      {/* Set new rate */}
      <div className="rounded-2xl bg-card border border-border/40 p-6 space-y-4">
        <p className="text-sm font-semibold text-foreground">Publicar Nova Taxa</p>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Nova taxa (%)</Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Ex: 0.8"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button
            onClick={handlePublish}
            disabled={publishMutation.isPending || !newRate}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Publicar
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Ao publicar, todos os cálculos de "Taxa Estimada pela Treend" serão atualizados imediatamente para todos os usuários.
        </p>
      </div>

      {/* History */}
      {history && history.length > 0 && (
        <div className="rounded-2xl bg-card border border-border/40 p-6 space-y-3">
          <p className="text-sm font-semibold text-foreground">Histórico</p>
          <div className="space-y-2">
            {history.map((item: any, i: number) => (
              <div
                key={item.id}
                className={`flex items-center justify-between py-2 px-3 rounded-lg ${i === 0 ? "bg-primary/5 border border-primary/20" : "bg-muted/30"}`}
              >
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {Number(item.rate_pct).toFixed(2)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(item.published_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTaxa;
