/**
 * Unified tracking helper (single source of truth)
 * All event tracking in the app should use this module.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
  createSession,
  getFreshSessionId,
  getCurrentSessionId,
  getSessionContext,
  getDeviceType,
} from "./session";

const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
let ensureSessionPromise: Promise<string | null> | null = null;

const ensureSession = async (): Promise<string | null> => {
  const fresh = getFreshSessionId(DEFAULT_SESSION_TTL_MS);
  if (fresh) return fresh;

  // Keep the existing (possibly-stale) session as a fallback. Creating a new session
  // can fail due to DB rate limiting; in that case we still want to capture events.
  const existing = getCurrentSessionId();

  if (!ensureSessionPromise) {
    const ctx = getSessionContext();
    ensureSessionPromise = createSession({
      shopId: ctx.shopId || undefined,
      batchId: ctx.batchId || undefined,
      qrType: ctx.qrType || undefined,
      referrer: document.referrer || "QR",
    }).finally(() => {
      ensureSessionPromise = null;
    });
  }

  const created = await ensureSessionPromise;
  return created || existing;
};

export type TrackingMetadata = {
  shop_id?: string | null;
  batch_id?: string | null;
  campaign_slug?: string | null;
  qr_url?: string | null;
  card_id?: string | null;
  page?: string;
  url?: string;
  type?: string;
  [key: string]: unknown;
};

/**
 * Track an event to offer_events table with automatic session context enrichment.
 * This is the PRIMARY tracking function for all user-facing pages.
 */
export const trackOfferEvent = async (
  eventType: string,
  metadata: TrackingMetadata = {},
  options?: { blockId?: string | null; cardId?: string | null }
): Promise<void> => {
  try {
    const sessionId = (getFreshSessionId(DEFAULT_SESSION_TTL_MS) ?? (await ensureSession())) || null;

    const ctx = getSessionContext();
    const deviceType = getDeviceType();

    // Merge persisted context with provided metadata (provided takes precedence)
    const enrichedMetadata: TrackingMetadata = {
      shop_id: ctx.shopId || null,
      batch_id: ctx.batchId || null,
      campaign_slug: ctx.campaignSlug || null,
      qr_url: ctx.qrUrl || null,
      ...metadata,
    };

    const { error } = await supabase.from("offer_events").insert({
      session_id: sessionId,
      shop_id: enrichedMetadata.shop_id || null,
      block_id: options?.blockId || null,
      card_id: options?.cardId || null,
      event_type: eventType,
      metadata: enrichedMetadata as Json,
      device_type: deviceType,
    });

    if (error) {
      console.error("trackOfferEvent insert failed:", error);
    }
  } catch (error) {
    console.error("Error tracking offer event:", error);
  }
};

/**
 * Track a QR scan event - should be called once per page load from /start.
 * This provides a dedicated metric for QR scans separate from page_view.
 */
export const trackQrScan = async (params: {
  shopId?: string | null;
  batchId?: string | null;
  campaignSlug?: string | null;
  qrUrl?: string;
}): Promise<void> => {
  const qrUrl = params.qrUrl || window.location.href;

  await trackOfferEvent("qr_scan", {
    shop_id: params.shopId,
    batch_id: params.batchId,
    campaign_slug: params.campaignSlug,
    qr_url: qrUrl,
  });
};

/**
 * Track a page view event.
 */
export const trackPageView = async (
  page: string,
  extraMetadata: TrackingMetadata = {}
): Promise<void> => {
  await trackOfferEvent("page_view", {
    page,
    ...extraMetadata,
  });
};

/**
 * Track a card click event.
 */
export const trackCardClick = async (
  cardId: string,
  extraMetadata: TrackingMetadata = {}
): Promise<void> => {
  await trackOfferEvent("card_click", extraMetadata, { cardId });
};

/**
 * Track a card impression event.
 */
export const trackCardImpression = async (
  cardId: string,
  extraMetadata: TrackingMetadata = {}
): Promise<void> => {
  await trackOfferEvent("card_impression", extraMetadata, { cardId });
};

/**
 * Track a page exit event.
 */
export const trackPageExit = async (params: {
  page: string;
  timeSpent?: number;
  scrollDepth?: number;
}): Promise<void> => {
  await trackOfferEvent("page_exit", {
    page: params.page,
    time_spent: params.timeSpent,
    scroll_depth: params.scrollDepth,
  });
};

/**
 * Track a block click event (for offer blocks).
 */
export const trackBlockClick = async (
  blockId: string,
  blockType: string,
  url?: string
): Promise<void> => {
  await trackOfferEvent(`${blockType}_click`, { url }, { blockId });
};

/**
 * Track a download event.
 */
export const trackDownload = async (
  blockId: string,
  downloadType: string
): Promise<void> => {
  await trackOfferEvent("download", { type: downloadType }, { blockId });
};

/**
 * Track a video play event.
 */
export const trackVideoPlay = async (blockId: string): Promise<void> => {
  await trackOfferEvent("video_play", {}, { blockId });
};
