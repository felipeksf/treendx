
-- Create heatmap_scores table to store admin-published heatmap values
CREATE TABLE public.heatmap_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('importador', 'exportador', 'agente_turismo', 'freelancer')),
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'EUR', 'GBP')),
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  -- x and y position of the heatmap point (0-100 range)
  heat_x NUMERIC NOT NULL DEFAULT 50,
  heat_y NUMERIC NOT NULL DEFAULT 50,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_type, currency, frequency)
);

-- Create heatmap_history table for admin update log
CREATE TABLE public.heatmap_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('importador', 'exportador', 'agente_turismo', 'freelancer')),
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'EUR', 'GBP')),
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  heat_x NUMERIC NOT NULL,
  heat_y NUMERIC NOT NULL,
  is_accurate BOOLEAN DEFAULT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.heatmap_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heatmap_history ENABLE ROW LEVEL SECURITY;

-- Policies for heatmap_scores
CREATE POLICY "Authenticated users can view heatmap scores"
  ON public.heatmap_scores FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert heatmap scores"
  ON public.heatmap_scores FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update heatmap scores"
  ON public.heatmap_scores FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete heatmap scores"
  ON public.heatmap_scores FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for heatmap_history
CREATE POLICY "Admins can view heatmap history"
  ON public.heatmap_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert heatmap history"
  ON public.heatmap_history FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update heatmap history"
  ON public.heatmap_history FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete heatmap history"
  ON public.heatmap_history FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at on heatmap_scores
CREATE TRIGGER update_heatmap_scores_updated_at
  BEFORE UPDATE ON public.heatmap_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
