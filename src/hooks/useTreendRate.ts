import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTreendRate() {
  return useQuery({
    queryKey: ["treend-rate"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treend_rate" as any)
        .select("rate_pct, published_at")
        .order("published_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return {
        ratePct: Number((data as any).rate_pct),
        rateFraction: Number((data as any).rate_pct) / 100,
        publishedAt: (data as any).published_at as string,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
