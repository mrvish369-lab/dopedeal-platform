import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { CoinAnimation } from "./CoinAnimation";
import { AuthModal } from "@/components/auth/AuthModal";
import { Coins, Gift, Clock, Sparkles, Flame, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const DailyCheckinButton = () => {
  const { user, checkinStatus, performDailyCheckin } = useAuth();
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [loading, setLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // Countdown timer for next check-in
  useEffect(() => {
    if (checkinStatus && !checkinStatus.canCheckin && checkinStatus.nextCheckinAt) {
      const updateTimer = () => {
        const now = new Date();
        const nextCheckin = new Date(checkinStatus.nextCheckinAt);
        
        // Validate that nextCheckin is a valid date
        if (isNaN(nextCheckin.getTime())) {
          setTimeRemaining("");
          return;
        }
        
        const diff = nextCheckin.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeRemaining("");
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // Ensure values are valid numbers before calling toString
        if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
          setTimeRemaining("");
          return;
        }

        setTimeRemaining(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    }
  }, [checkinStatus]);

  const handleCheckin = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!checkinStatus || !checkinStatus.canCheckin) {
      toast.info("You've already checked in today! Come back tomorrow.");
      return;
    }

    setLoading(true);

    const result = await performDailyCheckin();

    if (result.success) {
      setCoinsEarned(result.coins || 0);
      setShowCoinAnimation(true);
    } else {
      toast.error(result.error || "Failed to check in");
    }

    setLoading(false);
  };

  const handleAnimationComplete = () => {
    setShowCoinAnimation(false);
    
    if (!checkinStatus) return;
    
    // Check for streak milestone bonuses
    const streakMilestones = [
      { day: 3, bonus: 15, message: "3-Day Streak! 🌟" },
      { day: 5, bonus: 25, message: "5-Day Streak! ⚡" },
      { day: 7, bonus: 50, message: "Week Streak! 🏆" },
      { day: 14, bonus: 100, message: "2-Week Streak! 🔥" },
      { day: 30, bonus: 250, message: "Month Streak! 🎁" },
    ];
    
    const milestoneHit = streakMilestones.find(m => m.day === checkinStatus.streak);
    
    if (milestoneHit) {
      // Show milestone bonus toast
      toast.success(
        `🎉 ${milestoneHit.message} +${milestoneHit.bonus} BONUS coins!`,
        { duration: 5000 }
      );
      setTimeout(() => {
        toast.success(
          `Total earned: ${coinsEarned} coins! Keep the streak going!`,
          { duration: 3000 }
        );
      }, 1500);
    } else {
      toast.success(`🎉 You earned ${coinsEarned} coins! Streak: Day ${checkinStatus.streak}`, {
        duration: 4000,
      });
    }
    
    // Streak warning notification
    if (!checkinStatus.canCheckin && checkinStatus.streak > 0) {
      // Calculate hours until midnight
      const now = new Date();
      const midnight = new Date();
      midnight.setDate(midnight.getDate() + 1);
      midnight.setHours(0, 0, 0, 0);
      const hoursLeft = Math.floor((midnight.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      if (hoursLeft <= 4 && hoursLeft > 0) {
        setTimeout(() => {
          toast.info(
            `⏰ Don't forget! Check in tomorrow to keep your ${checkinStatus.streak}-day streak!`,
            { duration: 5000 }
          );
        }, 3000);
      }
    }
  };

  const getStreakEmoji = () => {
    if (!checkinStatus) return "🌟";
    if (checkinStatus.streak >= 30) return "🎁";
    if (checkinStatus.streak >= 14) return "🔥";
    if (checkinStatus.streak >= 7) return "🏆";
    if (checkinStatus.streak >= 5) return "⚡";
    if (checkinStatus.streak >= 3) return "✨";
    return "🌟";
  };

  // Don't render if checkinStatus is not loaded yet
  if (!checkinStatus) {
    return null;
  }

  return (
    <>
      <CoinAnimation
        show={showCoinAnimation}
        coinsEarned={coinsEarned}
        onComplete={handleAnimationComplete}
      />

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      <div className="px-4 py-4">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl p-4",
            "bg-gradient-to-r",
            checkinStatus.canCheckin
              ? "from-yellow-500 via-orange-500 to-red-500"
              : "from-slate-600 via-slate-500 to-slate-600",
            "border-2",
            checkinStatus.canCheckin
              ? "border-yellow-400/50 shadow-[0_0_30px_rgba(251,191,36,0.3)]"
              : "border-slate-500/30"
          )}
        >
          {/* Animated background patterns */}
          {checkinStatus.canCheckin && (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_50%)]" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            </>
          )}

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Gift className="w-5 h-5 text-white" />
                <span className="text-sm font-bold text-white uppercase tracking-wide">
                  Daily Check-in
                </span>
                {checkinStatus.streak > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white">
                    {getStreakEmoji()} Day {checkinStatus.streak}
                  </span>
                )}
              </div>

              {checkinStatus.canCheckin ? (
                <p className="text-white/90 text-sm">
                  Tap to claim your daily coins! 🪙
                </p>
              ) : (
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Next check-in in: <strong>{timeRemaining}</strong></span>
                </div>
              )}
            </div>

            <Button
              size="lg"
              onClick={handleCheckin}
              disabled={loading || !checkinStatus.canCheckin}
              className={cn(
                "gap-2 font-bold min-w-[120px]",
                checkinStatus.canCheckin
                  ? "bg-white text-orange-600 hover:bg-white/90 shadow-lg animate-pulse"
                  : "bg-white/20 text-white/60 cursor-not-allowed"
              )}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : checkinStatus.canCheckin ? (
                <>
                  <Coins className="w-5 h-5" />
                  Claim
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Claimed
                </>
              )}
            </Button>
          </div>

          {/* Streak bonus indicator */}
          {checkinStatus.canCheckin && checkinStatus.streak > 0 && (
            <div className="relative z-10 mt-3 pt-3 border-t border-white/20">
              <div className="flex items-center gap-2 text-xs text-white/80">
                <Flame className="w-4 h-4 text-yellow-300" />
                <span>
                  Continue your {checkinStatus.streak}-day streak for bonus coins!
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
