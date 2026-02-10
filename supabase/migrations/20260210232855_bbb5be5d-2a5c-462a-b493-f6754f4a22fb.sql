
-- Create enum for tutorial categories
CREATE TYPE public.tutorial_category AS ENUM ('introducao', 'importadores', 'exportadores', 'turistas', 'freelancers');

-- Add category column to tutorials table
ALTER TABLE public.tutorials
ADD COLUMN category public.tutorial_category NOT NULL DEFAULT 'introducao';
