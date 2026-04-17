/**
 * send-otp Edge Function
 *
 * Generates a 6-digit OTP, stores it in the `otp_codes` table with a 10-minute
 * expiry, then sends it via Resend using the verified domain email.
 *
 * Rate limiting: max 3 requests per email per 10-minute window (enforced in DB).
 *
 * Required Supabase secrets (set via `supabase secrets set`):
 *   RESEND_API_KEY   — your Resend API key
 *   FROM_EMAIL       — verified sender address (e.g. noreply@dopedeal.store)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS_PER_WINDOW = 3;
const WINDOW_MINUTES = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    // ── Input validation ────────────────────────────────────────────────────
    if (!email || typeof email !== "string") {
      return json({ error: "Email is required" }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return json({ error: "Invalid email address" }, 400);
    }

    // ── Environment ─────────────────────────────────────────────────────────
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "noreply@dopedeal.store";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY secret is not set");
      return json({ error: "Email service not configured. Please contact support." }, 500);
    }

    // ── Supabase admin client (service role — bypasses RLS for otp_codes) ───
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // ── Server-side rate limiting ────────────────────────────────────────────
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count, error: countErr } = await supabase
      .from("otp_codes")
      .select("*", { count: "exact", head: true })
      .eq("email", normalizedEmail)
      .gte("created_at", windowStart);

    if (countErr) {
      console.error("Rate limit check error:", countErr);
      // Fail open — don't block the user on a DB error
    } else if ((count ?? 0) >= MAX_ATTEMPTS_PER_WINDOW) {
      return json(
        { error: `Too many OTP requests. Please wait ${WINDOW_MINUTES} minutes before trying again.` },
        429
      );
    }

    // ── Generate OTP ─────────────────────────────────────────────────────────
    const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // ── Store OTP in database ────────────────────────────────────────────────
    // Invalidate any previous unused OTPs for this email first
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("email", normalizedEmail)
      .eq("used", false);

    const { error: insertErr } = await supabase.from("otp_codes").insert({
      email: normalizedEmail,
      otp_code: otp,
      expires_at: expiresAt,
      used: false,
    });

    if (insertErr) {
      console.error("OTP insert error:", insertErr);
      return json({ error: "Failed to generate OTP. Please try again." }, 500);
    }

    // ── Send email via Resend ────────────────────────────────────────────────
    const emailBody = {
      from: `DopeDeal <${FROM_EMAIL}>`,
      to: [normalizedEmail],
      subject: "Your DopeDeal Login Code",
      html: buildOtpEmail(otp, OTP_EXPIRY_MINUTES),
      text: `Your DopeDeal login code is: ${otp}\n\nThis code expires in ${OTP_EXPIRY_MINUTES} minutes.\n\nIf you didn't request this, please ignore this email.`,
    };

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailBody),
    });

    if (!resendRes.ok) {
      const resendError = await resendRes.text();
      console.error("Resend API error:", resendRes.status, resendError);

      // Clean up the OTP we just stored since we couldn't send it
      await supabase
        .from("otp_codes")
        .update({ used: true })
        .eq("email", normalizedEmail)
        .eq("otp_code", otp);

      if (resendRes.status === 422) {
        return json(
          { error: "Email delivery failed. Please check your email address and try again." },
          422
        );
      }
      return json({ error: "Failed to send OTP email. Please try again." }, 500);
    }

    console.log(`OTP sent successfully to ${normalizedEmail}`);
    return json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("send-otp error:", err);
    return json({ error: "An unexpected error occurred. Please try again." }, 500);
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildOtpEmail(otp: string, expiryMinutes: number): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your DopeDeal Login Code</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#111;border-radius:16px;overflow:hidden;border:1px solid #222;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#f97316,#ef4444);padding:32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                🔥 DopeDeal
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                Your login verification code
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;text-align:center;">
              <p style="margin:0 0 24px;color:#a1a1aa;font-size:15px;line-height:1.6;">
                Use the code below to sign in to your DopeDeal account.
              </p>
              <!-- OTP Code -->
              <div style="background:#1a1a1a;border:2px dashed #f97316;border-radius:12px;padding:24px;margin:0 0 24px;">
                <p style="margin:0 0 8px;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:1px;">
                  Your one-time code
                </p>
                <p style="margin:0;color:#fff;font-size:42px;font-weight:800;letter-spacing:12px;font-family:monospace;">
                  ${otp}
                </p>
              </div>
              <p style="margin:0 0 8px;color:#71717a;font-size:13px;">
                ⏱ This code expires in <strong style="color:#f97316;">${expiryMinutes} minutes</strong>
              </p>
              <p style="margin:0;color:#52525b;font-size:12px;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #222;text-align:center;">
              <p style="margin:0;color:#52525b;font-size:12px;">
                © ${new Date().getFullYear()} DopeDeal · Earn Daily Rewards & Exclusive Deals
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
