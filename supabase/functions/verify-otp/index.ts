/**
 * verify-otp Edge Function
 *
 * Validates the OTP submitted by the user against the `otp_codes` table,
 * then uses the Supabase Admin API to generate a magic-link token_hash so
 * the frontend can call `supabase.auth.verifyOtp({ token_hash, type: "email" })`
 * to create a real authenticated session.
 *
 * Required Supabase secrets:
 *   SUPABASE_URL              — project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service role key (never exposed to frontend)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_VERIFY_ATTEMPTS = 5; // per OTP record

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp } = await req.json();

    // ── Input validation ────────────────────────────────────────────────────
    if (!email || typeof email !== "string") {
      return json({ error: "Email is required" }, 400);
    }
    if (!otp || typeof otp !== "string") {
      return json({ error: "OTP is required" }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim();

    if (!/^\d{6}$/.test(normalizedOtp)) {
      return json({ error: "OTP must be a 6-digit number" }, 400);
    }

    // ── Environment ─────────────────────────────────────────────────────────
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // ── Look up the most recent unused, unexpired OTP for this email ─────────
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
      // Mark as used so it can't be retried
      await supabase.from("otp_codes").update({ used: true }).eq("id", otpRecord.id);
      return json({ error: "OTP has expired. Please request a new code." }, 400);
    }

    // ── Check attempt count (brute-force protection) ─────────────────────────
    const attempts = (otpRecord.verify_attempts ?? 0) + 1;
    if (attempts > MAX_VERIFY_ATTEMPTS) {
      await supabase.from("otp_codes").update({ used: true }).eq("id", otpRecord.id);
      return json(
        { error: "Too many incorrect attempts. Please request a new code." },
        429
      );
    }

    // ── Verify OTP value ─────────────────────────────────────────────────────
    if (otpRecord.otp_code !== normalizedOtp) {
      // Increment attempt counter
      await supabase
        .from("otp_codes")
        .update({ verify_attempts: attempts })
        .eq("id", otpRecord.id);

      const remaining = MAX_VERIFY_ATTEMPTS - attempts;
      return json(
        {
          error:
            remaining > 0
              ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
              : "Too many incorrect attempts. Please request a new code.",
        },
        400
      );
    }

    // ── OTP is valid — mark as used ──────────────────────────────────────────
    await supabase.from("otp_codes").update({ used: true }).eq("id", otpRecord.id);

    // ── Ensure the user exists in Supabase Auth ──────────────────────────────
    // Look up by email first
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existingUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create a new auth user (email confirmed immediately)
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
      });

      if (createErr || !newUser?.user) {
        console.error("Failed to create user:", createErr);
        return json({ error: "Failed to create account. Please try again." }, 500);
      }

      userId = newUser.user.id;
    }

    // ── Generate a magic-link token so the client can create a real session ──
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
    });

    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error("Failed to generate magic link:", linkErr);
      return json({ error: "Failed to create session. Please try again." }, 500);
    }

    console.log(`OTP verified successfully for ${normalizedEmail} (user: ${userId})`);

    return json({
      success: true,
      token_hash: linkData.properties.hashed_token,
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    return json({ error: "An unexpected error occurred. Please try again." }, 500);
  }
});

// ── Helper ───────────────────────────────────────────────────────────────────

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
