# DopeDeal — Complete Setup & Fix Guide

## What Was Wrong (Root Causes Found)

| # | Issue | Status |
|---|---|---|
| 1 | **Wrong Supabase project** — code pointed to dead project `edxmwkeubdlioohxjwzp`, live DB is `oyvumfznbsidngombidu` | ✅ Fixed in code |
| 2 | **`send-otp` / `verify-otp` / `send-email` functions missing** — never existed, OTP never worked | ✅ Created |
| 3 | **`otp_codes` table missing** — edge functions need it | ✅ In migration SQL below |
| 4 | **`dd_` tables missing** — 8 tables the code uses don't exist in the new DB | ✅ In migration SQL below |
| 5 | **`RESEND_API_KEY` secret not set** | ✅ Set it below |
| 6 | **Wallet column mismatch** — code expected `available_balance`, DB has `coins_balance` | ✅ Fixed in code |
| 7 | **All security vulnerabilities** (open redirects, admin signup, CSP, etc.) | ✅ Fixed in code |

---

## Step 1 — Run the Database Migration (REQUIRED)

Go to: **https://supabase.com/dashboard/project/oyvumfznbsidngombidu/sql/new**

Copy and paste the entire contents of this file and click **Run**:

```
supabase/migrations/20260418000002_dd_tables_and_otp.sql
```

This creates:
- `dd_user_profiles` — user profiles with referral codes
- `dd_wallet_balances` — view over `user_wallets` (backward compat)
- `dd_wallet_transactions` — view over `coin_transactions` (backward compat)
- `dd_social_profiles` — social verification for PocketMoney
- `dd_withdrawal_requests` — UPI/bank withdrawal requests
- `dd_referrals` — referral relationships
- `dd_tasks` — PocketMoney tasks
- `dd_task_submissions` — task proof submissions
- `dd_user_coupons` — DealSell coupon codes
- `dd_products` — DealSell products
- `otp_codes` — OTP storage for email auth

---

## Step 2 — Deploy Edge Functions (REQUIRED for OTP)

Install Supabase CLI if you haven't:
```bash
npm install -g supabase
```

Link to your project:
```bash
supabase login
supabase link --project-ref oyvumfznbsidngombidu
```

Set secrets:
```bash
supabase secrets set RESEND_API_KEY=re_U5Pp4gsy_7x5Nj8A9cXpkw23FGQmhPqeb
supabase secrets set FROM_EMAIL=noreply@dopedeal.store
```

Deploy the three new functions:
```bash
supabase functions deploy send-otp
supabase functions deploy verify-otp
supabase functions deploy send-email
```

---

## Step 3 — Verify Resend Domain

1. Go to https://resend.com/domains
2. Confirm `dopedeal.store` shows **Verified** status
3. If not verified, add the DNS records shown and wait for propagation

---

## Step 4 — Update Vercel Environment Variables

Go to: **https://vercel.com/dashboard** → Your project → Settings → Environment Variables

Add/update these:
```
VITE_SUPABASE_URL = https://oyvumfznbsidngombidu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95dnVtZnpuYnNpZG5nb21iaWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDAzNTcsImV4cCI6MjA4NDMxNjM1N30.8PBc-U3IT99R5eTzI32BZvmtREek143yGcDVASG7Y4Q
VITE_SUPABASE_PROJECT_ID = oyvumfznbsidngombidu
VITE_RESEND_FROM_EMAIL = noreply@dopedeal.store
```

Then redeploy: **Deployments → Redeploy**

---

## Step 5 — Create Your First Admin Account

Since the public admin signup has been removed, create admin accounts via:

1. Go to: https://supabase.com/dashboard/project/oyvumfznbsidngombidu/auth/users
2. Click **Invite user** → enter admin email
3. They set password via invite link
4. Then run this SQL to grant admin access:

```sql
-- Replace with the actual user UUID from auth.users
INSERT INTO public.admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'your-admin@email.com';
```

---

## Step 6 — Test OTP Flow

1. Go to your deployed app → `/auth/login`
2. Enter an email address
3. Click "Send OTP to Email"
4. Check inbox (and spam folder)
5. Enter the 6-digit code

If OTP doesn't arrive:
- Check Supabase Edge Function logs: https://supabase.com/dashboard/project/oyvumfznbsidngombidu/functions
- Check Resend dashboard for delivery status: https://resend.com/emails
- Verify `RESEND_API_KEY` secret is set: `supabase secrets list`

---

## All Code Changes Made

| File | Change |
|---|---|
| `src/integrations/supabase/client.ts` | Fixed to use correct project `oyvumfznbsidngombidu` |
| `.env` | Updated with correct project credentials |
| `src/contexts/AuthContext.tsx` | Fixed wallet fetch, OTP rate limiting, session cleanup on logout |
| `src/lib/db/wallet.ts` | Fixed table names, bank data masking |
| `src/lib/db/leaderboard.ts` | Fixed to use `user_wallets` + `coin_transactions` |
| `src/lib/db/tasks.ts` | Fixed wallet credit to use `coin_transactions` |
| `src/lib/adminAuthCache.ts` | Moved to sessionStorage, TTL reduced to 5 min |
| `src/pages/admin/Login.tsx` | Removed public signup tab |
| `src/lib/urlValidation.ts` | New: safe URL validation utility |
| `src/components/offers/OfferBanner.tsx` | Fixed unvalidated redirect |
| `src/components/offers/OfferButton.tsx` | Fixed unvalidated redirect |
| `src/components/quiz/QuizBottomBanner.tsx` | Fixed unvalidated redirect |
| `src/pages/OfferCardDetail.tsx` | Fixed unvalidated redirect |
| `src/pages/LighterOffers.tsx` | Fixed unvalidated redirect |
| `src/pages/CategoryDeals.tsx` | Fixed unvalidated redirect |
| `src/pages/SuperDealDetail.tsx` | Fixed unvalidated redirect |
| `src/pages/BannerLanding.tsx` | Fixed unvalidated redirect |
| `src/components/ui/chart.tsx` | Removed dangerouslySetInnerHTML |
| `src/main.tsx` | Added env var validation + React Error Boundary |
| `index.html` | Added Content Security Policy |
| `vercel.json` | Added HSTS + security headers |
| `supabase/functions/send-otp/index.ts` | New: OTP send via Resend |
| `supabase/functions/verify-otp/index.ts` | New: OTP verification |
| `supabase/functions/send-email/index.ts` | New: Welcome email |
| `supabase/config.toml` | Registered new functions |
| `supabase/migrations/20260418000002_dd_tables_and_otp.sql` | New: All missing tables |
| `.env.example` | New: Developer onboarding template |
