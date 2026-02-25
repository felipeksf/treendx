import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface HeatmapScore {
  id: string;
  admin_id: string;
  profile_type: string;
  currency: string;
  frequency: string;
  heat_x: number;
  heat_y: number;
  volatility_pct: number;
  momentum: number;
  published_at: string;
  updated_at: string;
}

export interface HeatmapHistoryItem {
  id: string;
  admin_id: string;
  profile_type: string;
  currency: string;
  frequency: string;
  heat_x: number;
  heat_y: number;
  volatility_pct: number;
  momentum: number;
  is_accurate: boolean | null;
  published_at: string;
}

export const useHeatmapScores = (currency?: string, frequency?: string) => {
  return useQuery({
    queryKey: ["heatmap-scores", currency, frequency],
    queryFn: async () => {
      let query = supabase.from("heatmap_scores").select("*");
      if (currency) query = query.eq("currency", currency);
      if (frequency) query = query.eq("frequency", frequency);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as HeatmapScore[];
    },
  });
};

export const useHeatmapHistory = () => {
  return useQuery({
    queryKey: ["heatmap-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("heatmap_history")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as HeatmapHistoryItem[];
    },
  });
};

export const usePublishHeatmap = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      profileType,
      currency,
      frequency,
      heatX,
      heatY,
      volatilityPct = 0,
      momentum = 0,
    }: {
      profileType: string;
      currency: string;
      frequency: string;
      heatX: number;
      heatY: number;
      volatilityPct?: number;
      momentum?: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error: upsertError } = await supabase
        .from("heatmap_scores")
        .upsert(
          {
            admin_id: user.id,
            profile_type: profileType,
            currency,
            frequency,
            heat_x: heatX,
            heat_y: heatY,
            volatility_pct: volatilityPct,
            momentum,
            published_at: new Date().toISOString(),
          } as any,
          { onConflict: "profile_type,currency,frequency" }
        );
      if (upsertError) throw upsertError;

      const { error: histError } = await supabase
        .from("heatmap_history")
        .insert({
          admin_id: user.id,
          profile_type: profileType,
          currency,
          frequency,
          heat_x: heatX,
          heat_y: heatY,
          volatility_pct: volatilityPct,
          momentum,
          published_at: new Date().toISOString(),
        } as any);
      if (histError) throw histError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heatmap-scores"] });
      queryClient.invalidateQueries({ queryKey: ["heatmap-history"] });
    },
  });
};

export const useToggleAccurate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isAccurate }: { id: string; isAccurate: boolean | null }) => {
      const { error } = await supabase
        .from("heatmap_history")
        .update({ is_accurate: isAccurate })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heatmap-history"] });
    },
  });
};
