import { CSSProperties } from "react";
import { ExternalLink, Gift, Star, Heart, Zap, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { safeNavigate } from "@/lib/urlValidation";

interface OfferButtonProps {
  block: {
    id: string;
    title: string | null;
    content_json: Record<string, unknown>;
  };
  onClick: (url?: string) => void;
  style?: CSSProperties;
}

// Map of available icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Gift,
  Star,
  Heart,
  Zap,
  Trophy,
  Sparkles,
};

export const OfferButton = ({ block, onClick, style }: OfferButtonProps) => {
  const content = block.content_json as {
    button_text?: string;
    button_color?: string;
    icon?: string;
    redirect_url?: string;
    animation?: string;
  };

  const handleClick = () => {
    onClick(content.redirect_url);
    if (content.redirect_url) {
      safeNavigate(content.redirect_url, { newTab: true });
    }
  };

  // Get icon component if specified
  const IconComponent = content.icon ? iconMap[content.icon] : null;

  return (
    <div className="slide-up" style={style}>
      <Button
        onClick={handleClick}
        className={cn(
          "w-full h-16 text-lg font-bold gap-3 rounded-2xl transition-all duration-300",
          content.animation === "pulse" && "animate-pulse",
          content.animation === "breathing" && "pulse-glow"
        )}
        style={{
          backgroundColor: content.button_color || "hsl(var(--primary))",
        }}
        size="lg"
      >
        {IconComponent && <IconComponent className="w-6 h-6" />}
        {content.button_text || block.title || "Click Here"}
        <ExternalLink className="w-5 h-5" />
      </Button>
    </div>
  );
};
