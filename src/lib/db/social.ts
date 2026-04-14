import { supabase } from "@/integrations/supabase/client";

export type VerificationStatus = "pending" | "approved" | "rejected";

export interface SocialProfile {
  id: string;
  user_id: string;
  platform: string;
  handle_url: string;
  follower_count: number;
  screenshot_url: string | null;
  status: VerificationStatus;
  review_note: string | null;
  submitted_at: string;
}

export async function getSocialProfile(userId: string): Promise<SocialProfile | null> {
  const { data } = await supabase
    .from("dd_social_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data as SocialProfile | null;
}

export async function upsertSocialProfile(
  userId: string,
  payload: {
    platform: string;
    handle_url: string;
    follower_count: number;
    screenshot_url?: string | null;
  }
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("dd_social_profiles").upsert(
    {
      user_id: userId,
      ...payload,
      status: "pending",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return { error: error?.message ?? null };
}

/** Upload screenshot to Supabase Storage and return the public path */
export async function uploadScreenshot(
  userId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-screenshots")
    .upload(path, file, { upsert: true });

  if (uploadError) return { url: null, error: uploadError.message };

  const { data } = supabase.storage.from("profile-screenshots").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

/** All pending submissions — used by admin */
export async function getAllSocialProfiles() {
  const { data } = await supabase
    .from("dd_social_profiles")
    .select("*")
    .order("submitted_at", { ascending: false });
  return (data ?? []) as SocialProfile[];
}

export async function reviewSocialProfile(
  id: string,
  decision: "approved" | "rejected",
  note: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("dd_social_profiles")
    .update({
      status: decision,
      review_note: note,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  return { error: error?.message ?? null };
}
