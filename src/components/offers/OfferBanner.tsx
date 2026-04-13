import { CSSProperties } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OfferBannerProps {
  block: {
    id: string;
    title: string | null;
    subtitle: string | null;
    content_json: Record<string, unknown>;
  };
  onClick: (url?: string) => void;
  style?: CSSProperties;
}

export const OfferBanner = ({ block, onClick, style }: OfferBannerProps) => {
  const content = block.content_json as {
    image_url?: string;
    cta_text?: string;
    redirect_url?: string;
    open_new_tab?: boolean;
    animation?: string;
    glow_enabled?: boolean;
  };

  const handleClick = () => {
    onClick(content.redirect_url);
    if (content.redirect_url) {
      if (content.open_new_tab) {
        window.open(content.redirect_url, "_blank");
      } else {
        window.location.href = content.redirect_url;
      }
    }
  };

  return (
    <div
      className={cn(
        "slide-up rounded-2xl overflow-hidden bg-card border border-border",
        content.glow_enabled && "glow-primary",
        content.animation === "breathing" && "pulse-glow"
      )}
      style={style}
    >
      {content.image_url && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={content.image_url}
            alt={block.title || "Offer banner"}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      <div className="p-5">
        {block.title && (
          <h3 className="text-xl font-bold text-foreground mb-1">
            {block.title}
          </h3>
        )}
        {block.subtitle && (
          <p className="text-sm text-muted-foreground mb-4">{block.subtitle}</p>
        )}
        {content.cta_text && (
          <Button
            onClick={handleClick}
            className="w-full btn-fire gap-2"
            size="lg"
          >
            {content.cta_text}
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
