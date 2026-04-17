/**
 * send-otp — Minimal version using direct REST calls (no esm.sh imports)
 * This avoids any import timeout issues in the Deno runtime.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResp(body: Record<string, unknown>, status = 200): Response {
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
      return jsonResp({ error: "Email is required" }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return jsonResp({ error: "Invalid email address" }, 400);
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "noreply@dopedeal.store";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY secret is not set");
      return jsonResp({ error: "Email service not configured." }, 500);
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Invalidate old OTPs via Supabase REST API (no SDK needed)
    await fetch(
      `${SUPABASE_URL}/rest/v1/otp_codes?email=eq.${encodeURIComponent(normalizedEmail)}&used=eq.false`,
      {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ used: true }),
      }
    );

    // Insert new OTP via Supabase REST API
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/otp_codes`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        email: normalizedEmail,
        otp_code: otp,
        expires_at: expiresAt,
        used: false,
      }),
    });

    if (!insertRes.ok) {
      const insertErr = await insertRes.text();
      console.error("OTP insert failed:", insertRes.status, insertErr);
      return jsonResp({ error: "Failed to generate OTP. Please try again." }, 500);
    }

    // Send email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
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
    <p style="margin:16px 0 0;color:#52525b;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
  </div>
  <div style="padding:20px 32px;border-top:1px solid #222;text-align:center;">
    <p style="margin:0;color:#52525b;font-size:12px;">© ${new Date().getFullYear()} DopeDeal · Earn Daily Rewards</p>
  </div>
</div>`,
        text: `Your DopeDeal login code is: ${otp}\n\nExpires in 10 minutes.\n\nIf you didn't request this, ignore this email.`,
      }),
    });

    if (!emailRes.ok) {
      const emailErr = await emailRes.text();
      console.error("Resend error:", emailRes.status, emailErr);
      // Clean up OTP since email failed
      await fetch(
        `${SUPABASE_URL}/rest/v1/otp_codes?email=eq.${encodeURIComponent(normalizedEmail)}&otp_code=eq.${otp}`,
        {
          method: "PATCH",
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({ used: true }),
        }
      );
      return jsonResp({ error: "Failed to send OTP email. Please try again." }, 500);
    }

    console.log(`OTP sent successfully to ${normalizedEmail}`);
    return jsonResp({ success: true, message: "OTP sent successfully" });

  } catch (err) {
    console.error("send-otp unexpected error:", err);
    return jsonResp({ error: "An unexpected error occurred. Please try again." }, 500);
  }
});
