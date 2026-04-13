-- Create quiz_campaigns table for managing different goodies/freebies
CREATE TABLE public.quiz_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  template_type TEXT NOT NULL DEFAULT 'lighter',
  -- Goodie/Freebie Details
  goodie_title TEXT NOT NULL,
  goodie_subtitle TEXT,
  goodie_emoji TEXT DEFAULT '🔥',
  goodie_image_url TEXT,
  goodie_price TEXT DEFAULT '₹2',
  goodie_original_price TEXT DEFAULT '₹50',
  -- Success/Failure Messages
  success_title TEXT DEFAULT 'Congratulations! 🎉',
  success_message TEXT DEFAULT 'You''ve won your DopeDeal Goodie!',
  failure_title TEXT DEFAULT 'Better Luck Next Time!',
  failure_message TEXT DEFAULT 'Don''t worry, you can try again from another stall!',
  -- Redemption Instructions (JSONB array)
  redemption_steps JSONB DEFAULT '["Go to the shopkeeper where you scanned the QR", "Show this screen to them", "Pay the amount and collect your goodie!"]'::jsonb,
  validity_hours INTEGER DEFAULT 24,
  -- Hero Banner (above quiz)
  hero_banner_enabled BOOLEAN DEFAULT false,
  hero_banner_image_url TEXT,
  hero_banner_title TEXT,
  hero_banner_subtitle TEXT,
  hero_banner_gradient_from TEXT,
  hero_banner_gradient_to TEXT,
  -- Bottom Card Banner
  bottom_banner_enabled BOOLEAN DEFAULT false,
  bottom_banner_image_url TEXT,
  bottom_banner_title TEXT,
  bottom_banner_subtitle TEXT,
  bottom_banner_redirect_url TEXT,
  bottom_banner_cta_text TEXT DEFAULT 'Learn More',
  -- Quiz Configuration
  quiz_categories TEXT[] DEFAULT ARRAY['bollywood', 'social_media', 'cricket'],
  questions_count INTEGER DEFAULT 3,
  success_probability NUMERIC DEFAULT 0.7,
  -- Status and Targeting
  status TEXT NOT NULL DEFAULT 'active',
  target_shop_ids TEXT[],
  target_cities TEXT[],
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_campaigns ENABLE ROW LEVEL SECURITY;

-- Public read access for active campaigns
CREATE POLICY "Anyone can view active quiz campaigns"
ON public.quiz_campaigns
FOR SELECT
USING (status = 'active');

-- Admin full access (using is_admin function)
CREATE POLICY "Admins can manage quiz campaigns"
ON public.quiz_campaigns
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Create trigger for updated_at
CREATE TRIGGER update_quiz_campaigns_updated_at
BEFORE UPDATE ON public.quiz_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default "Lighter" campaign as the template
INSERT INTO public.quiz_campaigns (
  name,
  slug,
  template_type,
  goodie_title,
  goodie_subtitle,
  goodie_emoji,
  goodie_price,
  goodie_original_price,
  success_title,
  success_message,
  redemption_steps,
  status
) VALUES (
  'DopeDeal Lighter Campaign',
  'lighter',
  'lighter',
  'DopeDeal Lighter',
  'Premium Quality Lighter',
  '🔥',
  '₹2',
  '₹50',
  'Congratulations! 🎉',
  'You''ve won your DopeDeal Lighter!',
  '["Go to the shopkeeper where you scanned the QR", "Show this screen to them", "Pay ₹2 and collect your DopeDeal Lighter!"]'::jsonb,
  'active'
);

-- Add comment for documentation
COMMENT ON TABLE public.quiz_campaigns IS 'Quiz campaigns for different goodies/freebies with customizable templates and banners';