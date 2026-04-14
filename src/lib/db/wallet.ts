import { supabase } from "@/integrations/supabase/client";

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: "task" | "coupon" | "referral" | "withdrawal";
  title: string;
  amount: number;
  direction: "credit" | "debit";
  status: "completed" | "pending" | "processing";
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  method: "upi" | "bank";
  upi_id: string | null;
  bank_account_no: string | null;
  bank_ifsc: string | null;
  bank_account_name: string | null;
  status: "pending" | "processing" | "paid" | "rejected";
  created_at: string;
}

export async function getTransactions(userId: string): Promise<WalletTransaction[]> {
  const { data } = await supabase
    .from("dd_wallet_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as WalletTransaction[];
}

export async function getWalletBalance(userId: string) {
  const { data } = await supabase
    .from("dd_wallet_balances" as never)
    .select("*")
    .eq("user_id", userId)
    .single();
  return (data as { available_balance: number; pending_balance: number; referral_balance: number; total_earned: number } | null) ?? {
    available_balance: 0, pending_balance: 0, referral_balance: 0, total_earned: 0,
  };
}

export async function submitWithdrawalRequest(
  userId: string,
  payload: {
    amount: number;
    method: "upi" | "bank";
    upi_id?: string;
    bank_account_no?: string;
    bank_ifsc?: string;
    bank_account_name?: string;
  }
): Promise<{ error: string | null }> {
  // Insert withdrawal request
  const { error: reqErr } = await supabase.from("dd_withdrawal_requests").insert({
    user_id: userId,
    ...payload,
    status: "pending",
  });
  if (reqErr) return { error: reqErr.message };

  // Debit from wallet immediately (processing)
  const { error: txErr } = await supabase.from("dd_wallet_transactions").insert({
    user_id: userId,
    type: "withdrawal",
    title: `Withdrawal via ${payload.method === "upi" ? `UPI (${payload.upi_id})` : "Bank Transfer"}`,
    amount: payload.amount,
    direction: "debit",
    status: "processing",
  });
  return { error: txErr?.message ?? null };
}

export async function getWithdrawalHistory(userId: string): Promise<WithdrawalRequest[]> {
  const { data } = await supabase
    .from("dd_withdrawal_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as WithdrawalRequest[];
}
