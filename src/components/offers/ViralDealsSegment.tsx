import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Flame, ShoppingBag, Heart, Star } from "lucide-react";
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

interface ViralDealsSegmentProps {
  cards: OfferCard[];
  onCardClick: (card: OfferCard) => void;
  onCardImpression: (cardId: string) => void;
}

// Template-specific icons for viral deals
const getDealIcon = (templateKey: string | null) => {
  switch (templateKey) {
    case "amazon_deal":
      return "📦";
    case "subscription":
      return "🎫";
    case "health_course":
    case "ayurvedic":
      return "🌿";
    case "lungs_detox":
      return "🫁";
    case "digestion_fix":
      return "💚";
    case "smoker_product":
      return "🚬";
    default:
      return "🎁";
  }
};

// Deal type badges
const getDealBadge = (templateKey: string | null) => {
  switch (templateKey) {
    case "amazon_deal":
      return { text: "Amazon", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" };
    case "subscription":
      return { text: "Subscription", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
    case "health_course":
    case "ayurvedic":
    case "lungs_detox":
    case "digestion_fix":
      return { text: "Health", color: "bg-green-500/20 text-green-400 border-green-500/30" };
    case "smoker_product":
      return { text: "For Smokers", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    default:
      return { text: "Hot Deal", color: "bg-red-500/20 text-red-400 border-red-500/30" };
  }
};

export const ViralDealsSegment = ({
  cards,
  onCardClick,
  onCardImpression,
}: ViralDealsSegmentProps) => {
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

  // Separate cards by type
  const affiliateCards = cards.filter(c => 
    c.template_key?.includes("amazon") || 
    c.template_key?.includes("subscription") || 
    c.template_key?.includes("smoker")
  );
  
  const healthCourses = cards.filter(c => 
    c.template_key?.includes("health") || 
    c.template_key?.includes("ayurvedic") ||
    c.template_key?.includes("lungs") ||
    c.template_key?.includes("digestion")
  );
  
  const otherDeals = cards.filter(c => 
    !affiliateCards.includes(c) && !healthCourses.includes(c)
  );

  if (cards.length === 0) return null;

  return (
    <section className="py-8">
      {/* Section Header - Viral Deals Theme with Glassmorphism */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg backdrop-blur-sm">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              🔥 Viral Top Deals
            </h2>
            <p className="text-sm text-muted-foreground">
              Best offers on products, subscriptions & health courses
            </p>
          </div>
        </div>
        
        {/* Trust badges with glassmorphism */}
        <div className="flex gap-2 flex-wrap mt-3">
          <span className="text-xs px-2 py-1 rounded-full backdrop-blur-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
            🛒 Amazon Partner
          </span>
          <span className="text-xs px-2 py-1 rounded-full backdrop-blur-md bg-green-500/10 text-green-400 border border-green-500/20">
            🌿 Ayurvedic Certified
          </span>
        </div>
      </div>

      {/* Featured Deals Carousel */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 pb-4" style={{ width: "max-content" }}>
          {cards.slice(0, 6).map((card, index) => {
            const badge = getDealBadge(card.template_key);
            return (
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
                  "backdrop-blur-xl bg-card/40 border border-orange-500/20",
                  "transition-all duration-300 ease-out",
                  "hover:shadow-2xl hover:-translate-y-2 hover:border-orange-400/50",
                  "hover:bg-card/60",
                  "active:scale-95",
                  card.glow_enabled && "shadow-[0_0_30px_rgba(249,115,22,0.2)]",
                  card.animation === "breathing" && "pulse-glow"
                )}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Glassmorphic gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-red-500/10 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                
                {/* Deal badge */}
                <div className={cn(
                  "absolute top-3 right-3 text-xs px-2 py-1 rounded-full font-medium border",
                  badge.color
                )}>
                  {badge.text}
                </div>

                {/* Card Content */}
                <div className="relative p-5 pt-10">
                  {/* Logo/Icon */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/30 to-red-500/30 flex items-center justify-center overflow-hidden border border-orange-500/40">
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
                        <span className="text-3xl">{getDealIcon(card.template_key)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-base line-clamp-1 group-hover:text-orange-400 transition-colors">
                        {card.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-yellow-500">
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-muted-foreground ml-1">5.0</span>
                      </div>
                    </div>
                  </div>

                  {/* Subtitle */}
                  {card.subtitle && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
                      {card.subtitle}
                    </p>
                  )}

                  {/* CTA Button - Orange theme */}
                  <Button
                    className="w-full btn-fire gap-2 group-hover:scale-[1.02] transition-transform"
                    size="sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {card.cta_text}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Health Courses Section */}
      {healthCourses.length > 0 && (
        <div className="px-4 mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-bold text-foreground">🌿 Ayurvedic Health Courses</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Transform your health with ancient wisdom</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthCourses.slice(0, 4).map((card) => (
              <div
                key={card.id}
                onClick={() => onCardClick(card)}
                className="bg-gradient-to-br from-green-500/5 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-green-400 hover:shadow-lg active:scale-[0.98] flex gap-4"
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center shrink-0">
                  {card.logo_url ? (
                    <img src={card.logo_url} alt="" className="w-10 h-10 object-contain" />
                  ) : (
                    <span className="text-2xl">{getDealIcon(card.template_key)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground text-sm line-clamp-1">{card.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{card.subtitle}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-green-400 font-medium">📚 Lifetime Access</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  );
};
