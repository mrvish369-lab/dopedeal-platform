-- =============================================
-- PHASE 2: SUPER DEALS & COUPON SYSTEM
-- =============================================

-- 1. Super Deals table (products with exclusive coupons)
CREATE TABLE public.super_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  long_description TEXT,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'digital_course',
  original_price NUMERIC,
  discounted_price NUMERIC,
  discount_percent INTEGER,
  platform_name TEXT,
  platform_url TEXT,
  features TEXT[] DEFAULT '{}',
  rating NUMERIC DEFAULT 4.5,
  reviews_count INTEGER DEFAULT 0,
  coins_required INTEGER NOT NULL DEFAULT 50,
  total_coupons INTEGER NOT NULL DEFAULT 100,
  coupons_claimed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold_out')),
  display_order INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.super_deals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active super deals"
  ON public.super_deals FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage super deals"
  ON public.super_deals FOR ALL
  USING (is_admin());

-- 2. Coupon Codes table (individual coupon codes for each deal)
CREATE TABLE public.coupon_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  super_deal_id UUID NOT NULL REFERENCES public.super_deals(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_by UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own claimed coupons"
  ON public.coupon_codes FOR SELECT
  USING (claimed_by = auth.uid());

CREATE POLICY "Admins can manage coupon codes"
  ON public.coupon_codes FOR ALL
  USING (is_admin());

-- 3. User Unlocked Deals (tracks which deals each user has unlocked)
CREATE TABLE public.user_unlocked_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  super_deal_id UUID NOT NULL REFERENCES public.super_deals(id) ON DELETE CASCADE,
  coupon_code_id UUID REFERENCES public.coupon_codes(id),
  coins_spent INTEGER NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, super_deal_id)
);

-- Enable RLS
ALTER TABLE public.user_unlocked_deals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own unlocked deals"
  ON public.user_unlocked_deals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all unlocked deals"
  ON public.user_unlocked_deals FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage unlocked deals"
  ON public.user_unlocked_deals FOR ALL
  USING (is_admin());

-- 4. Function to unlock a super deal with coins
CREATE OR REPLACE FUNCTION public.unlock_super_deal(
  p_user_id UUID,
  p_deal_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_deal RECORD;
  v_wallet RECORD;
  v_coupon_code RECORD;
  v_new_balance INTEGER;
BEGIN
  -- Get deal info
  SELECT * INTO v_deal FROM public.super_deals WHERE id = p_deal_id AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Deal not found or inactive');
  END IF;
  
  -- Check if already unlocked
  IF EXISTS (SELECT 1 FROM public.user_unlocked_deals WHERE user_id = p_user_id AND super_deal_id = p_deal_id) THEN
    RETURN json_build_object('success', false, 'error', 'You have already unlocked this deal');
  END IF;
  
  -- Get user wallet
  SELECT * INTO v_wallet FROM public.user_wallets WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  
  -- Check balance
  IF v_wallet.coins_balance < v_deal.coins_required THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient coins', 'required', v_deal.coins_required, 'balance', v_wallet.coins_balance);
  END IF;
  
  -- Get an available coupon code
  SELECT * INTO v_coupon_code 
  FROM public.coupon_codes 
  WHERE super_deal_id = p_deal_id AND is_claimed = false
  ORDER BY RANDOM()
  LIMIT 1
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Update deal status to sold_out
    UPDATE public.super_deals SET status = 'sold_out', updated_at = now() WHERE id = p_deal_id;
    RETURN json_build_object('success', false, 'error', 'No coupons available');
  END IF;
  
  -- Deduct coins from wallet
  UPDATE public.user_wallets
  SET coins_balance = coins_balance - v_deal.coins_required,
      total_spent = total_spent + v_deal.coins_required,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING coins_balance INTO v_new_balance;
  
  -- Mark coupon as claimed
  UPDATE public.coupon_codes
  SET is_claimed = true, claimed_by = p_user_id, claimed_at = now()
  WHERE id = v_coupon_code.id;
  
  -- Record the unlock
  INSERT INTO public.user_unlocked_deals (user_id, super_deal_id, coupon_code_id, coins_spent)
  VALUES (p_user_id, p_deal_id, v_coupon_code.id, v_deal.coins_required);
  
  -- Update coupons_claimed count
  UPDATE public.super_deals
  SET coupons_claimed = coupons_claimed + 1, updated_at = now()
  WHERE id = p_deal_id;
  
  -- Log transaction
  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, reference_id, description)
  VALUES (p_user_id, -v_deal.coins_required, 'coupon_unlock', p_deal_id, 'Unlocked: ' || v_deal.title);
  
  RETURN json_build_object(
    'success', true,
    'coupon_code', v_coupon_code.code,
    'new_balance', v_new_balance,
    'deal_title', v_deal.title
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Function to get user's unlocked coupon for a deal
CREATE OR REPLACE FUNCTION public.get_user_coupon(
  p_user_id UUID,
  p_deal_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_unlock RECORD;
  v_coupon RECORD;
BEGIN
  SELECT * INTO v_unlock 
  FROM public.user_unlocked_deals 
  WHERE user_id = p_user_id AND super_deal_id = p_deal_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('unlocked', false);
  END IF;
  
  SELECT code INTO v_coupon FROM public.coupon_codes WHERE id = v_unlock.coupon_code_id;
  
  RETURN json_build_object(
    'unlocked', true,
    'coupon_code', v_coupon.code,
    'unlocked_at', v_unlock.unlocked_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Indexes for performance
CREATE INDEX idx_super_deals_status ON public.super_deals(status);
CREATE INDEX idx_super_deals_category ON public.super_deals(category);
CREATE INDEX idx_coupon_codes_deal ON public.coupon_codes(super_deal_id);
CREATE INDEX idx_coupon_codes_claimed ON public.coupon_codes(is_claimed);
CREATE INDEX idx_user_unlocked_deals_user ON public.user_unlocked_deals(user_id);

-- 7. Insert sample super deals
INSERT INTO public.super_deals (title, subtitle, description, long_description, category, original_price, discounted_price, discount_percent, platform_name, features, coins_required, total_coupons, display_order) VALUES
('Digital Marketing Mastery', 'Complete Course Bundle', 'Learn digital marketing from scratch to advanced level', 'This comprehensive course covers SEO, Social Media Marketing, Google Ads, Facebook Ads, Email Marketing, Content Strategy, and Analytics. Perfect for beginners and intermediate marketers looking to scale their skills.', 'digital_course', 4999, 999, 80, 'Udemy', ARRAY['50+ Hours Content', 'Lifetime Access', 'Certificate', '24/7 Support'], 100, 50, 1),
('Python Programming Bootcamp', 'From Zero to Hero', 'Master Python programming with real-world projects', 'Complete Python bootcamp covering basics to advanced topics including data structures, OOP, web scraping, automation, APIs, databases, and building real projects. Includes Django and Flask frameworks.', 'digital_course', 3999, 799, 80, 'Coursera', ARRAY['40+ Hours Content', 'Real Projects', 'Certificate', 'Mentor Support'], 75, 30, 2),
('Fitness Transformation eBook', 'Complete Diet & Workout Guide', 'Transform your body in 90 days with proven methods', 'Comprehensive fitness guide covering nutrition, workout plans, meal prep, supplements, and mindset. Includes 12-week transformation program with daily workout videos and meal plans.', 'ebook', 1499, 299, 80, 'Gumroad', ARRAY['12-Week Program', 'Video Tutorials', 'Meal Plans', 'Progress Tracker'], 50, 100, 3);