/**
 * send-email Edge Function
 *
 * Sends transactional emails via Resend.
 * Supported types: "welcome"
 *
 * Required Supabase secrets:
 *   RESEND_API_KEY  — your Resend API key
 *   FROM_EMAIL      — verified sender address (e.g. noreply@dopedeal.store)
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
    const { type, to, name } = await req.json();

    if (!type || !to) {
      return json({ error: "type and to are required" }, 400);
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "noreply@dopedeal.store";

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY secret is not set");
      return json({ error: "Email service not configured" }, 500);
    }

    let subject = "";
    let html = "";
    let text = "";

    if (type === "welcome") {
      const displayName = name || "there";
      subject = "Welcome to DopeDeal! 🔥";
      html = buildWelcomeEmail(displayName);
      text = `Hi ${displayName},\n\nWelcome to DopeDeal! Start earning coins by completing quizzes, social tasks, and referring friends.\n\nVisit https://dopedeal.store to get started.\n\n— The DopeDeal Team`;
    } else {
      return json({ error: `Unknown email type: ${type}` }, 400);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `DopeDeal <${FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", res.status, err);
      return json({ error: "Failed to send email" }, 500);
    }

    return json({ success: true });
  } catch (err) {
    console.error("send-email error:", err);
    return json({ error: "An unexpected error occurred" }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildWelcomeEmail(name: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to DopeDeal</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#111;border-radius:16px;overflow:hidden;border:1px solid #222;">
          <tr>
            <td style="background:linear-gradient(135deg,#f97316,#ef4444);padding:32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;">🔥 Welcome to DopeDeal!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <p style="margin:0 0 16px;color:#e4e4e7;font-size:16px;">Hi ${name},</p>
              <p style="margin:0 0 24px;color:#a1a1aa;font-size:15px;line-height:1.6;">
                You're now part of India's fastest-growing rewards community. Start earning coins today!
              </p>
              <table width="100%" style="margin:0 0 24px;">
                <tr>
                  <td style="background:#1a1a1a;border-radius:12px;padding:16px;text-align:center;">
                    <p style="margin:0 0 4px;color:#f97316;font-size:24px;">🎯</p>
                    <p style="margin:0;color:#e4e4e7;font-size:14px;font-weight:600;">Complete Quizzes</p>
                    <p style="margin:4px 0 0;color:#71717a;font-size:12px;">Earn coins instantly</p>
                  </td>
                </tr>
              </table>
              <a href="https://dopedeal.store/dashboard"
                 style="display:block;background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;text-decoration:none;text-align:center;padding:16px;border-radius:12px;font-weight:700;font-size:16px;">
                Start Earning Now →
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #222;text-align:center;">
              <p style="margin:0;color:#52525b;font-size:12px;">© ${new Date().getFullYear()} DopeDeal</p>
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
