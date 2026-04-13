import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/lazy-image";
import { Sparkles, Star, ExternalLink, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

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
  discount_percent: string | null;
  rating: string | null;
}

interface RecommendationScore {
  card: OfferCard;
  score: number;
  reason: string;
}

interface RecommendedForYouProps {
  recommendations: RecommendationScore[];
  loading: boolean;
  onCardClick: (card: OfferCard) => void;
  onCardImpression: (cardId: string) => void;
}

// Get icon based on recommendation reason
const getReasonIcon = (reason: string) => {
  if (reason.includes("interest") || reason.includes("preference")) return "🎯";
  if (reason.includes("morning") || reason.includes("evening") || reason.includes("night")) return "⏰";
  if (reason.includes("OFF")) return "🔥";
  if (reason.includes("rated")) return "⭐";
  if (reason.includes("Trending")) return "📈";
  if (reason.includes("liked")) return "💡";
  return "✨";
};

// Template-specific icons
const getDealIcon = (templateKey: string | null, segment: string | null) => {
  if (segment === "money_making") return "💰";
  if (segment === "health") return "🌿";
  switch (templateKey) {
    case "amazon_deal":
      return "📦";
    case "subscription":
      return "🎫";
    case "health_course":
    case "ayurvedic":
      return "🌿";
    default:
      return "🎁";
  }
};

export const RecommendedForYou = ({
  recommendations,
  loading,
  onCardClick,
  onCardImpression,
}: RecommendedForYouProps) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const impressedCards = useRef<Set<string>>(new Set());

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardId = entry.target.getAttribute("data-card-id");
            if (cardId && !impressedCards.current.has(cardId)) {
              impressedCards.current.add(cardId);
              onCardImpression(cardId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [onCardImpression]);

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center animate-pulse">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="h-5 w-40 bg-muted rounded animate-pulse" />
            <div className="h-3 w-60 bg-muted rounded animate-pulse mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card/50 rounded-xl p-4 animate-pulse">
              <div className="w-full aspect-square bg-muted/30 rounded-lg mb-3" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <section className="px-4 py-6">
      {/* Section Header with AI Badge */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {/* AI pulse effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 animate-ping opacity-30" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            🎯 Recommended For You
            <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30 font-medium">
              AI Powered
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Personalized picks based on your activity & interests
          </p>
        </div>
      </div>

      {/* Smart Recommendation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {recommendations.map(({ card, score, reason }, index) => (
          <div
            key={card.id}
            data-card-id={card.id}
            ref={(el) => {
              if (el && observerRef.current) {
                observerRef.current.observe(el);
              }
            }}
            onClick={() => onCardClick(card)}
            className={cn(
              "group relative bg-card/60 backdrop-blur-sm border rounded-xl p-3 cursor-pointer",
              "transition-all duration-300 ease-out",
              "hover:shadow-xl hover:-translate-y-1 hover:border-purple-400/50",
              "active:scale-95",
              index === 0 && "col-span-2 md:col-span-1 border-purple-500/40 bg-gradient-to-br from-purple-500/10 to-pink-500/10",
              index !== 0 && "border-border hover:bg-card/80"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Score-based recommendation badge */}
            <div className="absolute -top-2 -right-2 z-10">
              {score >= 80 ? (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-lg flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Perfect Match
                </div>
              ) : score >= 60 ? (
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  For You
                </div>
              ) : null}
            </div>

            {/* Reason tag */}
            <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted/50 text-muted-foreground mb-2">
              <span>{getReasonIcon(reason)}</span>
              <span className="truncate max-w-[120px]">{reason}</span>
            </div>

            {/* Product Image with lazy loading and blur placeholder */}
            <LazyImage
              src={card.image_url || card.logo_url || ""}
              alt={card.title}
              fallbackSrc={card.image_url ? card.logo_url || undefined : undefined}
              objectFit={(card.image_fit as "cover" | "contain" | "fill" | "scale-down") || "cover"}
              containerClassName="w-full aspect-[4/3] rounded-lg mb-3 group-hover:scale-[1.02] transition-transform"
              fallbackIcon={<span className="text-5xl">{getDealIcon(card.template_key, card.card_segment)}</span>}
            />

            {/* Card Details */}
            <h4 className="font-semibold text-foreground text-sm line-clamp-2 mb-1 group-hover:text-purple-400 transition-colors">
              {card.title}
            </h4>

            {/* Rating & Discount */}
            <div className="flex items-center justify-between mb-2">
              {card.rating && (
                <div className="flex items-center gap-1 text-xs text-yellow-500">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{card.rating}</span>
                </div>
              )}
              {card.discount_percent && (
                <span className="text-xs font-bold text-green-500">
                  {card.discount_percent}% OFF
                </span>
              )}
            </div>

            {/* CTA */}
            <Button
              size="sm"
              className={cn(
                "w-full gap-1 text-xs",
                index === 0 
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  : "bg-primary hover:bg-primary/90"
              )}
            >
              {card.cta_text}
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
};
