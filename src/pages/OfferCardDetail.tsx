import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Play, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface OfferCardData {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  logo_url: string | null;
  image_url: string | null;
  cta_text: string;
  redirect_url: string;
  open_new_tab: boolean;
  video_url: string | null;
  features: string[] | null;
  category: string | null;
  card_segment: string | null;
  template_key: string | null;
  discount_percent: string | null;
  original_price: string | null;
  discounted_price: string | null;
  rating: string | null;
  reviews_count: string | null;
}

const OfferCardDetail = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<OfferCardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cardId) fetchCard();
  }, [cardId]);

  const fetchCard = async () => {
    const { data, error } = await supabase
      .from("offer_cards")
      .select("id, title, subtitle, description, logo_url, image_url, cta_text, redirect_url, open_new_tab, video_url, features, category, card_segment, template_key, discount_percent, original_price, discounted_price, rating, reviews_count")
      .eq("id", cardId)
      .single();

    if (data && !error) {
      setCard(data as OfferCardData);
    }
    setLoading(false);
  };

  const handleCta = () => {
    if (!card?.redirect_url) return;
    if (card.open_new_tab) {
      window.open(card.redirect_url, "_blank");
    } else {
      window.location.href = card.redirect_url;
    }
  };

  const getVideoEmbedUrl = (url: string): string | null => {
    // YouTube
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
    // Generic iframe-compatible
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-lg">Offer not found</p>
        <Button onClick={() => navigate("/deals")}>Back to Deals</Button>
      </div>
    );
  }

  const embedUrl = card.video_url ? getVideoEmbedUrl(card.video_url) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/deals")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="font-semibold text-foreground truncate">{card.title}</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Video Section */}
        {embedUrl ? (
          <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
            <div className="aspect-video bg-muted">
              <iframe
                src={embedUrl}
                title={card.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/20 pointer-events-none" />
          </div>
        ) : card.image_url ? (
          <div className="relative rounded-2xl overflow-hidden border border-border">
            <div className="aspect-video bg-muted">
              <img src={card.image_url} alt={card.title} className="w-full h-full object-cover" />
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-primary/10 to-accent/10">
            <div className="aspect-video flex items-center justify-center">
              <div className="text-center">
                <Play className="w-16 h-16 text-primary/40 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Video coming soon</p>
              </div>
            </div>
          </div>
        )}

        {/* Large Headline */}
        <div className="text-center space-y-2">
          {card.logo_url && (
            <img src={card.logo_url} alt="" className="w-16 h-16 object-contain mx-auto rounded-xl" />
          )}
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight">
            {card.title}
          </h1>
          {card.subtitle && (
            <p className="text-base text-muted-foreground">{card.subtitle}</p>
          )}
          {/* Price badge */}
          {(card.discount_percent || card.discounted_price) && (
            <div className="flex items-center justify-center gap-3 pt-1">
              {card.original_price && (
                <span className="text-muted-foreground line-through text-sm">{card.original_price}</span>
              )}
              {card.discounted_price && (
                <span className="text-lg font-bold text-secondary">{card.discounted_price}</span>
              )}
              {card.discount_percent && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground">
                  -{card.discount_percent}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Primary CTA - Dollar Green Breathing Button */}
        <Button
          onClick={handleCta}
          className={cn(
            "w-full py-7 text-lg font-extrabold gap-3 rounded-2xl relative overflow-hidden",
            "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400",
            "text-white shadow-[0_0_30px_rgba(16,185,129,0.4)]",
            "animate-breathing"
          )}
          size="lg"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700" />
          <Zap className="w-6 h-6" />
          {card.cta_text}
          <ExternalLink className="w-5 h-5" />
        </Button>

        {/* Description */}
        {card.description && (
          <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-5">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {card.description}
            </p>
          </div>
        )}

        {/* Features */}
        {card.features && card.features.length > 0 && (
          <div className="space-y-2">
            {card.features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-secondary mt-0.5">✓</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}

        {/* Second CTA */}
        <Button
          onClick={handleCta}
          className={cn(
            "w-full py-6 text-base font-bold gap-2 rounded-2xl",
            "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500",
            "text-white shadow-lg"
          )}
          size="lg"
        >
          <Zap className="w-5 h-5" />
          {card.cta_text}
          <ExternalLink className="w-4 h-4" />
        </Button>

        {/* Rating badge */}
        {card.rating && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pb-4">
            <span className="text-yellow-500">⭐</span>
            <span>{card.rating}</span>
            {card.reviews_count && <span>({card.reviews_count} reviews)</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferCardDetail;
