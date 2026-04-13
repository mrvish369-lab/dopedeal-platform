/**
 * Extract a readable platform name from a URL
 * Used as a fallback when AI-generated name isn't available
 */
export const extractPlatformFromUrl = (url: string): string => {
  if (!url) return "Platform";
  
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Remove www. prefix
    const domain = hostname.replace(/^www\./, "");
    
    // Common platform mappings
    const platformMappings: Record<string, string> = {
      "udemy.com": "Udemy",
      "coursera.org": "Coursera",
      "skillshare.com": "Skillshare",
      "masterclass.com": "MasterClass",
      "linkedin.com": "LinkedIn Learning",
      "edx.org": "edX",
      "amazon.in": "Amazon",
      "amazon.com": "Amazon",
      "flipkart.com": "Flipkart",
      "myntra.com": "Myntra",
      "ajio.com": "AJIO",
      "meesho.com": "Meesho",
      "nykaa.com": "Nykaa",
      "swiggy.com": "Swiggy",
      "zomato.com": "Zomato",
      "paytm.com": "Paytm",
      "phonepe.com": "PhonePe",
      "gpay.app.goo.gl": "Google Pay",
      "cashkaro.com": "CashKaro",
      "cred.club": "CRED",
      "groww.in": "Groww",
      "zerodha.com": "Zerodha",
      "upstox.com": "Upstox",
      "unacademy.com": "Unacademy",
      "byjus.com": "BYJU'S",
      "vedantu.com": "Vedantu",
      "whitehatjr.com": "WhiteHat Jr",
      "hotstar.com": "Disney+ Hotstar",
      "netflix.com": "Netflix",
      "primevideo.com": "Prime Video",
      "spotify.com": "Spotify",
      "gaana.com": "Gaana",
      "jiosaavn.com": "JioSaavn",
      "apple.com": "Apple",
      "google.com": "Google",
      "play.google.com": "Google Play",
      "apps.apple.com": "App Store",
      "github.com": "GitHub",
      "notion.so": "Notion",
      "canva.com": "Canva",
      "figma.com": "Figma",
      "dribbble.com": "Dribbble",
      "behance.net": "Behance",
      "fiverr.com": "Fiverr",
      "upwork.com": "Upwork",
      "freelancer.com": "Freelancer",
    };
    
    // Check for exact domain match
    for (const [domainKey, name] of Object.entries(platformMappings)) {
      if (domain === domainKey || domain.endsWith(`.${domainKey}`)) {
        return name;
      }
    }
    
    // Extract and capitalize the main domain name
    const parts = domain.split(".");
    const mainPart = parts.length > 1 ? parts[parts.length - 2] : parts[0];
    return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
  } catch {
    return "Platform";
  }
};

/**
 * Generate a smart CTA button text based on the platform and context
 */
export const generateSmartButtonText = (
  platformName: string,
  hasCoupon: boolean = false
): string => {
  if (!platformName || platformName === "Platform") {
    return hasCoupon ? "Visit & Apply Code" : "Visit Platform";
  }
  
  const actionVerbs: Record<string, string> = {
    // Learning platforms
    "Udemy": "Start Learning on",
    "Coursera": "Enroll on",
    "Skillshare": "Learn on",
    "MasterClass": "Watch on",
    "LinkedIn Learning": "Learn on",
    "edX": "Study on",
    "Unacademy": "Join",
    "BYJU'S": "Start with",
    "Vedantu": "Learn with",
    // E-commerce
    "Amazon": "Shop on",
    "Flipkart": "Buy on",
    "Myntra": "Shop on",
    "AJIO": "Shop on",
    "Meesho": "Shop on",
    "Nykaa": "Shop on",
    // Food & Delivery
    "Swiggy": "Order on",
    "Zomato": "Order on",
    // Finance & Payments
    "Paytm": "Pay via",
    "PhonePe": "Pay via",
    "Google Pay": "Pay via",
    "CRED": "Use",
    "Groww": "Invest on",
    "Zerodha": "Trade on",
    "Upstox": "Trade on",
    "CashKaro": "Earn on",
    // Entertainment
    "Disney+ Hotstar": "Watch on",
    "Netflix": "Watch on",
    "Prime Video": "Watch on",
    "Spotify": "Listen on",
    "Gaana": "Listen on",
    "JioSaavn": "Listen on",
    // Freelancing
    "Fiverr": "Hire on",
    "Upwork": "Work on",
    "Freelancer": "Find Work on",
    // Apps
    "Google Play": "Download from",
    "App Store": "Download from",
  };
  
  const verb = actionVerbs[platformName] || "Go to";
  const suffix = hasCoupon ? " & Apply Code" : "";
  
  return `${verb} ${platformName}${suffix}`;
};
