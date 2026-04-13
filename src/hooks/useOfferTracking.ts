import { useCallback, useRef } from "react";
import { getCurrentSessionId, getSessionContext } from "@/lib/session";
import {
  trackOfferEvent,
  trackPageView,
  trackCardClick,
  trackCardImpression,
  trackBlockClick,
  trackDownload,
  trackVideoPlay,
  trackPageExit,
  type TrackingMetadata,
} from "@/lib/tracking";

interface ActivityUpdate {
  totalTimeSpent?: number;
  scrollDepth?: number;
  clicks?: number;
  downloads?: number;
}

/**
 * Hook for tracking user activity in offer/deal pages.
 * Uses the unified tracking helper under the hood.
 */
export const useOfferTracking = () => {
  const activityRef = useRef<{
    totalTimeSpent: number;
    scrollDepth: number;
    clicks: number;
    downloads: number;
  }>({
    totalTimeSpent: 0,
    scrollDepth: 0,
    clicks: 0,
    downloads: 0,
  });

  const trackEvent = useCallback(
    async (
      eventType: string,
      blockId: string | null,
      metadata: Record<string, unknown> = {}
    ) => {
      await trackOfferEvent(eventType, metadata as TrackingMetadata, { blockId });

      // Update local counters
      if (eventType.includes("click")) {
        activityRef.current.clicks += 1;
      }
      if (eventType === "download") {
        activityRef.current.downloads += 1;
      }
    },
    []
  );

  const initActivity = useCallback(async (page: string = "offers") => {
    await trackPageView(page);
  }, []);

  const updateActivity = useCallback(async (updates: ActivityUpdate) => {
    const sessionId = getCurrentSessionId();
    if (!sessionId) return;

    if (updates.totalTimeSpent !== undefined) {
      activityRef.current.totalTimeSpent = updates.totalTimeSpent;
    }
    if (updates.scrollDepth !== undefined) {
      activityRef.current.scrollDepth = updates.scrollDepth;
    }
    // Note: Activity updates to user_activity table can be added here if needed
  }, []);

  const handlePageExit = useCallback(async (page: string) => {
    await trackPageExit({
      page,
      timeSpent: activityRef.current.totalTimeSpent,
      scrollDepth: activityRef.current.scrollDepth,
    });
  }, []);

  return {
    trackEvent,
    initActivity,
    updateActivity,
    handlePageExit,
    // Expose direct tracking functions for convenience
    trackPageView,
    trackCardClick,
    trackCardImpression,
    trackBlockClick,
    trackDownload,
    trackVideoPlay,
    trackPageExit,
  };
};
