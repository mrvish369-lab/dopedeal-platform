import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Copy, Check, Gift, Users, TrendingUp, Shield, Wallet } from "lucide-react";

// Simulated referrer data — in real app, fetch from DB by code
function useReferrerData(code: string) {
  const [data, setData] = useState<{ name: string; city: string; totalEarned: number } | null>(null);

  useEffect(() => {
    // Simulate API call — replace with real Supabase fetch
    const timer = setTimeout(() => {
      if (code && code.length > 3) {
        setData({ name: "Your Friend", city: "India", totalEarned: 2840 });
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [code]);

  return data;
}

const perks = [
  { icon: <Wallet className="w-5 h-5" />, text: "Earn ₹15–₹400 per task" },
  { icon: <TrendingUp className="w-5 h-5" />, text: "Up to ₹150 per coupon sale" },
  { icon: <Gift className="w-5 h-5" />, text: "Bonus on joining via referral" },
  { icon: <Shield className="w-5 h-5" />, text: "Verified platform, real payouts" },
];

export default function Join() {
  const { referralCode } = useParams<{ referralCode: string }>();
  const navigate = useNavigate();
  const referrer = useReferrerData(referralCode || "");

  const [revealed, setRevealed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleReveal = () => {
    setRevealed(true);
    setTimeout(() => setShowForm(true), 800);
  };

  const handleCopy = () => {
    if (referralCode) navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    navigate(`/auth/register?ref=${referralCode || ""}`);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #003D1F 0%, #005C2E 50%, #004D28 100%)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Background particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-brand-green opacity-10 blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-brand-teal opacity-8 blur-3xl translate-y-1/3 -translate-x-1/4" />
        {/* Floating dots */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-brand-green-light"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              opacity: 0.2 + Math.random() * 0.3,
            }}
            animate={{ y: [0, -12, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2.5 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
      </div>

      {/* India strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808] opacity-70" />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2.5 mb-10"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-green to-brand-green-dim flex items-center justify-center font-display font-black text-brand-forest text-sm shadow-lg shadow-brand-green/30">
            DD
          </div>
          <div>
            <div className="font-display font-black text-xl text-white">DopeDeal</div>
            <div className="text-[9px] font-mono text-brand-green-light/60 uppercase tracking-widest">dopedeal.store</div>
          </div>
        </motion.div>

        {/* Invitation header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-green/20 border-2 border-brand-green/30 flex items-center justify-center font-display font-black text-brand-green-light text-sm">
              {referrer ? referrer.name[0] : "?"}
            </div>
            <div className="text-white/70 text-sm">
              {referrer ? (
                <>
                  <strong className="text-white">{referrer.name}</strong> invited you
                </>
              ) : (
                "You've been invited"
              )}
            </div>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-2 leading-tight">
            Join DopeDeal<br />
            <span className="text-brand-green-light">Earn Real Money</span>
          </h1>
          <p className="text-white/60 text-sm">India's #1 earn-by-task platform for social media creators</p>
        </motion.div>

        {/* Perks */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-2 mb-8"
        >
          {perks.map((p, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/6 border border-white/10 rounded-xl px-3 py-2.5">
              <div className="text-brand-green-light shrink-0">{p.icon}</div>
              <span className="text-xs text-white/70 font-medium">{p.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Referral code reveal card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/8 backdrop-blur-md border border-white/15 rounded-3xl p-6 mb-4"
        >
          <div className="text-xs font-mono text-brand-green-light/60 uppercase tracking-widest mb-3 text-center">Your Referral Code</div>

          {/* Code reveal animation */}
          <div className="relative flex items-center justify-center mb-5">
            <AnimatePresence mode="wait">
              {!revealed ? (
                <motion.div
                  key="hidden"
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-5 py-3 w-full justify-center"
                >
                  <div className="flex gap-1">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="w-2.5 h-4 rounded-sm bg-white/20 animate-pulse" style={{ animationDelay: `${i * 0.07}s` }} />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="revealed"
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex items-center gap-3 bg-brand-green/15 border border-brand-green/40 rounded-2xl px-5 py-3 w-full"
                >
                  <span className="font-mono font-bold text-xl text-brand-green-light flex-1 text-center tracking-widest">
                    {referralCode || "DOPE-XXXX"}
                  </span>
                  <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                    {copied ? <Check className="w-4 h-4 text-brand-green-light" /> : <Copy className="w-4 h-4 text-white/50" />}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!revealed ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReveal}
              className="w-full bg-gradient-to-r from-brand-green to-brand-green-dim text-brand-forest font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-brand-green/30 flex items-center justify-center gap-2"
            >
              🔓 Unlock & Join Free
            </motion.button>
          ) : (
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.35 }}
                >
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleJoin}
                    className="w-full bg-gradient-to-r from-brand-green to-brand-green-dim text-brand-forest font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-brand-green/30 flex items-center justify-center gap-2 mb-3"
                  >
                    Create My Account Free <ArrowRight className="w-4 h-4" />
                  </motion.button>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="text-center text-xs text-white/40"
                  >
                    Already have an account?{" "}
                    <Link to="/auth/login" className="text-brand-green-light hover:underline">
                      Login here
                    </Link>
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="grid grid-cols-3 gap-2 text-center"
        >
          {[
            { value: "₹200+", label: "Min Payout" },
            { value: "3,800+", label: "Active Earners" },
            { value: "24–48hr", label: "Payout Speed" },
          ].map((s, i) => (
            <div key={i} className="bg-white/5 border border-white/8 rounded-xl py-3 px-2">
              <div className="font-display font-black text-brand-green-light text-sm">{s.value}</div>
              <div className="text-[10px] text-white/40 mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-center mt-8 text-xs text-white/25 font-mono"
        >
          🇮🇳 Made in India · Free to join · No investment needed
        </motion.div>
      </div>
    </div>
  );
}
