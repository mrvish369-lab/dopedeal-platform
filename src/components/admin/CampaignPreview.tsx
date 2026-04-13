import { QuizCampaign } from "@/hooks/useQuizCampaign";
import { QuizBranding } from "@/components/quiz/QuizBranding";
import { QuizHeroBanner } from "@/components/quiz/QuizHeroBanner";
import { QuizBottomBanner } from "@/components/quiz/QuizBottomBanner";
import { Smartphone, Monitor } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CampaignPreviewProps {
  campaign: Partial<QuizCampaign>;
}

export const CampaignPreview = ({ campaign }: CampaignPreviewProps) => {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");

  // Create a full campaign object with defaults for preview
  const previewCampaign: QuizCampaign = {
    id: "preview",
    name: campaign.name || "Preview Campaign",
    slug: campaign.slug || "preview",
    template_type: campaign.template_type || "lighter",
    goodie_title: campaign.goodie_title || "Your Goodie",
    goodie_subtitle: campaign.goodie_subtitle || null,
    goodie_emoji: campaign.goodie_emoji || "🎁",
    goodie_image_url: campaign.goodie_image_url || null,
    goodie_price: campaign.goodie_price || "₹2",
    goodie_original_price: campaign.goodie_original_price || "₹50",
    success_title: campaign.success_title || "Congratulations! 🎉",
    success_message: campaign.success_message || "You've won!",
    failure_title: campaign.failure_title || "Better Luck Next Time!",
    failure_message: campaign.failure_message || "Try again!",
    redemption_steps: campaign.redemption_steps || ["Step 1", "Step 2", "Step 3"],
    validity_hours: campaign.validity_hours || 24,
    hero_banner_enabled: campaign.hero_banner_enabled || false,
    hero_banner_image_url: campaign.hero_banner_image_url || null,
    hero_banner_title: campaign.hero_banner_title || null,
    hero_banner_subtitle: campaign.hero_banner_subtitle || null,
    hero_banner_gradient_from: campaign.hero_banner_gradient_from || null,
    hero_banner_gradient_to: campaign.hero_banner_gradient_to || null,
    bottom_banner_enabled: campaign.bottom_banner_enabled || false,
    bottom_banner_image_url: campaign.bottom_banner_image_url || null,
    bottom_banner_title: campaign.bottom_banner_title || null,
    bottom_banner_subtitle: campaign.bottom_banner_subtitle || null,
    bottom_banner_redirect_url: campaign.bottom_banner_redirect_url || null,
    bottom_banner_cta_text: campaign.bottom_banner_cta_text || "Learn More",
    quiz_categories: campaign.quiz_categories || ["bollywood", "cricket", "social_media"],
    questions_count: campaign.questions_count || 3,
    success_probability: campaign.success_probability || 0.7,
    status: campaign.status || "active",
  };

  return (
    <div className="h-full flex flex-col">
      {/* Device Toggle */}
      <div className="flex items-center justify-center gap-2 p-3 border-b border-border bg-muted/30">
        <Button
          variant={device === "mobile" ? "default" : "ghost"}
          size="sm"
          onClick={() => setDevice("mobile")}
          className="gap-1"
        >
          <Smartphone className="w-4 h-4" />
          Mobile
        </Button>
        <Button
          variant={device === "desktop" ? "default" : "ghost"}
          size="sm"
          onClick={() => setDevice("desktop")}
          className="gap-1"
        >
          <Monitor className="w-4 h-4" />
          Desktop
        </Button>
      </div>

      {/* Preview Container */}
      <div className="flex-1 overflow-auto p-4 bg-muted/20">
        <div
          className={cn(
            "mx-auto bg-background rounded-2xl shadow-2xl overflow-hidden border border-border transition-all duration-300",
            device === "mobile" ? "w-[375px]" : "w-full max-w-4xl"
          )}
          style={{
            minHeight: device === "mobile" ? "667px" : "600px",
          }}
        >
          {/* Preview Content */}
          <div className="h-full overflow-y-auto">
            {/* Branding Header */}
            <QuizBranding variant="header" />

            {/* Hero Banner */}
            {previewCampaign.hero_banner_enabled && (
              <div className="px-4 pt-4">
                <QuizHeroBanner campaign={previewCampaign} />
              </div>
            )}

            {/* Landing Section Preview */}
            <div className="p-4 md:p-6">
              <div className="text-center mb-6">
                <div className="inline-block mb-3 px-3 py-1.5 bg-primary/20 rounded-full">
                  <span className="text-primary font-medium text-sm">🔥 Limited Time Offer</span>
                </div>
                <h1 className={cn("font-bold mb-2", device === "mobile" ? "text-2xl" : "text-4xl")}>
                  <span className="text-foreground">Unlock Your </span>
                  <span className="text-gradient-fire">
                    {previewCampaign.goodie_price} {previewCampaign.goodie_title.split(" ")[0]}
                  </span>
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Answer {previewCampaign.questions_count} fun questions & win a{" "}
                  <span className="font-semibold text-foreground">
                    {previewCampaign.goodie_title}
                  </span>
                  !
                </p>
              </div>

              {/* Category Cards Preview */}
              <div className={cn("grid gap-3 mb-6", device === "mobile" ? "grid-cols-1" : "grid-cols-3")}>
                {previewCampaign.quiz_categories.slice(0, 3).map((cat) => (
                  <div
                    key={cat}
                    className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="text-3xl mb-2">
                      {cat === "bollywood" && "🎬"}
                      {cat === "social_media" && "📱"}
                      {cat === "cricket" && "🏏"}
                      {cat === "sports" && "⚽"}
                      {cat === "tech" && "💻"}
                      {cat === "music" && "🎵"}
                      {cat === "food" && "🍕"}
                      {cat === "general" && "📚"}
                    </div>
                    <p className="font-semibold text-foreground capitalize text-sm">
                      {cat.replace("_", " ")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bottom Banner */}
              {previewCampaign.bottom_banner_enabled && (
                <QuizBottomBanner campaign={previewCampaign} />
              )}
            </div>

            {/* Prize Preview Card */}
            <div className="p-4 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground text-center mb-3">
                🏆 Prize Preview (Success Screen)
              </p>
              <div className="bg-card border-2 border-secondary rounded-xl p-4 text-center max-w-xs mx-auto">
                <div className="text-4xl mb-2">{previewCampaign.goodie_emoji}</div>
                <h3 className="font-bold text-foreground mb-1">{previewCampaign.goodie_title}</h3>
                {previewCampaign.goodie_subtitle && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {previewCampaign.goodie_subtitle}
                  </p>
                )}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-muted-foreground line-through text-sm">
                    {previewCampaign.goodie_original_price}
                  </span>
                  <span className="text-xl font-bold text-gradient-fire">
                    {previewCampaign.goodie_price}
                  </span>
                </div>
              </div>
            </div>

            {/* Branding Footer */}
            <QuizBranding variant="footer" />
          </div>
        </div>
      </div>
    </div>
  );
};
