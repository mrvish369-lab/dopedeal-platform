/**
 * verify-otp — Minimal version using direct REST calls (no esm.sh imports)
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
    const { email, otp } = await req.json();

    if (!email || typeof email !== "string") return jsonResp({ error: "Email is required" }, 400);
    if (!otp || typeof otp !== "string") return jsonResp({ error: "OTP is required" }, 400);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim();

    if (!/^\d{6}$/.test(normalizedOtp)) {
      return jsonResp({ error: "OTP must be a 6-digit number" }, 400);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const dbHeaders = {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    };

    // Look up the most recent unused, unexpired OTP
    const otpRes = await fetch(
      `${SUPABASE_URL}/rest/v1/otp_codes?email=eq.${encodeURIComponent(normalizedEmail)}&used=eq.false&order=created_at.desc&limit=1`,
      { headers: { ...dbHeaders, "Prefer": "return=representation" } }
    );

    const otpRows = await otpRes.json();
    const otpRecord = Array.isArray(otpRows) ? otpRows[0] : null;

    if (!otpRecord) {
      return jsonResp({ error: "No active OTP found. Please request a new code." }, 400);
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/otp_codes?id=eq.${otpRecord.id}`,
        { method: "PATCH", headers: { ...dbHeaders, "Prefer": "return=minimal" }, body: JSON.stringify({ used: true }) }
      );
      return jsonResp({ error: "OTP has expired. Please request a new code." }, 400);
    }

    // Check attempts
    const attempts = (otpRecord.verify_attempts ?? 0) + 1;
    if (attempts > 5) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/otp_codes?id=eq.${otpRecord.id}`,
        { method: "PATCH", headers: { ...dbHeaders, "Prefer": "return=minimal" }, body: JSON.stringify({ used: true }) }
      );
      return jsonResp({ error: "Too many incorrect attempts. Please request a new code." }, 429);
    }

    // Verify OTP value
    if (otpRecord.otp_code !== normalizedOtp) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/otp_codes?id=eq.${otpRecord.id}`,
        { method: "PATCH", headers: { ...dbHeaders, "Prefer": "return=minimal" }, body: JSON.stringify({ verify_attempts: attempts }) }
      );
      const remaining = 5 - attempts;
      return jsonResp({
        error: remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Too many incorrect attempts. Please request a new code.",
      }, 400);
    }

    // Mark OTP as used
    await fetch(
      `${SUPABASE_URL}/rest/v1/otp_codes?id=eq.${otpRecord.id}`,
      { method: "PATCH", headers: { ...dbHeaders, "Prefer": "return=minimal" }, body: JSON.stringify({ used: true }) }
    );

    // Use Supabase Admin API to generate magic link token
    const linkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    // Generate magic link for the email
    const magicRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "magiclink",
        email: normalizedEmail,
      }),
    });

    if (!magicRes.ok) {
      const magicErr = await magicRes.text();
      console.error("Magic link error:", magicRes.status, magicErr);
      return jsonResp({ error: "Failed to create session. Please try again." }, 500);
    }

    const magicData = await magicRes.json();
    const tokenHash = magicData?.properties?.hashed_token ?? magicData?.hashed_token;

    if (!tokenHash) {
      console.error("No token_hash in response:", JSON.stringify(magicData));
      return jsonResp({ error: "Failed to create session. Please try again." }, 500);
    }

    console.log(`OTP verified for ${normalizedEmail}`);
    return jsonResp({ success: true, token_hash: tokenHash });

  } catch (err) {
    console.error("verify-otp error:", err);
    return jsonResp({ error: "An unexpected error occurred. Please try again." }, 500);
  }
});
