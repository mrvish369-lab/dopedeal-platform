import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Instagram, Share2, Star, Shield, TrendingUp, Users, Wallet,
  ChevronDown, ArrowRight, Copy, Check, Zap, Gift, Lock,
  Smartphone, BadgeCheck, BarChart3, MessageCircle
} from "lucide-react";

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

// ─── Section fade-in wrapper ──────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── FAQ data ─────────────────────────────────────────────────────────────────
const faqs = [
  { q: "Is DopeDeal free to join?", a: "Yes, 100% free. No registration fee, no hidden charges. You earn — we take a small platform cut only when you earn." },
  { q: "How do I get paid?", a: "Manually via UPI or bank transfer. Once your balance crosses ₹200, you can request a withdrawal and we process it within 24–48 hours." },
  { q: "Do I need a big following to join?", a: "Minimum 500 followers on at least one public social media account. Quality matters more than size — real engagement wins." },
  { q: "What is DealSell?", a: "DealSell lets you sell GrowthGurukul digital courses using exclusive coupon codes. You share coupons, customers buy, you earn commission — up to ₹150 per sale." },
  { q: "How does PocketMoney work?", a: "Accept a brand promotion task, post the content on your Instagram/WhatsApp/Facebook, submit your post URL + screenshot. Once verified, money is credited to your wallet." },
  { q: "Is my account safe?", a: "Yes. We use OTP-based mobile verification, device fingerprinting, and strict anti-fraud checks to keep the platform genuine." },
  { q: "When will Marketplace Reviews launch?", a: "Marketplace Reviews (Amazon, Flipkart, Google Maps) is in the pipeline pending legal advisory clearance. Join our notify list to be first in line." },
  { q: "Can I refer friends and earn?", a: "Absolutely. You earn 10% of your referred user's lifetime earnings, automatically credited to your Referral Balance wallet." },
];

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-brand-border" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-green to-brand-green-dim flex items-center justify-center font-display font-black text-sm text-brand-forest shadow-lg shadow-brand-green/30">
            DD
          </div>
          <div>
            <div className="font-display font-black text-lg text-brand-forest leading-none">DopeDeal</div>
            <div className="text-[9px] font-mono text-brand-text-faint uppercase tracking-wider">dopedeal.store</div>
          </div>
        </Link>

        {/* Nav Links — desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#how-it-works" className="text-sm font-medium text-brand-text-dim hover:text-brand-green-dim transition-colors">How it Works</a>
          <a href="#pocketmoney" className="text-sm font-medium text-brand-text-dim hover:text-brand-green-dim transition-colors">PocketMoney</a>
          <a href="#dealsell" className="text-sm font-medium text-brand-text-dim hover:text-brand-green-dim transition-colors">DealSell</a>
          <a href="#faq" className="text-sm font-medium text-brand-text-dim hover:text-brand-green-dim transition-colors">FAQ</a>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/auth/login")}
            className="hidden sm:block text-sm font-semibold text-brand-green-dim hover:text-brand-green transition-colors px-3 py-1.5"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/auth/register")}
            className="bg-gradient-to-r from-brand-green to-brand-green-dim text-white text-sm font-bold px-5 py-2 rounded-xl shadow-md shadow-brand-green/25 hover:shadow-lg hover:shadow-brand-green/35 transition-all hover:-translate-y-0.5"
          >
            Start Earning Free
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<"instagram" | "whatsapp" | "facebook" | "youtube">("instagram");
  const [followers, setFollowers] = useState(1000);

  const payoutMap = {
    instagram: { story: 25, post: 50, reel: 40 },
    whatsapp: { story: 20, post: 0, reel: 0 },
    facebook: { story: 15, post: 35, reel: 0 },
    youtube: { story: 0, post: 0, reel: 40 },
  };

  const monthlyEstimate = () => {
    const p = payoutMap[platform];
    const tasks = Math.min(Math.floor(followers / 200), 12);
    const base = (p.story * tasks) + (p.post * Math.floor(tasks / 3)) + (p.reel * Math.floor(tasks / 4));
    const couponBonus = 150 * 3; // 3 coupon sales/month
    return base + couponBonus;
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-16 overflow-hidden bg-brand-bg">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-brand-green opacity-[0.06] blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-brand-teal opacity-[0.05] blur-3xl translate-y-1/2 -translate-x-1/4" />
      </div>

      {/* India strip */}
      <div className="absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FF9933] via-white to-[#138808] opacity-60" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left — copy */}
        <div>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/25 rounded-full px-4 py-1.5 mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
            <span className="text-xs font-mono font-semibold text-brand-green-dim tracking-wider uppercase">India's #1 Earn-by-Task Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-brand-forest leading-[1.08] tracking-tight mb-5"
          >
            Earn Real Money<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-brand-teal">
              From Your Social
            </span>
            <br />Media
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-brand-text-dim text-lg leading-relaxed mb-8 max-w-md"
          >
            Share brand content on Instagram, WhatsApp & Facebook. Sell courses with exclusive coupon codes. Get paid real money — every week.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 mb-6"
          >
            <button
              onClick={() => navigate("/auth/register")}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-forest to-brand-forest-mid text-white font-bold text-base px-7 py-3.5 rounded-2xl shadow-lg shadow-brand-forest/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Start Earning Free <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#how-it-works"
              className="flex items-center justify-center gap-2 border-2 border-brand-border text-brand-text-dim font-semibold text-base px-7 py-3.5 rounded-2xl hover:border-brand-green hover:text-brand-green-dim transition-all"
            >
              See How it Works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-4 text-sm text-brand-text-faint"
          >
            <span className="flex items-center gap-1.5"><BadgeCheck className="w-4 h-4 text-brand-green" /> Free to join</span>
            <span className="flex items-center gap-1.5"><BadgeCheck className="w-4 h-4 text-brand-green" /> No investment</span>
            <span className="flex items-center gap-1.5"><BadgeCheck className="w-4 h-4 text-brand-green" /> Weekly payouts</span>
          </motion.div>
        </div>

        {/* Right — earn estimator */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="bg-white rounded-3xl border border-brand-border shadow-2xl shadow-brand-forest/8 p-6"
        >
          <div className="text-xs font-mono font-semibold text-brand-text-faint uppercase tracking-widest mb-4">Monthly Earnings Estimator</div>

          <div className="mb-5">
            <label className="text-sm font-semibold text-brand-text-dim block mb-2">Your Primary Platform</label>
            <div className="grid grid-cols-4 gap-2">
              {(["instagram", "whatsapp", "facebook", "youtube"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold border-2 transition-all capitalize ${
                    platform === p
                      ? "border-brand-green bg-brand-green/10 text-brand-green-dim"
                      : "border-brand-border text-brand-text-faint hover:border-brand-green/40"
                  }`}
                >
                  {p === "instagram" ? "IG" : p === "whatsapp" ? "WA" : p === "facebook" ? "FB" : "YT"}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm font-semibold text-brand-text-dim block mb-2">
              Followers / Connections: <span className="text-brand-green-dim">{followers.toLocaleString()}</span>
            </label>
            <input
              type="range"
              min={500}
              max={50000}
              step={500}
              value={followers}
              onChange={(e) => setFollowers(Number(e.target.value))}
              className="w-full accent-[#00C853]"
            />
            <div className="flex justify-between text-xs text-brand-text-faint mt-1">
              <span>500</span><span>50K+</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-forest to-brand-forest-mid rounded-2xl p-5 text-white mb-4">
            <div className="text-xs text-brand-green-light/70 font-mono uppercase tracking-widest mb-1">Estimated Monthly Earnings</div>
            <div className="font-display font-black text-4xl text-brand-green-light">
              ₹{monthlyEstimate().toLocaleString()}+
            </div>
            <div className="text-xs text-white/50 mt-1.5">Tasks + DealSell commissions combined</div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-brand-surface2 rounded-xl p-3">
              <div className="text-brand-text-faint mb-0.5">PocketMoney Tasks</div>
              <div className="font-bold text-brand-text">₹15–₹400 / task</div>
            </div>
            <div className="bg-brand-surface2 rounded-xl p-3">
              <div className="text-brand-text-faint mb-0.5">DealSell Commission</div>
              <div className="font-bold text-brand-text">Up to ₹150 / sale</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-brand-text-faint flex flex-col items-center gap-1"
      >
        <ChevronDown className="w-5 h-5" />
      </motion.div>
    </section>
  );
}

// ─── SOCIAL PROOF STRIP ───────────────────────────────────────────────────────
function SocialProofStrip() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const tasks = useCounter(18420, 2200, inView);
  const users = useCounter(3870, 2200, inView);
  const paid = useCounter(842000, 2200, inView);

  return (
    <div ref={ref} className="bg-gradient-to-r from-brand-forest to-brand-forest-mid py-5">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-3 gap-4 text-center text-white">
        <div>
          <div className="font-display font-black text-2xl sm:text-3xl text-brand-green-light">{tasks.toLocaleString()}</div>
          <div className="text-xs text-white/55 mt-0.5">Tasks Completed</div>
        </div>
        <div>
          <div className="font-display font-black text-2xl sm:text-3xl text-brand-green-light">{users.toLocaleString()}</div>
          <div className="text-xs text-white/55 mt-0.5">Verified Earners</div>
        </div>
        <div>
          <div className="font-display font-black text-2xl sm:text-3xl text-brand-green-light">₹{(paid / 1000).toFixed(0)}K+</div>
          <div className="text-xs text-white/55 mt-0.5">Paid Out Total</div>
        </div>
      </div>
    </div>
  );
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: <Smartphone className="w-6 h-6" />,
      title: "Register Free",
      desc: "Sign up with your mobile number. Verify your social media handle (min 500 followers). Admin approves your profile within 6–12 hours.",
      color: "from-brand-green to-brand-teal",
    },
    {
      num: "02",
      icon: <Share2 className="w-6 h-6" />,
      title: "Pick a Task or Coupon",
      desc: "Browse brand promotion tasks in PocketMoney or grab exclusive coupon codes in DealSell to share with your network.",
      color: "from-brand-teal to-[#0097A7]",
    },
    {
      num: "03",
      icon: <Wallet className="w-6 h-6" />,
      title: "Get Paid",
      desc: "Submit proof, pass verification, and get money credited to your wallet. Withdraw via UPI or bank once you hit ₹200.",
      color: "from-brand-green-dim to-brand-green",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-14">
          <div className="text-xs font-mono font-semibold text-brand-green-dim uppercase tracking-widest mb-3">Simple Process</div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-brand-forest mb-4">How DopeDeal Works</h2>
          <p className="text-brand-text-dim max-w-md mx-auto">Three simple steps. No investment. No confusion. Just real money.</p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <FadeIn key={i} delay={i * 0.12}>
              <div className="relative bg-brand-bg border border-brand-border rounded-3xl p-7 h-full hover:shadow-lg hover:shadow-brand-green/10 hover:-translate-y-1 transition-all">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg mb-5`}>
                  {s.icon}
                </div>
                <div className="font-mono text-xs text-brand-text-faint mb-2">{s.num}</div>
                <h3 className="font-display font-bold text-xl text-brand-forest mb-3">{s.title}</h3>
                <p className="text-sm text-brand-text-dim leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-14 -right-3 w-6 h-6 rounded-full bg-brand-green flex items-center justify-center z-10">
                    <ArrowRight className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── POCKET MONEY PANEL ───────────────────────────────────────────────────────
function PocketMoneySection() {
  const tasks = [
    { platform: "Instagram Story", icon: "📸", payout: "₹15–₹25", duration: "24 hrs live", color: "from-pink-500 to-purple-600" },
    { platform: "WhatsApp Status", icon: "💚", payout: "₹15–₹20", duration: "24 hrs live", color: "from-green-500 to-teal-500" },
    { platform: "Instagram Feed Post", icon: "🖼️", payout: "₹25–₹50", duration: "7–30 days up", color: "from-purple-500 to-pink-500" },
    { platform: "Instagram Reel", icon: "🎬", payout: "₹20–₹40", duration: "7 days min", color: "from-orange-500 to-red-500" },
    { platform: "Video Testimonial", icon: "🎥", payout: "₹70–₹400", duration: "Script + delivery", color: "from-brand-green-dim to-brand-teal" },
    { platform: "Long Campaign", icon: "📅", payout: "₹50–₹150", duration: "30-day premium", color: "from-blue-500 to-indigo-600" },
  ];

  return (
    <section id="pocketmoney" className="py-24 bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <FadeIn className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="text-xs font-mono font-semibold text-brand-green-dim uppercase tracking-widest mb-3">Earning Engine #1</div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-brand-forest mb-3">
              PocketMoney Panel
            </h2>
            <p className="text-brand-text-dim max-w-lg">
              Accept brand promotion tasks, post on your social media, get verified, get paid. Real brands, real money, real simple.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/25 rounded-2xl px-4 py-2 shrink-0">
            <Zap className="w-4 h-4 text-brand-green" />
            <span className="text-sm font-bold text-brand-green-dim">Instant Task Access</span>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((t, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div className="bg-white rounded-2xl border border-brand-border p-5 flex items-start gap-4 hover:shadow-md hover:shadow-brand-green/10 hover:-translate-y-0.5 transition-all">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-xl shrink-0`}>
                  {t.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-brand-text text-sm truncate">{t.platform}</div>
                  <div className="font-display font-black text-brand-green-dim text-lg">{t.payout}</div>
                  <div className="text-xs text-brand-text-faint">{t.duration}</div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.4} className="mt-8 bg-gradient-to-br from-brand-forest to-brand-forest-mid rounded-3xl p-7 text-white flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <div className="font-display font-black text-xl mb-1">Ready to start earning?</div>
            <div className="text-white/60 text-sm">Get verified, pick tasks, earn every week.</div>
          </div>
          <button
            onClick={() => window.location.href = "/auth/register"}
            className="shrink-0 bg-brand-green text-brand-forest font-bold text-sm px-6 py-3 rounded-2xl hover:bg-brand-green-light transition-colors flex items-center gap-2"
          >
            Join PocketMoney <ArrowRight className="w-4 h-4" />
          </button>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── DEALSELL SECTION ─────────────────────────────────────────────────────────
function DealSellSection() {
  const navigate = useNavigate();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (idx: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const courses = [
    {
      emoji: "📚",
      name: "Social Media Growth Blueprint",
      price: "₹349",
      earn: "₹150",
      discount: "₹50",
      sellers: 238,
      redeemed: 1204,
      sample: "DD-A3F9-50",
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
      sample: "DD-B7K2-50",
      bg: "from-[#1a1a2e] to-[#16213e]",
    },
  ];

  return (
    <section id="dealsell" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-12">
          <div className="text-xs font-mono font-semibold text-brand-green-dim uppercase tracking-widest mb-3">Earning Engine #2</div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-brand-forest mb-4">
            DealSell — Coupon Affiliate Engine
          </h2>
          <p className="text-brand-text-dim max-w-lg mx-auto">
            Generate exclusive coupon codes for GrowthGurukul digital courses. Share with your network. Earn up to ₹150 per sale — no website needed.
          </p>
        </FadeIn>

        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          {courses.map((c, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="bg-white border-2 border-brand-border rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-brand-green/12 hover:-translate-y-1 transition-all">
                <div className={`bg-gradient-to-br ${c.bg} px-6 pt-6 pb-8 text-center`}>
                  <div className="text-4xl mb-3">{c.emoji}</div>
                  <div className="font-display font-black text-base text-white leading-snug">{c.name}</div>
                  <div className="text-xs text-brand-green-light/70 font-mono mt-1">GrowthGurukul.store</div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-xs text-brand-text-faint">COURSE PRICE</div>
                      <div className="font-display font-black text-xl text-brand-text">{c.price}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-brand-text-faint">YOU EARN</div>
                      <div className="font-display font-black text-2xl text-brand-green-dim">{c.earn}</div>
                    </div>
                  </div>

                  <div className="bg-brand-green/6 border border-brand-green/20 rounded-xl p-2.5 text-xs text-brand-green-dim mb-4">
                    🎟️ Give buyers {c.discount} discount coupon
                  </div>

                  {/* Sample coupon chip */}
                  <div className="flex items-center gap-2 bg-brand-surface2 border border-brand-border rounded-xl px-3 py-2 mb-4">
                    <span className="font-mono font-bold text-sm text-brand-green-dim flex-1">{c.sample}</span>
                    <button onClick={() => handleCopy(i, c.sample)} className="p-1 rounded-lg hover:bg-brand-border transition-colors">
                      {copiedIdx === i ? <Check className="w-3.5 h-3.5 text-brand-green" /> : <Copy className="w-3.5 h-3.5 text-brand-text-faint" />}
                    </button>
                  </div>

                  <button
                    onClick={() => navigate("/auth/register")}
                    className="w-full bg-gradient-to-r from-brand-green to-brand-green-dim text-white font-bold text-sm py-3 rounded-xl hover:shadow-lg hover:shadow-brand-green/30 transition-all mb-3"
                  >
                    🚀 Get Coupons + Promo Kit
                  </button>

                  <div className="flex justify-between text-xs text-brand-text-faint">
                    <span>✅ {c.sellers} active sellers</span>
                    <span>🎟️ {c.redeemed.toLocaleString()} redeemed</span>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Promo Kit callout */}
        <FadeIn delay={0.2}>
          <div className="bg-gradient-to-br from-brand-surface2 to-brand-surface3 border border-brand-border rounded-3xl p-7">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-2xl shrink-0">🎨</div>
              <div>
                <h3 className="font-display font-bold text-lg text-brand-forest mb-1">Promo Kit Included — Free</h3>
                <p className="text-sm text-brand-text-dim mb-3">Every coupon pack comes with a complete selling system: 5 download-ready banners, caption packs, WhatsApp chat scripts, FAQ slides + 12 daily story/status creatives.</p>
                <div className="flex flex-wrap gap-2">
                  {["4–5 Promo Banners", "Caption + Hashtag Packs", "WhatsApp Scripts", "FAQ Story Slides", "12 Daily Creatives"].map((item) => (
                    <span key={item} className="text-xs bg-white border border-brand-border text-brand-text-dim font-medium px-3 py-1 rounded-full">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── PAYOUT PROOF ─────────────────────────────────────────────────────────────
function PayoutProof() {
  const proofs = [
    { name: "Rahul S.", city: "Mumbai", amount: "₹650", method: "UPI · PhonePe", task: "3 story tasks + 1 coupon", time: "2 days ago" },
    { name: "Priya M.", city: "Pune", amount: "₹1,250", method: "UPI · GPay", task: "5 tasks + DealSell", time: "4 days ago" },
    { name: "Arjun K.", city: "Delhi", amount: "₹450", method: "Bank Transfer", task: "2 reels + referral", time: "1 week ago" },
    { name: "Sneha T.", city: "Bengaluru", amount: "₹2,100", method: "UPI · Paytm", task: "Campaign + 8 coupons", time: "1 week ago" },
  ];

  return (
    <section className="py-24 bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-12">
          <div className="text-xs font-mono font-semibold text-brand-green-dim uppercase tracking-widest mb-3">Proof of Payouts</div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-brand-forest mb-4">Real Money, Real People</h2>
          <p className="text-brand-text-dim max-w-md mx-auto">Every week, verified earners receive their payout via UPI or bank transfer.</p>
        </FadeIn>

        <div className="grid sm:grid-cols-2 gap-4">
          {proofs.map((p, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div className="bg-white rounded-2xl border border-brand-border p-5 hover:shadow-md hover:shadow-brand-green/8 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-green/20 to-brand-teal/20 border-2 border-brand-green/30 flex items-center justify-center font-display font-black text-brand-green-dim">
                      {p.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-brand-text text-sm">{p.name}</div>
                      <div className="text-xs text-brand-text-faint">{p.city}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-black text-xl text-brand-green-dim">{p.amount}</div>
                    <div className="text-xs text-brand-text-faint">{p.time}</div>
                  </div>
                </div>
                <div className="bg-brand-surface2 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs text-brand-text-faint">{p.task}</span>
                  <span className="text-xs font-semibold text-brand-green-dim bg-brand-green/10 px-2 py-0.5 rounded-full">{p.method}</span>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                  <span className="text-xs text-brand-text-faint ml-1">Verified payout ✅</span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── COMING SOON — MARKETPLACE ────────────────────────────────────────────────
function ComingSoon() {
  const [notified, setNotified] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="border-2 border-dashed border-brand-border rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl shrink-0 shadow-lg shadow-orange-300/30">
              🔜
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="text-xs font-mono font-semibold text-amber-600 uppercase tracking-widest mb-2">Coming Soon</div>
              <h3 className="font-display font-bold text-xl text-brand-forest mb-1">Marketplace Reviews Module</h3>
              <p className="text-sm text-brand-text-dim">Earn by submitting verified reviews on Amazon, Flipkart, Meesho & Google Maps. Pending legal compliance clearance — launching soon!</p>
            </div>
            <div className="shrink-0 flex flex-col sm:flex-row gap-2">
              {notified ? (
                <div className="flex items-center gap-2 text-sm font-semibold text-brand-green-dim bg-brand-green/10 px-4 py-2.5 rounded-xl border border-brand-green/25">
                  <Check className="w-4 h-4" /> Notified!
                </div>
              ) : (
                <>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-green transition-colors"
                  />
                  <button
                    onClick={() => email && setNotified(true)}
                    className="bg-amber-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-amber-600 transition-colors whitespace-nowrap"
                  >
                    Notify Me
                  </button>
                </>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-brand-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-12">
          <div className="text-xs font-mono font-semibold text-brand-green-dim uppercase tracking-widest mb-3">Got Questions?</div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-brand-forest">Frequently Asked</h2>
        </FadeIn>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <FadeIn key={i} delay={i * 0.05}>
              <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-semibold text-brand-text text-sm">{f.q}</span>
                  <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4 text-brand-text-faint shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-4 text-sm text-brand-text-dim border-t border-brand-border pt-3">
                        {f.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── REFERRAL CTA ─────────────────────────────────────────────────────────────
function ReferralCTA() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="bg-gradient-to-br from-brand-forest via-brand-forest-mid to-[#006633] rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-brand-green opacity-10 blur-3xl translate-x-1/3 -translate-y-1/3" />
            </div>
            <div className="flex-1 relative">
              <div className="inline-flex items-center gap-2 bg-brand-green/20 border border-brand-green/30 rounded-full px-3 py-1 mb-4">
                <Gift className="w-3.5 h-3.5 text-brand-green-light" />
                <span className="text-xs font-mono text-brand-green-light font-semibold uppercase tracking-wider">Referral Program</span>
              </div>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-white mb-3">
                Refer Friends,<br />
                <span className="text-brand-green-light">Earn Forever</span>
              </h2>
              <p className="text-white/60 text-sm mb-2">Earn 10% of every rupee your referred friends make — for life. No cap, no expiry.</p>
              <p className="text-white/40 text-xs font-mono">Referral balance is separate. Withdraw anytime above ₹200.</p>
            </div>
            <div className="shrink-0 flex flex-col gap-3 relative">
              <div className="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl p-5 text-center min-w-[200px]">
                <div className="font-mono text-xs text-white/50 mb-1">Your Code (after signup)</div>
                <div className="font-mono font-bold text-xl text-brand-green-light tracking-wider">DOPE-XXXX</div>
              </div>
              <button
                onClick={() => window.location.href = "/auth/register"}
                className="bg-brand-green text-brand-forest font-bold py-3 px-6 rounded-2xl text-sm hover:bg-brand-green-light transition-colors flex items-center justify-center gap-2"
              >
                Get My Referral Code <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-brand-forest text-white py-12 border-t-4 border-brand-green">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-3 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-green to-brand-green-dim flex items-center justify-center font-display font-black text-sm text-brand-forest">DD</div>
              <div>
                <div className="font-display font-black text-lg">DopeDeal</div>
                <div className="text-[9px] font-mono text-brand-green-light/60 uppercase tracking-wider">dopedeal.store</div>
              </div>
            </div>
            <p className="text-sm text-white/50 leading-relaxed mb-3">India's smartest earn-by-task platform for social media creators and digital hustlers.</p>
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <span>🇮🇳</span>
              <span>Proudly Made in India</span>
            </div>
          </div>

          <div>
            <div className="font-semibold text-sm mb-4">Platform</div>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><a href="#pocketmoney" className="hover:text-white transition-colors">PocketMoney Panel</a></li>
              <li><a href="#dealsell" className="hover:text-white transition-colors">DealSell Engine</a></li>
              <li><Link to="/auth/register" className="hover:text-white transition-colors">Join Free</Link></li>
              <li><Link to="/auth/login" className="hover:text-white transition-colors">Login</Link></li>
              <li><Link to="/deals" className="hover:text-white transition-colors">Browse Deals</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-sm mb-4">Legal & Support</div>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><Link to="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/legal/terms" className="hover:text-white transition-colors">Terms of Use</Link></li>
              <li><Link to="/support" className="hover:text-white transition-colors">Support Center</Link></li>
              <li><a href="mailto:hello@dopedeal.store" className="hover:text-white transition-colors">hello@dopedeal.store</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30 font-mono">
          <span>© 2025 DopeDeal.store · All rights reserved</span>
          <span>Built for Bharat's creators, students & hustlers 🇮🇳</span>
        </div>
      </div>
    </footer>
  );
}

// ─── PAGE EXPORT ─────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#F7FAF8", color: "#0D1F17" }}>
      <Navbar />
      <Hero />
      <SocialProofStrip />
      <HowItWorks />
      <PocketMoneySection />
      <DealSellSection />
      <PayoutProof />
      <ComingSoon />
      <ReferralCTA />
      <FAQ />
      <Footer />
    </div>
  );
}
