import { supabase } from "@/integrations/supabase/client";

export interface CommissionTier {
  discountValue: 50 | 100 | 150;
  baseCommission: number;
}

export interface Product {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  store_url: string;
  description: string | null;
  price: number;
  commission_tiers: CommissionTier[];
  coupons_per_user: number;
  total_coupons_pool: number;
  used_coupons: number;
  active: boolean;
}

export async function getActiveProducts(): Promise<Product[]> {
  const { data } = await supabase
    .from("dd_products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true });
  return (data ?? []).map((p: Record<string, unknown>) => ({
    ...p,
    commission_tiers: Array.isArray(p.commission_tiers) ? p.commission_tiers : [],
  })) as Product[];
}
