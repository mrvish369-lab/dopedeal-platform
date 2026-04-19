import { useState, useEffect } from "react";
import { Coins, TrendingUp, MousePointerClick, HelpCircle, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CoinExpirationNotice } from "./CoinExpirationNotice";
import { StreakBonusDisplay } from "./StreakBonusDisplay";

interface EarningsSummary {
  totalFromClicks: number;
  totalFromQuizzes: number;
  totalFromCheckins: number;
  clicksToday: number;
  maxClicksPerDay: number;
}

interface ClickReward {
  coins_earned: number;
  clicks_count: number;
  click_date: string;
}

interface QuizReward {
  coins_earned: number;
}

interface CheckinReward {
  coins_earned: number;
}

export const CoinEarningsSummary = () => {
  const { user, wallet, checkinStatus } = useAuth();
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEarningsSummary();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchEarningsSummary = async () => {
    if (!user) return;

    try {
      // Fetch click rewards data - using type assertion for newer tables
      const today = new Date().toISOString().split("T")[0];
      const { data: clickData } = await (supabase
        .from("user_offer_click_rewards" as any)
        .select("coins_earned, clicks_count, click_date")
        .eq("user_id", user.id) as any);

      // Fetch quiz rewards data
      const { data: quizData } = await (supabase
        .from("user_quiz_rewards" as any)
        .select("coins_earned")
        .eq("user_id", user.id) as any);

      // Fetch checkin rewards
      const { data: checkinData } = await supabase
        .from("daily_checkins")
        .select("coins_earned")
        .eq("user_id", user.id);

      // Fetch max clicks setting
      const { data: settings } = await supabase
        .from("coin_settings")
        .select("setting_value")
        .eq("setting_key", "max_offer_clicks_per_day")
        .single();

      // Calculate totals with proper typing
      const clickRewards = (clickData as ClickReward[] | null) || [];
      const quizRewards = (quizData as QuizReward[] | null) || [];
      const checkinRewards = (checkinData as CheckinReward[] | null) || [];

      const totalFromClicks = clickRewards.reduce((sum, r) => sum + r.coins_earned, 0);
      const totalFromQuizzes = quizRewards.reduce((sum, r) => sum + r.coins_earned, 0);
      const totalFromCheckins = checkinRewards.reduce((sum, r) => sum + r.coins_earned, 0);
      const clicksToday = clickRewards.find((r) => r.click_date === today)?.clicks_count || 0;
      const maxClicksPerDay = settings?.setting_value || 10;

      setSummary({
        totalFromClicks,
        totalFromQuizzes,
        totalFromCheckins,
        clicksToday,
        maxClicksPerDay,
      });
    } catch (error) {
      console.error("Error fetching earnings summary:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-4 mb-6 p-4 rounded-xl bg-muted/50 border border-border">
        <div className="text-center text-sm text-muted-foreground">
          <p>Sign in to track your coin earnings!</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-4 mb-6 p-4 rounded-xl bg-muted/30 animate-pulse">
        <div className="h-20" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Expiration Notice */}
      <CoinExpirationNotice />

      {/* Earnings Summary */}
      <div className="mx-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-gold/10 via-background to-gold/5 border border-gold/20">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-gold" />
              </div>
              <span className="font-semibold text-foreground">Your Earnings</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/20">
              <Coins className="w-4 h-4 text-gold" />
              <span className="font-bold text-gold">{wallet?.coins_balance || 0}</span>
            </div>
          </div>

          {/* Earnings breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-1.5 mb-1">
                <MousePointerClick className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Clicks</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                +{summary?.totalFromClicks || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {summary?.clicksToday || 0}/{summary?.maxClicksPerDay || 10} today
              </p>
            </div>

            <div className="p-3 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-1.5 mb-1">
                <HelpCircle className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs text-muted-foreground">Quizzes</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                +{summary?.totalFromQuizzes || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                completed
              </p>
            </div>

            <div className="p-3 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-1.5 mb-1">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-xs text-muted-foreground">Check-ins</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                +{summary?.totalFromCheckins || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {checkinStatus && checkinStatus.streak > 0 ? `🔥 ${checkinStatus.streak} day streak` : "daily bonus"}
              </p>
            </div>
          </div>

          {/* Progress hint */}
          {summary && summary.clicksToday < summary.maxClicksPerDay && (
            <div className="mt-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-primary text-center">
                💡 Click {summary.maxClicksPerDay - summary.clicksToday} more offers today to earn coins!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Streak Bonus Display */}
      <div className="mx-4">
        <StreakBonusDisplay />
      </div>
    </div>
  );
};
