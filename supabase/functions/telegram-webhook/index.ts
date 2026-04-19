const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendTelegramMessage(chatId: string, text: string, botToken: string) {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      }),
    }
  );
  return response.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update = await req.json();
    
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!TELEGRAM_BOT_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing environment variables");
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (update.message?.text?.startsWith('/start')) {
      const parts = update.message.text.split(' ');
      const token = parts.length > 1 ? parts[1] : null;
      const chatId = String(update.message.chat.id);

      if (!token) {
        await sendTelegramMessage(
          chatId,
          "👋 Welcome to DopeDeal!\n\nTo get your OTP, please use the 'Send OTP via Telegram' button on our website.",
          TELEGRAM_BOT_TOKEN
        );
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const tokenResponse = await fetch(
        SUPABASE_URL + "/rest/v1/telegram_otp_tokens?token=eq." + encodeURIComponent(token) + "&used=eq.false&select=*",
        {
          method: "GET",
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      if (!tokenResponse.ok) {
        await sendTelegramMessage(
          chatId,
          "❌ Invalid or expired link. Please try again from the website.",
          TELEGRAM_BOT_TOKEN
        );
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const tokens = await tokenResponse.json();
      
      if (!tokens || tokens.length === 0) {
        await sendTelegramMessage(
          chatId,
          "❌ Invalid or expired link. Please try again from the website.",
          TELEGRAM_BOT_TOKEN
        );
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const tokenData = tokens[0];
      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);

      if (now > expiresAt) {
        await sendTelegramMessage(
          chatId,
          "❌ Link expired. Please request a new OTP from the website.",
          TELEGRAM_BOT_TOKEN
        );
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const otp = String(Math.floor(100000 + Math.random() * 900000));

      await fetch(
        SUPABASE_URL + "/rest/v1/telegram_otp_tokens?token=eq." + encodeURIComponent(token),
        {
          method: "PATCH",
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({ 
            chat_id: chatId, 
            otp_code: otp,
            used: true,
          }),
        }
      );

      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await fetch(SUPABASE_URL + "/rest/v1/otp_codes?email=eq." + encodeURIComponent(tokenData.email) + "&used=eq.false", {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ used: true }),
      });

      await fetch(SUPABASE_URL + "/rest/v1/otp_codes", {
        method: "POST",
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          email: tokenData.email,
          otp_code: otp,
          expires_at: otpExpiresAt,
          used: false,
        }),
      });

      await sendTelegramMessage(
        chatId,
        `🔥 *DopeDeal Login Code*\n\nYour OTP: \`${otp}\`\n\n✅ Valid for 10 minutes\n\nEnter this code on the website to complete your login.`,
        TELEGRAM_BOT_TOKEN
      );

      console.log("OTP sent to Telegram for:", tokenData.email);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("telegram-webhook error:", err);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
