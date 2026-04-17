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

/**
 * Mask a bank account number for safe storage and display.
 * Keeps only the last 4 digits: e.g. "123456789012" → "****9012"
 */
function maskAccountNumber(accountNo: string): string {
  const digits = accountNo.replace(/\s/g, "");
  if (digits.length <= 4) return "****";
  return `****${digits.slice(-4)}`;
}

/**
 * Mask an IFSC code for safe storage and display.
 * Keeps only the first 4 chars (bank identifier): e.g. "HDFC0001234" → "HDFC*******"
 */
function maskIfsc(ifsc: string): string {
  if (ifsc.length <= 4) return "****";
  return `${ifsc.slice(0, 4)}${"*".repeat(ifsc.length - 4)}`;
}

export async function getTransactions(userId: string): Promise<WalletTransaction[]> {
  // Read from coin_transactions (dd_wallet_transactions is a view over this)
  const { data } = await supabase
    .from("coin_transactions")
    .select("id, user_id, transaction_type, description, amount, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return ((data ?? []) as {
    id: string;
    user_id: string;
    transaction_type: string;
    description: string | null;
    amount: number;
    created_at: string;
  }[]).map((t) => ({
    id: t.id,
    user_id: t.user_id,
    type: (t.transaction_type as WalletTransaction["type"]) ?? "task",
    title: t.description ?? t.transaction_type,
    amount: Math.abs(t.amount),
    direction: t.amount >= 0 ? "credit" : "debit",
    status: "completed" as const,
    created_at: t.created_at,
  }));
}

export async function getWalletBalance(userId: string) {
  const { data } = await supabase
    .from("user_wallets")
    .select("coins_balance, total_earned, total_spent")
    .eq("user_id", userId)
    .single();

  if (!data) return { available_balance: 0, pending_balance: 0, referral_balance: 0, total_earned: 0 };

  const d = data as { coins_balance: number; total_earned: number; total_spent: number };
  return {
    available_balance: d.coins_balance ?? 0,
    pending_balance: 0,
    referral_balance: 0,
    total_earned: d.total_earned ?? 0,
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
  // Mask sensitive financial identifiers before persisting
  const safePayload = {
    ...payload,
    bank_account_no: payload.bank_account_no
      ? maskAccountNumber(payload.bank_account_no)
      : undefined,
    bank_ifsc: payload.bank_ifsc
      ? maskIfsc(payload.bank_ifsc)
      : undefined,
  };

  // Insert withdrawal request with masked data
  const { error: reqErr } = await supabase.from("dd_withdrawal_requests").insert({
    user_id: userId,
    ...safePayload,
    status: "pending",
  });
  if (reqErr) return { error: reqErr.message };

  // Debit from wallet immediately (processing) — write to coin_transactions
  const { error: txErr } = await supabase.from("coin_transactions").insert({
    user_id: userId,
    transaction_type: "withdrawal",
    description: `Withdrawal via ${
      payload.method === "upi" ? `UPI (${payload.upi_id})` : "Bank Transfer"
    }`,
    amount: -Math.abs(payload.amount), // negative = debit
    reference_id: null,
  });
  return { error: txErr?.message ?? null };
}

export async function getWithdrawalHistory(userId: string): Promise<WithdrawalRequest[]> {
  const { data } = await supabase
    .from("dd_withdrawal_requests")
    .select(
      "id, user_id, amount, method, upi_id, bank_account_no, bank_ifsc, bank_account_name, status, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // bank_account_no and bank_ifsc are already masked at write time,
  // but apply a defensive mask on read as well for any legacy plaintext rows.
  return ((data ?? []) as WithdrawalRequest[]).map((row) => ({
    ...row,
    bank_account_no: row.bank_account_no
      ? row.bank_account_no.startsWith("****")
        ? row.bank_account_no
        : maskAccountNumber(row.bank_account_no)
      : null,
    bank_ifsc: row.bank_ifsc
      ? row.bank_ifsc.includes("*")
        ? row.bank_ifsc
        : maskIfsc(row.bank_ifsc)
      : null,
  }));
}
