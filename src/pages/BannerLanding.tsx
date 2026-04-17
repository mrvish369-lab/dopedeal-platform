import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Check, ExternalLink, Star, Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { trackPageView } from "@/lib/tracking";
import { safeNavigate } from "@/lib/urlValidation";

interface BannerData {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  redirect_url: string | null;
  landing_enabled: boolean;
  landing_description: string | null;
  landing_long_description: string | null;
  landing_features: string[] | null;
  landing_cta_text: string | null;
  landing_cta_url: string | null;
  landing_coupon_code: string | null;
  landing_discount_text: string | null;
  landing_image_url: string | null;
}

const BannerLanding = () => {
  const { bannerId } = useParams();
  const navigate = useNavigate();
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (bannerId) {
      fetchBanner();
      trackPageView("banner_landing", { banner_id: bannerId });
    }
  }, [bannerId]);

  const fetchBanner = async () => {
    const { data, error } = await supabase
      .from("deal_banners")
      .select("*")
      .eq("id", bannerId)
      .eq("status", "active")
      .single();

    if (data) {
      setBanner(data as BannerData);
    }
    if (error) {
      console.error("Error fetching banner:", error);
    }
    setLoading(false);
  };

  const handleCopyCoupon = () => {
    if (banner?.landing_coupon_code) {
      navigator.clipboard.writeText(banner.landing_coupon_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCTA = () => {
    const url = banner?.landing_cta_url || banner?.redirect_url;
    if (url) {
      safeNavigate(url, { newTab: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!banner) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">Deal Not Found</h1>
        <p className="text-muted-foreground mb-4">This deal may have expired or been removed.</p>
        <Button onClick={() => navigate("/")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Deals
        </Button>
      </div>
    );
  }

  const heroImage = banner.landing_image_url || banner.image_url;
  const features = banner.landing_features || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground truncate">{banner.title}</h1>
        </div>
      </header>

      {/* Hero Image */}
      {heroImage && (
        <div className="w-full aspect-video relative overflow-hidden">
          <img
            src={heroImage}
            alt={banner.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{banner.title}</h1>
          {banner.subtitle && (
            <p className="text-muted-foreground">{banner.subtitle}</p>
          )}
        </div>

        {/* Discount Highlight */}
        {banner.landing_discount_text && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-orange-500 p-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Exclusive Discount</p>
                <p className="text-white text-xl font-bold">{banner.landing_discount_text}</p>
              </div>
            </div>
          </div>
        )}

        {/* Coupon Code */}
        {banner.landing_coupon_code && (
          <div className="bg-card border-2 border-dashed border-primary/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Use Coupon Code</p>
                <p className="text-2xl font-bold font-mono text-primary tracking-wider">
                  {banner.landing_coupon_code}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCoupon}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-secondary" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Description */}
        {(banner.landing_description || banner.landing_long_description) && (
          <div className="space-y-3">
            {banner.landing_description && (
              <p className="text-foreground text-lg">{banner.landing_description}</p>
            )}
            {banner.landing_long_description && (
              <p className="text-muted-foreground whitespace-pre-line">
                {banner.landing_long_description}
              </p>
            )}
          </div>
        )}

        {/* Features */}
        {features.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              What You Get
            </h3>
            <ul className="space-y-2">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                  <Star className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA Button */}
        <Button
          onClick={handleCTA}
          className="w-full h-14 text-lg font-bold btn-fire gap-2"
          size="lg"
        >
          {banner.landing_cta_text || "Get This Deal"}
          <ExternalLink className="w-5 h-5" />
        </Button>

        {/* Trust Badge */}
        <div className="text-center text-sm text-muted-foreground">
          <p>🔒 Verified by DopeDeal • Safe & Secure</p>
        </div>
      </div>
    </div>
  );
};

export default BannerLanding;
