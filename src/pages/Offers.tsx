import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentSessionId } from "@/lib/session";
import { OfferBanner } from "@/components/offers/OfferBanner";
import { OfferButton } from "@/components/offers/OfferButton";
import { OfferCourse } from "@/components/offers/OfferCourse";
import { OfferVideo } from "@/components/offers/OfferVideo";
import { OfferHeader } from "@/components/offers/OfferHeader";
import { OfferFooter } from "@/components/offers/OfferFooter";
import { useOfferTracking } from "@/hooks/useOfferTracking";

interface OfferBlock {
  id: string;
  block_type: string;
  title: string | null;
  subtitle: string | null;
  content_json: Record<string, unknown>;
  position: number;
}

const Offers = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState<OfferBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [sessionData, setSessionData] = useState<{
    shopId: string | null;
    category: string | null;
  }>({ shopId: null, category: null });

  const { trackEvent, initActivity, updateActivity } = useOfferTracking();

  useEffect(() => {
    // Backward-compatible: older "lighter" QR codes may point to /offers; redirect to the CashKaro-style page.
    const qrType = searchParams.get("qr_type");
    if (qrType === "lighter") {
      navigate(`/deals?${searchParams.toString()}`, { replace: true });
      return;
    }

    const checkEligibility = async () => {
      const sessionId = getCurrentSessionId();
      if (!sessionId) {
        navigate("/");
        return;
      }

      // Check if user is verified
      const { data: session } = await supabase
        .from("sessions")
        .select("whatsapp_verified, shop_id, quiz_category")
        .eq("id", sessionId)
        .single();

      if (!session?.whatsapp_verified) {
        navigate("/");
        return;
      }

      setIsEligible(true);
      setSessionData({
        shopId: session.shop_id,
        category: session.quiz_category,
      });

      // Initialize activity tracking
      await initActivity(sessionId);

      // Track page view
      await trackEvent("page_view", null, { page: "offers" });

      // Fetch offer blocks
      await fetchBlocks(session.quiz_category);
    };

    checkEligibility();

    // Track time spent
    const startTime = Date.now();
    const interval = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      updateActivity({ totalTimeSpent: timeSpent });
    }, 10000); // Update every 10 seconds

    return () => {
      clearInterval(interval);
      trackEvent("page_exit", null, {
        time_spent: Math.floor((Date.now() - startTime) / 1000),
      });
    };
  }, [navigate, searchParams, initActivity, trackEvent, updateActivity]);

  const fetchBlocks = async (category: string | null) => {
    try {
      let query = supabase
        .from("offer_blocks")
        .select("*")
        .eq("status", "active")
        .order("position", { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      // Filter blocks by category if applicable
      const filteredBlocks = (data || []).filter((block) => {
        const targetCategories = block.target_categories || [];
        if (targetCategories.length === 0) return true;
        return category && targetCategories.includes(category);
      });

      setBlocks(filteredBlocks as OfferBlock[]);
    } catch (error) {
      console.error("Error fetching blocks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockClick = async (blockId: string, blockType: string, url?: string) => {
    await trackEvent(`${blockType}_click`, blockId, { url });
  };

  const handleDownload = async (blockId: string, blockType: string) => {
    await trackEvent("download", blockId, { type: blockType });
  };

  const handleVideoPlay = async (blockId: string) => {
    await trackEvent("video_play", blockId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isEligible) {
    return null;
  }

  return (
    <div className="min-h-screen bg-animated-gradient">
      <OfferHeader />

      {/* Hero Section */}
      <section className="px-4 py-8 text-center">
        <div className="slide-up">
          <h1 className="text-3xl md:text-4xl font-bold text-gradient-fire mb-2">
            🎉 Congratulations!
          </h1>
          <p className="text-lg text-muted-foreground">
            You've unlocked exclusive rewards & offers
          </p>
        </div>
      </section>

      {/* Offer Blocks */}
      <section className="px-4 pb-8 max-w-2xl mx-auto space-y-6">
        {blocks.map((block, index) => {
          const animationDelay = `${index * 100}ms`;
          
          switch (block.block_type) {
            case "banner":
              return (
                <OfferBanner
                  key={block.id}
                  block={block}
                  onClick={(url) => handleBlockClick(block.id, "banner", url)}
                  style={{ animationDelay }}
                />
              );
            case "button":
              return (
                <OfferButton
                  key={block.id}
                  block={block}
                  onClick={(url) => handleBlockClick(block.id, "button", url)}
                  style={{ animationDelay }}
                />
              );
            case "course":
              return (
                <OfferCourse
                  key={block.id}
                  block={block}
                  onDownload={() => handleDownload(block.id, "course")}
                  style={{ animationDelay }}
                />
              );
            case "video":
              return (
                <OfferVideo
                  key={block.id}
                  block={block}
                  onPlay={() => handleVideoPlay(block.id)}
                  onDownload={() => handleDownload(block.id, "video")}
                  style={{ animationDelay }}
                />
              );
            default:
              return null;
          }
        })}

        {blocks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No offers available at the moment.</p>
            <p className="text-sm mt-2">Check back soon!</p>
          </div>
        )}
      </section>

      <OfferFooter />
    </div>
  );
};

export default Offers;
