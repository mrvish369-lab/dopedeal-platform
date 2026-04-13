const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, dealTitle, hasCoupon } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fallback to basic extraction if AI is not available
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: { buttonText: extractBasicButtonName(url, hasCoupon) }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert at creating compelling call-to-action button text for deals and offers.
Given a URL and optional deal title, generate a short, action-oriented button text (max 25 characters).

Guidelines:
- Use action verbs like "Shop", "Learn", "Claim", "Get", "Start", "Watch", "Download"
- Include the platform/brand name if recognizable
- If there's a coupon, mention "Apply Code" or "Use Code"
- Keep it concise and compelling
- Match the context (learning platforms get "Learn on...", shopping gets "Shop on...", etc.)

Examples:
- udemy.com → "Start Learning on Udemy"
- amazon.in → "Shop on Amazon"
- coursera.org + coupon → "Enroll on Coursera & Apply"
- unknown-app.com → "Visit & Claim Offer"`;

    const userPrompt = `Generate a button text for:
URL: ${url}
${dealTitle ? `Deal Title: ${dealTitle}` : ""}
Has Coupon: ${hasCoupon ? "Yes" : "No"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_button_text",
              description: "Generate a call-to-action button text",
              parameters: {
                type: "object",
                properties: {
                  buttonText: { 
                    type: "string", 
                    description: "The generated button text (max 25 chars)" 
                  },
                  platformName: {
                    type: "string",
                    description: "The extracted platform/brand name"
                  }
                },
                required: ["buttonText"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_button_text" } },
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      // Fallback to basic extraction
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: { buttonText: extractBasicButtonName(url, hasCoupon) }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const extractedData = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify({ success: true, data: extractedData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback if tool call fails
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { buttonText: extractBasicButtonName(url, hasCoupon) }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractBasicButtonName(url: string, hasCoupon: boolean): string {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, "");
    
    const platformMappings: Record<string, string> = {
      "udemy.com": "Udemy",
      "coursera.org": "Coursera",
      "skillshare.com": "Skillshare",
      "amazon.in": "Amazon",
      "amazon.com": "Amazon",
      "flipkart.com": "Flipkart",
      "myntra.com": "Myntra",
      "swiggy.com": "Swiggy",
      "zomato.com": "Zomato",
      "netflix.com": "Netflix",
      "spotify.com": "Spotify",
      "cashkaro.com": "CashKaro",
    };
    
    for (const [domain, name] of Object.entries(platformMappings)) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) {
        return hasCoupon ? `Go to ${name} & Apply Code` : `Go to ${name}`;
      }
    }
    
    const parts = hostname.split(".");
    const mainPart = parts.length > 1 ? parts[parts.length - 2] : parts[0];
    const platformName = mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
    
    return hasCoupon ? `Visit ${platformName} & Apply` : `Visit ${platformName}`;
  } catch {
    return hasCoupon ? "Visit & Apply Code" : "Visit Platform";
  }
}
