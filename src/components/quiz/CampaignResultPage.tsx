import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/Confetti";
import { cn } from "@/lib/utils";
import { QuizCampaign } from "@/hooks/useQuizCampaign";
import { QuizBranding } from "./QuizBranding";
import { QuizBottomBanner } from "./QuizBottomBanner";
import { DealsCtaButton } from "./DealsCtaButton";
import { Shield } from "lucide-react";

interface CampaignResultPageProps {
  result: "success" | "failure";
  campaign: QuizCampaign;
  onRestart?: () => void;
}

export const CampaignResultPage = ({
  result,
  campaign,
  onRestart,
}: CampaignResultPageProps) => {
  const isSuccess = result === "success";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Branding Header */}
      <QuizBranding variant="header" />

      {/* Confetti for success */}
      {isSuccess && <Confetti />}

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div
          className={cn(
            "w-full max-w-md mx-auto text-center",
            isSuccess ? "bounce-in" : "scale-in"
          )}
        >
          {isSuccess ? (
            <>
              {/* Success Icon */}
              <div className="w-32 h-32 mx-auto mb-8 relative">
                <div className="absolute inset-0 bg-secondary/20 rounded-full animate-ping" />
                <div className="relative w-full h-full bg-gradient-to-br from-secondary to-secondary/80 rounded-full flex items-center justify-center glow-secondary">
                  {campaign.goodie_image_url ? (
                    <img
                      src={campaign.goodie_image_url}
                      alt={campaign.goodie_title}
                      className="w-20 h-20 object-contain"
                    />
                  ) : (
                    <span className="text-6xl">{campaign.goodie_emoji}</span>
                  )}
                </div>
              </div>

              {/* Success Message */}
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gradient-success">
                {campaign.success_title}
              </h1>

              <p className="text-lg text-muted-foreground mb-8">
                {campaign.success_message}
              </p>

              {/* Prize Card */}
              <div className="bg-card border-2 border-secondary rounded-2xl p-6 mb-8 glow-secondary relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-gold to-secondary" />
                <div className="text-5xl mb-3">{campaign.goodie_emoji}</div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {campaign.goodie_title}
                </h2>
                {campaign.goodie_subtitle && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {campaign.goodie_subtitle}
                  </p>
                )}
                <div className="flex items-center justify-center gap-3">
                  <span className="text-muted-foreground line-through text-lg">
                    {campaign.goodie_original_price}
                  </span>
                  <span className="text-3xl font-bold text-gradient-fire">
                    {campaign.goodie_price}
                  </span>
                </div>
              </div>

              {/* Redemption Instructions */}
              <div className="bg-muted/30 rounded-xl p-6 text-left mb-6">
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-2xl">📍</span>
                  How to Redeem
                </h3>
                <ol className="space-y-2 text-muted-foreground">
                  {campaign.redemption_steps.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Valid badge */}
              <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-2 rounded-full">
                <Shield className="w-5 h-5" />
                <span className="font-medium">
                  Valid for {campaign.validity_hours} hours
                </span>
              </div>
            </>
          ) : (
            <>
              {/* Failure Icon */}
              <div className="w-32 h-32 mx-auto mb-8">
                <div className="w-full h-full bg-muted rounded-full flex items-center justify-center">
                  <span className="text-6xl">😢</span>
                </div>
              </div>

              {/* Failure Message */}
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                {campaign.failure_title}
              </h1>

              <p className="text-lg text-muted-foreground mb-8">
                {campaign.failure_message}
              </p>

              {/* Try Again Card */}
              <div className="bg-card border border-border rounded-2xl p-6 mb-8">
                <div className="text-5xl mb-4">🎯</div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Scan Another QR Code
                </h2>
                <p className="text-muted-foreground text-sm">
                  Find another DopeDeal sticker or poster and try your luck again!
                </p>
              </div>

              {onRestart && (
                <Button
                  onClick={onRestart}
                  className="btn-fire h-14 px-8 text-lg rounded-xl"
                >
                  Try Again
                </Button>
              )}
            </>
          )}
        </div>

        {/* Bottom Banner */}
        <div className="w-full max-w-md mx-auto mt-8">
          <QuizBottomBanner campaign={campaign} />
        </div>

        {/* Deals CTA Button */}
        <DealsCtaButton />
      </div>

      {/* Footer Branding */}
      <QuizBranding variant="footer" />
    </div>
  );
};
