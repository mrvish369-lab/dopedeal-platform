import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCoinRewards } from "@/hooks/useCoinRewards";
import { useToast } from "@/hooks/use-toast";
import { Coins, Flame, Gift, TrendingUp, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface Milestone {
  day: number;
  bonus: number;
  icon: string;
  color: string;
}

const milestones: Milestone[] = [
  { day: 3, bonus: 10, icon: "🔥", color: "from-orange-400 to-red-500" },
  { day: 5, bonus: 25, icon: "⚡", color: "from-yellow-400 to-orange-500" },
  { day: 7, bonus: 50, icon: "💎", color: "from-blue-400 to-purple-500" },
  { day: 14, bonus: 100, icon: "👑", color: "from-purple-500 to-pink-500" },
  { day: 30, bonus: 250, icon: "🏆", color: "from-gold to-yellow-600" },
];

export const DailyRewardsSection = () => {
  const { user, checkinStatus } = useAuth();
  const { performDailyCheckin } = useCoinRewards();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState("");

  // Calculate time until next check-in
  useEffect(() => {
    if (!checkinStatus?.can_checkin && checkinStatus?.next_checkin_at) {
      const updateTimer = () => {
        const now = new Date();
        const next = new Date(checkinStatus.next_checkin_at);
        const diff = next.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeUntilNext("Available now!");
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeUntilNext(`${hours}h ${minutes}m`);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [checkinStatus]);

  const handleCheckin = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to claim your daily rewards",
        variant: "destructive",
      });
      return;
    }

    if (!checkinStatus?.can_checkin) {
      toast({
        title: "Already Claimed",
        description: `Next check-in available in ${timeUntilNext}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await performDailyCheckin();
      
      if (result) {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-gold" />
              <span>+{result.coins_awarded} Coins Earned!</span>
            </div>
          ) as unknown as string,
          description: result.streak_bonus_awarded
            ? `🔥 ${result.current_streak} day streak! Bonus: +${result.streak_bonus_awarded} coins`
            : `Current streak: ${result.current_streak} days`,
        });
      }
    } catch (error) {
      toast({
        title: "Check-in Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentStreak = checkinStatus?.current_streak || 0;
  const nextMilestone = milestones.find((m) => m.day > currentStreak) || milestones[milestones.length - 1];
  const progressPercent = Math.min((currentStreak / nextMilestone.day) * 100, 100);

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-brand-bg">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/25 rounded-full px-3 py-1 mb-3">
            <span className="text-xs font-mono font-semibold text-brand-green-dim uppercase tracking-wider">
              Earning Engine #4
            </span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-brand-forest mb-3 sm:mb-4">
            Daily Rewards — Build Your Streak
          </h2>
          <p className="text-sm sm:text-base text-brand-text-dim max-w-2xl mx-auto">
            Check in every day to earn coins and unlock massive streak bonuses. The longer your streak, the bigger your rewards.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Left: Check-in Card */}
          <div className="bg-gradient-to-br from-brand-forest to-brand-forest-mid rounded-2xl sm:rounded-3xl p-6 sm:p-7 lg:p-8 text-white">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-green/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-brand-green-light" />
                </div>
                <div>
                  <div className="text-xs text-brand-green-light/70 font-mono uppercase tracking-wider">
                    Daily Check-in
                  </div>
                  <div className="font-display font-black text-xl sm:text-2xl">
                    {checkinStatus?.can_checkin ? "Available Now!" : "Claimed Today"}
                  </div>
                </div>
              </div>
              {currentStreak > 0 && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                  <span className="font-display font-black text-lg sm:text-xl">{currentStreak}</span>
                </div>
              )}
            </div>

            {/* Check-in Button */}
            <button
              onClick={handleCheckin}
              disabled={loading || !checkinStatus?.can_checkin}
              className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg mb-3 sm:mb-4 transition-all ${
                checkinStatus?.can_checkin
                  ? "bg-brand-green hover:bg-brand-green-light text-brand-forest hover:shadow-lg hover:shadow-brand-green/30"
                  : "bg-white/10 text-white/40 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : checkinStatus?.can_checkin ? (
                <div className="flex items-center justify-center gap-2">
                  <Gift className="w-5 h-5" />
                  Claim Daily Reward
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Coins className="w-5 h-5" />
                  Next Check-in: {timeUntilNext}
                </div>
              )}
            </button>

            {/* Streak Progress */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60">Progress to Next Milestone</span>
                <span className="text-xs font-bold text-brand-green-light">
                  {currentStreak}/{nextMilestone.day} days
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-brand-green to-brand-green-light transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-xs text-white/60 text-center">
                {nextMilestone.day - currentStreak} more days to unlock {nextMilestone.icon} +{nextMilestone.bonus} bonus coins
              </div>
            </div>
          </div>

          {/* Right: Milestone Cards */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <TrendingUp className="w-5 h-5 text-brand-green-dim" />
              <h3 className="font-display font-bold text-lg text-brand-forest">
                Streak Milestones
              </h3>
            </div>
            {milestones.map((milestone) => {
              const isUnlocked = currentStreak >= milestone.day;
              const isCurrent = currentStreak < milestone.day && milestone === nextMilestone;

              return (
                <div
                  key={milestone.day}
                  className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 transition-all ${
                    isUnlocked
                      ? "bg-brand-green/10 border-brand-green/30"
                      : isCurrent
                      ? "bg-white border-brand-green/50 shadow-md shadow-brand-green/10"
                      : "bg-brand-surface2 border-brand-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${milestone.color} flex items-center justify-center text-xl sm:text-2xl ${
                          !isUnlocked && !isCurrent ? "opacity-40" : ""
                        }`}
                      >
                        {milestone.icon}
                      </div>
                      <div>
                        <div className="font-display font-bold text-sm sm:text-base text-brand-text">
                          Day {milestone.day} Milestone
                        </div>
                        <div className="text-xs text-brand-text-dim">
                          {isUnlocked ? "Unlocked!" : isCurrent ? "Next milestone" : "Locked"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-black text-lg sm:text-xl text-brand-green-dim">
                        +{milestone.bonus}
                      </div>
                      <div className="text-xs text-brand-text-faint">bonus coins</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-br from-brand-surface2 to-brand-surface3 border border-brand-border rounded-2xl sm:rounded-3xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-green to-brand-green-dim flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-base sm:text-lg text-brand-forest mb-1">
                Don't Break Your Streak!
              </h3>
              <p className="text-sm text-brand-text-dim">
                Check in every 24 hours to maintain your streak. Miss a day and your streak resets to zero. Set a daily reminder to maximize your earnings!
              </p>
            </div>
            {user && (
              <Link
                to="/dashboard/rewards"
                className="w-full sm:w-auto shrink-0 bg-brand-green text-brand-forest font-bold text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl hover:bg-brand-green-light transition-colors"
              >
                View History
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
