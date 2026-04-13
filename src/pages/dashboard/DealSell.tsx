import { Link } from "react-router-dom";
import { ShoppingBag, Lock, Copy, TrendingUp } from "lucide-react";

const courses = [
  {
    emoji: "📚",
    name: "Social Media Growth Blueprint",
    price: "₹349",
    earn: "₹150",
    discount: "₹50",
    sellers: 238,
    redeemed: 1204,
    bg: "from-brand-forest to-brand-forest-mid",
  },
  {
    emoji: "🎨",
    name: "Canva Mastery Design Course",
    price: "₹299",
    earn: "₹120",
    discount: "₹50",
    sellers: 156,
    redeemed: 834,
    bg: "from-[#1a1a2e] to-[#16213e]",
  },
  {
    emoji: "📈",
    name: "Digital Marketing Starter Pack",
    price: "₹499",
    earn: "₹200",
    discount: "₹100",
    sellers: 412,
    redeemed: 2103,
    bg: "from-blue-900 to-blue-800",
  },
];

export default function DealSell() {
  return (
    <div className="p-6 max-w-4xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag className="w-5 h-5 text-brand-green" />
          <div className="text-xs font-mono font-semibold text-brand-green-dim uppercase tracking-widest">Earning Engine #2</div>
        </div>
        <h1 className="font-display font-extrabold text-2xl text-brand-forest mb-2">DealSell — Coupon Affiliate Engine</h1>
        <p className="text-sm text-brand-text-dim">Generate exclusive coupon codes for GrowthGurukul courses. Share with friends. Earn up to ₹200 per sale.</p>
      </div>

      {/* How it works summary */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        {[
          { step: "1", icon: "🎟️", text: "Get 5 coupon codes per product" },
          { step: "2", icon: "📲", text: "Share with your WhatsApp / Instagram" },
          { step: "3", icon: "💰", text: "Earn commission when someone buys" },
        ].map((s) => (
          <div key={s.step} className="bg-white border border-brand-border rounded-2xl p-4 text-center">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-xs text-brand-text-dim leading-snug">{s.text}</div>
          </div>
        ))}
      </div>

      {/* Verification gate */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 mb-7">
        <div className="text-amber-500 shrink-0 mt-0.5"><Lock className="w-4 h-4" /></div>
        <div>
          <div className="font-semibold text-amber-800 text-sm mb-0.5">Unlock DealSell after profile verification</div>
          <p className="text-xs text-amber-700/70">Complete your social media profile verification first. Once approved, you can generate coupon codes for any product below.</p>
        </div>
      </div>

      {/* Product cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-7">
        {courses.map((c, i) => (
          <div key={i} className="bg-white border-2 border-brand-border rounded-3xl overflow-hidden opacity-75 hover:opacity-90 transition-opacity">
            <div className={`bg-gradient-to-br ${c.bg} px-5 pt-5 pb-6 text-center`}>
              <div className="text-3xl mb-2">{c.emoji}</div>
              <div className="font-display font-black text-sm text-white leading-snug">{c.name}</div>
              <div className="text-[10px] text-brand-green-light/60 font-mono mt-1">GrowthGurukul.store</div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[10px] text-brand-text-faint">PRICE</div>
                  <div className="font-display font-black text-lg text-brand-text">{c.price}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-brand-text-faint">YOU EARN</div>
                  <div className="font-display font-black text-xl text-brand-green-dim">{c.earn}</div>
                </div>
              </div>
              <div className="bg-brand-green/6 border border-brand-green/15 rounded-xl p-2 text-[10px] text-brand-green-dim mb-3">
                🎟️ Give buyers {c.discount} discount
              </div>
              <button
                disabled
                className="w-full bg-brand-border text-brand-text-faint font-bold text-xs py-2.5 rounded-xl cursor-not-allowed flex items-center justify-center gap-1"
              >
                <Lock className="w-3 h-3" /> Locked — Verify First
              </button>
              <div className="flex justify-between text-[10px] text-brand-text-faint mt-2">
                <span>✅ {c.sellers} sellers</span>
                <span>🎟️ {c.redeemed.toLocaleString()} redeemed</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tier progression preview */}
      <div className="bg-white border border-brand-border rounded-2xl p-5">
        <div className="font-semibold text-brand-text text-sm mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-green" /> Seller Tier Progression
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { tier: "🥉 Bronze", sales: "0–4 sales", bonus: "Base commission", active: true },
            { tier: "🥈 Silver", sales: "5+ sales", bonus: "+10% bonus", active: false },
            { tier: "🥇 Gold", sales: "10+ sales", bonus: "+20% bonus", active: false },
            { tier: "💎 Platinum", sales: "25+ sales", bonus: "Custom deal", active: false },
          ].map((t, i) => (
            <div key={i} className={`rounded-xl p-3 text-center border ${t.active ? "border-brand-green/30 bg-brand-green/6" : "border-brand-border bg-brand-surface2"}`}>
              <div className="text-lg mb-1">{t.tier.split(" ")[0]}</div>
              <div className="text-[10px] font-bold text-brand-text">{t.tier.split(" ").slice(1).join(" ")}</div>
              <div className="text-[10px] text-brand-text-faint mt-0.5">{t.sales}</div>
              <div className={`text-[10px] font-semibold mt-1 ${t.active ? "text-brand-green-dim" : "text-brand-text-faint"}`}>{t.bonus}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
