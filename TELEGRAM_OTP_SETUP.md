# Telegram OTP Setup Guide

DopeDeal supports OTP delivery via Telegram as an alternative to email. This guide explains how to set up and use Telegram OTP.

## For Users: How to Get Your Telegram Chat ID

1. **Open Telegram** on your phone or desktop
2. **Search for @userinfobot** in the Telegram search bar
3. **Start a chat** with @userinfobot by clicking "Start"
4. The bot will automatically send you a message containing your **Chat ID**
5. **Copy your Chat ID** (it will be a number like `123456789`)
6. Use this Chat ID when signing up or logging in to DopeDeal

## For Developers: Backend Setup

### 1. Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Start a chat and send `/newbot`
3. Follow the prompts to:
   - Choose a name for your bot (e.g., "DopeDeal OTP Bot")
   - Choose a username (must end in "bot", e.g., "dopedeal_otp_bot")
4. **Copy the Bot Token** provided by BotFather (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Configure Supabase Edge Function

1. Go to your **Supabase Dashboard**
2. Navigate to **Edge Functions** → **Secrets**
3. Add the following secret:
   - **Name**: `TELEGRAM_BOT_TOKEN`
   - **Value**: Your bot token from BotFather

### 3. Deploy the Edge Function

Deploy the updated `send-otp` Edge Function:

```bash
supabase functions deploy send-otp
```

### 4. Test the Integration

Test with a sample request:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "email": "test@example.com",
    "telegram_chat_id": "YOUR_CHAT_ID"
  }'
```

## How It Works

### Dual Delivery Mode

When a user provides their Telegram Chat ID:
- OTP is sent to **both Email and Telegram**
- If either delivery succeeds, the request is considered successful
- This provides redundancy and better reliability

### Email-Only Mode

When no Telegram Chat ID is provided:
- OTP is sent to **Email only** (default behavior)
- Works exactly as before

### Frontend Integration

The Login and Register pages now include:
- A checkbox to enable Telegram OTP delivery
- An input field for Telegram Chat ID (shown when checkbox is enabled)
- A link to @userinfobot for users to get their Chat ID
- Dynamic button text showing the selected delivery method

## Security Considerations

### Chat ID Privacy
- Chat IDs are **not stored** in the database
- They are only used for the current OTP delivery
- Users must provide their Chat ID each time they want Telegram delivery

### Bot Token Security
- Bot token is stored as a **Supabase secret** (encrypted)
- Never expose the bot token in client-side code
- Only the Edge Function has access to the token

### Rate Limiting
- The same rate limiting rules apply to Telegram OTP as email OTP
- 3 OTP requests per email per 10-minute window (enforced server-side)
- Client-side cooldown of 60 seconds between requests

## Troubleshooting

### "Failed to deliver OTP via any channel"
- Check that `TELEGRAM_BOT_TOKEN` is set in Supabase secrets
- Verify the bot token is valid (test with BotFather)
- Check Edge Function logs for detailed error messages

### "Telegram message not received"
- Verify the Chat ID is correct (use @userinfobot to confirm)
- Make sure the user has **started a chat** with your bot first
- Check that the bot is not blocked by the user

### "Email not received"
- Verify `RESEND_API_KEY` is set in Supabase secrets
- Check `FROM_EMAIL` is set to `onboarding@resend.dev`
- Check Resend dashboard for delivery logs
- Ask user to check spam folder

## API Reference

### Send OTP Request

**Endpoint**: `POST /functions/v1/send-otp`

**Request Body**:
```json
{
  "email": "user@example.com",
  "telegram_chat_id": "123456789"  // Optional
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "OTP sent via Email and Telegram",
  "delivery": {
    "email": true,
    "telegram": true
  }
}
```

**Response (Partial Success)**:
```json
{
  "success": true,
  "message": "OTP sent via Email",
  "delivery": {
    "email": true,
    "telegram": false
  }
}
```

**Response (Failure)**:
```json
{
  "error": "Failed to deliver OTP via any channel. Please try again."
}
```

## Environment Variables

### Required for Email OTP
- `RESEND_API_KEY` - Resend API key for email delivery
- `FROM_EMAIL` - Sender email address (use `onboarding@resend.dev`)

### Required for Telegram OTP
- `TELEGRAM_BOT_TOKEN` - Telegram bot token from BotFather

### Required for Database Storage
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access

## Support

For issues or questions:
- Check Supabase Edge Function logs for detailed error messages
- Verify all environment variables are set correctly
- Test email delivery separately from Telegram delivery
- Contact support@dopedeal.store for assistance
