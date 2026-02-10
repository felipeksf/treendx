
-- Create storage bucket for admin chart uploads (TradingView screenshots)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chart-uploads', 'chart-uploads', true);

-- Only admins can upload
CREATE POLICY "Admins can upload charts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chart-uploads'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Anyone authenticated can view
CREATE POLICY "Authenticated users can view charts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chart-uploads');

-- Admins can delete
CREATE POLICY "Admins can delete charts"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chart-uploads'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
