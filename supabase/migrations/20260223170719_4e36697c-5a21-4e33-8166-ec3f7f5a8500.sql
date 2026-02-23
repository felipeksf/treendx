ALTER TABLE public.user_decisions
  ADD COLUMN IF NOT EXISTS spread numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile text DEFAULT 'importador',
  ADD COLUMN IF NOT EXISTS ops_per_month numeric DEFAULT 10,
  ADD COLUMN IF NOT EXISTS ops_frequency text DEFAULT 'month',
  ADD COLUMN IF NOT EXISTS projection_months integer DEFAULT 12,
  ADD COLUMN IF NOT EXISTS treend_rate numeric DEFAULT 0;