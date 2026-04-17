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
        subject: "Your DopeDeal Login Code: " + otp,
        html: "<div style='font-family:sans-serif;padding:32px;background:#111;color:#fff;border-radius:12px;max-width:400px;margin:0 auto'><h2 style='color:#f97316'>🔥 DopeDeal Login Code</h2><p style='color:#a1a1aa'>Your one-time login code is:</p><div style='background:#1a1a1a;border:2px dashed #f97316;border-radius:8px;padding:24px;text-align:center;margin:16px 0'><span style='font-size:36px;font-weight:800;letter-spacing:10px;font-family:monospace;color:#fff'>" + otp + "</span></div><p style='color:#71717a;font-size:13px'>Expires in 10 minutes. Do not share this code.</p></div>",
        text: "Your DopeDeal login code is: " + otp + "\n\nExpires in 10 minutes.",
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
