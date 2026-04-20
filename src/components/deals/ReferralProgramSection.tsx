import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Check, Share2, Users, TrendingUp, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const ReferralProgramSection = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Mock referral code - in production, fetch from user profile
  const referralCode = user ? `DD${user.id.slice(0, 6).toUpperCase()}` : "DDXXXXXX";
  const referralLink = `https://dopedeal.store/signup?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const message = encodeURIComponent(
      `🚀 Join DopeDeal and start earning! Get ₹50 signup bonus + earn from tasks, coupons & more. Use my code: ${referralCode}\n\n${referralLink}`
    );

    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${message}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${message}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], "_blank");
    }
  };

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/25 rounded-full px-3 py-1 mb-3">
            <span className="text-xs font-mono font-semibold text-brand-green-dim uppercase tracking-wider">
              Earning Engine #3
            </span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-brand-forest mb-3 sm:mb-4">
            Referral Program — Lifetime Passive Income
          </h2>
          <p className="text-sm sm:text-base text-brand-text-dim max-w-2xl mx-auto">
            Share your unique referral link. Earn <span className="font-bold text-brand-green-dim">10% lifetime commission</span> on everything your referrals earn — forever. No limits, no expiry.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Left: Referral Card */}
          <div className="bg-gradient-to-br from-brand-forest to-brand-forest-mid rounded-2xl sm:rounded-3xl p-6 sm:p-7 lg:p-8 text-white">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-green/20 flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-brand-green-light" />
              </div>
              <div>
                <div className="text-xs text-brand-green-light/70 font-mono uppercase tracking-wider">
                  Your Referral Code
                </div>
                <div className="font-display font-black text-xl sm:text-2xl">{referralCode}</div>
              </div>
            </div>

            {/* Referral Link */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="text-xs text-white/60 mb-2">Your Referral Link</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 font-mono text-xs sm:text-sm text-white/90 truncate break-all">
                  {referralLink}
                </div>
                <button
                  onClick={handleCopy}
                  className="shrink-0 p-2 rounded-lg sm:rounded-xl bg-brand-green hover:bg-brand-green-light transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-brand-forest" />
                  ) : (
                    <Copy className="w-4 h-4 text-brand-forest" />
                  )}
                </button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
              <button
                onClick={() => handleShare("whatsapp")}
                className="bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold text-sm py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                onClick={() => handleShare("telegram")}
                className="bg-[#0088cc] hover:bg-[#006699] text-white font-semibold text-sm py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Telegram
              </button>
            </div>

            {/* Stats (for logged-in users) */}
            {user && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                  <div className="font-display font-black text-lg sm:text-xl text-brand-green-light">0</div>
                  <div className="text-xs text-white/60">Referrals</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                  <div className="font-display font-black text-lg sm:text-xl text-brand-green-light">₹0</div>
                  <div className="text-xs text-white/60">Earned</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                  <div className="font-display font-black text-lg sm:text-xl text-brand-green-light">10%</div>
                  <div className="text-xs text-white/60">Commission</div>
                </div>
              </div>
            )}
          </div>

          {/* Right: How It Works */}
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-brand-surface2 border border-brand-border rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-brand-green to-brand-green-dim flex items-center justify-center text-white font-bold text-sm sm:text-base shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-brand-forest mb-1">
                    Share Your Link
                  </h3>
                  <p className="text-xs sm:text-sm text-brand-text-dim">
                    Share your unique referral link with friends, family, or your social media audience via WhatsApp, Telegram, Instagram, or anywhere else.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-brand-surface2 border border-brand-border rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-brand-green to-brand-green-dim flex items-center justify-center text-white font-bold text-sm sm:text-base shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-brand-forest mb-1">
                    They Sign Up & Earn
                  </h3>
                  <p className="text-xs sm:text-sm text-brand-text-dim">
                    When someone signs up using your link, they get a ₹50 welcome bonus. They start earning from PocketMoney tasks, DealSell coupons, and more.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-brand-surface2 border border-brand-border rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-brand-green to-brand-green-dim flex items-center justify-center text-white font-bold text-sm sm:text-base shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-brand-forest mb-1">
                    You Earn 10% Forever
                  </h3>
                  <p className="text-xs sm:text-sm text-brand-text-dim">
                    You automatically earn 10% commission on everything they earn — tasks, coupons, offers, everything. No limits, no expiry, lifetime passive income.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Earning Potential Banner */}
        <div className="bg-gradient-to-br from-brand-green/10 to-brand-teal/10 border-2 border-brand-green/30 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-green to-brand-green-dim flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h3 className="font-display font-black text-lg sm:text-xl text-brand-forest mb-2">
                  Earning Potential Example
                </h3>
                <div className="space-y-1 text-xs sm:text-sm text-brand-text-dim">
                  <p>• 10 referrals earning ₹5,000/month each = <span className="font-bold text-brand-green-dim">₹5,000/month for you</span></p>
                  <p>• 50 referrals earning ₹3,000/month each = <span className="font-bold text-brand-green-dim">₹15,000/month for you</span></p>
                  <p>• 100 referrals earning ₹2,000/month each = <span className="font-bold text-brand-green-dim">₹20,000/month for you</span></p>
                </div>
              </div>
            </div>
            <Link
              to="/dashboard/referral"
              className="w-full md:w-auto shrink-0 bg-gradient-to-r from-brand-green to-brand-green-dim text-white font-bold text-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl hover:shadow-lg hover:shadow-brand-green/30 transition-all flex items-center justify-center gap-2"
            >
              View Full Stats <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
