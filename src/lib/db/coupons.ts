import { supabase } from "@/integrations/supabase/client";

export type CouponStatus = "unused" | "redeemed" | "pending_verification";

export interface UserCoupon {
  id: string;
  user_id: string;
  product_id: string;
  code: string;
  discount_value: number;
  commission: number;
  status: CouponStatus;
  redeemed_at: string | null;
  created_at: string;
}

/** Get all coupons for a user (optionally filtered by product) */
export async function getUserCoupons(userId: string, productId?: string): Promise<UserCoupon[]> {
  let query = supabase
    .from("dd_user_coupons")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (productId) query = query.eq("product_id", productId);

  const { data } = await query;
  return (data ?? []) as UserCoupon[];
}

/** Generate random coupon code DD-XXXX-XXXX */
function makeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `DD-${seg(4)}-${seg(4)}`;
}

/** Generate `count` coupons for a product and save to DB */
export async function generateCoupons(
  userId: string,
  productId: string,
  discountValue: 50 | 100 | 150,
  commission: number,
  count: number
): Promise<{ codes: string[]; error: string | null }> {
  const rows = Array.from({ length: count }, () => ({
    user_id: userId,
    product_id: productId,
    code: makeCode(),
    discount_value: discountValue,
    commission,
    status: "unused" as CouponStatus,
  }));

  const { data, error } = await supabase
    .from("dd_user_coupons")
    .insert(rows)
    .select("code");

  if (error) return { codes: [], error: error.message };

  // Increment used_coupons counter on product
  await supabase.rpc("increment_used_coupons" as never, {
    p_product_id: productId,
    p_count: count,
  } as never).maybeSingle();

  return { codes: (data ?? []).map((r: { code: string }) => r.code), error: null };
}
