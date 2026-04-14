import { supabase } from "@/integrations/supabase/client";

export interface Task {
  id: string;
  platform: string;
  title: string;
  description: string | null;
  instructions: string[];
  payout: number;
  min_followers: number;
  estimated_time: string | null;
  active: boolean;
}

export type SubmissionStatus = "submitted" | "approved" | "rejected";

export interface TaskSubmission {
  id: string;
  user_id: string;
  task_id: string;
  screenshot_url: string;
  status: SubmissionStatus;
  review_note: string | null;
  submitted_at: string;
}

export async function getTasks(): Promise<Task[]> {
  const { data } = await supabase
    .from("dd_tasks")
    .select("*")
    .eq("active", true)
    .order("payout", { ascending: false });
  return (data ?? []).map((t: Record<string, unknown>) => ({
    ...t,
    instructions: Array.isArray(t.instructions) ? t.instructions : [],
  })) as Task[];
}

export async function getUserSubmissions(userId: string): Promise<TaskSubmission[]> {
  const { data } = await supabase
    .from("dd_task_submissions")
    .select("*")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false });
  return (data ?? []) as TaskSubmission[];
}

/** Upload proof screenshot */
export async function uploadTaskProof(
  userId: string,
  taskId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${taskId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("task-proofs")
    .upload(path, file, { upsert: true });

  if (uploadError) return { url: null, error: uploadError.message };

  const { data } = supabase.storage.from("task-proofs").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

/** Submit task proof — upserts to handle resubmission */
export async function submitTaskProof(
  userId: string,
  taskId: string,
  screenshotUrl: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("dd_task_submissions").upsert(
    {
      user_id: userId,
      task_id: taskId,
      screenshot_url: screenshotUrl,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      review_note: null,
      reviewed_at: null,
    },
    { onConflict: "user_id,task_id" }
  );
  return { error: error?.message ?? null };
}

/** Admin: all submissions */
export async function getAllTaskSubmissions() {
  const { data } = await supabase
    .from("dd_task_submissions")
    .select("*, dd_tasks(title, platform, payout)")
    .order("submitted_at", { ascending: false });
  return data ?? [];
}

/** Admin: approve / reject */
export async function reviewTaskSubmission(
  submissionId: string,
  userId: string,
  taskId: string,
  payout: number,
  decision: "approved" | "rejected",
  note: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("dd_task_submissions")
    .update({ status: decision, review_note: note, reviewed_at: new Date().toISOString() })
    .eq("id", submissionId);
  if (error) return { error: error.message };

  // Credit wallet on approval
  if (decision === "approved") {
    await supabase.from("dd_wallet_transactions").insert({
      user_id: userId,
      type: "task",
      title: "Task approved",
      amount: payout,
      direction: "credit",
      status: "completed",
      reference_id: submissionId,
    });
  }
  return { error: null };
}
