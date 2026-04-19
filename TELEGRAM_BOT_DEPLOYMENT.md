# 🤖 Telegram Bot OTP System - Deployment Guide

## ✅ What's Implemented

### Primary OTP Method: Telegram Bot
- User clicks "Send OTP via Telegram"
- Opens Telegram bot with unique token
- Bot sends OTP directly to user
- User enters OTP on website

### Secondary Method: Email (Beta)
- Small link at bottom: "Use Email (Beta - May not work reliably)"
- Only for fallback if Telegram doesn't work

---

## 🚀 Deployment Steps

### Step 1: Run Database Migration

```bash
# Terminal me ye command run karo
supabase db push
```

Ya manually SQL run karo Supabase Dashboard me:
- File: `supabase/migrations/20260419000001_telegram_otp_tokens.sql`

### Step 2: Deploy Edge Functions

```bash
# Generate Telegram Token function
supabase functions deploy generate-telegram-token

# Telegram Webhook function
supabase functions deploy telegram-webhook
```

### Step 3: Setup Telegram Bot

#### 3.1 Create Bot (If Not Already Created)
1. Open Telegram
2. Search for `@BotFather`
3. Send `/newbot`
4. Name: `DopeDeal OTP Bot`
5. Username: `DopeDealOTPBot` (ya jo bhi available ho)
6. Copy bot token

#### 3.2 Set Bot Username in Code

**IMPORTANT:** Apne bot ka username update karo:

**File:** `src/pages/auth/Login.tsx` (line ~30)
```typescript
const botUsername = "DopeDealOTPBot"; // ← Apna bot username yaha daalo
```

**File:** `src/pages/auth/Register.tsx` (line ~50)
```typescript
const botUsername = "DopeDealOTPBot"; // ← Apna bot username yaha daalo
```

#### 3.3 Setup Webhook

Telegram bot ko webhook se connect karo:

```bash
# Replace with your values:
# BOT_TOKEN = your bot token from BotFather
# WEBHOOK_URL = https://your-project.supabase.co/functions/v1/telegram-webhook

curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "<WEBHOOK_URL>"}'
```

**Example:**
```bash
curl -X POST "https://api.telegram.org/bot123456:ABCdef/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://oyvumfznbsidngombidu.supabase.co/functions/v1/telegram-webhook"}'
```

**Success Response:**
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

#### 3.4 Verify Webhook

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

**Expected Response:**
```json
{
  "ok": true,
  "result": {
    "url": "https://your-project.supabase.co/functions/v1/telegram-webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

### Step 4: Update Supabase Config

**File:** `supabase/config.toml`

Add these functions:

```toml
[functions.generate-telegram-token]
verify_jwt = false

[functions.telegram-webhook]
verify_jwt = false
```

### Step 5: Deploy Frontend

```bash
npm run build
git add .
git commit -m "feat: implement Telegram bot OTP as primary method"
git push origin main
```

Vercel will auto-deploy.

---

## 🎯 User Flow

### 1. Login/Signup Page
```
User enters email
↓
Clicks "Send OTP via Telegram"
↓
New tab opens: https://t.me/DopeDealOTPBot?start=abc123
```

### 2. Telegram Bot
```
User clicks "START" button
↓
Bot sends: "🔥 DopeDeal Login Code
Your OTP: 123456
✅ Valid for 10 minutes"
```

### 3. Website
```
User copies OTP from Telegram
↓
Pastes in website
↓
Login/Signup complete
```

---

## 🔧 Configuration

### Environment Variables (Already Set)
- ✅ `TELEGRAM_BOT_TOKEN` (you added this)
- ✅ `FROM_EMAIL` (you added this)
- ✅ `RESEND_API_KEY` (already set)
- ✅ `SUPABASE_URL` (already set)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (already set)

### Bot Username Update Required
**CRITICAL:** Update bot username in both files:
- `src/pages/auth/Login.tsx` (line ~30)
- `src/pages/auth/Register.tsx` (line ~50)

Change:
```typescript
const botUsername = "DopeDealOTPBot"; // ← Your actual bot username
```

---

## 🧪 Testing

### Test Telegram OTP (Primary)
1. Open login page
2. Enter email
3. Click "Send OTP via Telegram"
4. Telegram opens with bot
5. Click "START"
6. Bot sends OTP
7. Copy OTP
8. Paste on website
9. Login successful

### Test Email OTP (Secondary)
1. Open login page
2. Click small link: "Use Email (Beta - May not work reliably)"
3. Enter email
4. Click "Send OTP via Email"
5. Check email (may not work)

---

## 📊 Database Schema

### New Table: `telegram_otp_tokens`
```sql
- id: UUID (primary key)
- email: TEXT (user's email)
- token: TEXT (unique token for Telegram link)
- chat_id: TEXT (user's Telegram chat ID)
- otp_code: TEXT (generated OTP)
- created_at: TIMESTAMPTZ
- expires_at: TIMESTAMPTZ (10 minutes)
- used: BOOLEAN
```

### Existing Table: `otp_codes`
- Still used for OTP verification
- Works with both Telegram and Email OTPs

---

## 🔍 Troubleshooting

### Telegram Bot Not Responding
1. Check webhook is set: `curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"`
2. Check Edge Function logs in Supabase
3. Verify `TELEGRAM_BOT_TOKEN` is set correctly

### "Invalid or expired link" Error
1. Token expires in 10 minutes
2. Request new OTP from website
3. Check database: `SELECT * FROM telegram_otp_tokens WHERE used = false`

### OTP Not Received in Telegram
1. User must click "START" button
2. Check bot username is correct in code
3. Check Edge Function logs
4. Verify webhook is working

### Email OTP Not Working
- Expected behavior (Beta warning shown)
- Use Telegram as primary method
- Email is fallback only

---

## ✨ Summary

**Primary Method:** Telegram Bot (Recommended)
- ✅ Fast delivery
- ✅ Reliable
- ✅ No email issues
- ✅ Better UX

**Secondary Method:** Email (Beta)
- ⚠️ May not work reliably
- ⚠️ Gmail bouncing issues
- ⚠️ Only for fallback

**Deployment:**
1. ✅ Run migration
2. ✅ Deploy Edge Functions
3. ✅ Setup Telegram webhook
4. ✅ Update bot username in code
5. ✅ Deploy frontend

**Time:** 15-20 minutes

---

## 📝 Quick Commands

```bash
# Database migration
supabase db push

# Deploy Edge Functions
supabase functions deploy generate-telegram-token
supabase functions deploy telegram-webhook

# Set webhook (replace values)
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://<PROJECT>.supabase.co/functions/v1/telegram-webhook"}'

# Deploy frontend
npm run build
git add .
git commit -m "feat: Telegram bot OTP as primary"
git push origin main
```

---

**Ready to deploy!** 🚀
