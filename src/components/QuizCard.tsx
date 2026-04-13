import { useState } from "react";
import { cn } from "@/lib/utils";
import { Quiz } from "@/hooks/useQuiz";

interface QuizCardProps {
  quiz: Quiz;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (optionIndex: number) => void;
}

export const QuizCard = ({
  quiz,
  questionNumber,
  totalQuestions,
  onAnswer,
}: QuizCardProps) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSelect = (index: number) => {
    if (isAnimating) return;
    
    setSelectedOption(index);
    setIsAnimating(true);
    
    // Small delay before advancing to show selection
    setTimeout(() => {
      onAnswer(index);
      setSelectedOption(null);
      setIsAnimating(false);
    }, 400);
  };

  return (
    <div className="w-full max-w-lg mx-auto scale-in">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground text-sm">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="text-primary font-semibold">
            {Math.round((questionNumber / totalQuestions) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-gold transition-all duration-500 ease-out"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-foreground leading-relaxed">
          {quiz.question}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {quiz.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={isAnimating}
            className={cn(
              "quiz-option w-full text-left",
              "flex items-center gap-4",
              selectedOption === index && "selected scale-[1.02]"
            )}
          >
            {/* Option letter */}
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                "border-2 transition-all duration-200",
                selectedOption === index
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/30 text-muted-foreground"
              )}
            >
              {String.fromCharCode(65 + index)}
            </div>
            
            {/* Option text */}
            <span className="text-foreground font-medium flex-1">
              {option}
            </span>

            {/* Check indicator */}
            {selectedOption === index && (
              <svg
                className="w-6 h-6 text-primary animate-scale-in"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};