import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OfferClickResult {
  success: boolean;
  coins_awarded: number;
  clicks_today: number;
  max_clicks: number;
}

interface QuizCompletionResult {
  success: boolean;
  coins_awarded: number;
  already_completed: boolean;
}

export const useCoinRewards = () => {
  const { user, refreshWallet } = useAuth();

  const awardOfferClickCoins = useCallback(async (): Promise<OfferClickResult | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc("award_offer_click_coins", {
        p_user_id: user.id,
      });

      if (error) {
        console.error("Error awarding offer click coins:", error);
        return null;
      }

      const result = data as unknown as OfferClickResult;
      
      if (result.coins_awarded > 0) {
        // Refresh wallet to show updated balance
        await refreshWallet();
      }

      return result;
    } catch (error) {
      console.error("Error in awardOfferClickCoins:", error);
      return null;
    }
  }, [user, refreshWallet]);

  const awardQuizCompletionCoins = useCallback(async (quizId: string): Promise<QuizCompletionResult | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc("award_quiz_completion_coins", {
        p_user_id: user.id,
        p_quiz_id: quizId,
      });

      if (error) {
        console.error("Error awarding quiz completion coins:", error);
        return null;
      }

      const result = data as unknown as QuizCompletionResult;
      
      if (result.coins_awarded > 0) {
        // Refresh wallet to show updated balance
        await refreshWallet();
      }

      return result;
    } catch (error) {
      console.error("Error in awardQuizCompletionCoins:", error);
      return null;
    }
  }, [user, refreshWallet]);

  return {
    awardOfferClickCoins,
    awardQuizCompletionCoins,
  };
};