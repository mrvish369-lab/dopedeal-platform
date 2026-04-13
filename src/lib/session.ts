import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type SessionContext = {
  shopId?: string;
  batchId?: string;
  qrType?: string;
  campaignSlug?: string;
  qrUrl?: string;
};

const SESSION_ID_KEY = "dopedeal_session_id";
const SESSION_CREATED_AT_KEY = "dopedeal_session_created_at";

const SESSION_CONTEXT_KEYS = {
  shopId: "dopedeal_session_shop_id",
  batchId: "dopedeal_session_batch_id",
  qrType: "dopedeal_session_qr_type",
  campaignSlug: "dopedeal_session_campaign_slug",
  qrUrl: "dopedeal_session_qr_url",
} as const;

export const setSessionContext = (ctx: SessionContext): void => {
  if (ctx.shopId !== undefined) {
    if (ctx.shopId) localStorage.setItem(SESSION_CONTEXT_KEYS.shopId, ctx.shopId);
    else localStorage.removeItem(SESSION_CONTEXT_KEYS.shopId);
  }
  if (ctx.batchId !== undefined) {
    if (ctx.batchId) localStorage.setItem(SESSION_CONTEXT_KEYS.batchId, ctx.batchId);
    else localStorage.removeItem(SESSION_CONTEXT_KEYS.batchId);
  }
  if (ctx.qrType !== undefined) {
    if (ctx.qrType) localStorage.setItem(SESSION_CONTEXT_KEYS.qrType, ctx.qrType);
    else localStorage.removeItem(SESSION_CONTEXT_KEYS.qrType);
  }
  if (ctx.campaignSlug !== undefined) {
    if (ctx.campaignSlug) localStorage.setItem(SESSION_CONTEXT_KEYS.campaignSlug, ctx.campaignSlug);
    else localStorage.removeItem(SESSION_CONTEXT_KEYS.campaignSlug);
  }
  if (ctx.qrUrl !== undefined) {
    if (ctx.qrUrl) localStorage.setItem(SESSION_CONTEXT_KEYS.qrUrl, ctx.qrUrl);
    else localStorage.removeItem(SESSION_CONTEXT_KEYS.qrUrl);
  }
};

export const getSessionContext = (): Required<SessionContext> => {
  return {
    shopId: localStorage.getItem(SESSION_CONTEXT_KEYS.shopId) || "",
    batchId: localStorage.getItem(SESSION_CONTEXT_KEYS.batchId) || "",
    qrType: localStorage.getItem(SESSION_CONTEXT_KEYS.qrType) || "",
    campaignSlug: localStorage.getItem(SESSION_CONTEXT_KEYS.campaignSlug) || "",
    qrUrl: localStorage.getItem(SESSION_CONTEXT_KEYS.qrUrl) || "",
  };
};

// Generate or retrieve anonymous ID
export const getAnonymousId = (): string => {
  const storageKey = "dopedeal_anonymous_id";
  let anonymousId = localStorage.getItem(storageKey);
  
  // Backward-compat: if an older build stored an invalid/too-long value,
  // it will fail the `sessions` INSERT RLS check (length <= 100) and break tracking.
  const isInvalid = !anonymousId || anonymousId.length === 0 || anonymousId.length > 100;
  if (isInvalid) {
    anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(storageKey, anonymousId);
  }
  
  return anonymousId;
};

// Get current session ID
export const getCurrentSessionId = (): string | null => {
  return localStorage.getItem(SESSION_ID_KEY);
};

// Save session ID
export const setCurrentSessionId = (sessionId: string): void => {
  localStorage.setItem(SESSION_ID_KEY, sessionId);
  // Used to rotate sessions periodically without needing to SELECT from DB (RLS-safe)
  localStorage.setItem(SESSION_CREATED_AT_KEY, String(Date.now()));
};

export const clearCurrentSession = (): void => {
  localStorage.removeItem(SESSION_ID_KEY);
  localStorage.removeItem(SESSION_CREATED_AT_KEY);
};

export const getCurrentSessionCreatedAt = (): number | null => {
  const raw = localStorage.getItem(SESSION_CREATED_AT_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

/**
 * Returns session id only if it was created recently.
 * If timestamp is missing (older sessions), it is treated as stale.
 */
export const getFreshSessionId = (ttlMs: number): string | null => {
  const id = getCurrentSessionId();
  if (!id) return null;
  const createdAt = getCurrentSessionCreatedAt();
  if (!createdAt) return null;
  if (Date.now() - createdAt > ttlMs) return null;
  return id;
};

// Detect device type
export const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) return "mobile";
  return "desktop";
};

export type CreateSessionOptions = {
  shopId?: string;
  batchId?: string;
  qrType?: string;
  referrer?: string;
};

// Prevent duplicate session creation (can otherwise hit DB rate limits + break tracking)
let createSessionInFlight: Promise<string | null> | null = null;
let createSessionInFlightKey: string | null = null;

const getCreateSessionKey = (options: CreateSessionOptions): string => {
  // Intentionally ignore referrer to dedupe calls happening at the same time
  // from different code paths (e.g. Start.tsx + tracking ensureSession).
  return `${options.shopId ?? ""}::${options.batchId ?? ""}::${options.qrType ?? ""}`;
};

