import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Coins, Lock, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface SuperDeal {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  category: string;
  discount_percent: number | null;
  coins_required: number;
  total_coupons: number;
  coupons_claimed: number;
  rating: number | null;
}

export const SuperDealsPreview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deals, setDeals] = useState<SuperDeal[]>([]);
  const [unlockedDeals, setUnlockedDeals] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
    if (user) {
      fetchUnlockedDeals();
    }
  }, [user]);

  const fetchDeals = async () => {
    const { data, error } = await (supabase
      .from("super_deals" as any)
      .select("id, title, subtitle, image_url, category, discount_percent, coins_required, total_coupons, coupons_claimed, rating")
      .eq("status", "active")
      .order("display_order", { ascending: true })
      .limit(4) as any);

    if (data && !error) {
      setDeals(data as SuperDeal[]);
    }
    setLoading(false);
  };

  const fetchUnlockedDeals = async () => {
    if (!user) return;
    const { data } = await (supabase
      .from("user_unlocked_deals" as any)
      .select("super_deal_id")
      .eq("user_id", user.id) as any);

    if (data) {
      setUnlockedDeals(new Set((data as { super_deal_id: string }[]).map((d) => d.super_deal_id)));
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "digital_course":
        return "📚";
      case "ebook":
        return "📖";
      case "software":
        return "💻";
      default:
        return "🎁";
    }
  };

  if (loading || deals.length === 0) {
    return null;
  }

  return (
    <section className="py-6">
      {/* Section Header */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                ✨ Super Deals
                <span className="text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold font-medium">
                  Unlock with Coins
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Exclusive coupons for premium products
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-purple-400 hover:text-purple-300"
            onClick={() => navigate("/super-deals")}
          >
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Horizontal Scroll Cards */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-4 pb-2" style={{ width: "max-content" }}>
          {deals.map((deal, index) => {
            const isUnlocked = unlockedDeals.has(deal.id);
            const couponsLeft = deal.total_coupons - deal.coupons_claimed;

            return (
              <div
                key={deal.id}
                onClick={() => navigate(`/super-deals/${deal.id}`)}
                className={cn(
                  "relative flex-shrink-0 w-[200px] rounded-xl overflow-hidden cursor-pointer",
                  "transition-all duration-300 ease-out",
                  "hover:shadow-xl hover:-translate-y-1",
                  "active:scale-95",
                  isUnlocked
                    ? "border-2 border-emerald-500/50 bg-emerald-500/5"
                    : "border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Unlock Badge */}
                <div className={cn(
                  "absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
                  isUnlocked
                    ? "bg-emerald-500/90 text-white"
                    : "bg-gold/90 text-background"
                )}>
                  {isUnlocked ? (
                    <>
                      <Lock className="w-3 h-3" />
                      Unlocked
                    </>
                  ) : (
                    <>
                      <Coins className="w-3 h-3" />
                      {deal.coins_required}
                    </>
                  )}
                </div>

                {/* Discount Badge */}
                {deal.discount_percent && (
                  <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-red-500 text-white text-xs font-bold">
                    -{deal.discount_percent}%
                  </div>
                )}

                {/* Image */}
                <div className="relative h-24 bg-muted/50">
                  {deal.image_url ? (
                    <img
                      src={deal.image_url}
                      alt={deal.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {getCategoryIcon(deal.category)}
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                    {deal.title}
                  </h3>
                  {deal.subtitle && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {deal.subtitle}
                    </p>
                  )}

                  {/* Rating */}
                  {deal.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-3 h-3 fill-gold text-gold" />
                      <span className="text-xs text-muted-foreground">{deal.rating}</span>
                    </div>
                  )}

                  {/* Coupons Progress */}
                  {!isUnlocked && (
                    <div className="mt-2">
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          style={{ width: `${(couponsLeft / deal.total_coupons) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {couponsLeft} left
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* View All Card */}
          <div
            onClick={() => navigate("/super-deals")}
            className={cn(
              "relative flex-shrink-0 w-[120px] rounded-xl overflow-hidden cursor-pointer",
              "border border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-pink-500/20",
              "transition-all duration-300 ease-out",
              "hover:shadow-xl hover:-translate-y-1 hover:border-purple-400",
              "active:scale-95",
              "flex flex-col items-center justify-center"
            )}
            style={{ minHeight: "180px" }}
          >
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
              <ChevronRight className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-sm font-medium text-purple-400">View All</span>
            <span className="text-xs text-muted-foreground">Super Deals</span>
          </div>
        </div>
      </div>
    </section>
  );
};
