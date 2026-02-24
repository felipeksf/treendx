
-- Add video_url column to tutorials (for direct uploads)
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS video_url text;

-- Make youtube_url nullable (since tutorials can now be upload-only)
ALTER TABLE public.tutorials ALTER COLUMN youtube_url DROP NOT NULL;

-- Create tutorial-videos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('tutorial-videos', 'tutorial-videos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for tutorial-videos bucket
CREATE POLICY "Admins can upload tutorial videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tutorial-videos' AND (SELECT public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Admins can update tutorial videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'tutorial-videos' AND (SELECT public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Admins can delete tutorial videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'tutorial-videos' AND (SELECT public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Anyone can view tutorial videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'tutorial-videos');
