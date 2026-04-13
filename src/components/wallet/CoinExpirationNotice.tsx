import { useState, useEffect } from "react";
import { AlertTriangle, Clock, X, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ExpiringCoins {
  amount: number;
  expiresIn: number; // days
  expirationDate: Date;
}

// Coins expire after 30 days of inactivity
const COIN_EXPIRATION_DAYS = 30;
const WARNING_THRESHOLD_DAYS = 7;

export const CoinExpirationNotice = () => {
  const { user, wallet } = useAuth();
  const [expiringCoins, setExpiringCoins] = useState<ExpiringCoins | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkCoinExpiration();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkCoinExpiration = async () => {
    if (!user) return;

    try {
      // Get the most recent activity (transaction or check-in)
      const { data: lastTransaction } = await supabase
        .from("coin_transactions")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const { data: lastCheckin } = await supabase
        .from("daily_checkins")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Determine last activity date
      const transactionDate = lastTransaction?.created_at 
        ? new Date(lastTransaction.created_at) 
        : null;
      const checkinDate = lastCheckin?.created_at 
        ? new Date(lastCheckin.created_at) 
        : null;

      let lastActivityDate: Date | null = null;
      if (transactionDate && checkinDate) {
        lastActivityDate = transactionDate > checkinDate ? transactionDate : checkinDate;
      } else {
        lastActivityDate = transactionDate || checkinDate;
      }

      if (lastActivityDate && wallet && wallet.coins_balance > 0) {
        const now = new Date();
        const daysSinceActivity = Math.floor(
          (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const daysUntilExpiration = COIN_EXPIRATION_DAYS - daysSinceActivity;

        if (daysUntilExpiration <= WARNING_THRESHOLD_DAYS && daysUntilExpiration > 0) {
          const expirationDate = new Date(lastActivityDate);
          expirationDate.setDate(expirationDate.getDate() + COIN_EXPIRATION_DAYS);

          setExpiringCoins({
            amount: wallet.coins_balance,
            expiresIn: daysUntilExpiration,
            expirationDate,
          });
        }
      }
    } catch (error) {
      console.error("Error checking coin expiration:", error);
    } finally {
      setLoading(false);
    }
  };

  // Show toast notification for urgent expirations
  useEffect(() => {
    if (expiringCoins && expiringCoins.expiresIn <= 3 && !dismissed) {
      toast.warning(
        `⚠️ ${expiringCoins.amount} coins expiring in ${expiringCoins.expiresIn} day${expiringCoins.expiresIn === 1 ? "" : "s"}!`,
        {
          duration: 6000,
          action: {
            label: "Use Now",
            onClick: () => {
              window.location.href = "/super-deals";
            },
          },
        }
      );
    }
  }, [expiringCoins, dismissed]);

  if (loading || !expiringCoins || dismissed || !user) {
    return null;
  }

  const isUrgent = expiringCoins.expiresIn <= 3;

  return (
    <div
      className={cn(
        "mx-4 mb-4 p-3 rounded-xl border animate-in slide-in-from-top-2 duration-300",
        isUrgent
          ? "bg-destructive/10 border-destructive/30"
          : "bg-warning/10 border-warning/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
            isUrgent ? "bg-destructive/20" : "bg-warning/20"
          )}
        >
          {isUrgent ? (
            <AlertTriangle className="w-4 h-4 text-destructive" />
          ) : (
            <Clock className="w-4 h-4 text-warning" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "font-semibold text-sm",
              isUrgent ? "text-destructive" : "text-warning"
            )}
          >
            {isUrgent ? "Coins Expiring Soon!" : "Coin Expiration Notice"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="inline-flex items-center gap-1">
              <Coins className="w-3 h-3 text-gold" />
              <strong>{expiringCoins.amount}</strong> coins
            </span>{" "}
            will expire in{" "}
            <strong>
              {expiringCoins.expiresIn} day{expiringCoins.expiresIn === 1 ? "" : "s"}
            </strong>
            . Use them on Super Deals before they're gone!
          </p>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 rounded-full hover:bg-background/50 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="mt-2 pl-11">
        <a
          href="/super-deals"
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors",
            isUrgent
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-warning text-warning-foreground hover:bg-warning/90"
          )}
        >
          <Coins className="w-3.5 h-3.5" />
          Redeem Now
        </a>
      </div>
    </div>
  );
};
