ALTER TABLE public.heatmap_scores ADD COLUMN IF NOT EXISTS volatility_pct numeric DEFAULT 0;
ALTER TABLE public.heatmap_scores ADD COLUMN IF NOT EXISTS momentum numeric DEFAULT 0;
ALTER TABLE public.heatmap_history ADD COLUMN IF NOT EXISTS volatility_pct numeric DEFAULT 0;
ALTER TABLE public.heatmap_history ADD COLUMN IF NOT EXISTS momentum numeric DEFAULT 0;