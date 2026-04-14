import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Star, Users, TrendingUp, Crown, Zap } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type LeaderboardPeriod = "weekly" | "monthly" | "alltime";

interface LeaderEntry {
  rank: number;
  name: string;
  city: string;
  avatar: string;
  earned: number;
  tasksCompleted: number;
  couponsIssued: number;
  referrals: number;
  badge: "platinum" | "gold" | "silver" | "bronze";
  isCurrentUser?: boolean;
}

// ── Mock leaderboard data ─────────────────────────────────────────────────────
const DATA: Record<LeaderboardPeriod, LeaderEntry[]> = {
  weekly: [
    { rank: 1, name: "Priya Sharma", city: "Mumbai", avatar: "P", earned: 2840, tasksCompleted: 18, couponsIssued: 15, referrals: 4, badge: "platinum" },
    { rank: 2, name: "Arjun Reddy", city: "Hyderabad", avatar: "A", earned: 2150, tasksCompleted: 14, couponsIssued: 10, referrals: 3, badge: "gold" },
    { rank: 3, name: "Meera Nair", city: "Kochi", avatar: "M", earned: 1890, tasksCompleted: 12, couponsIssued: 8, referrals: 2, badge: "gold" },
    { rank: 4, name: "Rahul Verma", city: "Delhi", avatar: "R", earned: 1540, tasksCompleted: 10, couponsIssued: 6, referrals: 2, badge: "silver" },
    { rank: 5, name: "Sneha Patel", city: "Ahmedabad", avatar: "S", earned: 1320, tasksCompleted: 9, couponsIssued: 5, referrals: 1, badge: "silver" },
    { rank: 6, name: "Karan Singh", city: "Jaipur", avatar: "K", earned: 980, tasksCompleted: 7, couponsIssued: 4, referrals: 1, badge: "bronze" },
    { rank: 7, name: "Divya Menon", city: "Chennai", avatar: "D", earned: 820, tasksCompleted: 6, couponsIssued: 3, referrals: 0, badge: "bronze" },
    { rank: 8, name: "You", city: "Your City", avatar: "U", earned: 43, tasksCompleted: 2, couponsIssued: 0, referrals: 0, badge: "bronze", isCurrentUser: true },
  ],
  monthly: [
    { rank: 1, name: "Arjun Reddy", city: "Hyderabad", avatar: "A", earned: 9800, tasksCompleted: 62, couponsIssued: 45, referrals: 12, badge: "platinum" },
    { rank: 2, name: "Priya Sharma", city: "Mumbai", avatar: "P", earned: 8450, tasksCompleted: 54, couponsIssued: 40, referrals: 10, badge: "platinum" },
    { rank: 3, name: "Sneha Patel", city: "Ahmedabad", avatar: "S", earned: 6200, tasksCompleted: 40, couponsIssued: 30, referrals: 6, badge: "gold" },
    { rank: 4, name: "Meera Nair", city: "Kochi", avatar: "M", earned: 5100, tasksCompleted: 34, couponsIssued: 22, referrals: 5, badge: "gold" },
    { rank: 5, name: "Rahul Verma", city: "Delhi", avatar: "R", earned: 4400, tasksCompleted: 28, couponsIssued: 18, referrals: 4, badge: "silver" },
    { rank: 6, name: "Karan Singh", city: "Jaipur", avatar: "K", earned: 3200, tasksCompleted: 22, couponsIssued: 12, referrals: 2, badge: "silver" },
    { rank: 7, name: "Divya Menon", city: "Chennai", avatar: "D", earned: 2800, tasksCompleted: 18, couponsIssued: 10, referrals: 1, badge: "bronze" },
    { rank: 8, name: "You", city: "Your City", avatar: "U", earned: 43, tasksCompleted: 2, couponsIssued: 0, referrals: 0, badge: "bronze", isCurrentUser: true },
  ],
  alltime: [
    { rank: 1, name: "Meera Nair", city: "Kochi", avatar: "M", earned: 42000, tasksCompleted: 280, couponsIssued: 180, referrals: 35, badge: "platinum" },
    { rank: 2, name: "Arjun Reddy", city: "Hyderabad", avatar: "A", earned: 38500, tasksCompleted: 245, couponsIssued: 160, referrals: 28, badge: "platinum" },
    { rank: 3, name: "Priya Sharma", city: "Mumbai", avatar: "P", earned: 31200, tasksCompleted: 200, couponsIssued: 135, referrals: 22, badge: "platinum" },
    { rank: 4, name: "Rahul Verma", city: "Delhi", avatar: "R", earned: 24000, tasksCompleted: 160, couponsIssued: 100, referrals: 18, badge: "gold" },
    { rank: 5, name: "Sneha Patel", city: "Ahmedabad", avatar: "S", earned: 18500, tasksCompleted: 120, couponsIssued: 80, referrals: 12, badge: "gold" },
    { rank: 6, name: "Karan Singh", city: "Jaipur", avatar: "K", earned: 12400, tasksCompleted: 84, couponsIssued: 56, referrals: 8, badge: "silver" },
    { rank: 7, name: "Divya Menon", city: "Chennai", avatar: "D", earned: 9800, tasksCompleted: 66, couponsIssued: 40, referrals: 5, badge: "silver" },
    { rank: 8, name: "You", city: "Your City", avatar: "U", earned: 43, tasksCompleted: 2, couponsIssued: 0, referrals: 0, badge: "bronze", isCurrentUser: true },
  ],
};

