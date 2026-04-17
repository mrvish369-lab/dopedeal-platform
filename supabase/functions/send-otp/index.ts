/**
 * send-otp Edge Function
 *
 * Generates a 6-digit OTP, stores it in the `otp_codes` table,
 * then sends it via Resend.
 *
 * Required secrets (set via Supabase Dashboard → Edge Functions → Secrets):
 *   RESEND_API_KEY  — your Resend API key
 *   FROM_EMAIL      — verified sender address (e.g. noreply@dopedeal.store)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return json({ error: "Email is required" }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return json({ error: "Invalid email address" }, 400);
    }

    // ── Get env vars ────────────────────────────────────────────────────────
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "noreply@dopedeal.store";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      return json({ error: "Email service not configured. Please contact support." }, 500);
    }

    // ── Supabase admin client ────────────────────────────────────────────────
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // ── Generate 6-digit OTP ─────────────────────────────────────────────────
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    // ── Invalidate old OTPs for this email ───────────────────────────────────
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("email", normalizedEmail)
      .eq("used", false);

    // ── Store new OTP ────────────────────────────────────────────────────────
    const { error: insertErr } = await supabase.from("otp_codes").insert({
      email: normalizedEmail,
      otp_code: otp,
      expires_at: expiresAt,
      used: false,
    });

    if (insertErr) {
      console.error("OTP insert error:", insertErr.message);
      return json({ error: "Failed to generate OTP. Please try again." }, 500);
    }

    // ── Send email via Resend ────────────────────────────────────────────────
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `DopeDeal <${FROM_EMAIL}>`,
        to: [normalizedEmail],
        subject: "Your DopeDeal Login Code",
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;background:#111;border-radius:16px;overflow:hidden;border:1px solid #222;">
            <div style="background:linear-gradient(135deg,#f97316,#ef4444);padding:32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;">🔥 DopeDeal</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your login verification code</p>
            </div>
            <div style="padding:40px 32px;text-align:center;">
              <p style="margin:0 0 24px;color:#a1a1aa;font-size:15px;">Use this code to sign in to your DopeDeal account.</p>
              <div style="background:#1a1a1a;border:2px dashed #f97316;border-radius:12px;padding:24px;margin:0 0 24px;">
                <p style="margin:0 0 8px;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:1px;">One-time code</p>
                <p style="margin:0;color:#fff;font-size:42px;font-weight:800;letter-spacing:12px;font-family:monospace;">${otp}</p>
              </div>
              <p style="margin:0;color:#71717a;font-size:13px;">⏱ Expires in <strong style="color:#f97316;">10 minutes</strong></p>
            </div>
            <div style="padding:20px 32px;border-top:1px solid #222;text-align:center;">
              <p style="margin:0;color:#52525b;font-size:12px;">© ${new Date().getFullYear()} DopeDeal</p>
            </div>
          </div>
        `,
        text: `Your DopeDeal login code is: ${otp}\n\nExpires in 10 minutes.\n\nIf you didn't request this, ignore this email.`,
      }),
    });

    if (!resendRes.ok) {
      const resendErr = await resendRes.text();
      console.error("Resend error:", resendRes.status, resendErr);

      // Clean up the OTP we stored since we couldn't send it
      await supabase.from("otp_codes").update({ used: true }).eq("email", normalizedEmail).eq("otp_code", otp);

      return json({ error: "Failed to send OTP email. Please try again." }, 500);
    }

    console.log(`OTP sent to ${normalizedEmail}`);
    return json({ success: true, message: "OTP sent successfully" });

  } catch (err) {
    console.error("send-otp error:", err);
    return json({ error: "An unexpected error occurred. Please try again." }, 500);
  }
});
