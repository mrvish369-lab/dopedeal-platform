import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Coins, Lock, Star, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/wallet/WalletButton";
import { CoinEarningsSummary } from "@/components/wallet/CoinEarningsSummary";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface SuperDeal {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  category: string;
  original_price: number | null;
  discounted_price: number | null;
  discount_percent: number | null;
  platform_name: string | null;
  coins_required: number;
  total_coupons: number;
  coupons_claimed: number;
  features: string[] | null;
  rating: number | null;
}

const SuperDeals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deals, setDeals] = useState<SuperDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockedDeals, setUnlockedDeals] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDeals();
    if (user) {
      fetchUnlockedDeals();
    }
  }, [user]);

  const fetchDeals = async () => {
    const { data, error } = await supabase
      .from("super_deals")
      .select("*")
      .eq("status", "active")
      .order("display_order", { ascending: true });

    if (data && !error) {
      setDeals(data as SuperDeal[]);
    }
    setLoading(false);
  };

  const fetchUnlockedDeals = async () => {
    const { data } = await supabase
      .from("user_unlocked_deals")
      .select("super_deal_id")
      .eq("user_id", user!.id);

    if (data) {
      setUnlockedDeals(new Set(data.map((d) => d.super_deal_id)));
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/deals")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">Super Deals</span>
            </div>
          </div>
          <WalletButton />
        </div>
      </header>

      {/* Coin Earnings Summary */}
      <CoinEarningsSummary />

      {/* Hero Banner */}
      <div className="px-4 py-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-white mb-2">
              🎁 Exclusive Coupons
            </h1>
            <p className="text-white/80 text-sm mb-4">
              Unlock premium courses & ebooks with your coins
            </p>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <Lock className="w-4 h-4" />
              <span>Use coins to unlock exclusive discount codes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deals List */}
      <div className="px-4 pb-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No deals available right now</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deals.map((deal) => {
              const isUnlocked = unlockedDeals.has(deal.id);
              const couponsLeft = deal.total_coupons - deal.coupons_claimed;
              
              return (
                <div
                  key={deal.id}
                  onClick={() => navigate(`/super-deals/${deal.id}`)}
                  className={cn(
                    "relative overflow-hidden rounded-xl border p-4 cursor-pointer",
                    "transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                    isUnlocked
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-border bg-card hover:border-purple-500/30"
                  )}
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="relative w-24 h-24 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
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
                      {isUnlocked && (
                        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                          <span className="text-2xl">✅</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-foreground line-clamp-1">
                            {deal.title}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {deal.subtitle}
                          </p>
                        </div>
                        {deal.discount_percent && (
                          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-500 text-xs font-bold">
                            -{deal.discount_percent}%
                          </span>
                        )}
                      </div>

                      {/* Rating & Platform */}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        {deal.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            {deal.rating}
                          </span>
                        )}
                        {deal.platform_name && (
                          <span className="flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            {deal.platform_name}
                          </span>
                        )}
                      </div>

                      {/* Price & Coins */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          {deal.original_price && (
                            <span className="text-xs text-muted-foreground line-through">
                              ₹{deal.original_price}
                            </span>
                          )}
                          {deal.discounted_price && (
                            <span className="text-sm font-bold text-emerald-500">
                              ₹{deal.discounted_price}
                            </span>
                          )}
                        </div>

                        {isUnlocked ? (
                          <span className="text-xs font-medium text-emerald-500 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Unlocked
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20">
                            <Coins className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">
                              {deal.coins_required}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Coupons left */}
                      {!isUnlocked && (
                        <div className="mt-2">
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                              style={{ width: `${(couponsLeft / deal.total_coupons) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {couponsLeft} of {deal.total_coupons} coupons left
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperDeals;
