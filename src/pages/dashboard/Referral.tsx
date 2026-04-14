import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Copy, Check, Share2, Gift, Trophy } from "lucide-react";
import { getReferralStats } from "@/lib/db/referrals";

export default function Referral() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ total_referred: 0, total_commission: 0, referral_code: null as string | null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getReferralStats(user.id).then((s) => { setStats(s); setLoading(false); });
  }, [user]);

  const referralCode = stats.referral_code ?? "DOPE-......";
  const referralLink = `${window.location.origin}/join/${referralCode}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: "Join DopeDeal — Earn Real Money!", text: `Join DopeDeal and start earning! Use my referral code: ${referralCode}`, url: referralLink });
    } else {
      handleCopy(referralLink);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-4 h-4 text-brand-green" />
          <span className="text-xs font-mono font-semibold text-brand-green-dim uppercase tracking-widest">Viral Growth</span>
        </div>
        <h1 className="font-display font-extrabold text-2xl text-brand-forest">Referral Dashboard</h1>
        <p className="text-sm text-brand-text-dim mt-1">Share your code. Earn 10% of every rupee your friends make — forever.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Referred", value: loading ? "—" : String(stats.total_referred), icon: <Users className="w-4 h-4" />, color: "text-blue-500" },
          { label: "Referral Earned", value: loading ? "—" : `₹${stats.total_commission}`, icon: <Gift className="w-4 h-4" />, color: "text-purple-500" },
          { label: "Lifetime", value: loading ? "—" : `₹${stats.total_commission}`, icon: <Trophy className="w-4 h-4" />, color: "text-brand-green" },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-brand-border rounded-2xl p-4 text-center">
            <div className={`${s.color} flex justify-center mb-2`}>{s.icon}</div>
            <div className="font-display font-black text-xl text-brand-forest">{s.value}</div>
            <div className="text-[10px] text-brand-text-faint mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Referral code card */}
      <div className="bg-gradient-to-br from-brand-forest to-brand-forest-mid rounded-3xl p-6 text-white mb-6">
        <div className="text-xs font-mono text-brand-green-light/60 uppercase tracking-widest mb-3">Your Unique Referral Code</div>
        <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl px-4 py-3 mb-4">
          <span className="font-mono font-black text-xl text-brand-green-light flex-1 tracking-wider">{referralCode}</span>
          <button onClick={() => handleCopy(referralCode)} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/60 hover:text-white">
            {copied ? <Check className="w-4 h-4 text-brand-green-light" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className="text-xs text-white/40 mb-4 font-mono truncate">{referralLink}</div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => handleCopy(referralLink)} className="flex items-center justify-center gap-2 bg-white/10 border border-white/15 rounded-xl py-2.5 text-sm font-semibold hover:bg-white/15 transition-colors">
            <Copy className="w-4 h-4" /> Copy Link
          </button>
          <button onClick={handleShare} className="flex items-center justify-center gap-2 bg-brand-green text-brand-forest rounded-xl py-2.5 text-sm font-bold hover:bg-brand-green-light transition-colors">
            <Share2 className="w-4 h-4" /> Share Now
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white border border-brand-border rounded-2xl p-5 mb-4">
        <p className="font-semibold text-brand-text text-sm mb-3">How Referral Earnings Work</p>
        <div className="space-y-2">
          {[
            { icon: "🔗", text: "Your friend joins using your referral code or link" },
            { icon: "✅", text: "They complete tasks and earn money on DopeDeal" },
            { icon: "💰", text: "You automatically earn 10% of everything they earn — forever" },
            { icon: "📊", text: "Tracked per referral — see each person's earnings in real time" },
            { icon: "💸", text: "Referral balance withdrawable same as main balance (min ₹200)" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-brand-text-dim">
              <span className="text-base shrink-0">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard teaser */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
        <Trophy className="w-8 h-8 text-amber-500 shrink-0" />
        <div>
          <p className="font-semibold text-amber-800 text-sm">Monthly Referral Leaderboard</p>
          <p className="text-xs text-amber-700/70">Top 10 referrers each month get featured + bonus rewards. Start referring to climb the board!</p>
        </div>
      </div>
    </div>
  );
}
