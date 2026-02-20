
-- Table to store the Treend master rate (taxa-rainha)
CREATE TABLE public.treend_rate (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rate_pct numeric NOT NULL DEFAULT 0.8,
  admin_id uuid NOT NULL,
  published_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.treend_rate ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view current rate"
ON public.treend_rate FOR SELECT
USING (true);

CREATE POLICY "Admins can insert rates"
ON public.treend_rate FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update rates"
ON public.treend_rate FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete rates"
ON public.treend_rate FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed with default 0.8%
INSERT INTO public.treend_rate (rate_pct, admin_id)
VALUES (0.8, '00000000-0000-0000-0000-000000000000');
