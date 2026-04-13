import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Gift, Flame, TrendingUp, Sparkles, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  badge_text: string | null;
  gradient_from: string;
  gradient_via: string;
  gradient_to: string;
  icon_name: string;
  redirect_url: string | null;
  image_url: string | null;
  landing_enabled: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Flame,
  TrendingUp,
  Sparkles,
  Gift,
  Star,
  Zap,
};

const GRADIENT_MAP: Record<string, string> = {
  primary: "hsl(var(--primary))",
  "orange-500": "#f97316",
  "yellow-500": "#eab308",
  "emerald-500": "#10b981",
  "teal-500": "#14b8a6",
  "cyan-500": "#06b6d4",
  "green-500": "#22c55e",
  "blue-500": "#3b82f6",
  "purple-500": "#a855f7",
  "pink-500": "#ec4899",
  "red-500": "#ef4444",
};

// Default banners for fallback
const DEFAULT_BANNERS: Banner[] = [
  {
    id: "default-1",
    title: "India's #1 Authentic Deal Platform",
    subtitle: "Verified offers • Real earnings • Daily updates",
    badge_text: "🔥 Trending",
    gradient_from: "primary",
    gradient_via: "orange-500",
    gradient_to: "yellow-500",
    icon_name: "Flame",
    redirect_url: null,
    image_url: null,
    landing_enabled: false,
  },
  {
    id: "default-2",
    title: "Earn Money From Your Phone",
    subtitle: "HoneyGain • CashKaro • Sports Trading & More",
    badge_text: "💰 Money Making",
    gradient_from: "emerald-500",
    gradient_via: "teal-500",
    gradient_to: "cyan-500",
    icon_name: "TrendingUp",
    redirect_url: null,
    image_url: null,
    landing_enabled: false,
  },
];

export const DealsHero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [banners, setBanners] = useState<Banner[]>(DEFAULT_BANNERS);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    const { data, error } = await supabase
      .from("deal_banners")
      .select("*")
      .eq("status", "active")
      .order("display_order", { ascending: true });

    if (data && data.length > 0) {
      setBanners(data as Banner[]);
    }
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const current = banners[currentSlide];
  const Icon = ICON_MAP[current.icon_name] || Flame;

  const getGradientStyle = () => {
    if (current.image_url) {
      return {
        backgroundImage: `url(${current.image_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    
    const from = GRADIENT_MAP[current.gradient_from] || GRADIENT_MAP.primary;
    const via = GRADIENT_MAP[current.gradient_via] || GRADIENT_MAP["orange-500"];
    const to = GRADIENT_MAP[current.gradient_to] || GRADIENT_MAP["yellow-500"];
    
    return {
      background: `linear-gradient(to right, ${from}, ${via}, ${to})`,
    };
  };

  const handleBannerClick = () => {
    // If landing page is enabled, navigate to landing page
    if (current.landing_enabled) {
      navigate(`/banner/${current.id}`);
      return;
    }

    // Otherwise use redirect URL
    if (current.redirect_url) {
      let url = current.redirect_url.trim();
      if (url && !url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/")) {
        url = "https://" + url;
      }
      if (url.startsWith("/")) {
        navigate(url);
      } else if (url.startsWith("http")) {
        window.open(url, "_blank");
      }
    }
  };

  return (
    <section className="px-3 pt-3 pb-2">
      <div
        onClick={handleBannerClick}
        className={cn(
          "relative overflow-hidden rounded-2xl flex flex-col justify-end",
          "transition-all duration-500",
          "border border-white/20 shadow-xl",
          (current.redirect_url || current.landing_enabled) && "cursor-pointer hover:scale-[1.01] active:scale-[0.99]",
          // Expanded height for better image visibility
          current.image_url ? "min-h-[220px] md:min-h-[280px]" : "min-h-[160px] md:min-h-[200px]"
        )}
        style={getGradientStyle()}
      >
        {/* Minimal overlay for gradient banners */}
        {!current.image_url && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none" />
        )}
        
        {/* Subtle bottom gradient for image banners - better image visibility */}
        {current.image_url && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        )}
        
        {/* Decorative Elements - smaller on image banners */}
        {!current.image_url && (
          <>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          </>
        )}

        {/* Content - positioned at bottom for image banners */}
        <div className={cn(
          "relative z-10 p-4",
          current.image_url && "mt-auto"
        )}>
          {/* Badge - smaller text */}
          {current.badge_text && (
            <div className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
              <Icon className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wide">
                {current.badge_text}
              </span>
            </div>
          )}
          
          {/* Title - reduced size */}
          <h1 className={cn(
            "font-bold text-white mb-1 drop-shadow-lg leading-tight",
            current.image_url ? "text-lg md:text-xl" : "text-xl md:text-2xl"
          )}>
            {current.title}
          </h1>
          
          {/* Subtitle - reduced size */}
          <p className={cn(
            "text-white/90 mb-3 max-w-sm drop-shadow",
            current.image_url ? "text-xs md:text-sm" : "text-sm md:text-base"
          )}>
            {current.subtitle}
          </p>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-white text-black hover:bg-white/90 font-bold gap-1 shadow-lg border-0 h-8 text-xs px-3"
              onClick={(e) => {
                e.stopPropagation();
                handleBannerClick();
              }}
            >
              Explore
              <ChevronRight className="w-3 h-3" />
            </Button>
            <span className="text-[10px] text-white/80 font-medium drop-shadow">
              <Gift className="w-3 h-3 inline mr-1" />
              100+ Offers
            </span>
          </div>
        </div>

        {/* Slide Indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? "bg-white w-6" : "bg-white/50 w-1.5"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Category Buttons - tighter spacing */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {[
          { icon: "💰", label: "Money Making", count: "15+", path: "/category/money-making", bgClass: "bg-emerald-500/20", textClass: "text-emerald-700 dark:text-emerald-300", borderClass: "border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/30" },
          { icon: "🛒", label: "Top Deals", count: "30+", path: "/category/top-deals", bgClass: "bg-orange-500/20", textClass: "text-orange-700 dark:text-orange-300", borderClass: "border-orange-500/40 hover:border-orange-400 hover:bg-orange-500/30" },
          { icon: "🌿", label: "Health", count: "10+", path: "/category/health-courses", bgClass: "bg-green-500/20", textClass: "text-green-700 dark:text-green-300", borderClass: "border-green-500/40 hover:border-green-400 hover:bg-green-500/30" },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => navigate(stat.path)}
            className={cn(
              "relative overflow-hidden rounded-lg p-2 text-center cursor-pointer",
              "border transition-all duration-300",
              "hover:-translate-y-0.5 hover:shadow-md active:scale-95",
              stat.bgClass,
              stat.borderClass
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
            <span className="text-xl relative z-10">{stat.icon}</span>
            <p className={cn("text-base font-bold mt-0.5 relative z-10", stat.textClass)}>{stat.count}</p>
            <p className="text-[10px] text-muted-foreground relative z-10">{stat.label}</p>
          </button>
        ))}
      </div>
    </section>
  );
};
