import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  clearCurrentSession,
  createSession,
  getFreshSessionId,
  setSessionContext,
} from "@/lib/session";
import { trackPageView, trackPageExit, trackOfferEvent, trackQrScan } from "@/lib/tracking";
import { DealsHero } from "@/components/offers/DealsHero";
import { OfferSearchBar } from "@/components/offers/OfferSearchBar";
import { SuperDealsButton } from "@/components/offers/SuperDealsButton";
import { DailyCheckinButton } from "@/components/wallet/DailyCheckinButton";
import { MoneyMakingSegment } from "@/components/offers/MoneyMakingSegment";
import { ViralDealsSegment } from "@/components/offers/ViralDealsSegment";
import { RecommendedForYou } from "@/components/offers/RecommendedForYou";
import { OfferTrustSection } from "@/components/offers/OfferTrustSection";
import { OfferFooter } from "@/components/offers/OfferFooter";
import { SuperDealsPreview } from "@/components/offers/SuperDealsPreview";
import { useSmartRecommendations } from "@/hooks/useSmartRecommendations";
import { useCoinRewards } from "@/hooks/useCoinRewards";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Coins } from "lucide-react";

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

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

const LighterOffers = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [allCards, setAllCards] = useState<OfferCard[]>([]);
  const [moneyMakingCards, setMoneyMakingCards] = useState<OfferCard[]>([]);
  const [viralDealsCards, setViralDealsCards] = useState<OfferCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const hasTrackedPageViewRef = useRef(false);
  const startTimeRef = useRef(Date.now());
  const maxScrollDepthRef = useRef(0);

  // AI-powered recommendations
  const { recommendations, loading: recommendationsLoading } = useSmartRecommendations(allCards);
  
  // Coin rewards integration
  const { user } = useAuth();
  const { awardOfferClickCoins } = useCoinRewards();
  const { toast } = useToast();
  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = scrollHeight > 0 ? Math.round((window.scrollY / scrollHeight) * 100) : 0;
      if (scrollPercent > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = scrollPercent;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Initialize session and load cards
  useEffect(() => {
    const init = async () => {
      const shopIdParam = searchParams.get("shop_id");
      const batchIdParam = searchParams.get("batch_id");
      const qrType = searchParams.get("qr_type") || "lighter";

      setShopId(shopIdParam);

      // Persist context for tracking enrichment
      setSessionContext({
        shopId: shopIdParam || "",
        batchId: batchIdParam || "",
        qrType: qrType,
        qrUrl: window.location.href,
      });

      // Check for existing session or create new one
      let currentSessionId = getFreshSessionId(SESSION_TTL_MS);
      
      if (!currentSessionId) {
        clearCurrentSession();
        currentSessionId = await createSession({
          shopId: shopIdParam || undefined,
          batchId: batchIdParam || undefined,
          qrType: qrType,
        });
      }
      
      if (currentSessionId) {
        // Update session with qr_type and batch_id
        await supabase
          .from("sessions")
          .update({
            qr_type: qrType,
            batch_id: batchIdParam,
          })
          .eq("id", currentSessionId);

        // Track QR scan if coming from QR (has shop_id or batch_id params)
        if ((shopIdParam || batchIdParam) && !hasTrackedPageViewRef.current) {
          await trackQrScan({
            shopId: shopIdParam,
            batchId: batchIdParam,
            qrUrl: window.location.href,
          });
        }

        // Track page view (deduplicated)
        if (!hasTrackedPageViewRef.current) {
          hasTrackedPageViewRef.current = true;
          await trackPageView("deals", {
            qr_type: qrType,
            batch_id: batchIdParam,
            referrer: document.referrer,
            screen_width: window.innerWidth,
            screen_height: window.innerHeight,
          });
        }
      }

      // Fetch active offer cards
      await fetchCards(shopIdParam);
    };

    init();

    // Track exit
    return () => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      trackPageExit({
        page: "deals",
        timeSpent,
        scrollDepth: maxScrollDepthRef.current,
      });
    };
  }, [searchParams]);

  const fetchCards = async (shopId: string | null) => {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("offer_cards")
        .select("*")
        .eq("status", "active")
        .order("display_order", { ascending: true });

      if (error) throw error;

      // Filter by targeting and scheduling
      const filteredCards = (data || []).filter((card) => {
        // Check date range
        if (card.start_date && new Date(card.start_date) > new Date(now)) return false;
        if (card.end_date && new Date(card.end_date) < new Date(now)) return false;

        // Check shop targeting
        const targetShops = card.target_shop_ids || [];
        if (targetShops.length > 0 && shopId && !targetShops.includes(shopId)) {
          return false;
        }

        return true;
      }) as OfferCard[];

      // Store all cards for AI recommendations
      setAllCards(filteredCards);

      // Separate cards by segment
      const moneyCards = filteredCards.filter(c => c.card_segment === "money_making");
      const dealCards = filteredCards.filter(c => c.card_segment === "viral_deals" || c.card_segment === "health" || !c.card_segment);

      setMoneyMakingCards(moneyCards);
      setViralDealsCards(dealCards);
    } catch (error) {
      console.error("Error fetching cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (card: OfferCard) => {
    // Use unified tracking helper
    await trackOfferEvent("card_click", { 
      redirect_url: card.redirect_url,
      card_title: card.title,
      card_segment: card.card_segment,
    }, { cardId: card.id });

    // Award coins for offer click if user is logged in
    if (user) {
      const result = await awardOfferClickCoins();
      if (result?.coins_awarded && result.coins_awarded > 0) {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-gold" />
              <span>+{result.coins_awarded} Coins Earned!</span>
            </div>
          ) as unknown as string,
          description: `You've used ${result.clicks_today}/${result.max_clicks} offer clicks today`,
        });
      } else if (result && result.clicks_today >= result.max_clicks) {
        toast({
          title: "Daily limit reached",
          description: `You've reached your ${result.max_clicks} offer clicks for today. Come back tomorrow!`,
          variant: "destructive",
        });
      }
    }

    // Navigate to dedicated detail page for all cards except viral_deals
    if (card.card_segment !== "viral_deals") {
      navigate(`/offer/${card.id}`);
      return;
    }

    // Viral deals: direct redirect
    if (card.redirect_url) {
      if (card.open_new_tab) {
        window.open(card.redirect_url, "_blank");
      } else {
        window.location.href = card.redirect_url;
      }
    }
  };

  const handleCardImpression = async (cardId: string) => {
    await trackOfferEvent("card_impression", {}, { cardId });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground mt-4">Loading exclusive deals...</p>
        </div>
      </div>
    );
  }

  const hasNoCards = moneyMakingCards.length === 0 && viralDealsCards.length === 0;

  return (
    <div className="min-h-screen bg-animated-gradient overflow-x-hidden">
      {/* Sticky Header with Wallet */}
      <OfferSearchBar />

      {/* Enhanced Hero Banner */}
      <DealsHero />

      {/* Super Deals Button */}
      <SuperDealsButton />

      {/* Daily Check-in Button - Above Money Making Section */}
      <DailyCheckinButton />

      {/* Money Making Segment */}
      {moneyMakingCards.length > 0 && (
        <MoneyMakingSegment
          cards={moneyMakingCards}
          onCardClick={handleCardClick}
          onCardImpression={handleCardImpression}
        />
      )}

      {/* Divider between segments */}
      {moneyMakingCards.length > 0 && viralDealsCards.length > 0 && (
        <div className="px-4 py-4">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      )}

      {/* Super Deals Preview - Featured Section */}
      <SuperDealsPreview />

      {/* Viral Deals Segment */}
      {viralDealsCards.length > 0 && (
        <ViralDealsSegment
          cards={viralDealsCards}
          onCardClick={handleCardClick}
          onCardImpression={handleCardImpression}
        />
      )}

      {/* AI-Powered Recommendations */}
      <RecommendedForYou
        recommendations={recommendations}
        loading={recommendationsLoading}
        onCardClick={handleCardClick}
        onCardImpression={handleCardImpression}
      />

      {/* Trust Section */}
      <OfferTrustSection />

      {/* Empty State */}
      {hasNoCards && (
        <div className="text-center py-16 px-4">
          <div className="text-6xl mb-4">🎁</div>
          <p className="text-lg text-foreground font-medium">No deals available right now</p>
          <p className="text-sm text-muted-foreground mt-2">
            Check back daily for new exclusive offers!
          </p>
        </div>
      )}

      <OfferFooter />
    </div>
  );
};

export default LighterOffers;
