import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface QuizCampaign {
  id: string;
  name: string;
  slug: string;
  template_type: string;
  // Goodie Details
  goodie_title: string;
  goodie_subtitle: string | null;
  goodie_emoji: string;
  goodie_image_url: string | null;
  goodie_price: string;
  goodie_original_price: string;
  // Messages
  success_title: string;
  success_message: string;
  failure_title: string;
  failure_message: string;
  redemption_steps: string[];
  validity_hours: number;
  // Hero Banner
  hero_banner_enabled: boolean;
  hero_banner_image_url: string | null;
  hero_banner_title: string | null;
  hero_banner_subtitle: string | null;
  hero_banner_gradient_from: string | null;
  hero_banner_gradient_to: string | null;
  // Bottom Banner
  bottom_banner_enabled: boolean;
  bottom_banner_image_url: string | null;
  bottom_banner_title: string | null;
  bottom_banner_subtitle: string | null;
  bottom_banner_redirect_url: string | null;
  bottom_banner_cta_text: string;
  // Config
  quiz_categories: string[];
  questions_count: number;
  success_probability: number;
  status: string;
}

export const useQuizCampaign = (campaignSlug?: string) => {
  const [campaign, setCampaign] = useState<QuizCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const baseQuery = supabase
          .from("quiz_campaigns")
          .select("*")
          .eq("status", "active");

        const { data, error: fetchError } = campaignSlug
          ? await baseQuery.eq("slug", campaignSlug).maybeSingle()
          : await baseQuery
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          // As a last resort, try the classic "lighter" slug
          const { data: fallback } = await supabase
            .from("quiz_campaigns")
            .select("*")
            .eq("status", "active")
            .eq("slug", "lighter")
            .maybeSingle();

          if (fallback) {
            setCampaign(parseCampaign(fallback));
            return;
          }

          throw new Error("Campaign not found");
        }

        setCampaign(parseCampaign(data));
      } catch (err) {
        console.error("Failed to fetch campaign:", err);
        setError("Campaign not found");
        // Return default campaign structure
        setCampaign(getDefaultCampaign());
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignSlug]);

  return { campaign, isLoading, error };
};

function parseCampaign(data: Record<string, unknown>): QuizCampaign {
  return {
    ...data,
    redemption_steps: Array.isArray(data.redemption_steps) 
      ? data.redemption_steps 
      : JSON.parse(data.redemption_steps as string || "[]"),
    quiz_categories: data.quiz_categories || ["bollywood", "social_media", "cricket"],
  } as QuizCampaign;
}

function getDefaultCampaign(): QuizCampaign {
  return {
    id: "default",
    name: "DopeDeal Lighter Campaign",
    slug: "lighter",
    template_type: "lighter",
    goodie_title: "DopeDeal Lighter",
    goodie_subtitle: "Premium Quality Lighter",
    goodie_emoji: "🔥",
    goodie_image_url: null,
    goodie_price: "₹2",
    goodie_original_price: "₹50",
    success_title: "Congratulations! 🎉",
    success_message: "You've won your DopeDeal Goodie!",
    failure_title: "Better Luck Next Time!",
    failure_message: "Don't worry, you can try again from another stall!",
    redemption_steps: [
      "Go to the shopkeeper where you scanned the QR",
      "Show this screen to them",
      "Pay ₹2 and collect your DopeDeal Lighter!",
    ],
    validity_hours: 24,
    hero_banner_enabled: false,
    hero_banner_image_url: null,
    hero_banner_title: null,
    hero_banner_subtitle: null,
    hero_banner_gradient_from: null,
    hero_banner_gradient_to: null,
    bottom_banner_enabled: false,
    bottom_banner_image_url: null,
    bottom_banner_title: null,
    bottom_banner_subtitle: null,
    bottom_banner_redirect_url: null,
    bottom_banner_cta_text: "Learn More",
    quiz_categories: ["bollywood", "social_media", "cricket"],
    questions_count: 3,
    success_probability: 0.7,
    status: "active",
  };
}
