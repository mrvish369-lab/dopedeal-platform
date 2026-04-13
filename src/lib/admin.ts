import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { buildShopQuizUrl, buildStockBatchUrl } from "./config";

// Check if current user is admin
export const checkIsAdmin = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return !error && !!data;
};

// Log admin action
export const logAdminAction = async (
  action: string,
  entityType: string,
  entityId?: string,
  metadata: Record<string, unknown> = {}
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase.from("admin_logs").insert({
    admin_id: user?.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata as Json,
  });
};

// Dashboard stats interface
export interface DashboardStats {
  total_shops: number;
  total_scans: number;
  verified_users: number;
  success_count: number;
  failure_count: number;
  quiz_completed: number;
}

// Get dashboard stats
export const getDashboardStats = async (
  startDate?: Date,
  endDate?: Date
): Promise<DashboardStats | null> => {
  const { data, error } = await supabase.rpc("get_admin_dashboard_stats", {
    start_date: startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: endDate?.toISOString() || new Date().toISOString(),
  });

  if (error) {
    console.error("Error fetching dashboard stats:", error);
    return null;
  }

  return data as unknown as DashboardStats;
};

// Shop interface
export interface Shop {
  id: string;
  shop_code: string;
  name: string;
  owner_name?: string;
  owner_contact?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  location?: string;
  geo_lat?: number;
  geo_lng?: number;
  shop_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Create shop
export const createShop = async (shopData: Partial<Shop>): Promise<Shop | null> => {
  const shopCode = `SHOP_${Date.now().toString(36).toUpperCase()}`;
  
  const { data, error } = await supabase
    .from("shops")
    .insert({
      shop_code: shopCode,
      name: shopData.name!,
      owner_name: shopData.owner_name,
      owner_contact: shopData.owner_contact,
      address: shopData.address,
      city: shopData.city,
      state: shopData.state,
      pincode: shopData.pincode,
      location: shopData.location,
      geo_lat: shopData.geo_lat,
      geo_lng: shopData.geo_lng,
      shop_type: shopData.shop_type || "general_store",
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating shop:", error);
    return null;
  }

  // Auto-generate QR code for shop using centralized config
  const qrUrl = buildShopQuizUrl(data.id, 1);
  
  await supabase.from("qr_codes").insert({
    shop_id: data.id,
    qr_url: qrUrl,
    status: "active",
    version: 1,
  });

  await logAdminAction("create", "shop", data.id, { shop_name: data.name });

  return data as Shop;
};

// Update shop
export const updateShop = async (shopId: string, updates: Partial<Shop>): Promise<boolean> => {
  const { error } = await supabase
    .from("shops")
    .update(updates)
    .eq("id", shopId);

  if (error) {
    console.error("Error updating shop:", error);
    return false;
  }

  await logAdminAction("update", "shop", shopId, updates);
  return true;
};

// Get all shops
export const getShops = async (): Promise<Shop[]> => {
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching shops:", error);
    return [];
  }

  return data as Shop[];
};

// Get shop by ID with stats
export const getShopWithStats = async (shopId: string) => {
  const [shopResult, sessionsResult, stockResult, qrResult] = await Promise.all([
    supabase.from("shops").select("*").eq("id", shopId).single(),
    supabase.from("sessions").select("*").eq("shop_id", shopId),
    supabase.from("shop_stock").select("*, products:product_id(name, emoji)").eq("shop_id", shopId),
    supabase.from("qr_codes").select("*").eq("shop_id", shopId).eq("status", "active"),
  ]);

  const sessions = sessionsResult.data || [];
  const stats = {
    total_scans: sessions.length,
    verified_users: sessions.filter((s) => s.whatsapp_verified).length,
    success_redemptions: sessions.filter((s) => s.result_type === "success").length,
    failure_count: sessions.filter((s) => s.result_type === "failure").length,
    quiz_scans: sessions.filter((s) => s.qr_type === "quiz" || !s.qr_type).length,
    lighter_scans: sessions.filter((s) => s.qr_type === "lighter" || s.qr_type === "product").length,
  };

  return {
    shop: shopResult.data as Shop,
    stats,
    stock: stockResult.data || [],
    qrCodes: qrResult.data || [],
  };
};

// Legacy stock assignment (for backwards compatibility)
export const assignStock = async (
  shopId: string,
  productType: string,
  quantity: number
): Promise<boolean> => {
  const { error } = await supabase
    .from("shop_stock")
    .upsert({
      shop_id: shopId,
      product_type: productType,
      quantity_assigned: quantity,
      quantity_redeemed: 0,
    }, { onConflict: "shop_id,product_type" });

  if (error) {
    console.error("Error assigning stock:", error);
    return false;
  }

  await logAdminAction("assign_stock", "shop_stock", shopId, { product_type: productType, quantity });
  return true;
};

// New stock batch assignment with product-based Quiz Campaign QR generation
export const assignStockBatch = async (
  shopId: string,
  productId: string,
  quantity: number,
  batchName?: string
): Promise<{ batchId: string; qrUrl: string } | null> => {
  // First, get the product details and find the linked quiz campaign
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("slug, name")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    console.error("Error fetching product:", productError);
    return null;
  }

  // Find the quiz campaign linked to this product
  const { data: campaign } = await supabase
    .from("quiz_campaigns")
    .select("slug")
    .eq("product_id", productId)
    .eq("status", "active")
    .single();

