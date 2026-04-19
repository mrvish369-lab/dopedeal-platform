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

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase credentials not configured");
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const invalidateResponse = await fetch(
      SUPABASE_URL + "/rest/v1/telegram_otp_tokens?email=eq." + encodeURIComponent(normalizedEmail) + "&used=eq.false",
      {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ used: true }),
      }
    );

    const insertResponse = await fetch(SUPABASE_URL + "/rest/v1/telegram_otp_tokens", {
      method: "POST",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        email: normalizedEmail,
        token: token,
        expires_at: expiresAt,
        used: false,
      }),
    });

    if (!insertResponse.ok) {
      const errText = await insertResponse.text();
      console.error("Failed to create token:", errText);
      return new Response(JSON.stringify({ error: "Failed to generate token" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Generated Telegram token for:", normalizedEmail);

    return new Response(
      JSON.stringify({ 
        success: true,
        token: token,
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err) {
    console.error("generate-telegram-token error:", err);
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
