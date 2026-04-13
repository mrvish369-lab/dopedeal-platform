-- Add coin reward settings for different actions
INSERT INTO coin_settings (setting_key, setting_value, description)
VALUES 
  ('offer_click_coins', 1, 'Coins earned per offer click'),
  ('quiz_completion_coins', 5, 'Coins earned for completing a quiz'),
  ('max_offer_clicks_per_day', 10, 'Maximum offer clicks that earn coins per day')
ON CONFLICT (setting_key) DO NOTHING;

-- Create table to track coin-eligible offer clicks per user per day
CREATE TABLE IF NOT EXISTS user_offer_click_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  click_date DATE NOT NULL DEFAULT CURRENT_DATE,
  clicks_count INTEGER NOT NULL DEFAULT 0,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, click_date)
);

-- Create table to track quiz completion rewards
CREATE TABLE IF NOT EXISTS user_quiz_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  coins_earned INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, quiz_id)
);

-- Enable RLS
ALTER TABLE user_offer_click_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_offer_click_rewards (with IF NOT EXISTS pattern)
DO $$ BEGIN
  CREATE POLICY "Users can view their own click rewards"
    ON user_offer_click_rewards FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own click rewards"
    ON user_offer_click_rewards FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own click rewards"
    ON user_offer_click_rewards FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can view all click rewards"
    ON user_offer_click_rewards FOR SELECT
    USING ((SELECT is_admin()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies for user_quiz_rewards
DO $$ BEGIN
  CREATE POLICY "Users can view their own quiz rewards"
    ON user_quiz_rewards FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own quiz rewards"
    ON user_quiz_rewards FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can view all quiz rewards"
    ON user_quiz_rewards FOR SELECT
    USING ((SELECT is_admin()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Function to award coins for offer click
CREATE OR REPLACE FUNCTION award_offer_click_coins(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coins_per_click INTEGER;
  v_max_clicks INTEGER;
  v_today DATE := CURRENT_DATE;
  v_current_clicks INTEGER;
  v_coins_awarded INTEGER := 0;
BEGIN
  -- Get settings
  SELECT setting_value INTO v_coins_per_click FROM coin_settings WHERE setting_key = 'offer_click_coins';
  SELECT setting_value INTO v_max_clicks FROM coin_settings WHERE setting_key = 'max_offer_clicks_per_day';
  
  v_coins_per_click := COALESCE(v_coins_per_click, 1);
  v_max_clicks := COALESCE(v_max_clicks, 10);
  
  -- Get or create today's click record
  INSERT INTO user_offer_click_rewards (user_id, click_date, clicks_count, coins_earned)
  VALUES (p_user_id, v_today, 0, 0)
  ON CONFLICT (user_id, click_date) DO NOTHING;
  
  -- Get current clicks
  SELECT clicks_count INTO v_current_clicks
  FROM user_offer_click_rewards
  WHERE user_id = p_user_id AND click_date = v_today;
  
  -- Check if under limit
  IF v_current_clicks < v_max_clicks THEN
    v_coins_awarded := v_coins_per_click;
    
    -- Update click count and coins
    UPDATE user_offer_click_rewards
    SET clicks_count = clicks_count + 1,
        coins_earned = coins_earned + v_coins_awarded,
        updated_at = now()
    WHERE user_id = p_user_id AND click_date = v_today;
    
    -- Add coins to wallet
    PERFORM add_coins(p_user_id, 'offer_click', v_coins_awarded, 'Coins for clicking offer', NULL);
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'coins_awarded', v_coins_awarded,
    'clicks_today', v_current_clicks + 1,
    'max_clicks', v_max_clicks
  );
END;
$$;

-- Function to award coins for quiz completion
CREATE OR REPLACE FUNCTION award_quiz_completion_coins(p_user_id UUID, p_quiz_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coins_per_quiz INTEGER;
  v_already_completed BOOLEAN;
  v_coins_awarded INTEGER := 0;
BEGIN
  -- Get settings
  SELECT setting_value INTO v_coins_per_quiz FROM coin_settings WHERE setting_key = 'quiz_completion_coins';
  v_coins_per_quiz := COALESCE(v_coins_per_quiz, 5);
  
  -- Check if already completed this quiz
  SELECT EXISTS(
    SELECT 1 FROM user_quiz_rewards WHERE user_id = p_user_id AND quiz_id = p_quiz_id
  ) INTO v_already_completed;
  
  IF NOT v_already_completed THEN
    v_coins_awarded := v_coins_per_quiz;
    
    -- Record quiz reward
    INSERT INTO user_quiz_rewards (user_id, quiz_id, coins_earned)
    VALUES (p_user_id, p_quiz_id, v_coins_awarded);
    
    -- Add coins to wallet
    PERFORM add_coins(p_user_id, 'quiz_completion', v_coins_awarded, 'Coins for completing quiz', p_quiz_id::text);
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'coins_awarded', v_coins_awarded,
    'already_completed', v_already_completed
  );
END;
$$;

-- Function for admin to credit/debit coins
CREATE OR REPLACE FUNCTION admin_adjust_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_type TEXT;
  v_new_balance INTEGER;
BEGIN
  -- Check admin
  SELECT is_admin() INTO v_is_admin;
  IF NOT v_is_admin THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;
  
  v_type := CASE WHEN p_amount >= 0 THEN 'admin_credit' ELSE 'admin_debit' END;
  
  -- Add coins (handles negative for debit)
  PERFORM add_coins(p_user_id, v_type, p_amount, p_description, NULL);
  
  -- Get new balance
  SELECT coins_balance INTO v_new_balance FROM user_wallets WHERE user_id = p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance
  );
END;
$$;