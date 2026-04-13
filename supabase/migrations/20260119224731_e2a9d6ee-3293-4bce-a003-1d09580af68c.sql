-- =============================================
-- PHASE 1: USER WALLET & COINS SYSTEM
-- =============================================

-- 1. User Profiles table (for authenticated users)
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage all profiles"
  ON public.user_profiles FOR ALL
  USING (is_admin());

-- 2. User Wallets table
CREATE TABLE public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  coins_balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_wallets
CREATE POLICY "Users can view their own wallet"
  ON public.user_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON public.user_wallets FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage all wallets"
  ON public.user_wallets FOR ALL
  USING (is_admin());

-- 3. Coin Transactions table (audit log)
CREATE TABLE public.coin_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('daily_checkin', 'offer_click', 'quiz_complete', 'referral', 'coupon_unlock', 'admin_credit', 'admin_debit')),
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coin_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.coin_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.coin_transactions FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage transactions"
  ON public.coin_transactions FOR ALL
  USING (is_admin());

-- 4. Daily Check-ins table
CREATE TABLE public.daily_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  coins_earned INTEGER NOT NULL,
  streak_day INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);

-- Enable RLS
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_checkins
CREATE POLICY "Users can view their own checkins"
  ON public.daily_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checkin"
  ON public.daily_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all checkins"
  ON public.daily_checkins FOR SELECT
  USING (is_admin());

-- 5. Coin Settings (admin-configurable)
CREATE TABLE public.coin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value INTEGER NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coin_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coin_settings
CREATE POLICY "Anyone can read coin settings"
  ON public.coin_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage coin settings"
  ON public.coin_settings FOR ALL
  USING (is_admin());

-- Insert default coin settings
INSERT INTO public.coin_settings (setting_key, setting_value, description) VALUES
  ('daily_checkin_base', 10, 'Base coins for daily check-in'),
  ('daily_checkin_streak_bonus', 5, 'Extra coins per streak day (max 7 days)'),
  ('offer_click_coins', 2, 'Coins earned per offer click'),
  ('quiz_complete_coins', 15, 'Coins earned for completing a quiz'),
  ('referral_coins', 50, 'Coins earned for successful referral');

-- 6. Function to auto-create wallet on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id);
  
  -- Create user wallet with 0 balance
  INSERT INTO public.user_wallets (user_id, coins_balance)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Function to process daily check-in
CREATE OR REPLACE FUNCTION public.process_daily_checkin(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_last_checkin DATE;
  v_streak INTEGER := 1;
  v_base_coins INTEGER;
  v_streak_bonus INTEGER;
  v_total_coins INTEGER;
  v_wallet_id UUID;
BEGIN
  -- Get coin settings
  SELECT setting_value INTO v_base_coins FROM public.coin_settings WHERE setting_key = 'daily_checkin_base';
  SELECT setting_value INTO v_streak_bonus FROM public.coin_settings WHERE setting_key = 'daily_checkin_streak_bonus';
  
  v_base_coins := COALESCE(v_base_coins, 10);
  v_streak_bonus := COALESCE(v_streak_bonus, 5);
  
  -- Check if already checked in today
  IF EXISTS (SELECT 1 FROM public.daily_checkins WHERE user_id = p_user_id AND checkin_date = CURRENT_DATE) THEN
    RETURN json_build_object('success', false, 'error', 'Already checked in today');
  END IF;
  
  -- Get last check-in date to calculate streak
  SELECT checkin_date, streak_day INTO v_last_checkin, v_streak
  FROM public.daily_checkins
  WHERE user_id = p_user_id
  ORDER BY checkin_date DESC
  LIMIT 1;
  
  -- Calculate streak
  IF v_last_checkin = CURRENT_DATE - INTERVAL '1 day' THEN
    v_streak := LEAST(v_streak + 1, 7); -- Max 7 day streak
  ELSE
    v_streak := 1; -- Reset streak
  END IF;
  
  -- Calculate total coins (base + streak bonus)
  v_total_coins := v_base_coins + (v_streak_bonus * (v_streak - 1));
  
  -- Insert check-in record
  INSERT INTO public.daily_checkins (user_id, checkin_date, coins_earned, streak_day)
  VALUES (p_user_id, CURRENT_DATE, v_total_coins, v_streak);
  
  -- Update wallet
  UPDATE public.user_wallets
  SET coins_balance = coins_balance + v_total_coins,
      total_earned = total_earned + v_total_coins,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, v_total_coins, 'daily_checkin', 'Daily check-in day ' || v_streak);
  
  RETURN json_build_object(
    'success', true,
    'coins_earned', v_total_coins,
    'streak_day', v_streak,
    'next_checkin', (CURRENT_DATE + INTERVAL '1 day')::TEXT
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Function to add coins (for offer clicks, quizzes, etc.)
CREATE OR REPLACE FUNCTION public.add_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Update wallet
  UPDATE public.user_wallets
  SET coins_balance = coins_balance + p_amount,
      total_earned = total_earned + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING coins_balance INTO v_new_balance;
  
  -- Log transaction
  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, reference_id, description)
  VALUES (p_user_id, p_amount, p_type, p_reference_id, p_description);
  
  RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Trigger to update timestamps
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_wallets_updated_at
  BEFORE UPDATE ON public.user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();