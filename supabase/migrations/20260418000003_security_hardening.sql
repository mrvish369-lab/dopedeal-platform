-- =============================================================================
-- Security Hardening: OTP Rate Limiting Index
-- =============================================================================

-- ── 1. Add OTP rate limit index for efficient rate limit queries ─────────────
-- This index enables fast lookups of recent OTP requests per email address
-- Used by send-otp Edge Function to enforce 3 requests per 10-minute window
CREATE INDEX IF NOT EXISTS idx_otp_codes_email_created_at 
  ON public.otp_codes (email, created_at DESC) 
  WHERE used = false;

COMMENT ON INDEX idx_otp_codes_email_created_at IS 'Supports OTP rate limiting queries (3 requests per email per 10 minutes)';
