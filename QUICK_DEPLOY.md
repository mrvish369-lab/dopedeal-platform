# Quick Deploy Guide - Copy & Paste Commands

## Step 1: Deploy Edge Function

```bash
supabase functions deploy send-otp
```

---

## Step 2: Set Environment Variables in Supabase

Go to: **Supabase Dashboard** → **Edge Functions** → **Secrets**

### Critical: Update FROM_EMAIL
```
FROM_EMAIL = onboarding@resend.dev
```

### Optional: Add Telegram Support
```
TELEGRAM_BOT_TOKEN = <your-bot-token-from-botfather>
```

---

## Step 3: Test Email OTP

1. Open your app's login page
2. Enter your email
3. Click "Send OTP to Email"
4. Check your email inbox

**Expected**: Email received within 1-2 minutes

---

## Step 4: Deploy Frontend to Vercel

```bash
# Build and push to GitHub
npm run build
git add .
git commit -m "feat: add Telegram OTP support with dual delivery"
git push origin main
```

Vercel will auto-deploy.

---

## Step 5: Verify Production

1. Go to your production URL
2. Test login with email OTP
3. Verify OTP is received

---

## If Email Still Not Working

### Check Resend Logs
1. Go to https://resend.com/emails
2. Check recent emails
3. Look for delivery status

### Check Supabase Logs
1. Go to Supabase Dashboard
2. Navigate to Edge Functions → send-otp
3. Click "Logs"
4. Look for errors

### Verify Environment Variables
```bash
# In Supabase Dashboard → Edge Functions → Secrets
RESEND_API_KEY = re_xxxxx (should be set)
FROM_EMAIL = onboarding@resend.dev (MUST be this exact value)
SUPABASE_URL = https://xxxxx.supabase.co (should be set)
SUPABASE_SERVICE_ROLE_KEY = xxxxx (should be set)
```

---

## Optional: Setup Telegram OTP

### Get Bot Token
1. Open Telegram
2. Search for `@BotFather`
3. Send `/newbot`
4. Follow prompts
5. Copy bot token

### Add to Supabase
Go to: **Supabase Dashboard** → **Edge Functions** → **Secrets**
```
TELEGRAM_BOT_TOKEN = 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### Test Telegram OTP
1. Get your Chat ID from `@userinfobot`
2. Go to login page
3. Check "Send OTP via Telegram"
4. Enter your Chat ID
5. Click "Send OTP to Telegram"
6. Check Telegram messages

---

## Troubleshooting Commands

### View Edge Function Logs
```bash
supabase functions logs send-otp
```

### Test Edge Function Directly
```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"email": "test@example.com"}'
```

---

## Success Checklist

- [ ] Edge Function deployed
- [ ] FROM_EMAIL set to `onboarding@resend.dev`
- [ ] Email OTP working
- [ ] Frontend deployed to Vercel
- [ ] Production tested
- [ ] (Optional) Telegram OTP configured and tested

---

## Need Help?

- Read `DEPLOYMENT_CHECKLIST.md` for detailed steps
- Read `TELEGRAM_OTP_SETUP.md` for Telegram setup
- Read `IMPLEMENTATION_SUMMARY.md` for technical details
- Check Supabase Edge Function logs
- Check Resend dashboard logs
