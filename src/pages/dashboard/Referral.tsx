import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Copy, Check, Share2, Gift, Trophy } from "lucide-react";

export default function Referral() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Generate referral code from user metadata or user ID
  const uid = user?.id?.slice(0, 6).toUpperCase() || "XXXXXX";
  const referralCode = `DOPE-${uid}`;
  const referralLink = `${window.location.origin}/join/${referralCode}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join DopeDeal — Earn Real Money!",
        text: `Join DopeDeal and start earning real money from your social media! Use my referral code: ${referralCode}`,
        url: referralLink,
      });
    } else {
      handleCopy(referralLink);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-brand-green" />
          <div className="text-xs font-mono font-semibold text-brand-green-dim uppercase tracking-widest">Viral Growth</div>
        </div>
        <h1 className="font-display font-extrabold text-2xl text-brand-forest mb-2">Referral Dashboard</h1>
        <p className="text-sm text-brand-text-dim">Share your code. Earn 10% of every rupee your friends make — forever.</p>
      </div>

      {/* Referral stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Referred", value: "0", icon: <Users className="w-4 h-4" />, color: "text-blue-500" },
          { label: "Their Earnings", value: "₹0", icon: <Gift className="w-4 h-4" />, color: "text-purple-500" },
          { label: "You've Earned", value: "₹0", icon: <Trophy className="w-4 h-4" />, color: "text-brand-green" },
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
          <span className="font-mono font-black text-2xl text-brand-green-light flex-1 tracking-wider">{referralCode}</span>
          <button
            onClick={() => handleCopy(referralCode)}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            {copied ? <Check className="w-4 h-4 text-brand-green-light" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="text-xs text-white/50 mb-4 font-mono truncate">{referralLink}</div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleCopy(referralLink)}
            className="flex items-center justify-center gap-2 bg-white/10 border border-white/15 rounded-xl py-2.5 text-sm font-semibold hover:bg-white/15 transition-colors"
          >
            <Copy className="w-4 h-4" /> Copy Link
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 bg-brand-green text-brand-forest rounded-xl py-2.5 text-sm font-bold hover:bg-brand-green-light transition-colors"
          >
            <Share2 className="w-4 h-4" /> Share Now
          </button>
        </div>
      </div>

      {/* How referral earnings work */}
      <div className="bg-white border border-brand-border rounded-2xl p-5 mb-4">
        <div className="font-semibold text-brand-text text-sm mb-3">How Referral Earnings Work</div>
        <div className="space-y-2">
          {[
            { icon: "🔗", text: "Your friend joins using your referral code or link" },
            { icon: "✅", text: "They complete tasks and earn money on DopeDeal" },
            { icon: "💰", text: "You automatically earn 10% of everything they earn — forever" },
            { icon: "📊", text: "Tracked per referral — see each person's earnings in your dashboard" },
            { icon: "💸", text: "Referral balance withdrawable same as main balance (min ₹200)" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-brand-text-dim">
              <span className="text-base shrink-0">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Referred users list */}
      <div className="bg-white border border-brand-border rounded-2xl p-5">
        <div className="font-semibold text-brand-text text-sm mb-4">Referred Users</div>
        <div className="text-center py-8">
          <div className="text-3xl mb-3">👥</div>
          <div className="font-semibold text-brand-text-dim text-sm mb-1">No referrals yet</div>
          <p className="text-xs text-brand-text-faint">Share your code on WhatsApp, Instagram, or any social platform to start earning referral income.</p>
        </div>
      </div>

      {/* Leaderboard teaser */}
      <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
        <Trophy className="w-8 h-8 text-amber-500 shrink-0" />
        <div>
          <div className="font-semibold text-amber-800 text-sm">Monthly Referral Leaderboard</div>
          <p className="text-xs text-amber-700/70">Top 10 referrers each month get featured + bonus rewards. Start referring to climb the board!</p>
        </div>
      </div>
    </div>
  );
}
