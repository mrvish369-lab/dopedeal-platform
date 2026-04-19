# Deployment Checklist - OTP Delivery Fix & Telegram Support

## Current Status
- ✅ Edge Function code updated with dual delivery support (Email + Telegram)
- ✅ Frontend UI updated with Telegram toggle in Login and Register pages
- ✅ Documentation created (TELEGRAM_OTP_SETUP.md)
- ⏳ **Pending**: Edge Function deployment
- ⏳ **Pending**: Environment variable verification

---

## Step 1: Deploy Edge Function

### Deploy send-otp Edge Function

Run this command in your terminal:

```bash
supabase functions deploy send-otp
```

**Expected Output**:
```
Deploying function send-otp...
Function send-otp deployed successfully
```

---

## Step 2: Verify Environment Variables

Go to **Supabase Dashboard** → **Edge Functions** → **Secrets** and verify these are set:

### Required for Email OTP (CRITICAL)
- ✅ `RESEND_API_KEY` = `re_your_api_key_here`
- ✅ `FROM_EMAIL` = `onboarding@resend.dev` ⚠️ **Must use Resend's verified domain**

### Required for Telegram OTP (Optional)
- ⏳ `TELEGRAM_BOT_TOKEN` = `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
  - Get this from @BotFather on Telegram
  - See TELEGRAM_OTP_SETUP.md for instructions

### Required for Database Storage
- ✅ `SUPABASE_URL` = `https://your-project.supabase.co`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` = `your-service-role-key`

---

## Step 3: Test Email OTP Delivery

### Test Email-Only Mode

1. Go to your app's login page
2. Enter your email address
3. **Do NOT check** the "Send OTP via Telegram" checkbox
4. Click "Send OTP to Email"
5. Check your email inbox (and spam folder)
6. Verify you receive the OTP email

**Expected Result**: Email received within 1-2 minutes

**If email not received**:
- Check Resend dashboard logs: https://resend.com/emails
- Verify `FROM_EMAIL` is set to `onboarding@resend.dev`
- Check Supabase Edge Function logs for errors
- Verify `RESEND_API_KEY` is valid

---

## Step 4: Test Telegram OTP Delivery (Optional)

### Get Your Telegram Chat ID

1. Open Telegram
2. Search for `@userinfobot`
3. Start a chat and copy your Chat ID

### Test Telegram Mode

1. Go to your app's login page
2. Enter your email address
3. **Check** the "Send OTP via Telegram" checkbox
4. Enter your Telegram Chat ID
5. Click "Send OTP to Telegram"
6. Check your Telegram messages

**Expected Result**: 
- OTP sent to **both Email and Telegram**
- Telegram message received within seconds
- Email received within 1-2 minutes

**If Telegram message not received**:
- Verify `TELEGRAM_BOT_TOKEN` is set in Supabase secrets
- Make sure you've started a chat with your bot first
- Check Supabase Edge Function logs for errors
- Verify Chat ID is correct

---

## Step 5: Deploy Frontend Changes

### Build and Deploy to Vercel

```bash
# Build the project
npm run build

# Push to GitHub (triggers Vercel auto-deployment)
git add .
git commit -m "feat: add Telegram OTP support with dual delivery"
git push origin main
```

**Vercel will automatically**:
- Detect the push to main branch
- Build the project
- Deploy to production

---

## Step 6: Verify Production Deployment

1. Go to your production URL
2. Test login with email OTP
3. Test login with Telegram OTP (if configured)
4. Verify both delivery methods work

---

## Troubleshooting

### "Failed to deliver OTP via any channel"

**Possible Causes**:
1. `RESEND_API_KEY` not set or invalid
2. `FROM_EMAIL` not set to `onboarding@resend.dev`
3. Edge Function not deployed
4. Network connectivity issues

**Solution**:
1. Check Supabase Edge Function logs
2. Verify environment variables
3. Redeploy Edge Function
4. Test with curl command (see TELEGRAM_OTP_SETUP.md)

### Email Not Received

**Possible Causes**:
1. Gmail bouncing emails from custom domain
2. Email in spam folder
3. Resend API key invalid
4. FROM_EMAIL not using Resend's verified domain

**Solution**:
1. Use `onboarding@resend.dev` as FROM_EMAIL (Resend's verified domain)
2. Check Resend dashboard for delivery logs
3. Ask user to check spam folder
4. Verify RESEND_API_KEY is valid

### Telegram Message Not Received

**Possible Causes**:
1. `TELEGRAM_BOT_TOKEN` not set
2. User hasn't started chat with bot
3. Chat ID incorrect
4. Bot blocked by user

**Solution**:
1. Verify bot token in Supabase secrets
2. Ask user to start chat with bot first
3. Verify Chat ID with @userinfobot
4. Check Edge Function logs for detailed error

---

## Rollback Plan

If issues occur after deployment:

### Rollback Edge Function

```bash
# List previous deployments
supabase functions list

# Rollback to previous version (if needed)
# Note: Supabase doesn't have built-in rollback, so redeploy previous version
```

### Rollback Frontend

1. Go to Vercel Dashboard
2. Navigate to Deployments
3. Find the previous working deployment
4. Click "Promote to Production"

---

## Success Criteria

✅ Email OTP delivery works consistently
✅ Telegram OTP delivery works (if configured)
✅ Dual delivery provides redundancy
✅ Error messages are user-friendly
✅ No "Failed to deliver OTP via any channel" errors
✅ Users can successfully sign up and log in

---

## Next Steps After Successful Deployment

1. Monitor Supabase Edge Function logs for errors
2. Monitor Resend dashboard for email delivery metrics
3. Collect user feedback on OTP delivery reliability
4. Consider adding SMS OTP as third delivery option (future enhancement)

---

## Support

For issues or questions:
- Check Supabase Edge Function logs
- Check Resend dashboard logs
- Review TELEGRAM_OTP_SETUP.md
- Contact support@dopedeal.store
