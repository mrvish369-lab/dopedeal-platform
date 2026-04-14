import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  bio: string | null;
  referral_code: string | null;
  referred_by: string | null;
  created_at: string;
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from("dd_user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data as UserProfile | null;
}

export async function upsertProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, "full_name" | "phone" | "city" | "bio">>
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("dd_user_profiles")
    .upsert({ user_id: userId, ...updates, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  return { error: error?.message ?? null };
}
