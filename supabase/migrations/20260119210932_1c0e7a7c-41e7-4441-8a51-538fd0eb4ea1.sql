-- Add full-size image field to offer_cards for recommendation display
ALTER TABLE public.offer_cards 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add AI recommendation settings table for admin control
CREATE TABLE IF NOT EXISTS public.recommendation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recommendation_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/modify recommendation settings
CREATE POLICY "Only admins can view recommendation settings"
ON public.recommendation_settings
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Only admins can modify recommendation settings"
ON public.recommendation_settings
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Insert default recommendation weights
INSERT INTO public.recommendation_settings (setting_key, setting_value, description)
VALUES 
  ('time_based_weights', 
   '{"morning_health_boost": 15, "evening_money_boost": 15, "night_gaming_boost": 10}',
   'Boost scores based on time of day'),
  ('interest_weights',
   '{"money_making_match": 25, "health_match": 25, "gaming_match": 20, "deals_match": 15}',
   'Boost scores based on user interests'),
  ('engagement_weights',
   '{"category_affinity": 20, "high_scroll_premium": 10, "mobile_quick_deals": 10}',
   'Boost scores based on user engagement patterns'),
  ('new_user_weights',
   '{"popular_item_boost": 15, "click_threshold": 3}',
   'Boost popular items for new users'),
  ('discount_weights',
   '{"high_discount_boost": 15, "medium_discount_boost": 8, "high_discount_threshold": 50, "medium_discount_threshold": 20}',
   'Boost based on discount percentages'),
  ('rating_weights',
   '{"high_rating_boost": 12, "high_rating_threshold": 4.5}',
   'Boost based on card ratings'),
  ('diversity_settings',
   '{"max_per_segment": 2, "min_total_before_diversity": 3, "randomization_range": 5}',
   'Controls for result diversity')
ON CONFLICT (setting_key) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_recommendation_settings_updated_at
  BEFORE UPDATE ON public.recommendation_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();