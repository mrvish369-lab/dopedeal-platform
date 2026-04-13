import { cn } from "@/lib/utils";
import { Flame, Shield, Star, TrendingUp } from "lucide-react";

interface QuizBrandingProps {
  variant?: "header" | "footer" | "badge";
  className?: string;
}

export const QuizBranding = ({ variant = "header", className }: QuizBrandingProps) => {
  if (variant === "badge") {
    return (
      <div className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
        "bg-gradient-to-r from-primary/20 to-gold/20 border border-primary/30",
        className
      )}>
        <Flame className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-gradient-fire">DopeDeal</span>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={cn(
        "w-full py-6 px-4 text-center",
        className
      )}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Flame className="w-6 h-6 text-primary animate-pulse" />
          <span className="text-xl font-bold text-gradient-fire">DopeDeal</span>
        </div>
        <p className="text-xs text-muted-foreground">
          India's Most Authentic & Viral Deal Provider
        </p>
      </div>
    );
  }

  // Header variant - full branding
  return (
    <div className={cn(
      "w-full bg-gradient-to-r from-background via-card to-background",
      "border-b border-border/50 py-4 px-6",
      className
    )}>
      <div className="max-w-2xl mx-auto">
        {/* Logo and Tagline */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-gold flex items-center justify-center shadow-lg shadow-primary/30">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full flex items-center justify-center">
              <Star className="w-2.5 h-2.5 text-secondary-foreground fill-current" />
            </div>
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black text-gradient-fire tracking-tight">
              DopeDeal
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              India's #1 Viral Deal Provider
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-secondary" />
            <span>100% Authentic</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span>10L+ Happy Users</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="w-3.5 h-3.5 text-gold fill-gold" />
            <span>4.9★ Rated</span>
          </div>
        </div>
      </div>
    </div>
  );
};
