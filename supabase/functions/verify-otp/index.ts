/**
 * verify-otp Edge Function
 *
 * Validates the OTP, then uses Supabase Admin API to generate
 * a magic-link token_hash so the frontend can create a real session.
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
    const { email, otp } = await req.json();

    if (!email || typeof email !== "string") return json({ error: "Email is required" }, 400);
    if (!otp || typeof otp !== "string") return json({ error: "OTP is required" }, 400);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim();

    if (!/^\d{6}$/.test(normalizedOtp)) {
      return json({ error: "OTP must be a 6-digit number" }, 400);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // ── Look up the most recent unused, unexpired OTP ────────────────────────
    const { data: otpRecord, error: fetchErr } = await supabase
      .from("otp_codes")
      .select("id, otp_code, expires_at, used, verify_attempts")
      .eq("email", normalizedEmail)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchErr || !otpRecord) {
      return json({ error: "No active OTP found. Please request a new code." }, 400);
    }

    // ── Check expiry ─────────────────────────────────────────────────────────
    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabase.from("otp_codes").update({ used: true }).eq("id", otpRecord.id);
      return json({ error: "OTP has expired. Please request a new code." }, 400);
    }

    // ── Check attempts ───────────────────────────────────────────────────────
    const attempts = (otpRecord.verify_attempts ?? 0) + 1;
    if (attempts > 5) {
      await supabase.from("otp_codes").update({ used: true }).eq("id", otpRecord.id);
      return json({ error: "Too many incorrect attempts. Please request a new code." }, 429);
    }

    // ── Verify OTP ───────────────────────────────────────────────────────────
    if (otpRecord.otp_code !== normalizedOtp) {
      await supabase.from("otp_codes").update({ verify_attempts: attempts }).eq("id", otpRecord.id);
      const remaining = 5 - attempts;
      return json({
        error: remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Too many incorrect attempts. Please request a new code.",
      }, 400);
    }

    // ── Mark OTP as used ─────────────────────────────────────────────────────
    await supabase.from("otp_codes").update({ used: true }).eq("id", otpRecord.id);

    // ── Ensure user exists in Supabase Auth ──────────────────────────────────
    const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!existingUser) {
      const { error: createErr } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
      });
      if (createErr) {
        console.error("Failed to create user:", createErr.message);
        return json({ error: "Failed to create account. Please try again." }, 500);
      }
    }

    // ── Generate magic-link token for session creation ───────────────────────
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
    });

    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error("Failed to generate magic link:", linkErr?.message);
      return json({ error: "Failed to create session. Please try again." }, 500);
    }

    console.log(`OTP verified for ${normalizedEmail}`);
    return json({ success: true, token_hash: linkData.properties.hashed_token });

  } catch (err) {
    console.error("verify-otp error:", err);
    return json({ error: "An unexpected error occurred. Please try again." }, 500);
  }
});
