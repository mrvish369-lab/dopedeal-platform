-- Add enhanced details fields to offer_cards
ALTER TABLE public.offer_cards 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS features TEXT[],
ADD COLUMN IF NOT EXISTS original_price TEXT,
ADD COLUMN IF NOT EXISTS discounted_price TEXT,
ADD COLUMN IF NOT EXISTS discount_percent TEXT,
ADD COLUMN IF NOT EXISTS rating TEXT,
ADD COLUMN IF NOT EXISTS reviews_count TEXT,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Create deal_banners table for hero carousel
CREATE TABLE IF NOT EXISTS public.deal_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  badge_text TEXT,
  gradient_from TEXT DEFAULT 'primary',
  gradient_via TEXT DEFAULT 'orange-500',
  gradient_to TEXT DEFAULT 'yellow-500',
  icon_name TEXT DEFAULT 'Flame',
  redirect_url TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'draft')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on banners
ALTER TABLE public.deal_banners ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active banners
CREATE POLICY "Anyone can view active banners"
ON public.deal_banners
FOR SELECT
USING (status = 'active');

-- Allow admins to manage banners
CREATE POLICY "Admins can manage banners"
ON public.deal_banners
FOR ALL
USING (public.is_admin());

-- Create storage bucket for banner images
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public to view banner images
CREATE POLICY "Banner images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'banners');

-- Allow authenticated admins to upload/manage banner images
CREATE POLICY "Admins can upload banner images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'banners' AND public.is_admin());

CREATE POLICY "Admins can update banner images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'banners' AND public.is_admin());

CREATE POLICY "Admins can delete banner images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'banners' AND public.is_admin());

-- Add trigger for updated_at on banners
CREATE TRIGGER update_deal_banners_updated_at
BEFORE UPDATE ON public.deal_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();