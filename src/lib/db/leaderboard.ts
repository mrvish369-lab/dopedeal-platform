import { supabase } from "@/integrations/supabase/client";

export interface LeaderEntry {
  rank: number;
  user_id: string;
  name: string;
  city: string;
  avatar: string;
  earned: number;
  badge: "platinum" | "gold" | "silver" | "bronze";
  isCurrentUser?: boolean;
}

function assignBadge(rank: number): LeaderEntry["badge"] {
  if (rank === 1) return "platinum";
  if (rank <= 3) return "gold";
  if (rank <= 5) return "silver";
  return "bronze";
}

export async function getLeaderboard(
  period: "weekly" | "monthly" | "alltime",
  currentUserId?: string
): Promise<LeaderEntry[]> {
  let userEarnings: { user_id: string; earned: number }[] = [];

  if (period === "alltime") {
    // Use user_wallets (the live table)
    const { data } = await supabase
      .from("user_wallets")
      .select("user_id, total_earned")
      .order("total_earned", { ascending: false })
      .limit(10);

    userEarnings = ((data ?? []) as { user_id: string; total_earned: number }[])
      .map((d) => ({ user_id: d.user_id, earned: d.total_earned }));
  } else {
    const now = new Date();
    const since =
      period === "weekly"
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : new Date(now.getFullYear(), now.getMonth(), 1);

    // Use coin_transactions (the live table)
    const { data: txns } = await supabase
      .from("coin_transactions")
      .select("user_id, amount")
      .gte("amount", 0) // credits only
      .gte("created_at", since.toISOString());

    const byUser: Record<string, number> = {};
    for (const t of (txns ?? []) as { user_id: string; amount: number }[]) {
      byUser[t.user_id] = (byUser[t.user_id] ?? 0) + (t.amount ?? 0);
    }

    userEarnings = Object.entries(byUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([user_id, earned]) => ({ user_id, earned }));
  }

  if (!userEarnings.length) return [];

  const userIds = userEarnings.map((u) => u.user_id);
  const { data: profiles } = await supabase
    .from("dd_user_profiles")
    .select("user_id, full_name, city")
    .in("user_id", userIds);

  const profileMap = Object.fromEntries(
    ((profiles ?? []) as { user_id: string; full_name: string | null; city: string | null }[])
      .map((p) => [p.user_id, p])
  );

  return userEarnings.map(({ user_id, earned }, i) => {
    const rank = i + 1;
    const name = profileMap[user_id]?.full_name ?? "DopeDeal User";
    return {
      rank,
      user_id,
      name,
      city: profileMap[user_id]?.city ?? "",
      avatar: name[0]?.toUpperCase() ?? "D",
      earned,
      badge: assignBadge(rank),
      isCurrentUser: user_id === currentUserId,
    };
  });
}