// Create a new session
export const createSession = async (
  shopIdOrOptions?: string | CreateSessionOptions
): Promise<string | null> => {
  const options: CreateSessionOptions =
    typeof shopIdOrOptions === "string" ? { shopId: shopIdOrOptions } : (shopIdOrOptions ?? {});

  const key = getCreateSessionKey(options);
  if (createSessionInFlight && createSessionInFlightKey === key) {
    return createSessionInFlight;
  }

  createSessionInFlightKey = key;

  createSessionInFlight = (async () => {

    // Persist context locally so we never need to SELECT from `sessions` (RLS-safe)
    setSessionContext({
      shopId: options.shopId || "",
      batchId: options.batchId || "",
      qrType: options.qrType || "",
    });

    const anonymousId = getAnonymousId();
    const deviceType = getDeviceType();
    const userAgent = navigator.userAgent;

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        shop_id: options.shopId || null,
        batch_id: options.batchId || null,
        qr_type: options.qrType || null,
        anonymous_id: anonymousId,
        device_type: deviceType,
        user_agent: userAgent,
        referrer: options.referrer ?? "QR",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating session:", error);
      return null;
    }

    const sessionId = data.id;
    setCurrentSessionId(sessionId);

    // Track session start event
    await trackEvent("session_started", {
      shop_id: options.shopId || null,
      batch_id: options.batchId || null,
      qr_type: options.qrType || null,
    });

    return sessionId;
  })().finally(() => {
    createSessionInFlight = null;
    createSessionInFlightKey = null;
  });

  return createSessionInFlight;
};

// Update session with quiz data
export const updateSessionQuiz = async (
  sessionId: string,
  category: string,
  completed: boolean = false
): Promise<boolean> => {
  const { error } = await supabase
    .from("sessions")
    .update({
      quiz_category: category,
      quiz_completed: completed,
    })
    .eq("id", sessionId);

  if (error) {
    console.error("Error updating session quiz:", error);
    return false;
  }
  
  return true;
};

// Update session with WhatsApp data
export const updateSessionWhatsApp = async (
  sessionId: string,
  whatsappNumber: string,
  verified: boolean = false
): Promise<boolean> => {
  const { error } = await supabase
    .from("sessions")
    .update({
      whatsapp_number: whatsappNumber,
      whatsapp_verified: verified,
    })
    .eq("id", sessionId);

  if (error) {
    console.error("Error updating session WhatsApp:", error);
    return false;
  }
  
  return true;
};

// Update session with result
export const updateSessionResult = async (
  sessionId: string,
  resultType: "success" | "failure",
  redemptionAllowed: boolean
): Promise<boolean> => {
  const { error } = await supabase
    .from("sessions")
    .update({
      result_type: resultType,
      redemption_allowed: redemptionAllowed,
      ended_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) {
    console.error("Error updating session result:", error);
    return false;
  }
  
  return true;
};

// Track an event
export const trackEvent = async (
  eventType: string,
  metadata: Record<string, unknown> = {}
): Promise<void> => {
  const sessionId = getCurrentSessionId();
  
  const { error } = await supabase.from("events").insert([{
    session_id: sessionId,
    event_type: eventType,
    metadata: metadata as Json,
  }]);

  if (error) {
    console.error("Error tracking event:", error);
  }
};

// Log quiz answer
export const logQuizAnswer = async (
  sessionId: string,
  quizId: string,
  selectedOption: number
): Promise<boolean> => {
  const { error } = await supabase.from("quiz_logs").insert({
    session_id: sessionId,
    quiz_id: quizId,
    selected_option: selectedOption,
  });

  if (error) {
    console.error("Error logging quiz answer:", error);
    return false;
  }
  
  return true;
};

// Check if WhatsApp number already used
export const isWhatsAppNumberUsed = async (whatsappNumber: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("sessions")
    .select("id")
    .eq("whatsapp_number", whatsappNumber)
    .eq("whatsapp_verified", true)
    .eq("redemption_allowed", true)
    .limit(1);

  if (error) {
    console.error("Error checking WhatsApp number:", error);
    return false;
  }

  return data && data.length > 0;
};

// Get success probability for category
export const getSuccessProbability = async (category: string): Promise<number> => {
  const { data, error } = await supabase
    .from("quiz_settings")
    .select("success_probability")
    .eq("category", category)
    .single();

  if (error || !data) {
    console.error("Error getting success probability:", error);
    return 80; // Default 80%
  }

  return data.success_probability;
};

// Determine result based on probability
export const determineResult = async (category: string): Promise<"success" | "failure"> => {
  const probability = await getSuccessProbability(category);
  const random = Math.random() * 100;
  return random <= probability ? "success" : "failure";
};

// Capture lead from WhatsApp verification
export const captureLead = async (
  whatsappNumber: string,
  options?: {
    sessionId?: string;
    shopId?: string;
    productId?: string;
    campaignId?: string;
    resultType?: "success" | "failure";
    city?: string;
    state?: string;
  }
): Promise<boolean> => {
  try {
    const sessionId = options?.sessionId || getCurrentSessionId();
    const deviceType = getDeviceType();

    const { error } = await supabase.from("leads").insert({
      whatsapp_number: whatsappNumber,
      session_id: sessionId,
      shop_id: options?.shopId || null,
      product_id: options?.productId || null,
      campaign_id: options?.campaignId || null,
      result_type: options?.resultType || null,
      device_type: deviceType,
      city: options?.city || null,
      state: options?.state || null,
      status: "new",
    });

    if (error) {
      console.error("Error capturing lead:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error capturing lead:", err);
    return false;
  }
};