  // Generate batch name if not provided
  const finalBatchName =
    batchName || `${product.name.toUpperCase().replace(/\s+/g, '_')}_${Date.now().toString(36).toUpperCase()}`;

  // Create stock batch with product_id
  const { data: stockData, error: stockError } = await supabase
    .from("shop_stock")
    .insert({
      shop_id: shopId,
      product_id: productId,
      product_type: product.slug, // Keep for backwards compatibility
      quantity_assigned: quantity,
      quantity_redeemed: 0,
      batch_name: finalBatchName,
      status: "active",
    })
    .select()
    .single();

  if (stockError || !stockData) {
    console.error("Error creating stock batch:", stockError);
    return null;
  }

  // Generate QR URL using centralized config
  const campaignSlug = campaign?.slug || product.slug;
  const qrUrl = buildStockBatchUrl(campaignSlug, shopId, stockData.id);

  // NOTE: qr_codes has UNIQUE (shop_id, version), so each insert for a shop must increment version.
  const { data: latestVersions, error: versionError } = await supabase
    .from("qr_codes")
    .select("version")
    .eq("shop_id", shopId)
    .order("version", { ascending: false })
    .limit(1);

  if (versionError) {
    console.error("Error reading QR version:", versionError);
    // Roll back the stock batch to avoid partial state
    await supabase.from("shop_stock").delete().eq("id", stockData.id);
    return null;
  }

  const nextVersion = (latestVersions?.[0]?.version ?? 0) + 1;

  const { error: qrError } = await supabase.from("qr_codes").insert({
    shop_id: shopId,
    batch_id: stockData.id,
    qr_type: "product",
    qr_url: qrUrl,
    status: "active",
    version: nextVersion,
  });

  if (qrError) {
    console.error("Error creating product QR:", qrError);
    // Roll back the stock batch to avoid partial state
    await supabase.from("shop_stock").delete().eq("id", stockData.id);
    return null;
  }

  await logAdminAction("assign_stock_batch", "shop_stock", shopId, {
    batch_id: stockData.id,
    product_id: productId,
    product_slug: product.slug,
    campaign_slug: campaignSlug,
    quantity,
    batch_name: finalBatchName,
    qr_version: nextVersion,
  });

  return { batchId: stockData.id, qrUrl };
};

// Regenerate QR code
export const regenerateQRCode = async (shopId: string): Promise<string | null> => {
  // Disable old QR
  await supabase
    .from("qr_codes")
    .update({ status: "regenerated" })
    .eq("shop_id", shopId)
    .eq("status", "active");

  // Get current version
  const { data: existing } = await supabase
    .from("qr_codes")
    .select("version")
    .eq("shop_id", shopId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const newVersion = (existing?.version || 0) + 1;
  const qrUrl = buildShopQuizUrl(shopId, newVersion);

  const { data, error } = await supabase
    .from("qr_codes")
    .insert({
      shop_id: shopId,
      qr_url: qrUrl,
      status: "active",
      version: newVersion,
    })
    .select()
    .single();

  if (error) {
    console.error("Error regenerating QR:", error);
    return null;
  }

  await logAdminAction("regenerate_qr", "qr_codes", shopId);
  return data.qr_url;
};

// Quiz management
export interface QuizData {
  id?: string;
  category: string;
  question: string;
  options: string[];
  correct_option?: number;
  is_active: boolean;
  display_order: number;
}

export const createQuiz = async (quizData: QuizData): Promise<boolean> => {
  const { error } = await supabase.from("quizzes").insert({
    category: quizData.category,
    question: quizData.question,
    options: quizData.options,
    correct_option: quizData.correct_option,
    is_active: quizData.is_active,
    display_order: quizData.display_order,
  });

  if (error) {
    console.error("Error creating quiz:", error);
    return false;
  }

  await logAdminAction("create", "quiz", undefined, { category: quizData.category });
  return true;
};

export const updateQuiz = async (quizId: string, updates: Partial<QuizData>): Promise<boolean> => {
  const { error } = await supabase
    .from("quizzes")
    .update(updates)
    .eq("id", quizId);

  if (error) {
    console.error("Error updating quiz:", error);
    return false;
  }

  await logAdminAction("update", "quiz", quizId, updates);
  return true;
};

export const deleteQuiz = async (quizId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("quizzes")
    .delete()
    .eq("id", quizId);

  if (error) {
    console.error("Error deleting quiz:", error);
    return false;
  }

  await logAdminAction("delete", "quiz", quizId);
  return true;
};

// Success rules management
export const updateSuccessRule = async (
  ruleType: "global" | "shop",
  probability: number,
  shopId?: string
): Promise<boolean> => {
  if (ruleType === "global") {
    const { error } = await supabase
      .from("success_rules")
      .update({ success_probability: probability })
      .eq("rule_type", "global");

    if (error) {
      console.error("Error updating global rule:", error);
      return false;
    }
  } else if (shopId) {
    const { error } = await supabase
      .from("success_rules")
      .upsert({
        rule_type: "shop",
        shop_id: shopId,
        success_probability: probability,
        priority: 1,
        is_active: true,
      });

    if (error) {
      console.error("Error updating shop rule:", error);
      return false;
    }
  }

  await logAdminAction("update_success_rule", "success_rules", shopId, { rule_type: ruleType, probability });
  return true;
};

// Get admin logs
export const getAdminLogs = async (limit = 50) => {
  const { data, error } = await supabase
    .from("admin_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching admin logs:", error);
    return [];
  }

  return data;
};
