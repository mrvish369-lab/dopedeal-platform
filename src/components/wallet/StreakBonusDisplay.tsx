import { Flame, Gift, Trophy, Star, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface StreakMilestone {
  day: number;
  bonus: number;
  icon: React.ReactNode;
  label: string;
  color: string;
}

const STREAK_MILESTONES: StreakMilestone[] = [
  { day: 3, bonus: 15, icon: <Star className="w-4 h-4" />, label: "3 Days", color: "text-blue-500" },
  { day: 5, bonus: 25, icon: <Zap className="w-4 h-4" />, label: "5 Days", color: "text-purple-500" },
  { day: 7, bonus: 50, icon: <Trophy className="w-4 h-4" />, label: "Week", color: "text-gold" },
  { day: 14, bonus: 100, icon: <Flame className="w-4 h-4" />, label: "2 Weeks", color: "text-orange-500" },
  { day: 30, bonus: 250, icon: <Gift className="w-4 h-4" />, label: "Month", color: "text-pink-500" },
];

export const StreakBonusDisplay = () => {
  const { user, checkinStatus } = useAuth();

  if (!user || !checkinStatus) return null;

  const currentStreak = checkinStatus.streak || 0;
  
  // Find the next milestone
  const nextMilestone = STREAK_MILESTONES.find((m) => m.day > currentStreak);
  const daysToNext = nextMilestone ? nextMilestone.day - currentStreak : 0;
  
  // Find achieved milestones
  const achievedMilestones = STREAK_MILESTONES.filter((m) => m.day <= currentStreak);
  const lastAchieved = achievedMilestones[achievedMilestones.length - 1];

  const getStreakMessage = () => {
    if (currentStreak === 0) {
      return "Start your streak today!";
    }
    if (currentStreak >= 30) {
      return "🎉 Amazing! 30-day streak master!";
    }
    if (nextMilestone) {
      return `${daysToNext} day${daysToNext === 1 ? "" : "s"} to ${nextMilestone.label} bonus!`;
    }
    return "Keep going!";
  };

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 via-background to-red-500/10 border border-orange-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <span className="font-semibold text-foreground">Daily Streak</span>
            <p className="text-xs text-muted-foreground">{getStreakMessage()}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-500/20">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="font-bold text-orange-500">{currentStreak}</span>
        </div>
      </div>

      {/* Milestone Progress */}
      <div className="relative mt-4">
        {/* Progress bar */}
        <div className="absolute top-3 left-0 right-0 h-1 bg-muted rounded-full">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min((currentStreak / 30) * 100, 100)}%`,
            }}
          />
        </div>

        {/* Milestones */}
        <div className="relative flex justify-between">
          {STREAK_MILESTONES.map((milestone) => {
            const isAchieved = currentStreak >= milestone.day;
            const isCurrent = lastAchieved?.day === milestone.day;

            return (
              <div
                key={milestone.day}
                className="flex flex-col items-center"
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isAchieved
                      ? "bg-gradient-to-br from-orange-500 to-red-500 border-orange-400 text-white shadow-lg shadow-orange-500/30"
                      : "bg-background border-muted text-muted-foreground",
                    isCurrent && "ring-2 ring-orange-500/50 ring-offset-2 ring-offset-background animate-pulse"
                  )}
                >
                  {milestone.icon}
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-1.5 font-medium",
                    isAchieved ? milestone.color : "text-muted-foreground"
                  )}
                >
                  {milestone.label}
                </span>
                {isAchieved && (
                  <span className="text-[9px] text-muted-foreground">
                    +{milestone.bonus}🪙
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Next bonus hint */}
      {nextMilestone && currentStreak > 0 && (
        <div className="mt-4 p-2 rounded-lg bg-background/50 border border-border/50">
          <p className="text-xs text-center">
            <span className="text-muted-foreground">Keep checking in!</span>{" "}
            <span className="font-medium text-foreground">
              +{nextMilestone.bonus} bonus coins
            </span>{" "}
            <span className="text-muted-foreground">at {nextMilestone.label} streak</span>
          </p>
        </div>
      )}

      {/* Max streak celebration */}
      {currentStreak >= 30 && (
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-gold/20 to-orange-500/20 border border-gold/30">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-gold" />
            <p className="text-sm font-semibold text-gold">
              Streak Master! Maximum bonus unlocked!
            </p>
            <Trophy className="w-5 h-5 text-gold" />
          </div>
        </div>
      )}
    </div>
  );
};
