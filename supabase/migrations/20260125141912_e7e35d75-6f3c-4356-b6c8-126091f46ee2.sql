-- Add toggle for WhatsApp number collection and banner landing page fields

-- 1. Add setting for skipping WhatsApp number collection
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES ('skip_whatsapp_number_input', 'false', 'Skip WhatsApp number input and go directly to channel join')
ON CONFLICT (setting_key) DO NOTHING;

-- 2. Add landing page fields to deal_banners table
ALTER TABLE public.deal_banners
ADD COLUMN IF NOT EXISTS landing_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS landing_description text,
ADD COLUMN IF NOT EXISTS landing_long_description text,
ADD COLUMN IF NOT EXISTS landing_features text[],
ADD COLUMN IF NOT EXISTS landing_cta_text text DEFAULT 'Get This Deal',
ADD COLUMN IF NOT EXISTS landing_cta_url text,
ADD COLUMN IF NOT EXISTS landing_coupon_code text,
ADD COLUMN IF NOT EXISTS landing_discount_text text,
ADD COLUMN IF NOT EXISTS landing_image_url text;