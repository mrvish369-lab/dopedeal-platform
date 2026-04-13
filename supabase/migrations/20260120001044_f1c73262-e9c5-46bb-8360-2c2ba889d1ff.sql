-- Create storage bucket for campaign assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-assets', 
  'campaign-assets', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access for campaign assets
CREATE POLICY "Public read access for campaign assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'campaign-assets');

-- Allow authenticated admins to upload campaign assets
CREATE POLICY "Admins can upload campaign assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'campaign-assets' 
  AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Allow authenticated admins to update campaign assets
CREATE POLICY "Admins can update campaign assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'campaign-assets' 
  AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Allow authenticated admins to delete campaign assets
CREATE POLICY "Admins can delete campaign assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'campaign-assets' 
  AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);