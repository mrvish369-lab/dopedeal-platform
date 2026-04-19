# 🚀 Telegram Bot OTP - Quick Setup (5 Steps)

## ✅ Already Done (Automated)
- ✅ Database migration created
- ✅ Edge Functions created
- ✅ Frontend updated (Telegram primary, Email secondary)
- ✅ Code pushed to GitHub
- ✅ Vercel deployment triggered

---

## ⏳ Manual Steps (15 minutes)

### Step 1: Run Database Migration (2 min)
```bash
supabase db push
```

### Step 2: Deploy Edge Functions (3 min)
```bash
supabase functions deploy generate-telegram-token
supabase functions deploy telegram-webhook
```

### Step 3: Get Your Bot Username (2 min)
1. Open Telegram
2. Search for your bot (jo tumne BotFather se banaya tha)
3. Bot ka username copy karo (e.g., `DopeDealOTPBot`)

### Step 4: Update Bot Username in Code (3 min)

**File 1:** `src/pages/auth/Login.tsx` (line ~30)
```typescript
const botUsername = "YOUR_BOT_USERNAME_HERE"; // ← Apna bot username yaha
```

**File 2:** `src/pages/auth/Register.tsx` (line ~50)
```typescript
const botUsername = "YOUR_BOT_USERNAME_HERE"; // ← Apna bot username yaha
```

**Commit and push:**
```bash
git add src/pages/auth/Login.tsx src/pages/auth/Register.tsx
git commit -m "chore: update Telegram bot username"
git push origin main
```

### Step 5: Setup Telegram Webhook (5 min)

**Replace these values:**
- `<BOT_TOKEN>` = Your bot token from BotFather
- `<PROJECT_ID>` = `oyvumfznbsidngombidu`

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://<PROJECT_ID>.supabase.co/functions/v1/telegram-webhook"}'
```

**Example:**
```bash
curl -X POST "https://api.telegram.org/bot123456:ABCdef/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://oyvumfznbsidngombidu.supabase.co/functions/v1/telegram-webhook"}'
```

**Success Response:**
```json
{"ok":true,"result":true}
```

---

## 🧪 Test It

### 1. Open Your App
Go to login page

### 2. Enter Email
Type your email

### 3. Click "Send OTP via Telegram"
Button will open Telegram

### 4. Click "START" in Telegram
Bot will send OTP

### 5. Copy OTP
From Telegram message

### 6. Paste on Website
Enter OTP and login

---

## 🎯 What Changed

### Before (Old System)
- ❌ User had to manually get Chat ID
- ❌ Confusing for users
- ❌ Email OTP not working

### After (New System)
- ✅ One-click Telegram redirect
- ✅ Bot automatically sends OTP
- ✅ No Chat ID required
- ✅ Email as fallback (Beta)

---

## 📝 Summary

**Automated:**
- ✅ Code implemented
- ✅ Pushed to GitHub
- ✅ Vercel deploying

**Manual (15 min):**
1. ⏳ Run migration
2. ⏳ Deploy Edge Functions
3. ⏳ Update bot username
4. ⏳ Setup webhook
5. ⏳ Test

**Files to Read:**
- `TELEGRAM_BOT_DEPLOYMENT.md` - Detailed guide
- This file - Quick reference

---

**Ready to deploy!** 🚀
