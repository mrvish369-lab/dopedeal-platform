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
    <section className="py-8">
      {/* Section Header - Money Making Theme with Glass Effect */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg backdrop-blur-sm">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              💸 Online Earning Hub
            </h2>
            <p className="text-sm text-muted-foreground">
              Verified ways to make money from your smartphone
            </p>
          </div>
        </div>
        
        {/* Trust badges with glassmorphism */}
        <div className="flex gap-2 flex-wrap mt-3">
          <span className="text-xs px-2 py-1 rounded-full backdrop-blur-md bg-secondary/10 text-secondary border border-secondary/20">
            ✓ 100% Verified Methods
          </span>
          <span className="text-xs px-2 py-1 rounded-full backdrop-blur-md bg-primary/10 text-primary border border-primary/20">
            🔥 Trending Now
          </span>
        </div>
      </div>

      {/* Horizontal Scrollable Cards */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 pb-4" style={{ width: "max-content" }}>
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
                "backdrop-blur-xl bg-card/40 border border-emerald-500/20",
                "transition-all duration-300 ease-out",
                "hover:shadow-2xl hover:-translate-y-2 hover:border-emerald-400/50",
                "hover:bg-card/60",
                "active:scale-95",
                card.glow_enabled && "shadow-[0_0_30px_rgba(16,185,129,0.2)]",
                card.animation === "breathing" && "pulse-glow"
              )}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Glassmorphic gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              
              {/* Floating coins decoration */}
              <div className="absolute top-2 right-2 text-2xl opacity-20 animate-bounce">💰</div>

              {/* Card Content */}
              <div className="relative p-5">
                {/* Logo/Icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center overflow-hidden border border-emerald-500/40">
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
                    <h3 className="font-bold text-foreground text-base line-clamp-1 group-hover:text-emerald-400 transition-colors">
                      {card.title}
                    </h3>
                    <span className="text-xs text-emerald-400 font-medium">
                      Earn from ₹500 - ₹50K/month
                    </span>
                  </div>
                </div>

                {/* Subtitle */}
                {card.subtitle && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
                    {card.subtitle}
                  </p>
                )}

                {/* Stats/Benefits */}
                <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> Mobile Only
                  </span>
                  <span className="flex items-center gap-1">
                    <Wallet className="w-3 h-3" /> Free to Start
                  </span>
                </div>

                {/* CTA Button - Green theme */}
                <Button
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold gap-2 group-hover:scale-[1.02] transition-transform"
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
        <div className="px-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
            {cards.slice(4, 8).map((card) => (
              <div
                key={card.id}
                onClick={() => onCardClick(card)}
                className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-emerald-400 hover:shadow-lg active:scale-95"
              >
                <div className="flex items-center gap-2 mb-2">
                  {card.logo_url ? (
                    <img src={card.logo_url} alt="" className="w-8 h-8 object-contain" />
                  ) : (
                    <span className="text-xl">{getMoneyIcon(card.template_key)}</span>
                  )}
                  <h3 className="font-semibold text-foreground text-sm line-clamp-1 flex-1">{card.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{card.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
