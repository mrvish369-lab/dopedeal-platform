-- Add column to store AI-generated button text for super deals
ALTER TABLE public.super_deals 
ADD COLUMN IF NOT EXISTS button_text TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.super_deals.button_text IS 'AI-generated CTA button text based on platform_url';