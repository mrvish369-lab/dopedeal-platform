import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Users, TrendingUp, Zap, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getLeaderboard, LeaderEntry } from "@/lib/db/leaderboard";

type LeaderboardPeriod = "weekly" | "monthly" | "alltime";

const BADGE_CONFIG = {
  platinum: { color: "from-slate-400 to-slate-200", ring: "ring-slate-300" },
  gold:     { color: "from-yellow-400 to-amber-300", ring: "ring-amber-300" },
  silver:   { color: "from-gray-400 to-gray-300",   ring: "ring-gray-300"  },
  bronze:   { color: "from-orange-400 to-orange-300", ring: "ring-orange-300" },
};

function Podium({ top3, loading }: { top3: LeaderEntry[]; loading: boolean }) {
  const order = [top3[1], top3[0], top3[2]];
  const heights = ["h-20", "h-28", "h-16"];
  const positions = ["2nd", "1st", "3rd"];

  if (loading) {
    return (
      <div className="flex items-end justify-center gap-3 mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`flex flex-col items-center ${i === 1 ? "mb-8" : ""}`}>
            <div className="w-14 h-14 rounded-2xl bg-gray-200 animate-pulse mb-2" />
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-1" />
            <div className={`w-20 ${heights[i]} mt-2 bg-gray-200 rounded-t-xl animate-pulse`} />
          </div>
        ))}
      </div>
    );
  }

  if (top3.length === 0) {
    return (
      <div className="text-center py-8 mb-4">
        <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-brand-text-faint">No earners yet this period.</p>
        <p className="text-xs text-brand-text-faint mt-1">Be the first to climb the board!</p>
      </div>
    );
  }

  return (
    <div className="flex items-end justify-center gap-3 mb-8">
      {order.map((entry, i) => {
        if (!entry) return <div key={i} className="w-20" />;
        const badge = BADGE_CONFIG[entry.badge];
        const isFirst = positions[i] === "1st";
        return (
          <motion.div
            key={entry.user_id}
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            {isFirst && <Crown className="w-5 h-5 text-yellow-400 mb-1" />}
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center font-display font-black text-xl text-white ring-2 ${badge.ring} mb-2 ${entry.isCurrentUser ? "ring-brand-green" : ""}`}>
              {entry.avatar}
            </div>
            <p className="text-xs font-bold text-gray-900 text-center leading-tight max-w-[72px]">{entry.name.split(" ")[0]}</p>
            {entry.city && <p className="text-[10px] text-gray-400 mb-1">{entry.city}</p>}
            <p className={`text-sm font-black ${isFirst ? "text-brand-green" : "text-gray-600"}`}>
              ₹{entry.earned.toLocaleString("en-IN")}
            </p>
            <div className={`w-20 ${heights[i]} mt-2 rounded-t-xl flex items-center justify-center ${
              isFirst ? "bg-gradient-to-b from-yellow-400 to-amber-500"
              : i === 0 ? "bg-gradient-to-b from-gray-300 to-gray-400"
              : "bg-gradient-to-b from-orange-300 to-orange-400"
            }`}>
              <span className="text-white font-black text-lg">{positions[i][0]}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<LeaderboardPeriod>("weekly");
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(period, user?.id).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [period, user?.id]);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const currentUser = entries.find((e) => e.isCurrentUser);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-[10px] font-mono font-bold text-brand-green-dim bg-brand-green/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
            Community
          </span>
        </div>
        <h1 className="font-display font-extrabold text-2xl text-brand-forest">Leaderboard</h1>
        <p className="text-sm text-brand-text-dim mt-1">Top earners in the DopeDeal community</p>
      </div>

      {/* Community stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: <Users className="w-4 h-4" />, label: "Active Earners", value: entries.length > 0 ? String(entries.length) : "—", color: "text-blue-600" },
          { icon: <TrendingUp className="w-4 h-4" />, label: "Top Earner", value: entries[0] ? `₹${entries[0].earned.toLocaleString("en-IN")}` : "—", color: "text-green-600" },
          { icon: <Zap className="w-4 h-4" />, label: "Your Rank", value: currentUser ? `#${currentUser.rank}` : "—", color: "text-amber-600" },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="bg-white border border-brand-border rounded-2xl p-3 text-center">
            <div className={`flex justify-center mb-1.5 ${color}`}>{icon}</div>
            <p className={`text-base font-black ${color}`}>{loading ? "—" : value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Period toggle */}
      <div className="flex bg-brand-surface2 border border-brand-border rounded-2xl p-1 mb-6">
        {(["weekly", "monthly", "alltime"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              period === p
                ? "bg-white text-brand-forest shadow-sm border border-brand-border"
                : "text-brand-text-faint hover:text-brand-text-dim"
            }`}
          >
            {p === "weekly" ? "This Week" : p === "monthly" ? "This Month" : "All Time"}
          </button>
        ))}
      </div>

      {/* Podium */}
      <Podium top3={top3} loading={loading} />

      {/* Rank list 4+ */}
      {!loading && rest.length > 0 && (
        <div className="space-y-2 mb-6">
          {rest.map((entry, i) => {
            const badge = BADGE_CONFIG[entry.badge];
            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 bg-white border rounded-2xl px-4 py-3.5 transition-all ${
                  entry.isCurrentUser
                    ? "border-brand-green/40 bg-brand-green/5 ring-1 ring-brand-green/30"
                    : "border-brand-border"
                }`}
              >
                <div className="w-7 text-center">
                  <span className="text-sm font-bold text-gray-400">#{entry.rank}</span>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center font-display font-black text-base text-white flex-shrink-0`}>
                  {entry.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${entry.isCurrentUser ? "text-brand-green-dim" : "text-gray-900"}`}>
                    {entry.name} {entry.isCurrentUser && <span className="text-[10px] font-mono">(you)</span>}
                  </p>
                  {entry.city && <p className="text-[10px] text-gray-400">{entry.city}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-brand-green">₹{entry.earned.toLocaleString("en-IN")}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Skeleton rows while loading */}
      {loading && (
        <div className="space-y-2 mb-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 bg-white border border-brand-border rounded-2xl px-4 py-3.5 animate-pulse">
              <div className="w-7 h-4 bg-gray-200 rounded" />
              <div className="w-10 h-10 bg-gray-200 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-32" />
                <div className="h-2 bg-gray-200 rounded w-16" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      )}

      {/* Current user callout */}
      {!loading && currentUser && (
        <div className="bg-brand-forest rounded-2xl p-5 text-white text-center">
          <Crown className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="font-bold text-base mb-1">Your Rank: #{currentUser.rank}</p>
          {entries[currentUser.rank - 1] && entries[currentUser.rank - 2] && (
            <p className="text-xs text-white/60 mb-3">
              Earn ₹{(entries[currentUser.rank - 2].earned - currentUser.earned + 1).toLocaleString("en-IN")} more to climb one spot
            </p>
          )}
          <div className="bg-white/10 rounded-xl py-3">
            <p className="text-lg font-black">₹{currentUser.earned.toLocaleString("en-IN")}</p>
            <p className="text-[10px] text-white/50">Total Earned This Period</p>
          </div>
        </div>
      )}

      {/* Empty state (not current user) */}
      {!loading && entries.length === 0 && (
        <div className="bg-brand-surface2 border border-brand-border rounded-2xl p-6 text-center">
          <Medal className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-brand-text-dim text-sm">No data for this period yet</p>
          <p className="text-xs text-brand-text-faint mt-1">Complete tasks and sell coupons to appear here!</p>
        </div>
      )}
    </div>
  );
}
