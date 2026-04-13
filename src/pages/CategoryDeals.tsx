import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  clearCurrentSession,
  createSession,
  getFreshSessionId,
  setSessionContext,
} from "@/lib/session";
import { trackPageView, trackPageExit, trackOfferEvent } from "@/lib/tracking";
import { Button } from "@/components/ui/button";
import { OfferFooter } from "@/components/offers/OfferFooter";
import { 
  ArrowLeft, 
  ExternalLink, 
  TrendingUp, 
  Flame, 
  Heart, 
  Star,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OfferCard {
  id: string;
  template_key: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  logo_url: string | null;
  cta_text: string;
  redirect_url: string;
  open_new_tab: boolean;
  display_order: number;
  glow_enabled: boolean;
  animation: string | null;
  background_color: string | null;
  card_segment: string;
  features: string[] | null;
  original_price: string | null;
  discounted_price: string | null;
  discount_percent: string | null;
  rating: string | null;
  reviews_count: string | null;
  category: string | null;
}

const CATEGORY_CONFIG: Record<string, {
  title: string;
  subtitle: string;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  segment: string;
  accentColor: string;
}> = {
  "money-making": {
    title: "Money Making Hub",
    subtitle: "Verified ways to earn from your smartphone",
    emoji: "💰",
    icon: TrendingUp,
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    segment: "money_making",
    accentColor: "emerald",
  },
  "top-deals": {
    title: "Top Viral Deals",
    subtitle: "Best discounts on trending products",
    emoji: "🛒",
    icon: Flame,
    gradient: "from-orange-500 via-red-500 to-pink-500",
    segment: "viral_deals",
    accentColor: "orange",
  },
  "health-courses": {
    title: "Health & Wellness",
    subtitle: "Ayurvedic courses for a better life",
    emoji: "🌿",
    icon: Heart,
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    segment: "health",
    accentColor: "green",
  },
};

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

const CategoryDeals = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [cards, setCards] = useState<OfferCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const startTimeRef = useRef(Date.now());
  const maxScrollDepthRef = useRef(0);
  const hasTrackedPageViewRef = useRef(false);

  const config = category ? CATEGORY_CONFIG[category] : null;

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

  useEffect(() => {
    const init = async () => {
      if (!config) {
        navigate("/deals");
        return;
      }

      const shopIdParam = searchParams.get("shop_id");
      setShopId(shopIdParam);

      // Persist context for tracking enrichment
      setSessionContext({
        shopId: shopIdParam || "",
      });

      let currentSessionId = getFreshSessionId(SESSION_TTL_MS);
      
      if (!currentSessionId) {
        clearCurrentSession();
        currentSessionId = await createSession({
          shopId: shopIdParam || undefined,
        });
      }
      
      if (currentSessionId) {
        // Track page view (deduplicated)
        if (!hasTrackedPageViewRef.current) {
          hasTrackedPageViewRef.current = true;
          await trackPageView(`category_${category}`, {
            referrer: document.referrer,
          });
        }
      }

      await fetchCards(shopIdParam);
    };

    init();

    return () => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      trackPageExit({
        page: `category_${category}`,
        timeSpent,
        scrollDepth: maxScrollDepthRef.current,
      });
    };
  }, [category, searchParams]);

  const fetchCards = async (shopId: string | null) => {
    if (!config) return;

    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("offer_cards")
        .select("*")
        .eq("status", "active")
        .eq("card_segment", config.segment)
        .order("display_order", { ascending: true });

      if (error) throw error;

      const filteredCards = (data || []).filter((card) => {
        if (card.start_date && new Date(card.start_date) > new Date(now)) return false;
        if (card.end_date && new Date(card.end_date) < new Date(now)) return false;

        const targetShops = card.target_shop_ids || [];
        if (targetShops.length > 0 && shopId && !targetShops.includes(shopId)) {
          return false;
        }

        return true;
      }) as OfferCard[];

      setCards(filteredCards);
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
      category,
    }, { cardId: card.id });

    if (card.redirect_url) {
      let url = card.redirect_url.trim();
      if (url && !url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/")) {
        url = "https://" + url;
      }
      if (card.open_new_tab || url.startsWith("http")) {
        window.open(url, "_blank");
      } else {
        window.location.href = url;
      }
    }
  };

  if (!config) {
    return null;
  }

  const Icon = config.icon;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground mt-4">Loading {config.title}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-animated-gradient overflow-x-hidden">
      {/* Glassmorphic Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-white/10">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/deals")}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br",
              config.gradient
            )}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground flex items-center gap-2">
                {config.emoji} {config.title}
              </h1>
              <p className="text-xs text-muted-foreground">{cards.length} offers available</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Glassmorphism */}
      <section className="px-4 py-6">
        <div className={cn(
          "relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br",
          config.gradient
        )}>
          {/* Glass overlay */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
          
          <div className="relative z-10 text-center">
            <span className="text-5xl mb-4 block">{config.emoji}</span>
            <h2 className="text-2xl font-bold text-white mb-2">{config.title}</h2>
            <p className="text-white/80 text-sm">{config.subtitle}</p>
          </div>
        </div>
      </section>

      {/* Cards Grid with Glassmorphism */}
      <section className="px-4 pb-8">
        {cards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card, index) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card)}
                className={cn(
                  "group relative rounded-2xl overflow-hidden cursor-pointer",
                  "backdrop-blur-xl bg-card/40 border border-white/10",
                  "hover:bg-card/60 hover:border-white/20",
                  "transition-all duration-300 ease-out",
                  "hover:shadow-2xl hover:-translate-y-1",
                  "active:scale-[0.98]",
                  card.glow_enabled && `shadow-[0_0_30px_rgba(16,185,129,0.2)]`
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Glass gradient overlay */}
                <div className={cn(
                  "absolute inset-0 opacity-20 bg-gradient-to-br pointer-events-none",
                  config.gradient
                )} />

                <div className="relative p-5">
                  {/* Discount Badge */}
                  {card.discount_percent && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-destructive/90 text-white text-xs font-bold">
                      {card.discount_percent}% OFF
                    </div>
                  )}

                  {/* Logo & Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={cn(
                      "w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden",
                      "backdrop-blur-sm bg-white/10 border border-white/20"
                    )}>
                      {card.logo_url ? (
                        <img
                          src={card.logo_url}
                          alt={card.title}
                          className="w-12 h-12 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="text-3xl">{config.emoji}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {card.title}
                      </h3>
                      {card.rating && (
                        <div className="flex items-center gap-1 text-xs text-yellow-500 mt-1">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{card.rating}</span>
                          {card.reviews_count && (
                            <span className="text-muted-foreground">({card.reviews_count} reviews)</span>
                          )}
                        </div>
                      )}
                      {card.category && (
                        <span className={cn(
                          "inline-block mt-2 text-xs px-2 py-0.5 rounded-full",
                          `bg-${config.accentColor}-500/20 text-${config.accentColor}-400 border border-${config.accentColor}-500/30`
                        )}>
                          {card.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {card.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {card.description}
                    </p>
                  )}

                  {/* Features */}
                  {card.features && card.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {card.features.slice(0, 3).map((feature, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 rounded-full bg-white/10 text-foreground/80"
                        >
                          ✓ {feature}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Pricing */}
                  {(card.original_price || card.discounted_price) && (
                    <div className="flex items-center gap-2 mb-4">
                      {card.discounted_price && (
                        <span className="text-xl font-bold text-primary">₹{card.discounted_price}</span>
                      )}
                      {card.original_price && (
                        <span className="text-sm text-muted-foreground line-through">₹{card.original_price}</span>
                      )}
                    </div>
                  )}

                  {/* CTA Button */}
                  <Button
                    className={cn(
                      "w-full gap-2 font-bold",
                      config.accentColor === "emerald" && "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400",
                      config.accentColor === "orange" && "btn-fire",
                      config.accentColor === "green" && "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400"
                    )}
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
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">{config.emoji}</div>
            <p className="text-lg text-foreground font-medium">No {config.title.toLowerCase()} available</p>
            <p className="text-sm text-muted-foreground mt-2">Check back soon for new offers!</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/deals")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Deals
            </Button>
          </div>
        )}
      </section>

      <OfferFooter />
    </div>
  );
};

export default CategoryDeals;
