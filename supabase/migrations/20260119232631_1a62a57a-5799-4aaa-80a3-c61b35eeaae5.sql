-- Fix award_offer_click_coins function - correct add_coins parameter order
CREATE OR REPLACE FUNCTION public.award_offer_click_coins(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    
    -- Add coins to wallet - FIXED parameter order: (user_id, amount, type, reference_id, description)
    PERFORM add_coins(p_user_id, v_coins_awarded, 'offer_click', NULL, 'Coins for clicking offer');
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'coins_awarded', v_coins_awarded,
    'clicks_today', v_current_clicks + 1,
    'max_clicks', v_max_clicks
  );
END;
$function$;

-- Fix award_quiz_completion_coins function - correct add_coins parameter order
CREATE OR REPLACE FUNCTION public.award_quiz_completion_coins(p_user_id uuid, p_quiz_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    
    -- Add coins to wallet - FIXED parameter order: (user_id, amount, type, reference_id, description)
    PERFORM add_coins(p_user_id, v_coins_awarded, 'quiz_completion', p_quiz_id, 'Coins for completing quiz');
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'coins_awarded', v_coins_awarded,
    'already_completed', v_already_completed
  );
END;
$function$;

-- Fix admin_adjust_coins function - correct add_coins parameter order
CREATE OR REPLACE FUNCTION public.admin_adjust_coins(p_user_id uuid, p_amount integer, p_description text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Add coins - FIXED parameter order: (user_id, amount, type, reference_id, description)
  PERFORM add_coins(p_user_id, p_amount, v_type, NULL, p_description);
  
  -- Get new balance
  SELECT coins_balance INTO v_new_balance FROM user_wallets WHERE user_id = p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance
  );
END;
$function$;