/**
 * Application configuration constants
 * Single source of truth for environment-specific settings
 */

// Production domain for QR codes and tracking links
// This ensures all generated QR codes point to the correct production URL
export const PRODUCTION_DOMAIN = "https://dopedeal.store";

// Helper to generate tracking URLs
export const buildTrackingUrl = (
  path: string,
  params: Record<string, string | undefined>
): string => {
  const url = new URL(path, PRODUCTION_DOMAIN);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  
  return url.toString();
};

// Generate Quiz QR URL for shops (no batch)
export const buildShopQuizUrl = (shopId: string, version?: number): string => {
  return buildTrackingUrl("/start", {
    shop_id: shopId,
    v: version?.toString(),
  });
};

// Generate Stock Batch QR URL (with campaign and batch)
export const buildStockBatchUrl = (
  campaignSlug: string,
  shopId: string,
  batchId: string
): string => {
  return buildTrackingUrl("/start", {
    c: campaignSlug,
    shop_id: shopId,
    batch_id: batchId,
  });
};

// Generate Deals Page QR URL
export const buildDealsUrl = (shopId?: string, batchId?: string): string => {
  return buildTrackingUrl("/", {
    shop_id: shopId,
    batch_id: batchId,
  });
};

// Generate Campaign URL (for clipboard copy)
export const buildCampaignUrl = (campaignSlug: string): string => {
  return buildTrackingUrl("/start", {
    campaign: campaignSlug,
  });
};
