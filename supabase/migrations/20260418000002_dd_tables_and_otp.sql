-- =============================================================================
-- DopeDeal: Create missing dd_ tables + otp_codes table
-- Run this in Supabase SQL Editor for project: oyvumfznbsidngombidu
-- =============================================================================

-- ── 1. dd_user_profiles ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dd_user_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text,
  full_name       text,
  phone           text,
  city            text,
  bio             text,
  referral_code   text UNIQUE DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  referred_by     text,
  updated_at      timestamptz DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dd_user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.dd_user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own profile" ON public.dd_user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.dd_user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_dd_user_profiles_user_id ON public.dd_user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_dd_user_profiles_referral_code ON public.dd_user_profiles(referral_code);

-- ── 2. dd_wallet_balances (view over user_wallets for backward compat) ────────
-- The live DB has user_wallets with coins_balance/total_earned/total_spent.
-- The code expects available_balance/pending_balance/referral_balance/total_earned.
-- We create a view that maps the columns.
CREATE OR REPLACE VIEW public.dd_wallet_balances AS
SELECT
  id,
  user_id,
  coins_balance        AS available_balance,
  0::bigint            AS pending_balance,
  0::bigint            AS referral_balance,
  total_earned,
  created_at,
  updated_at
FROM public.user_wallets;

-- Allow authenticated users to read their own balance via the view
-- (RLS on the underlying user_wallets table applies)

-- ── 3. dd_wallet_transactions (view over coin_transactions) ──────────────────
-- coin_transactions has: user_id, amount, transaction_type, reference_id, description, created_at
-- Code expects: user_id, type, title, amount, direction, status, created_at
CREATE OR REPLACE VIEW public.dd_wallet_transactions AS
SELECT
  id,
  user_id,
  transaction_type                                          AS type,
  COALESCE(description, transaction_type)                   AS title,
  ABS(amount)                                               AS amount,
  CASE WHEN amount >= 0 THEN 'credit' ELSE 'debit' END      AS direction,
  'completed'                                               AS status,
  reference_id,
  created_at
FROM public.coin_transactions;

-- ── 4. dd_social_profiles ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dd_social_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  platform        text NOT NULL DEFAULT 'instagram',
  handle_url      text NOT NULL DEFAULT '',
  follower_count  integer NOT NULL DEFAULT 0,
  screenshot_url  text,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  review_note     text,
  submitted_at    timestamptz NOT NULL DEFAULT now(),
  reviewed_at     timestamptz,
  updated_at      timestamptz DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dd_social_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own social profile" ON public.dd_social_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own social profile" ON public.dd_social_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own social profile" ON public.dd_social_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_dd_social_profiles_user_id ON public.dd_social_profiles(user_id);

-- ── 5. dd_withdrawal_requests ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dd_withdrawal_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount              numeric(12,2) NOT NULL,
  method              text NOT NULL CHECK (method IN ('upi','bank')),
  upi_id              text,
  bank_account_no     text,  -- stored masked (****1234)
  bank_ifsc           text,  -- stored masked (HDFC*******)
  bank_account_name   text,
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','rejected')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE public.dd_withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own withdrawals" ON public.dd_withdrawal_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own withdrawals" ON public.dd_withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_dd_withdrawal_requests_user_id ON public.dd_withdrawal_requests(user_id);

-- ── 6. dd_referrals ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dd_referrals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id         uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code       text NOT NULL,
  referrer_commission numeric(12,2) NOT NULL DEFAULT 0,
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paid')),
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dd_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own referrals" ON public.dd_referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "System can insert referrals" ON public.dd_referrals FOR INSERT WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_dd_referrals_referrer_id ON public.dd_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_dd_referrals_referred_id ON public.dd_referrals(referred_id);

-- ── 7. dd_tasks ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dd_tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform        text NOT NULL,
  title           text NOT NULL,
  description     text,
  instructions    jsonb NOT NULL DEFAULT '[]',
  payout          numeric(10,2) NOT NULL DEFAULT 0,
  min_followers   integer NOT NULL DEFAULT 0,
  estimated_time  text,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.dd_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active tasks" ON public.dd_tasks FOR SELECT USING (active = true);
CREATE INDEX IF NOT EXISTS idx_dd_tasks_active ON public.dd_tasks(active);

