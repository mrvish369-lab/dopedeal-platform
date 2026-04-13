import { useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface OfferCardSliderProps {
  cards: OfferCard[];
  onCardClick: (card: OfferCard) => void;
  onCardImpression: (cardId: string) => void;
}

// Template-specific icons/logos
const getTemplateIcon = (templateKey: string | null) => {
  switch (templateKey) {
    case "honeygain":
      return "🍯";
    case "cashkaro":
      return "💰";
    case "sports_trading":
      return "📈";
    case "telegram_loot":
      return "📱";
    case "amazon_deal":
      return "📦";
    default:
      return "🎁";
  }
};

export const OfferCardSlider = ({
  cards,
  onCardClick,
  onCardImpression,
}: OfferCardSliderProps) => {
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
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-4 px-4 pb-4" style={{ width: "max-content" }}>
        {cards.slice(0, 6).map((card, index) => (
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
              "group relative flex-shrink-0 w-[280px] rounded-2xl overflow-hidden cursor-pointer",
              "bg-card border border-border",
              "transition-all duration-300 ease-out",
              "hover:shadow-2xl hover:-translate-y-2 hover:border-primary",
              "active:scale-95",
              card.glow_enabled && "glow-primary",
              card.animation === "breathing" && "pulse-glow"
            )}
            style={{
              animationDelay: `${index * 100}ms`,
              backgroundColor: card.background_color || undefined,
            }}
          >
            {/* 3D Depth Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            {/* Card Content */}
            <div className="relative p-5">
              {/* Logo/Icon */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                  {card.logo_url ? (
                    <img
                      src={card.logo_url}
                      alt={card.title}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-2xl">{getTemplateIcon(card.template_key)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-base line-clamp-1 group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>
                </div>
              </div>

              {/* Subtitle */}
              {card.subtitle && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
                  {card.subtitle}
                </p>
              )}

              {/* CTA Button */}
              <Button
                className="w-full btn-fire gap-2 group-hover:scale-[1.02] transition-transform"
                size="sm"
              >
                {card.cta_text}
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Ripple Effect Overlay */}
            <div className="absolute inset-0 bg-primary/0 group-active:bg-primary/10 transition-colors pointer-events-none" />
          </div>
        ))}
      </div>
    </div>
  );
};