// ── Badge config ──────────────────────────────────────────────────────────────
const BADGE_CONFIG = {
  platinum: { label: "Platinum", color: "from-slate-400 to-slate-200", text: "text-slate-600", ring: "ring-slate-300" },
  gold:     { label: "Gold",     color: "from-yellow-400 to-amber-300", text: "text-amber-700",  ring: "ring-amber-300" },
  silver:   { label: "Silver",   color: "from-gray-400 to-gray-300",   text: "text-gray-600",   ring: "ring-gray-300"  },
  bronze:   { label: "Bronze",   color: "from-orange-400 to-orange-300", text: "text-orange-700", ring: "ring-orange-300" },
};

const RANK_COLOR = ["", "text-yellow-500", "text-gray-400", "text-orange-400"];

// ── Podium Top 3 ─────────────────────────────────────────────────────────────
function Podium({ top3 }: { top3: LeaderEntry[] }) {
  const order = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd
  const heights = ["h-20", "h-28", "h-16"];
  const positions = ["2nd", "1st", "3rd"];

  return (
    <div className="flex items-end justify-center gap-3 mb-8">
      {order.map((entry, i) => {
        if (!entry) return null;
        const badge = BADGE_CONFIG[entry.badge];
        const isFirst = positions[i] === "1st";
        return (
          <motion.div
            key={entry.rank}
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            {isFirst && <Crown className="w-5 h-5 text-yellow-400 mb-1" />}
            {/* Avatar */}
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center font-display font-black text-xl text-white ring-2 ${badge.ring} mb-2`}>
              {entry.avatar}
            </div>
            <p className="text-xs font-bold text-gray-900 text-center leading-tight max-w-[72px]">{entry.name.split(" ")[0]}</p>
            <p className="text-[10px] text-gray-400 mb-1">{entry.city}</p>
            <p className={`text-sm font-black ${isFirst ? "text-brand-green" : "text-gray-600"}`}>₹{entry.earned.toLocaleString("en-IN")}</p>
            {/* Podium block */}
            <div className={`w-20 ${heights[i]} mt-2 rounded-t-xl flex items-center justify-center ${
              isFirst ? "bg-gradient-to-b from-yellow-400 to-amber-500" : i === 0 ? "bg-gradient-to-b from-gray-300 to-gray-400" : "bg-gradient-to-b from-orange-300 to-orange-400"
            }`}>
              <span className="text-white font-black text-lg">{positions[i][0]}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Leaderboard() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("weekly");
  const entries = DATA[period];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const currentUser = entries.find((e) => e.isCurrentUser);

  const totalEarned = entries.reduce((s, e) => s + e.earned, 0);

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
          { icon: <Users className="w-4 h-4" />, label: "Active Earners", value: "1,248", color: "text-blue-600" },
          { icon: <TrendingUp className="w-4 h-4" />, label: "Total Paid Out", value: "₹4.8L", color: "text-green-600" },
          { icon: <Zap className="w-4 h-4" />, label: "Tasks Done", value: "18.4K", color: "text-amber-600" },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="bg-white border border-brand-border rounded-2xl p-3 text-center">
            <div className={`flex justify-center mb-1.5 ${color}`}>{icon}</div>
            <p className={`text-base font-black ${color}`}>{value}</p>
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
      <Podium top3={top3} />

      {/* Rank list 4+ */}
      <div className="space-y-2 mb-6">
        {rest.map((entry, i) => {
          const badge = BADGE_CONFIG[entry.badge];
          return (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 bg-white border rounded-2xl px-4 py-3.5 transition-all ${
                entry.isCurrentUser
                  ? "border-brand-green/40 bg-brand-green/5 ring-1 ring-brand-green/30"
                  : "border-brand-border"
              }`}
            >
              {/* Rank */}
              <div className="w-7 text-center">
                <span className="text-sm font-bold text-gray-400">#{entry.rank}</span>
              </div>

              {/* Avatar */}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center font-display font-black text-base text-white flex-shrink-0`}>
                {entry.avatar}
              </div>

              {/* Name + city */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-bold truncate ${entry.isCurrentUser ? "text-brand-green-dim" : "text-gray-900"}`}>
                    {entry.name} {entry.isCurrentUser && <span className="text-[10px] font-mono">(you)</span>}
                  </p>
                </div>
                <p className="text-[10px] text-gray-400">{entry.city}</p>
              </div>

              {/* Stats */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-black text-brand-green">₹{entry.earned.toLocaleString("en-IN")}</p>
                <p className="text-[10px] text-gray-400">{entry.tasksCompleted} tasks</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Your position callout (if not in top 10 visually) */}
      {currentUser && (
        <div className="bg-brand-forest rounded-2xl p-5 text-white text-center">
          <Crown className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="font-bold text-base mb-1">Your Rank: #{currentUser.rank}</p>
          <p className="text-xs text-white/60 mb-3">
            Earn ₹{(entries[entries.indexOf(currentUser) - 1]?.earned ?? 0) - currentUser.earned + 1} more to climb one spot
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Earned", value: `₹${currentUser.earned}` },
              { label: "Tasks", value: currentUser.tasksCompleted },
              { label: "Referrals", value: currentUser.referrals },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl py-2">
                <p className="text-sm font-black">{value}</p>
                <p className="text-[10px] text-white/50">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