-- ── 8. dd_task_submissions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dd_task_submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id         uuid NOT NULL REFERENCES public.dd_tasks(id) ON DELETE CASCADE,
  screenshot_url  text NOT NULL,
  status          text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','approved','rejected')),
  review_note     text,
  submitted_at    timestamptz NOT NULL DEFAULT now(),
  reviewed_at     timestamptz,
  UNIQUE(user_id, task_id)
);

ALTER TABLE public.dd_task_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own submissions" ON public.dd_task_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own submissions" ON public.dd_task_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own submissions" ON public.dd_task_submissions FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_dd_task_submissions_user_id ON public.dd_task_submissions(user_id);

-- ── 9. dd_user_coupons ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dd_user_coupons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id      uuid NOT NULL,
  code            text NOT NULL UNIQUE,
  discount_value  integer NOT NULL CHECK (discount_value IN (50, 100, 150)),
  commission      numeric(10,2) NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'unused' CHECK (status IN ('unused','redeemed','pending_verification')),
  redeemed_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dd_user_coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own coupons" ON public.dd_user_coupons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own coupons" ON public.dd_user_coupons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_dd_user_coupons_user_id ON public.dd_user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_dd_user_coupons_code ON public.dd_user_coupons(code);

-- ── 10. dd_products ──────────────────────────────────────────────────────────
-- Maps to the existing `products` table with extra DealSell fields
CREATE TABLE IF NOT EXISTS public.dd_products (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  category              text,
  image_url             text,
  store_url             text NOT NULL DEFAULT '',
  description           text,
  price                 numeric(12,2) NOT NULL DEFAULT 0,
  commission_tiers      jsonb NOT NULL DEFAULT '[]',
  coupons_per_user      integer NOT NULL DEFAULT 5,
  total_coupons_pool    integer NOT NULL DEFAULT 1000,
  used_coupons          integer NOT NULL DEFAULT 0,
  active                boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE public.dd_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active dd_products" ON public.dd_products FOR SELECT USING (active = true);

-- ── 11. otp_codes (for send-otp / verify-otp edge functions) ─────────────────
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL,
  otp_code        text NOT NULL,
  expires_at      timestamptz NOT NULL,
  used            boolean NOT NULL DEFAULT false,
  verify_attempts integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_email_used
  ON public.otp_codes (email, used, created_at DESC);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to otp_codes"
  ON public.otp_codes FOR ALL TO public USING (false);
GRANT ALL ON public.otp_codes TO service_role;

-- ── 12. Grant service_role access to all dd_ tables (for edge functions) ─────
GRANT ALL ON public.dd_user_profiles TO service_role;
GRANT ALL ON public.dd_social_profiles TO service_role;
GRANT ALL ON public.dd_withdrawal_requests TO service_role;
GRANT ALL ON public.dd_referrals TO service_role;
GRANT ALL ON public.dd_tasks TO service_role;
GRANT ALL ON public.dd_task_submissions TO service_role;
GRANT ALL ON public.dd_user_coupons TO service_role;
GRANT ALL ON public.dd_products TO service_role;

-- ── 13. Admin policies (service_role bypass) ─────────────────────────────────
-- Allow admins (via is_admin() RPC) to read all social profiles for verification queue
CREATE POLICY "Admins can read all social profiles"
  ON public.dd_social_profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update social profiles"
  ON public.dd_social_profiles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can read all task submissions"
  ON public.dd_task_submissions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update task submissions"
  ON public.dd_task_submissions FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can manage tasks"
  ON public.dd_tasks FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can manage dd_products"
  ON public.dd_products FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can read all withdrawals"
  ON public.dd_withdrawal_requests FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update withdrawals"
  ON public.dd_withdrawal_requests FOR UPDATE
  USING (public.is_admin());

COMMENT ON TABLE public.dd_user_profiles IS 'DopeDeal user profiles with referral codes';
COMMENT ON TABLE public.dd_social_profiles IS 'Social media verification submissions for PocketMoney';
COMMENT ON TABLE public.dd_withdrawal_requests IS 'UPI/bank withdrawal requests (bank details stored masked)';
COMMENT ON TABLE public.dd_referrals IS 'Referral relationships between users';
COMMENT ON TABLE public.dd_tasks IS 'PocketMoney social tasks available for users';
COMMENT ON TABLE public.dd_task_submissions IS 'User proof submissions for tasks';
COMMENT ON TABLE public.dd_user_coupons IS 'DealSell coupon codes generated by users';
COMMENT ON TABLE public.dd_products IS 'DealSell products with commission tiers';
COMMENT ON TABLE public.otp_codes IS 'One-time passwords for email auth (managed by edge functions)';
