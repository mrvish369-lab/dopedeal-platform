import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentSessionId, getDeviceType } from "@/lib/session";

interface OfferCard {
  id: string;
  template_key: string | null;
  title: string;
  subtitle: string | null;
  logo_url: string | null;
  image_url: string | null;
  image_fit: string | null;
  cta_text: string;
  redirect_url: string;
  open_new_tab: boolean;
  display_order: number;
  glow_enabled: boolean;
  animation: string | null;
  background_color: string | null;
  card_segment: string | null;
  category: string | null;
  description: string | null;
  features: string[] | null;
  rating: string | null;
  discount_percent: string | null;
}

interface UserBehavior {
  clickedCategories: string[];
  viewedSegments: string[];
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  deviceType: string;
  avgScrollDepth: number;
  totalTimeSpent: number;
  clickCount: number;
  interests: string[];
}

interface RecommendationScore {
  card: OfferCard;
  score: number;
  reason: string;
}

// Get time of day segment
const getTimeOfDay = (): "morning" | "afternoon" | "evening" | "night" => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
};

// Analyze user behavior from events
const analyzeUserBehavior = async (sessionId: string | null): Promise<UserBehavior> => {
  const defaultBehavior: UserBehavior = {
    clickedCategories: [],
    viewedSegments: [],
    timeOfDay: getTimeOfDay(),
    deviceType: getDeviceType(),
    avgScrollDepth: 0,
    totalTimeSpent: 0,
    clickCount: 0,
    interests: [],
  };

  if (!sessionId) return defaultBehavior;

  try {
    // Get user events from current and recent sessions
    const { data: events } = await supabase
      .from("offer_events")
      .select("event_type, metadata, card_id")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!events || events.length === 0) return defaultBehavior;

    const clickedCategories: string[] = [];
    const viewedSegments: string[] = [];
    const interests: string[] = [];
    let totalScrollDepth = 0;
    let scrollCount = 0;
    let totalTime = 0;
    let clickCount = 0;

    events.forEach((event) => {
      const metadata = event.metadata as Record<string, unknown> | null;
      
      if (event.event_type === "card_click") {
        clickCount++;
        if (metadata?.card_segment) {
          clickedCategories.push(metadata.card_segment as string);
        }
        if (metadata?.card_title) {
          // Extract keywords from card title for interest matching
          const title = (metadata.card_title as string).toLowerCase();
          if (title.includes("earn") || title.includes("money") || title.includes("income")) {
            interests.push("money-making");
          }
          if (title.includes("health") || title.includes("ayurved") || title.includes("wellness")) {
            interests.push("health");
          }
          if (title.includes("deal") || title.includes("discount") || title.includes("offer")) {
            interests.push("deals");
          }
          if (title.includes("game") || title.includes("trading") || title.includes("fantasy")) {
            interests.push("gaming");
          }
        }
      }
      
      if (event.event_type === "page_view" && metadata?.page) {
        viewedSegments.push(metadata.page as string);
      }
      
      if (event.event_type === "page_exit" && metadata?.scroll_depth) {
        totalScrollDepth += metadata.scroll_depth as number;
        scrollCount++;
      }
      
      if (event.event_type === "page_exit" && metadata?.time_spent) {
        totalTime += metadata.time_spent as number;
      }
    });

    return {
      clickedCategories: [...new Set(clickedCategories)],
      viewedSegments: [...new Set(viewedSegments)],
      timeOfDay: getTimeOfDay(),
      deviceType: getDeviceType(),
      avgScrollDepth: scrollCount > 0 ? totalScrollDepth / scrollCount : 0,
      totalTimeSpent: totalTime,
      clickCount,
      interests: [...new Set(interests)],
    };
  } catch (error) {
    console.error("Error analyzing user behavior:", error);
    return defaultBehavior;
  }
};

