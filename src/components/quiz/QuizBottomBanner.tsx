import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QuizCampaign } from "@/hooks/useQuizCampaign";
import { trackEvent } from "@/lib/session";
import { safeNavigate } from "@/lib/urlValidation";

interface QuizBottomBannerProps {
  campaign: QuizCampaign;
  className?: string;
}

export const QuizBottomBanner = ({ campaign, className }: QuizBottomBannerProps) => {
  if (!campaign.bottom_banner_enabled) return null;

  const handleClick = async () => {
    await trackEvent("quiz_bottom_banner_clicked", {
      campaign_id: campaign.id,
      redirect_url: campaign.bottom_banner_redirect_url,
    });

    if (campaign.bottom_banner_redirect_url) {
      const url = campaign.bottom_banner_redirect_url.startsWith("http")
        ? campaign.bottom_banner_redirect_url
        : `https://${campaign.bottom_banner_redirect_url}`;
      safeNavigate(url, { newTab: true });
    }
  };

  const hasImage = !!campaign.bottom_banner_image_url;

  return (
    <div
      className={cn(
        "w-full bg-card border border-border rounded-2xl overflow-hidden",
        "shadow-lg hover:shadow-xl transition-all duration-300",
        "cursor-pointer group",
        className
      )}
      onClick={handleClick}
    >
      {/* Image Section */}
      {hasImage && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={campaign.bottom_banner_image_url!}
            alt={campaign.bottom_banner_title || "Promotional banner"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        </div>
      )}

      {/* Content Section */}
      <div className="p-5">
        {campaign.bottom_banner_title && (
          <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
            {campaign.bottom_banner_title}
          </h3>
        )}
        {campaign.bottom_banner_subtitle && (
          <p className="text-sm text-muted-foreground mb-4">
            {campaign.bottom_banner_subtitle}
          </p>
        )}

        {campaign.bottom_banner_redirect_url && (
          <Button
            className="w-full btn-fire gap-2"
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            {campaign.bottom_banner_cta_text || "Learn More"}
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-gold/5" />
      </div>
    </div>
  );
};
