import { cn } from "@/lib/utils";
import { QuizCampaign } from "@/hooks/useQuizCampaign";

interface QuizHeroBannerProps {
  campaign: QuizCampaign;
  className?: string;
}

export const QuizHeroBanner = ({ campaign, className }: QuizHeroBannerProps) => {
  if (!campaign.hero_banner_enabled) return null;

  const hasImage = !!campaign.hero_banner_image_url;
  const hasGradient = campaign.hero_banner_gradient_from && campaign.hero_banner_gradient_to;

  const gradientStyle = hasGradient
    ? {
        background: `linear-gradient(135deg, ${campaign.hero_banner_gradient_from}, ${campaign.hero_banner_gradient_to})`,
      }
    : {};

  return (
    <div
      className={cn(
        "w-full relative overflow-hidden rounded-2xl",
        "border border-border/50 shadow-xl",
        !hasImage && !hasGradient && "bg-gradient-to-r from-primary/20 via-gold/20 to-primary/20",
        className
      )}
      style={gradientStyle}
    >
      {/* Background Image */}
      {hasImage && (
        <>
          <img
            src={campaign.hero_banner_image_url!}
            alt={campaign.hero_banner_title || "Campaign banner"}
            className="w-full h-48 md:h-64 object-cover"
          />
          {/* Dark Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </>
      )}

      {/* Content */}
      <div
        className={cn(
          "p-6 md:p-8",
          hasImage && "absolute bottom-0 left-0 right-0"
        )}
      >
        {campaign.hero_banner_title && (
          <h2
            className={cn(
              "text-2xl md:text-3xl font-bold mb-2",
              hasImage ? "text-white" : "text-foreground"
            )}
          >
            {campaign.hero_banner_title}
          </h2>
        )}
        {campaign.hero_banner_subtitle && (
          <p
            className={cn(
              "text-sm md:text-base",
              hasImage ? "text-white/80" : "text-muted-foreground"
            )}
          >
            {campaign.hero_banner_subtitle}
          </p>
        )}

        {/* If no custom content, show default promo */}
        {!campaign.hero_banner_title && !campaign.hero_banner_subtitle && (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">🎁</div>
            <h2 className="text-xl font-bold text-foreground">
              Win Amazing Goodies!
            </h2>
            <p className="text-sm text-muted-foreground">
              Answer simple questions & claim your prize
            </p>
          </div>
        )}
      </div>

      {/* Decorative elements */}
      {!hasImage && (
        <>
          <div className="absolute top-4 right-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-gold/10 rounded-full blur-xl" />
        </>
      )}
    </div>
  );
};