// Score cards based on user behavior
const scoreCard = (card: OfferCard, behavior: UserBehavior): RecommendationScore => {
  let score = 50; // Base score
  let reasons: string[] = [];

  // Time-based scoring
  const timeOfDay = behavior.timeOfDay;
  if (timeOfDay === "morning" && card.card_segment === "health") {
    score += 15;
    reasons.push("Popular morning pick");
  }
  if (timeOfDay === "evening" && card.card_segment === "money_making") {
    score += 15;
    reasons.push("Evening earner favorite");
  }
  if (timeOfDay === "night" && card.template_key?.includes("game")) {
    score += 10;
    reasons.push("Night owl special");
  }

  // Interest matching
  if (behavior.interests.includes("money-making") && card.card_segment === "money_making") {
    score += 25;
    reasons.push("Matches your interests");
  }
  if (behavior.interests.includes("health") && (card.card_segment === "health" || card.template_key?.includes("health"))) {
    score += 25;
    reasons.push("Based on your preferences");
  }
  if (behavior.interests.includes("gaming") && card.template_key?.includes("game")) {
    score += 20;
    reasons.push("Gaming enthusiast pick");
  }

  // Category affinity
  if (behavior.clickedCategories.includes(card.card_segment || "")) {
    score += 20;
    reasons.push("You liked similar offers");
  }

  // Engagement-based boosting
  if (behavior.avgScrollDepth > 70) {
    // Highly engaged users - show premium offers
    if (card.glow_enabled || card.discount_percent) {
      score += 10;
      reasons.push("Premium pick for engaged users");
    }
  }

  // Device-specific recommendations
  if (behavior.deviceType === "mobile") {
    // Mobile users prefer quick actions
    if (card.template_key?.includes("cashback") || card.template_key?.includes("quick")) {
      score += 10;
      reasons.push("Quick mobile deal");
    }
  }

  // New user boosting - show popular items
  if (behavior.clickCount < 3) {
    if (card.display_order <= 3) {
      score += 15;
      reasons.push("Top rated by users");
    }
  }

  // Discount boost
  if (card.discount_percent) {
    const discount = parseInt(card.discount_percent);
    if (discount >= 50) {
      score += 15;
      reasons.push(`${discount}% OFF!`);
    } else if (discount >= 20) {
      score += 8;
    }
  }

  // Rating boost
  if (card.rating) {
    const rating = parseFloat(card.rating);
    if (rating >= 4.5) {
      score += 12;
      if (!reasons.length) reasons.push("Highly rated");
    }
  }

  // Add randomization for variety (±5 points)
  score += Math.floor(Math.random() * 10) - 5;

  return {
    card,
    score: Math.min(100, Math.max(0, score)),
    reason: reasons.length > 0 ? reasons[0] : "Trending now",
  };
};

export const useSmartRecommendations = (allCards: OfferCard[]) => {
  const [behavior, setBehavior] = useState<UserBehavior | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBehavior = async () => {
      const sessionId = getCurrentSessionId();
      const userBehavior = await analyzeUserBehavior(sessionId);
      setBehavior(userBehavior);
      setLoading(false);
    };

    fetchBehavior();
  }, []);

  const recommendations = useMemo(() => {
    if (!behavior || allCards.length === 0) return [];

    // Score all cards
    const scoredCards: RecommendationScore[] = allCards.map((card) => 
      scoreCard(card, behavior)
    );

    // Sort by score descending
    scoredCards.sort((a, b) => b.score - a.score);

    // Return top recommendations with diversity
    const result: RecommendationScore[] = [];
    const usedSegments = new Set<string>();

    // Ensure diversity - don't show too many from same segment
    for (const scored of scoredCards) {
      const segment = scored.card.card_segment || "other";
      const segmentCount = [...result].filter(r => r.card.card_segment === segment).length;
      
      if (segmentCount < 2 || result.length < 3) {
        result.push(scored);
        usedSegments.add(segment);
      }
      
      if (result.length >= 6) break;
    }

    return result;
  }, [allCards, behavior]);

  return {
    recommendations,
    behavior,
    loading,
  };
};
