import { Link } from "react-router-dom";
import { Lock, Share2, Instagram, Clock, Star } from "lucide-react";

const taskTypes = [
  { icon: "📸", platform: "Instagram Story", payout: "₹15–₹25", duration: "24 hrs", badge: "Popular" },
  { icon: "💚", platform: "WhatsApp Status", payout: "₹15–₹20", duration: "24 hrs", badge: "" },
  { icon: "🖼️", platform: "Instagram Feed Post", payout: "₹25–₹50", duration: "7–30 days", badge: "High Payout" },
  { icon: "🎬", platform: "Instagram Reel", payout: "₹20–₹40", duration: "7 days min", badge: "" },
  { icon: "🎥", platform: "Video Testimonial", payout: "₹70–₹400", duration: "Script included", badge: "Best Earning" },
  { icon: "📅", platform: "Long Campaign", payout: "₹50–₹150", duration: "30-day premium", badge: "" },
];

export default function PocketMoney() {
  return (
    <div className="p-6 max-w-4xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <Share2 className="w-5 h-5 text-brand-green" />
          <div className="text-xs font-mono font-semibold text-brand-green-dim uppercase tracking-widest">Earning Engine #1</div>
        </div>
        <h1 className="font-display font-extrabold text-2xl text-brand-forest mb-2">PocketMoney Panel</h1>
        <p className="text-sm text-brand-text-dim">Share brand content on your social media, get verified, earn real money.</p>
      </div>

      {/* Verification gate */}
      <div className="bg-gradient-to-br from-brand-forest to-brand-forest-mid rounded-3xl p-8 text-white text-center mb-7">
        <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-4 text-3xl">
          🔒
        </div>
        <h2 className="font-display font-bold text-xl mb-2">Profile Verification Required</h2>
        <p className="text-white/60 text-sm mb-5 max-w-sm mx-auto">
          Submit your social media handle (min 500 followers) for admin review. Approved within 6–12 hours. Then all tasks unlock.
        </p>
        <Link
          to="/dashboard/profile"
          className="inline-flex items-center gap-2 bg-brand-green text-brand-forest font-bold text-sm px-6 py-3 rounded-2xl hover:bg-brand-green-light transition-colors"
        >
          <Lock className="w-4 h-4" />
          Complete Verification
        </Link>
      </div>

      {/* Preview of task types */}
      <div className="mb-6">
        <div className="text-xs font-mono font-semibold text-brand-text-faint uppercase tracking-widest mb-4">
          Available Task Types (Unlocks After Verification)
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {taskTypes.map((t, i) => (
            <div key={i} className="bg-white border border-brand-border rounded-2xl p-4 flex items-center gap-3 opacity-60">
              <div className="w-11 h-11 rounded-xl bg-brand-surface2 flex items-center justify-center text-2xl shrink-0">{t.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm text-brand-text">{t.platform}</span>
                  {t.badge && (
                    <span className="text-[9px] font-mono bg-brand-green/10 text-brand-green-dim px-1.5 py-0.5 rounded-full font-semibold">{t.badge}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-brand-text-faint">
                  <span className="font-bold text-brand-green-dim">{t.payout}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-brand-surface2 border border-brand-border rounded-2xl p-5">
        <div className="font-semibold text-brand-text mb-3 text-sm">How PocketMoney Works</div>
        <div className="space-y-2">
          {[
            "Pick a brand promotion task from the available list",
            "Download the promo content and post on your social media",
            "Submit your post URL + screenshot as proof",
            "Admin verifies + random spot-checks during monitoring window",
            "Money credited to your wallet after successful verification",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-brand-text-dim">
              <div className="w-5 h-5 rounded-full bg-brand-green/15 border border-brand-green/25 flex items-center justify-center text-brand-green-dim font-bold shrink-0 mt-0.5 text-[10px]">
                {i + 1}
              </div>
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
