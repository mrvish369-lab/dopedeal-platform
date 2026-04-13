import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Coins, Lock, Star, ExternalLink, Check, Copy, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/wallet/WalletButton";
import { AuthModal } from "@/components/auth/AuthModal";
import { CoinAnimation } from "@/components/wallet/CoinAnimation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { extractPlatformFromUrl, generateSmartButtonText } from "@/lib/platformUtils";

interface SuperDeal {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  long_description: string | null;
  image_url: string | null;
  category: string;
  original_price: number | null;
  discounted_price: number | null;
  discount_percent: number | null;
  platform_name: string | null;
  platform_url: string | null;
  coins_required: number;
  total_coupons: number;
  coupons_claimed: number;
  features: string[] | null;
  rating: number | null;
  reviews_count: number | null;
  button_text: string | null;
}

interface UnlockStatus {
  unlocked: boolean;
  coupon_code?: string;
  unlocked_at?: string;
}

const SuperDealDetail = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const { user, wallet, refreshWallet } = useAuth();
  
  const [deal, setDeal] = useState<SuperDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockStatus, setUnlockStatus] = useState<UnlockStatus>({ unlocked: false });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dynamicButtonText, setDynamicButtonText] = useState<string | null>(null);
  const [isGeneratingButtonName, setIsGeneratingButtonName] = useState(false);

  useEffect(() => {
    if (dealId) {
      fetchDeal();
      if (user) {
        checkUnlockStatus();
      }
    }
  }, [dealId, user]);

  // Generate dynamic button name when deal is loaded and unlocked
  useEffect(() => {
    if (deal?.platform_url && unlockStatus.unlocked) {
      // If cached button text exists, use it; otherwise generate
      if (deal.button_text) {
        setDynamicButtonText(deal.button_text);
      } else if (!dynamicButtonText) {
        generateDynamicButtonName();
      }
    }
  }, [deal, unlockStatus.unlocked]);

  const fetchDeal = async () => {
    const { data, error } = await supabase
      .from("super_deals")
      .select("*")
      .eq("id", dealId)
      .single();

    if (data && !error) {
      setDeal(data as SuperDeal);
    }
    setLoading(false);
  };

  const checkUnlockStatus = async () => {
    const { data, error } = await supabase.rpc("get_user_coupon", {
      p_user_id: user!.id,
      p_deal_id: dealId,
    });

    if (data && !error) {
      setUnlockStatus(data as unknown as UnlockStatus);
    }
  };

  const generateDynamicButtonName = async () => {
    if (!deal?.platform_url) return;
    
    setIsGeneratingButtonName(true);
    
    try {
      // First, use local utility for instant feedback
      const platformName = extractPlatformFromUrl(deal.platform_url);
      const fallbackText = generateSmartButtonText(platformName, true);
      setDynamicButtonText(fallbackText);
      
      // Then try AI for a potentially better name
      const { data, error } = await supabase.functions.invoke("generate-button-name", {
        body: { 
          url: deal.platform_url,
          dealTitle: deal.title,
          hasCoupon: true
        },
      });
      
      if (!error && data?.success && data.data?.buttonText) {
        const aiButtonText = data.data.buttonText;
        setDynamicButtonText(aiButtonText);
        
        // Cache the AI-generated button text in the database
        await supabase
          .from("super_deals")
          .update({ button_text: aiButtonText })
          .eq("id", deal.id);
          
        // Update local state to reflect cached value
        setDeal(prev => prev ? { ...prev, button_text: aiButtonText } : prev);
      }
    } catch (err) {
      console.error("Failed to generate button name:", err);
      // Keep the fallback text
    } finally {
      setIsGeneratingButtonName(false);
    }
  };

  const handleUnlock = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!wallet || wallet.coins_balance < (deal?.coins_required || 0)) {
      toast.error("Insufficient coins! Earn more through daily check-ins and offers.");
      return;
    }

    setUnlocking(true);

    const { data, error } = await supabase.rpc("unlock_super_deal", {
      p_user_id: user.id,
      p_deal_id: dealId,
    });

    if (error) {
      toast.error("Failed to unlock deal");
      setUnlocking(false);
      return;
    }

    const result = data as { success: boolean; coupon_code?: string; error?: string };

    if (result.success) {
      setShowCoinAnimation(true);
      setUnlockStatus({
        unlocked: true,
        coupon_code: result.coupon_code,
      });
      await refreshWallet();
    } else {
      toast.error(result.error || "Failed to unlock");
    }

    setUnlocking(false);
  };

  const handleCopyCode = () => {
    if (unlockStatus.coupon_code) {
      navigator.clipboard.writeText(unlockStatus.coupon_code);
      setCopied(true);
      toast.success("Coupon code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoToPlatform = () => {
    if (deal?.platform_url) {
      let url = deal.platform_url.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      window.open(url, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Deal not found</p>
        <Button onClick={() => navigate("/super-deals")}>Back to Deals</Button>
      </div>
    );
  }

  const couponsLeft = deal.total_coupons - deal.coupons_claimed;
  const canUnlock = user && wallet && wallet.coins_balance >= deal.coins_required && !unlockStatus.unlocked;

  return (
    <div className="min-h-screen bg-background pb-32">
      <CoinAnimation
        show={showCoinAnimation}
        coinsEarned={deal.coins_required}
        onComplete={() => {
          setShowCoinAnimation(false);
          toast.success("🎉 Coupon unlocked! Use it before it expires.");
        }}
      />

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/super-deals")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="font-medium truncate max-w-[200px]">{deal.title}</span>
          </div>
          <WalletButton />
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative aspect-video bg-muted">
        {deal.image_url ? (
          <img src={deal.image_url} alt={deal.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <span className="text-8xl">📚</span>
          </div>
        )}
        {deal.discount_percent && (
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-red-500 text-white font-bold text-sm">
            -{deal.discount_percent}% OFF
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Title & Rating */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{deal.title}</h1>
          {deal.subtitle && (
            <p className="text-muted-foreground mt-1">{deal.subtitle}</p>
          )}
          <div className="flex items-center gap-4 mt-3">
            {deal.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                <span className="font-medium">{deal.rating}</span>
                {deal.reviews_count && (
                  <span className="text-muted-foreground text-sm">
                    ({deal.reviews_count} reviews)
                  </span>
                )}
              </div>
            )}
            {deal.platform_name && (
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <ExternalLink className="w-4 h-4" />
                {deal.platform_name}
              </div>
            )}
          </div>
        </div>

        {/* Price Section */}
        <div className="flex items-center gap-3">
          {deal.original_price && (
            <span className="text-lg text-muted-foreground line-through">
              ₹{deal.original_price}
            </span>
          )}
          {deal.discounted_price && (
            <span className="text-2xl font-bold text-emerald-500">
              ₹{deal.discounted_price}
            </span>
          )}
        </div>

        {/* Description */}
        {deal.long_description && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-muted-foreground">{deal.long_description}</p>
          </div>
        )}

        {/* Features */}
        {deal.features && deal.features.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">What's Included:</h3>
            <div className="grid grid-cols-2 gap-2">
              {deal.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-3 rounded-lg bg-muted/50"
                >
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coupon Unlock Section */}
        <div className={cn(
          "rounded-2xl p-5 border-2",
          unlockStatus.unlocked
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-purple-500/30 bg-purple-500/5"
        )}>
          {unlockStatus.unlocked ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-emerald-500">Coupon Unlocked!</span>
              </div>
              
              <div className="relative">
                <div className="flex items-center justify-between p-4 rounded-xl bg-background border-2 border-dashed border-emerald-500/50">
                  <code className="text-xl font-mono font-bold tracking-wider">
                    {unlockStatus.coupon_code}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyCode}
                    className="gap-2"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>

              {deal.platform_url && (
                <Button
                  className="w-full gap-2 py-6 text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 animate-breathing relative overflow-hidden group"
                  onClick={handleGoToPlatform}
                  disabled={isGeneratingButtonName}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  {isGeneratingButtonName ? (
                    <>
                      <Wand2 className="w-5 h-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-5 h-5" />
                      <span>{dynamicButtonText || generateSmartButtonText(extractPlatformFromUrl(deal.platform_url), true)}</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-purple-500" />
                  <span className="font-bold">Unlock This Deal</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-yellow-500/20">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold text-yellow-600 dark:text-yellow-400">
                    {deal.coins_required} coins
                  </span>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Spend {deal.coins_required} coins to unlock an exclusive coupon code.</p>
              </div>

              {/* Progress bar */}
              <div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                    style={{ width: `${(couponsLeft / deal.total_coupons) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {couponsLeft} of {deal.total_coupons} coupons remaining
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      {!unlockStatus.unlocked && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border">
          <Button
            size="lg"
            className={cn(
              "w-full gap-2 font-bold text-lg py-6",
              canUnlock
                ? "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400"
                : "bg-muted text-muted-foreground"
            )}
            disabled={unlocking || (!user || (wallet && wallet.coins_balance < deal.coins_required))}
            onClick={handleUnlock}
          >
            {unlocking ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Lock className="w-5 h-5" />
                {!user
                  ? "Sign In to Unlock"
                  : wallet && wallet.coins_balance < deal.coins_required
                  ? `Need ${deal.coins_required - wallet.coins_balance} more coins`
                  : `Unlock for ${deal.coins_required} Coins`}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SuperDealDetail;
