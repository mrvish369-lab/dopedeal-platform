const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "AI gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // First, fetch the webpage to extract content
    console.log("Fetching URL:", url);
    let pageContent = "";
    let pageTitle = "";
    
    try {
      const pageResponse = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      
      if (pageResponse.ok) {
        const html = await pageResponse.text();
        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        pageTitle = titleMatch ? titleMatch[1].trim() : "";
        
        // Extract meta description
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
        const metaDesc = descMatch ? descMatch[1].trim() : "";
        
        // Extract Open Graph data
        const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
        const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
        const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
        
        const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : "";
        const ogDesc = ogDescMatch ? ogDescMatch[1].trim() : "";
        const ogImage = ogImageMatch ? ogImageMatch[1].trim() : "";
        
        // Look for price patterns
        const priceMatches = html.match(/(?:₹|Rs\.?|INR)\s*[\d,]+(?:\.\d{2})?/g) || [];
        const prices = priceMatches.slice(0, 3).join(", ");
        
        // Compile content for AI analysis
        pageContent = `
URL: ${url}
Page Title: ${pageTitle || ogTitle}
Description: ${metaDesc || ogDesc}
OG Image: ${ogImage}
Detected Prices: ${prices}
        `.trim();
      }
    } catch (fetchError) {
      console.error("Error fetching page:", fetchError);
      pageContent = `URL: ${url}\nNote: Could not fetch page content directly. Please analyze based on URL pattern.`;
    }

    // Use AI to extract structured offer details
    const systemPrompt = `You are an expert at analyzing product/offer pages and extracting key information. 
Given information about a webpage, extract details to create an attractive offer card.
Return a JSON object with these fields:
- title: A catchy, short title (max 50 chars)
- subtitle: A compelling subtitle describing the offer (max 80 chars)
- description: A detailed description of the product/service (max 200 chars)
- features: Array of 3-5 key features/benefits (short phrases)
- cta_text: Call-to-action button text (e.g., "Get Started", "Claim Offer", "Download Now")
- original_price: Original price if available (with currency symbol)
- discounted_price: Discounted price if available (with currency symbol)
- discount_percent: Discount percentage if available (e.g., "50% OFF")
- rating: Rating if available (e.g., "4.5/5")
- reviews_count: Number of reviews if available
- category: Category of the product/service (e.g., "Money Making", "Health", "Shopping", "Subscription")
- logo_url: The OG image URL or best image URL found

Be creative but accurate. If information is not available, make reasonable assumptions based on the URL and context.
For money-making apps (CashKaro, HoneyGain, etc.), emphasize earning potential.
For health courses, emphasize benefits and transformation.
For affiliate products, emphasize deals and savings.`;

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
          { role: "user", content: `Analyze this webpage and extract offer details:\n\n${pageContent}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_offer_details",
              description: "Extract structured offer details from a webpage",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Catchy title for the offer card" },
                  subtitle: { type: "string", description: "Compelling subtitle" },
                  description: { type: "string", description: "Detailed description" },
                  features: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Key features/benefits"
                  },
                  cta_text: { type: "string", description: "Call-to-action button text" },
                  original_price: { type: "string", description: "Original price with currency" },
                  discounted_price: { type: "string", description: "Discounted price with currency" },
                  discount_percent: { type: "string", description: "Discount percentage" },
                  rating: { type: "string", description: "Product rating" },
                  reviews_count: { type: "string", description: "Number of reviews" },
                  category: { type: "string", description: "Product category" },
                  logo_url: { type: "string", description: "Best image URL for the offer" },
                },
                required: ["title", "subtitle", "cta_text"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_offer_details" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    console.log("AI Response:", JSON.stringify(aiResponse));

    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const extractedData = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify({ success: true, data: extractedData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: try to parse from content if no tool call
    const content = aiResponse.choices?.[0]?.message?.content;
    if (content) {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extractedData = JSON.parse(jsonMatch[0]);
          return new Response(
            JSON.stringify({ success: true, data: extractedData }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch {
        console.error("Failed to parse AI content as JSON");
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: "Failed to extract offer details" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
