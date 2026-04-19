/**
 * send-otp — Ultra-minimal version for debugging
 * No imports, no DB calls, just Resend directly
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const email = body?.email;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Get env vars
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@dopedeal.store";

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Send email via Resend - direct fetch, no imports needed
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DopeDeal <" + FROM_EMAIL + ">",
        to: [normalizedEmail],
        reply_to: FROM_EMAIL,
        subject: "Your DopeDeal Login Code: " + otp,
        html: "<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head><body style='margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5'><table width='100%' cellpadding='0' cellspacing='0' style='background-color:#f5f5f5;padding:20px'><tr><td align='center'><table width='600' cellpadding='0' cellspacing='0' style='background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)'><tr><td style='background-color:#f97316;padding:30px;text-align:center'><h1 style='margin:0;color:#ffffff;font-size:28px'>🔥 DopeDeal</h1></td></tr><tr><td style='padding:40px 30px'><h2 style='margin:0 0 20px 0;color:#333333;font-size:24px'>Your Login Code</h2><p style='margin:0 0 30px 0;color:#666666;font-size:16px;line-height:1.5'>Use this one-time code to complete your sign-in:</p><div style='background-color:#f8f8f8;border:2px solid #f97316;border-radius:8px;padding:20px;text-align:center;margin:0 0 30px 0'><span style='font-size:36px;font-weight:bold;letter-spacing:8px;color:#333333;font-family:monospace'>" + otp + "</span></div><p style='margin:0 0 10px 0;color:#999999;font-size:14px'>This code expires in 10 minutes.</p><p style='margin:0;color:#999999;font-size:14px'>If you didn't request this code, please ignore this email.</p></td></tr><tr><td style='background-color:#f8f8f8;padding:20px 30px;text-align:center;border-top:1px solid #eeeeee'><p style='margin:0;color:#999999;font-size:12px'>© 2026 DopeDeal. All rights reserved.</p></td></tr></table></td></tr></table></body></html>",
        text: "DopeDeal Login Code\n\nYour one-time code: " + otp + "\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\n© 2026 DopeDeal",
      }),
    });

    if (!resendResponse.ok) {
      const errText = await resendResponse.text();
      return new Response(JSON.stringify({ error: "Email send failed: " + errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store OTP in DB (best-effort, don't crash if it fails)
    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // Invalidate old OTPs
        await fetch(SUPABASE_URL + "/rest/v1/otp_codes?email=eq." + encodeURIComponent(normalizedEmail) + "&used=eq.false", {
          method: "PATCH",
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({ used: true }),
        });

        // Insert new OTP
        await fetch(SUPABASE_URL + "/rest/v1/otp_codes", {
          method: "POST",
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
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
      }
    } catch (dbErr) {
      // DB storage failed but email was sent - log and continue
      console.error("DB storage error (non-fatal):", dbErr);
    }

    return new Response(JSON.stringify({ success: true, message: "OTP sent successfully" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("send-otp error:", err);
    return new Response(JSON.stringify({ error: "Unexpected error: " + String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
