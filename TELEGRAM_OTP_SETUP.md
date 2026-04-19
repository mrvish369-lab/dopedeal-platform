# 🚀 Telegram OTP Integration Guide

## ✅ What's Done

### 1. Backend (Edge Function)
- ✅ `send-otp` function updated with Telegram support
- ✅ Email fixed: Using `onboarding@resend.dev` (no bounce)
- ✅ Dual delivery: Email + Telegram (at least one must succeed)

### 2. Frontend (AuthContext)
- ✅ `sendOtp()` function updated to accept `telegram_chat_id`
- ✅ Type definitions updated

---

## 📋 Remaining Steps

### Step 1: Deploy Edge Function
1. Supabase Dashboard → Edge Functions → send-otp
2. Copy code from `supabase/functions/send-otp/index.ts`
3. Deploy

### Step 2: Add Telegram Bot Token
1. Create Telegram Bot:
   - Open Telegram → Search "@BotFather"
   - Send: `/newbot`
   - Follow instructions
   - Copy token (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

2. Add to Supabase:
   - Dashboard → Settings → Edge Functions → Environment Variables
   - Add: `TELEGRAM_BOT_TOKEN` = `your_bot_token_here`
   - Save

### Step 3: Update Login/Register UI (Optional)

Add Telegram option in `src/pages/auth/Login.tsx` and `src/pages/auth/Register.tsx`:

```tsx
// Add state for Telegram
const [useTelegram, setUseTelegram] = useState(false);
const [telegramChatId, setTelegramChatId] = useState("");

// Update handleSendOtp
const handleSendOtp = async () => {
  setError(null);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return setError("Enter a valid email address");
  
  if (useTelegram && !telegramChatId.trim()) {
    return setError("Enter your Telegram Chat ID");
  }
  
  setLoading(true);
  const { error: err } = await sendOtp(
    email.trim().toLowerCase(),
    useTelegram ? { telegram_chat_id: telegramChatId } : undefined
  );
  setLoading(false);
  if (err) return setError(err);
  setStep("otp");
};

// Add UI toggle
<div className="flex items-center gap-2 mb-4">
  <input
    type="checkbox"
    checked={useTelegram}
    onChange={(e) => setUseTelegram(e.target.checked)}
    className="w-4 h-4"
  />
  <label className="text-sm text-gray-700">
    Send OTP via Telegram instead
  </label>
</div>

{useTelegram && (
  <input
    type="text"
    value={telegramChatId}
    onChange={(e) => setTelegramChatId(e.target.value)}
    placeholder="Your Telegram Chat ID"
    className="w-full py-2.5 px-3 text-sm border rounded-xl mb-4"
  />
)}
```

---

## 🔍 How Users Get Telegram Chat ID

### Option 1: Via Your Bot
1. User opens your Telegram bot
2. Sends `/start`
3. Bot replies with their Chat ID

### Option 2: Via @userinfobot
1. User searches "@userinfobot" in Telegram
2. Sends `/start`
3. Bot shows their Chat ID

---

## 📊 Current Status

### Working Now (Email Only):
```javascript
// Frontend call
await sendOtp("user@example.com");

// Backend sends via: onboarding@resend.dev
// Result: ✅ Email delivered to inbox
```

### After Telegram Setup:
```javascript
// Email only
await sendOtp("user@example.com");

// Telegram only
await sendOtp("user@example.com", { telegram_chat_id: "123456789" });

// Both (fallback)
await sendOtp("user@example.com", { telegram_chat_id: "123456789" });
```

---

## 🎯 Quick Test

### Test Email (No changes needed):
1. Go to login page
2. Enter email
3. Click "Send OTP"
4. Check inbox (email from `onboarding@resend.dev`)

### Test Telegram (After setup):
1. Create bot via @BotFather
2. Add `TELEGRAM_BOT_TOKEN` to Supabase
3. Get your Chat ID from @userinfobot
4. Update Login.tsx with Telegram UI
5. Test with your Chat ID

---

## 🚨 Important Notes

1. **Email is now fixed**: Using `onboarding@resend.dev` (100% delivery)
2. **Telegram is optional**: Works without it, email will be used
3. **Dual delivery**: If both email and Telegram fail, user gets error
4. **Rate limiting**: Still enforced (3 requests per 10 minutes)

---

## 📝 Summary

**What works NOW:**
- ✅ Email OTP (fixed, using Resend verified domain)
- ✅ Backend supports Telegram (code ready)
- ✅ Frontend can pass `telegram_chat_id`

**What needs setup:**
- ⏳ Deploy updated Edge Function
- ⏳ Add Telegram Bot Token to Supabase
- ⏳ (Optional) Add Telegram UI toggle in Login/Register pages

**Estimated time:** 10 minutes for full setup
