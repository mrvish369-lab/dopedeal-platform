import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { QuizCard } from "@/components/QuizCard";
import { WhatsAppVerification } from "@/components/WhatsAppVerification";
import { CoinAnimation } from "@/components/wallet/CoinAnimation";
import { useQuiz } from "@/hooks/useQuiz";
import { useQuizCampaign } from "@/hooks/useQuizCampaign";
import { useCoinRewards } from "@/hooks/useCoinRewards";
import { useAuth } from "@/contexts/AuthContext";
import { QuizLandingSection } from "@/components/quiz/QuizLandingSection";
import { CampaignResultPage } from "@/components/quiz/CampaignResultPage";
import { QuizBranding } from "@/components/quiz/QuizBranding";
import { QuizHeroBanner } from "@/components/quiz/QuizHeroBanner";
import { QuizBottomBanner } from "@/components/quiz/QuizBottomBanner";
import {
  createSession,
  clearCurrentSession,
  getFreshSessionId,
  getCurrentSessionId,
  updateSessionResult,
  determineResult,
  trackEvent,
  setSessionContext,
} from "@/lib/session";
import { trackQrScan, trackPageView } from "@/lib/tracking";

type FlowStep = "landing" | "quiz" | "verify" | "result";

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

export default function Start() {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const navigate = useNavigate();
  const hasTrackedQrScan = useRef(false);

  const shopId = searchParams.get("shop_id") || searchParams.get("shop");
  const batchId =
    searchParams.get("batch_id") || searchParams.get("batch") || searchParams.get("b");
  const campaignSlug =
    searchParams.get("campaign") || searchParams.get("c") || params.campaignSlug || null;

  const [step, setStep] = useState<FlowStep>("landing");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [result, setResult] = useState<"success" | "failure" | null>(null);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [completedQuizId, setCompletedQuizId] = useState<string | null>(null);

  // Fetch campaign data
  const { campaign, isLoading: campaignLoading } = useQuizCampaign(campaignSlug || undefined);

  const {
    currentQuiz,
    isLoading: quizLoading,
    isComplete,
    selectAnswer,
    totalQuestions,
    currentIndex,
    quizzes,
  } = useQuiz(selectedCategory);
  const { user } = useAuth();
  const { awardQuizCompletionCoins } = useCoinRewards();

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      // If a user scans a *different* QR, start a fresh session (but avoid duplicating on refresh)
      const contextKey = JSON.stringify({
        shopId: shopId || null,
        batchId: batchId || null,
        campaignSlug: campaignSlug || null,
      });

      const previousContext = localStorage.getItem("dopedeal_session_context");
      const freshSessionId = getFreshSessionId(SESSION_TTL_MS);
      if (previousContext !== contextKey || !freshSessionId) {
        clearCurrentSession();
        localStorage.setItem("dopedeal_session_context", contextKey);
      }

      // Persist session context so other pages can access it
      setSessionContext({
        shopId: shopId || "",
        batchId: batchId || "",
        qrType: batchId ? "product" : "quiz",
        campaignSlug: campaignSlug || "",
        qrUrl: window.location.href,
      });

      let sessionId = getFreshSessionId(SESSION_TTL_MS);
      if (!sessionId) {
        sessionId = await createSession({
          shopId: shopId || undefined,
          batchId: batchId || undefined,
          qrType: batchId ? "product" : "quiz",
        });
      }

      // Track events - prevent duplicate qr_scan on refresh
      await trackEvent("landing_page_viewed", {
        shop_id: shopId,
        batch_id: batchId,
        campaign_slug: campaignSlug,
      });

      // Track dedicated qr_scan event (only once per session context)
      if (!hasTrackedQrScan.current) {
        hasTrackedQrScan.current = true;
        await trackQrScan({
          shopId,
          batchId,
          campaignSlug,
          qrUrl: window.location.href,
        });
      }

      await trackPageView("quiz_start", {
        shop_id: shopId,
        batch_id: batchId,
        campaign_slug: campaignSlug,
      });
    };

    initSession();
  }, [shopId, batchId, campaignSlug]);

  // Handle quiz completion - award coins
  useEffect(() => {
    const handleQuizComplete = async () => {
      if (isComplete && step === "quiz" && quizzes.length > 0) {
        const lastQuizId = quizzes[quizzes.length - 1]?.id;
        if (lastQuizId) {
          setCompletedQuizId(lastQuizId);
        }

        // Award coins if user is logged in
        if (user && lastQuizId) {
          const result = await awardQuizCompletionCoins(lastQuizId);
          if (result?.coins_awarded && result.coins_awarded > 0) {
            setCoinsEarned(result.coins_awarded);
            setShowCoinAnimation(true);
            return;
          }
        }

        setStep("verify");
      }
    };

    handleQuizComplete();
  }, [isComplete, step, quizzes, user, awardQuizCompletionCoins]);

  const handleCoinAnimationComplete = useCallback(() => {
    setShowCoinAnimation(false);
    setStep("verify");
  }, []);

  const handleCategorySelect = async (category: string) => {
    await trackEvent("category_selected", { category, campaign_id: campaign?.id });
    setSelectedCategory(category);
    setStep("quiz");
  };

  const handleVerified = async () => {
    const sessionId = getCurrentSessionId();
    const resultType = await determineResult(selectedCategory);

    if (sessionId) {
      await updateSessionResult(sessionId, resultType, resultType === "success");
    }

    await trackEvent("quiz_result_determined", {
      result: resultType,
      campaign_id: campaign?.id,
    });

    setResult(resultType);
    setStep("result");
  };

  const handleRestart = () => {
    navigate("/");
  };

  // Loading state
  if (campaignLoading) {
    return (
      <div className="min-h-screen bg-animated-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading campaign...</p>
        </div>
      </div>
    );
  }

  // Fallback if no campaign
  if (!campaign) {
    return (
      <div className="min-h-screen bg-animated-gradient flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Campaign Not Found</h1>
          <p className="text-muted-foreground">This quiz campaign is not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-animated-gradient">
      {/* Coin Animation Overlay */}
      <CoinAnimation
        show={showCoinAnimation}
        coinsEarned={coinsEarned}
        onComplete={handleCoinAnimationComplete}
      />

      {step === "landing" && (
        <QuizLandingSection campaign={campaign} onCategorySelect={handleCategorySelect} />
      )}

      {step === "quiz" && (
        <div className="min-h-screen flex flex-col">
          {/* Branding Header */}
          <QuizBranding variant="header" />

          {/* Hero Banner during quiz */}
          {campaign.hero_banner_enabled && (
            <div className="px-6 pt-4">
              <div className="max-w-lg mx-auto">
                <QuizHeroBanner campaign={campaign} className="mb-4" />
              </div>
            </div>
          )}

          <div className="flex-1 flex items-center justify-center p-6">
            {quizLoading ? (
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading quiz...</p>
              </div>
            ) : currentQuiz ? (
              <div className="w-full max-w-lg">
                <QuizCard
                  quiz={currentQuiz}
                  questionNumber={currentIndex + 1}
                  totalQuestions={totalQuestions}
                  onAnswer={selectAnswer}
                />

                {/* Bottom Banner during quiz */}
                <div className="mt-8">
                  <QuizBottomBanner campaign={campaign} />
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No questions available</p>
            )}
          </div>

          {/* Footer Branding */}
          <QuizBranding variant="footer" />
        </div>
      )}

      {step === "verify" && (
        <div className="min-h-screen flex flex-col">
          <QuizBranding variant="header" />
          <div className="flex-1 flex items-center justify-center p-6">
            <WhatsAppVerification
              onVerified={handleVerified}
              onError={(msg) => console.error(msg)}
            />
          </div>
          <QuizBranding variant="footer" />
        </div>
      )}

      {step === "result" && result && (
        <CampaignResultPage result={result} campaign={campaign} onRestart={handleRestart} />
      )}
    </div>
  );
}
