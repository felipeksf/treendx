
INSERT INTO storage.buckets (id, name, public)
VALUES ('feed-images', 'feed-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload feed images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feed-images'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Anyone can view feed images"
ON storage.objects FOR SELECT
USING (bucket_id = 'feed-images');

CREATE POLICY "Admins can delete feed images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'feed-images'
  AND public.has_role(auth.uid(), 'admin')
);
