-- =============================================================================
-- Telegram OTP Token System
-- =============================================================================
-- This table stores temporary tokens for Telegram OTP flow
-- Users click "Send OTP via Telegram" → Get redirected to bot with token
-- Bot verifies token and sends OTP directly to user's Telegram

CREATE TABLE IF NOT EXISTS public.telegram_otp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  chat_id TEXT,
  otp_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_telegram_tokens_token ON public.telegram_otp_tokens(token) WHERE used = false;
CREATE INDEX IF NOT EXISTS idx_telegram_tokens_email ON public.telegram_otp_tokens(email, used) WHERE used = false;
CREATE INDEX IF NOT EXISTS idx_telegram_tokens_expires ON public.telegram_otp_tokens(expires_at) WHERE used = false;

-- RLS Policies (no public access - only Edge Functions can access)
ALTER TABLE public.telegram_otp_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to telegram_otp_tokens" ON public.telegram_otp_tokens
  FOR ALL USING (false);

-- Cleanup old tokens (auto-delete after 1 hour)
CREATE OR REPLACE FUNCTION cleanup_expired_telegram_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM public.telegram_otp_tokens
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.telegram_otp_tokens IS 'Temporary tokens for Telegram OTP flow - auto-expire after 10 minutes';
