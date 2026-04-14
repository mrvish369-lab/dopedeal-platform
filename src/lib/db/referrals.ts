import { supabase } from "@/integrations/supabase/client";

export interface ReferralStats {
  total_referred: number;
  total_commission: number;
  referral_code: string | null;
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  // Get user's referral code
  const { data: profile } = await supabase
    .from("dd_user_profiles")
    .select("referral_code")
    .eq("user_id", userId)
    .single();

  // Count referred users
  const { count } = await supabase
    .from("dd_referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", userId);

  // Sum referrer_commission
  const { data: commData } = await supabase
    .from("dd_referrals")
    .select("referrer_commission")
    .eq("referrer_id", userId);

  const totalCommission = (commData ?? []).reduce(
    (s: number, r: { referrer_commission: number }) => s + (r.referrer_commission ?? 0),
    0
  );

  return {
    referral_code: profile?.referral_code ?? null,
    total_referred: count ?? 0,
    total_commission: totalCommission,
  };
}
