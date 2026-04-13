import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  getCurrentSessionId, 
  updateSessionQuiz, 
  logQuizAnswer,
  trackEvent 
} from "@/lib/session";

export interface Quiz {
  id: string;
  category: string;
  question: string;
  options: string[];
  display_order: number;
}

export interface QuizState {
  quizzes: Quiz[];
  currentIndex: number;
  answers: Record<string, number>;
  isLoading: boolean;
  isComplete: boolean;
  error: string | null;
}

export const useQuiz = (category: string) => {
  const [state, setState] = useState<QuizState>({
    quizzes: [],
    currentIndex: 0,
    answers: {},
    isLoading: true,
    isComplete: false,
    error: null,
  });

  // Fetch quizzes for category
  useEffect(() => {
    const fetchQuizzes = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("category", category)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: "Failed to load quiz questions",
        }));
        return;
      }

      // Parse options from JSONB
      const parsedQuizzes: Quiz[] = (data || []).map(q => ({
        ...q,
        options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
      }));

      setState(prev => ({
        ...prev,
        quizzes: parsedQuizzes,
        isLoading: false,
      }));

      // Track quiz started
      await trackEvent("quiz_started", { category });

      // Update session
      const sessionId = getCurrentSessionId();
      if (sessionId) {
        await updateSessionQuiz(sessionId, category, false);
      }
    };

    if (category) {
      fetchQuizzes();
    }
  }, [category]);

  // Select answer and advance
  const selectAnswer = useCallback(async (optionIndex: number) => {
    const { quizzes, currentIndex } = state;
    const currentQuiz = quizzes[currentIndex];
    
    if (!currentQuiz) return;

    // Log answer
    const sessionId = getCurrentSessionId();
    if (sessionId) {
      await logQuizAnswer(sessionId, currentQuiz.id, optionIndex);
    }

    // Track event
    await trackEvent("quiz_answer_selected", {
      quiz_id: currentQuiz.id,
      question_index: currentIndex,
      selected_option: optionIndex,
    });

    // Update state
    const newAnswers = { ...state.answers, [currentQuiz.id]: optionIndex };
    const isLastQuestion = currentIndex >= quizzes.length - 1;

    if (isLastQuestion) {
      // Mark quiz as complete
      if (sessionId) {
        await updateSessionQuiz(sessionId, category, true);
      }
      await trackEvent("quiz_completed", { category, answers: newAnswers });
    }

    setState(prev => ({
      ...prev,
      answers: newAnswers,
      currentIndex: isLastQuestion ? currentIndex : currentIndex + 1,
      isComplete: isLastQuestion,
    }));
  }, [state, category]);

  // Get current quiz
  const currentQuiz = state.quizzes[state.currentIndex] || null;
  const progress = state.quizzes.length > 0 
    ? ((state.currentIndex + 1) / state.quizzes.length) * 100 
    : 0;

  return {
    ...state,
    currentQuiz,
    progress,
    totalQuestions: state.quizzes.length,
    selectAnswer,
  };
};