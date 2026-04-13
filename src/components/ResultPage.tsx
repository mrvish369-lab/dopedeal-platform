import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Confetti } from "./Confetti";
import { cn } from "@/lib/utils";

interface ResultPageProps {
  result: "success" | "failure";
  onRestart?: () => void;
}

export const ResultPage = ({ result, onRestart }: ResultPageProps) => {
  const isSuccess = result === "success";

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      {/* Confetti for success */}
      {isSuccess && <Confetti />}

      <div
        className={cn(
          "w-full max-w-md mx-auto text-center",
          isSuccess ? "bounce-in" : "scale-in"
        )}
      >
        {isSuccess ? (
          <>
            {/* Success Icon */}
            <div className="w-32 h-32 mx-auto mb-8 relative">
              <div className="absolute inset-0 bg-secondary/20 rounded-full animate-ping" />
              <div className="relative w-full h-full bg-gradient-to-br from-secondary to-secondary/80 rounded-full flex items-center justify-center glow-secondary">
                <svg
                  className="w-16 h-16 text-secondary-foreground"
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
              </div>
            </div>

            {/* Success Message */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient-success">
              Congratulations! 🎉
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              You've won your DopeDeal Goodie!
            </p>

            {/* Prize Card */}
            <div className="bg-card border-2 border-secondary rounded-2xl p-6 mb-8 glow-secondary">
              <div className="text-6xl mb-4">🔥</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                DopeDeal Lighter
              </h2>
              <p className="text-muted-foreground">
                Worth ₹50 - Yours for just ₹2!
              </p>
            </div>

            {/* Redemption Instructions */}
            <div className="bg-muted/30 rounded-xl p-6 text-left">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-2xl">📍</span>
                How to Redeem
              </h3>
              <ol className="space-y-2 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    1
                  </span>
                  <span>Go to the shopkeeper where you scanned the QR</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    2
                  </span>
                  <span>Show this screen to them</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    3
                  </span>
                  <span>Pay ₹2 and collect your DopeDeal Lighter!</span>
                </li>
              </ol>
            </div>

            {/* Valid badge */}
            <div className="mt-6 inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-2 rounded-full">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span className="font-medium">Valid for 24 hours</span>
            </div>
          </>
        ) : (
          <>
            {/* Failure Icon */}
            <div className="w-32 h-32 mx-auto mb-8">
              <div className="w-full h-full bg-muted rounded-full flex items-center justify-center">
                <span className="text-6xl">😢</span>
              </div>
            </div>

            {/* Failure Message */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Better Luck Next Time!
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              Don't worry, you can try again from another stall!
            </p>

            {/* Try Again Card */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-8">
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Scan Another QR Code
              </h2>
              <p className="text-muted-foreground text-sm">
                Find another DopeDeal sticker or poster and try your luck again!
              </p>
            </div>

            {onRestart && (
              <Button
                onClick={onRestart}
                className="btn-fire h-14 px-8 text-lg rounded-xl"
              >
                Try Again
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};