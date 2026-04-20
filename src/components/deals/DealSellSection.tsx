import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Check, ArrowRight } from "lucide-react";

interface Course {
  id: string;
  name: string;
  emoji: string;
  price: string;
  commission: string;
  discount: string;
  sellers: number;
  redeemed: number;
  sampleCoupon: string;
  bg: string;
}

const courses: Course[] = [
  {
    id: "social-media-growth",
    name: "Social Media Growth Blueprint",
    emoji: "📚",
    price: "₹349",
    commission: "₹150",
    discount: "₹50",
    sellers: 238,
    redeemed: 1204,
    sampleCoupon: "DD-A3F9-50",
    bg: "from-brand-forest to-brand-forest-mid",
  },
  {
    id: "canva-mastery",
    name: "Canva Mastery Design Course",
    emoji: "🎨",
    price: "₹299",
    commission: "₹120",
    discount: "₹50",
    sellers: 156,
    redeemed: 834,
    sampleCoupon: "DD-B7K2-50",
    bg: "from-[#1a1a2e] to-[#16213e]",
  },
];

export const DealSellSection = () => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (idx: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/25 rounded-full px-3 py-1 mb-3">
            <span className="text-xs font-mono font-semibold text-brand-green-dim uppercase tracking-wider">
              Earning Engine #2
            </span>
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-brand-forest mb-4">
            DealSell — Coupon Affiliate Engine
          </h2>
          <p className="text-brand-text-dim max-w-lg mx-auto">
            Generate exclusive coupon codes for GrowthGurukul digital courses. Share with your network. Earn up to ₹150 per sale — no website needed.
          </p>
        </div>

        {/* Course Cards */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          {courses.map((course, idx) => (
            <div
              key={course.id}
              className="bg-white border-2 border-brand-border rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-brand-green/12 hover:-translate-y-1 transition-all"
            >
              {/* Course Header */}
              <div className={`bg-gradient-to-br ${course.bg} px-6 pt-6 pb-8 text-center`}>
                <div className="text-4xl mb-3">{course.emoji}</div>
                <div className="font-display font-black text-base text-white leading-snug">
                  {course.name}
                </div>
                <div className="text-xs text-brand-green-light/70 font-mono mt-1">
                  GrowthGurukul.store
                </div>
              </div>

              {/* Course Details */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs text-brand-text-faint">COURSE PRICE</div>
                    <div className="font-display font-black text-xl text-brand-text">
                      {course.price}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-brand-text-faint">YOU EARN</div>
                    <div className="font-display font-black text-2xl text-brand-green-dim">
                      {course.commission}
                    </div>
                  </div>
                </div>

                <div className="bg-brand-green/6 border border-brand-green/20 rounded-xl p-2.5 text-xs text-brand-green-dim mb-4">
                  🎟️ Give buyers {course.discount} discount coupon
                </div>

                {/* Sample Coupon */}
                <div className="flex items-center gap-2 bg-brand-surface2 border border-brand-border rounded-xl px-3 py-2 mb-4">
                  <span className="font-mono font-bold text-sm text-brand-green-dim flex-1">
                    {course.sampleCoupon}
                  </span>
                  <button
                    onClick={() => handleCopy(idx, course.sampleCoupon)}
                    className="p-1 rounded-lg hover:bg-brand-border transition-colors"
                  >
                    {copiedIdx === idx ? (
                      <Check className="w-3.5 h-3.5 text-brand-green" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-brand-text-faint" />
                    )}
                  </button>
                </div>

                <Link
                  to="/dashboard/deal-sell"
                  className="w-full bg-gradient-to-r from-brand-green to-brand-green-dim text-white font-bold text-sm py-3 rounded-xl hover:shadow-lg hover:shadow-brand-green/30 transition-all mb-3 flex items-center justify-center"
                >
                  🚀 Get Coupons + Promo Kit
                </Link>

                <div className="flex justify-between text-xs text-brand-text-faint">
                  <span>✅ {course.sellers} active sellers</span>
                  <span>🎟️ {course.redeemed.toLocaleString()} redeemed</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Promo Kit Callout */}
        <div className="bg-gradient-to-br from-brand-surface2 to-brand-surface3 border border-brand-border rounded-3xl p-7">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-2xl shrink-0">
              🎨
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-brand-forest mb-1">
                Promo Kit Included — Free
              </h3>
              <p className="text-sm text-brand-text-dim mb-3">
                Every coupon pack comes with a complete selling system: 5 download-ready banners, caption packs, WhatsApp chat scripts, FAQ slides + 12 daily story/status creatives.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "4–5 Promo Banners",
                  "Caption + Hashtag Packs",
                  "WhatsApp Scripts",
                  "FAQ Story Slides",
                  "12 Daily Creatives",
                ].map((item) => (
                  <span
                    key={item}
                    className="text-xs bg-white border border-brand-border text-brand-text-dim font-medium px-3 py-1 rounded-full"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
