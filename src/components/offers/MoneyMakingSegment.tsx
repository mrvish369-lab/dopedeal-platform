import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp, Wallet, Zap, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfferCard {
  id: string;
  template_key: string | null;
  title: string;
  subtitle: string | null;
  logo_url: string | null;
  cta_text: string;
  redirect_url: string;
  open_new_tab: boolean;
  glow_enabled: boolean;
  animation: string | null;
  background_color: string | null;
}

interface MoneyMakingSegmentProps {
  cards: OfferCard[];
  onCardClick: (card: OfferCard) => void;
  onCardImpression: (cardId: string) => void;
}

// Template-specific icons for money-making offers
const getMoneyIcon = (templateKey: string | null) => {
  switch (templateKey) {
    case "honeygain":
      return "🍯";
    case "cashkaro":
    case "earnkaro":
      return "💰";
    case "sports_trading":
      return "📈";
    case "dropshipping":
      return "📦";
    case "facebook_ads":
      return "📱";
    case "telegram_channel":
    case "whatsapp_channel":
      return "💬";
    default:
      return "🚀";
  }
};

export const MoneyMakingSegment = ({
  cards,
  onCardClick,
  onCardImpression,
}: MoneyMakingSegmentProps) => {
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

  if (cards.length === 0) return null;

  return (
    <section className="py-12 bg-white">
      {/* Section Header - Money Making Theme */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-green to-brand-green-dim flex items-center justify-center shadow-md">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-2xl text-brand-forest flex items-center gap-2">
              💸 Money Making Offers
            </h2>
            <p className="text-sm text-brand-text-dim">
              Verified ways to make money from your smartphone
            </p>
          </div>
        </div>
        
        {/* Trust badges */}
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs px-3 py-1 rounded-full bg-brand-green/10 text-brand-green-dim border border-brand-green/25 font-medium">
            ✓ 100% Verified Methods
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-brand-green/10 text-brand-green-dim border border-brand-green/25 font-medium">
            🔥 Trending Now
          </span>
        </div>
      </div>

      {/* Horizontal Scrollable Cards */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 sm:px-6 pb-4 max-w-7xl mx-auto" style={{ width: "max-content" }}>
          {cards.slice(0, 8).map((card, index) => (
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
                "group relative flex-shrink-0 w-[300px] rounded-2xl overflow-hidden cursor-pointer",
                "bg-white border-2 border-brand-border",
                "transition-all duration-300 ease-out",
                "hover:shadow-xl hover:shadow-brand-green/10 hover:-translate-y-2 hover:border-brand-green",
                "active:scale-95"
              )}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Card Content */}
              <div className="relative p-5">
                {/* Logo/Icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-green/20 to-brand-teal/20 flex items-center justify-center overflow-hidden border border-brand-green/30">
                    {card.logo_url ? (
                      <img
                        src={card.logo_url}
                        alt={card.title}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-3xl">{getMoneyIcon(card.template_key)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-brand-text text-base line-clamp-1 group-hover:text-brand-green-dim transition-colors">
                      {card.title}
                    </h3>
                    <span className="text-xs text-brand-green-dim font-medium">
                      Earn from ₹500 - ₹50K/month
                    </span>
                  </div>
                </div>

                {/* Subtitle */}
                {card.subtitle && (
                  <p className="text-sm text-brand-text-dim line-clamp-2 mb-4 min-h-[40px]">
                    {card.subtitle}
                  </p>
                )}

                {/* Stats/Benefits */}
                <div className="flex items-center gap-2 mb-4 text-xs text-brand-text-faint">
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> Mobile Only
                  </span>
                  <span className="flex items-center gap-1">
                    <Wallet className="w-3 h-3" /> Free to Start
                  </span>
                </div>

                {/* CTA Button - Green theme */}
                <Button
                  className="w-full bg-gradient-to-r from-brand-green to-brand-green-dim hover:from-brand-green-light hover:to-brand-green text-white font-bold gap-2 group-hover:scale-[1.02] transition-transform"
                  size="sm"
                >
                  <Zap className="w-4 h-4" />
                  {card.cta_text}
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid for additional cards */}
      {cards.length > 4 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
          <div className="grid grid-cols-2 gap-4">
            {cards.slice(4, 8).map((card) => (
              <div
                key={card.id}
                onClick={() => onCardClick(card)}
                className="bg-white border-2 border-brand-border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-brand-green hover:shadow-md hover:shadow-brand-green/10 active:scale-95"
              >
                <div className="flex items-center gap-2 mb-2">
                  {card.logo_url ? (
                    <img src={card.logo_url} alt="" className="w-8 h-8 object-contain" />
                  ) : (
                    <span className="text-xl">{getMoneyIcon(card.template_key)}</span>
                  )}
                  <h3 className="font-semibold text-brand-text text-sm line-clamp-1 flex-1">{card.title}</h3>
                </div>
                <p className="text-xs text-brand-text-dim line-clamp-2">{card.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
