import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Lock, Copy, Check, TrendingUp, ChevronRight,
  Zap, Gift, ArrowRight, X
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getActiveProducts } from "@/lib/db/products";
import { getUserCoupons, generateCoupons } from "@/lib/db/coupons";
import type { Product as DbProduct } from "@/lib/db/products";
import type { UserCoupon } from "@/lib/db/coupons";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CommissionTier {
  discountValue: 50 | 100 | 150;
  baseCommission: number;
}

interface Product {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  price: number;
  baseCommission: number;
  minCoupon: number;
  maxCoupon: number;
  sellers: number;
  redeemed: number;
  bg: string;
  tiers: CommissionTier[];
  coupons_per_user: number;
}

interface CouponCode {
  code: string;
  discountValue: number;
  status: "unused" | "redeemed" | "pending";
  commissionEarned?: number;
  createdAt?: string;
}

// ─── Static display config ────────────────────────────────────────────────────
const EMOJIS = ["📚", "🎨", "📈", "💡", "🚀", "💻", "📊", "🎯"];
const BG_GRADIENTS = [
  "from-brand-forest to-brand-forest-mid",
  "from-[#1a1a2e] to-[#16213e]",
  "from-blue-900 to-blue-800",
  "from-violet-800 to-purple-900",
  "from-emerald-800 to-teal-900",
  "from-rose-800 to-red-900",
];

function mapDbProduct(p: DbProduct, idx: number): Product {
  const tiers = (p.commission_tiers ?? []) as CommissionTier[];
  const discounts = tiers.map((t) => t.discountValue);
  const commissions = tiers.map((t) => t.baseCommission);
  return {
    id: p.id,
    emoji: EMOJIS[idx % EMOJIS.length],
    name: p.name,
    desc: p.description ?? "",
    price: p.price,
    baseCommission: commissions.length ? Math.max(...commissions) : 150,
    minCoupon: discounts.length ? Math.min(...discounts) : 50,
    maxCoupon: discounts.length ? Math.max(...discounts) : 150,
    sellers: p.used_coupons || 0,
    redeemed: p.used_coupons || 0,
    bg: BG_GRADIENTS[idx % BG_GRADIENTS.length],
    tiers,
    coupons_per_user: p.coupons_per_user ?? 5,
  };
}

function mapDbCoupon(c: UserCoupon): CouponCode {
  return {
    code: c.code,
    discountValue: c.discount_value,
    status: c.status === "pending_verification" ? "pending" : c.status,
    commissionEarned: c.status === "redeemed" ? c.commission : undefined,
    createdAt: c.created_at,
  };
}

// ─── Coupon value selector widget ────────────────────────────────────────────
function CouponValueSelector({
  product, onConfirm, onClose, generating,
}: {
  product: Product;
  onConfirm: (val: number) => void;
  onClose: () => void;
  generating: boolean;
}) {
  const [selected, setSelected] = useState(product.minCoupon);

  const getTierCommission = (val: number) => {
    const tier = product.tiers.find((t) => t.discountValue === val);
    return tier ? tier.baseCommission : product.baseCommission - val;
  };

  const commission = getTierCommission(selected);
  const buyerPays  = product.price - selected;

  const steps = product.tiers.length > 0
    ? product.tiers.map((t) => t.discountValue).sort((a, b) => a - b)
    : Array.from({ length: Math.floor((product.maxCoupon - product.minCoupon) / 50) + 1 }, (_, i) => product.minCoupon + i * 50);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-faint hover:text-brand-text"><X className="w-5 h-5" /></button>

        <div className="flex items-center gap-3 mb-5">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${product.bg} flex items-center justify-center text-2xl`}>{product.emoji}</div>
          <div>
            <div className="font-display font-bold text-brand-forest text-sm leading-snug">{product.name}</div>
            <div className="text-xs text-brand-text-faint font-mono">GrowthGurukul.store</div>
          </div>
        </div>

        <div className="text-xs font-mono font-semibold text-brand-text-faint uppercase tracking-widest mb-3">Choose Coupon Discount Value</div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {steps.map(v => {
            const earn = getTierCommission(v);
            return (
              <button key={v} onClick={() => setSelected(v)}
                className={`rounded-2xl p-3 border-2 text-center transition-all ${
                  selected === v ? "border-brand-green bg-brand-green/8" : "border-brand-border hover:border-brand-green/40"
                }`}>
                <div className={`font-display font-black text-lg ${selected === v ? "text-brand-green-dim" : "text-brand-text"}`}>₹{v}</div>
                <div className="text-[10px] text-brand-text-faint">buyer saves</div>
                <div className={`text-xs font-bold mt-1 ${selected === v ? "text-brand-green-dim" : "text-brand-text-dim"}`}>You: ₹{earn}</div>
              </button>
            );
          })}
        </div>

        {/* Live calculation */}
        <div className="bg-brand-surface2 border border-brand-border rounded-2xl p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-brand-text-dim">Course price</span>
            <span className="font-semibold text-brand-text">₹{product.price}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-text-dim">Buyer's discount</span>
            <span className="font-semibold text-red-500">−₹{selected}</span>
          </div>
          <div className="flex justify-between border-t border-brand-border pt-2">
            <span className="text-brand-text-dim">Buyer pays</span>
            <span className="font-bold text-brand-text">₹{buyerPays}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-brand-text-dim">Your commission</span>
            <span className="font-display font-black text-lg text-brand-green-dim">₹{commission}</span>
          </div>
        </div>

        <div className="text-xs text-brand-text-faint mb-4 text-center">You'll receive {product.coupons_per_user} exclusive coupon codes + complete Promo Kit</div>

        <button
          onClick={() => onConfirm(selected)}
          disabled={generating}
          className="w-full bg-gradient-to-r from-brand-green to-brand-green-dim text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand-green/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
              Generating...
            </>
          ) : (
            <>🎟️ Generate {product.coupons_per_user} Coupon Codes <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Coupon reveal animation ──────────────────────────────────────────────────
function CouponReveal({
  codes, product, onClose,
}: { codes: CouponCode[]; product: Product; onClose: () => void }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(codes.map(c => c.code).join("\n"));
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="bg-white rounded-3xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto"
      >
        <div className="text-center mb-5">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring" }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-green to-brand-teal flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-green/25 text-3xl"
          >🎟️</motion.div>
          <h2 className="font-display font-black text-xl text-brand-forest">Your Coupon Codes!</h2>
          <p className="text-xs text-brand-text-faint mt-1">Share these with your network to earn commission on every sale</p>
        </div>

        <div className="space-y-2 mb-4">
          {codes.map((c, i) => (
            <motion.div
              key={c.code}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="flex items-center gap-3 bg-brand-green/6 border border-brand-green/20 rounded-xl px-4 py-3"
            >
              <span className="font-mono font-bold text-brand-green-dim flex-1 tracking-wider">{c.code}</span>
              <span className="text-xs bg-brand-green/10 text-brand-green-dim px-2 py-0.5 rounded-full font-semibold">₹{c.discountValue} off</span>
              <button onClick={() => handleCopy(c.code, i)} className="p-1.5 rounded-lg hover:bg-brand-green/15 transition-colors">
                {copiedIdx === i ? <Check className="w-3.5 h-3.5 text-brand-green" /> : <Copy className="w-3.5 h-3.5 text-brand-text-faint" />}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={handleCopyAll}
            className="flex-1 flex items-center justify-center gap-2 border-2 border-brand-green/30 bg-brand-green/6 text-brand-green-dim font-bold text-sm py-2.5 rounded-xl hover:bg-brand-green/12 transition-colors">
            {allCopied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy All Codes</>}
          </button>
          <button onClick={onClose}
            className="flex-1 bg-gradient-to-r from-brand-green to-brand-green-dim text-white font-bold text-sm py-2.5 rounded-xl hover:shadow-lg hover:shadow-brand-green/30 transition-all">
            View My Coupons
          </button>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-700">
          🎨 <strong>Promo Kit unlocked!</strong> Banners, captions, WhatsApp scripts and daily creatives are now available in your DealSell panel.
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── My Coupons view ──────────────────────────────────────────────────────────
function MyCouponsView({ product, codes, onBack }: {
  product: Product;
  codes: CouponCode[];
  onBack: () => void;
}) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const redeemed = codes.filter(c => c.status === "redeemed").length;
  const tierTarget = 5;
  const progress = Math.min(redeemed / tierTarget, 1);

  const statusStyle = (s: CouponCode["status"]) => ({
    unused:   "bg-amber-50 border-amber-200 text-amber-700",
    redeemed: "bg-green-50 border-green-200 text-green-700",
    pending:  "bg-blue-50 border-blue-200 text-blue-700",
  }[s]);

  const statusLabel = (c: CouponCode) => ({
    unused:   "⏳ Pending",
    redeemed: `✅ ₹${c.commissionEarned} Earned`,
    pending:  "🔄 Verifying",
  }[c.status]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-1">
        <button onClick={onBack} className="text-brand-text-faint hover:text-brand-text text-sm flex items-center gap-1">
          ← Back
        </button>
        <div className="font-display font-bold text-brand-forest text-lg">{product.name}</div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Codes", val: codes.length },
          { label: "Redeemed", val: redeemed },
          { label: "Earnings", val: `₹${codes.filter(c => c.status === "redeemed").reduce((s, c) => s + (c.commissionEarned || 0), 0)}` },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-brand-border rounded-2xl p-3 text-center">
            <div className="font-display font-black text-xl text-brand-forest">{s.val}</div>
            <div className="text-[10px] text-brand-text-faint">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tier progress */}
      <div className="bg-white border border-brand-border rounded-2xl p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-semibold text-brand-text">Progress to Silver 🥈</div>
          <div className="text-xs text-brand-text-faint">{redeemed}/{tierTarget} sales</div>
        </div>
        <div className="h-2.5 bg-brand-surface2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-brand-green to-brand-teal rounded-full"
          />
        </div>
        <div className="text-[10px] text-brand-text-faint mt-1.5">{tierTarget - redeemed} more sales to unlock Silver (+10% bonus commission)</div>
      </div>

      {/* Codes list */}
      <div className="space-y-2">
        {codes.map((c, i) => (
          <div key={c.code} className="bg-white border border-brand-border rounded-2xl p-4 flex items-center gap-3">
            <span className="font-mono font-bold text-sm text-brand-green-dim flex-1 tracking-wider">{c.code}</span>
            <div className={`shrink-0 border rounded-lg px-2.5 py-1 text-[10px] font-bold ${statusStyle(c.status)}`}>
              {statusLabel(c)}
            </div>
            {c.status === "unused" && (
              <button onClick={() => { navigator.clipboard.writeText(c.code); setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 1500); }}
                className="p-1.5 rounded-lg hover:bg-brand-surface2 transition-colors shrink-0">
                {copiedIdx === i ? <Check className="w-3.5 h-3.5 text-brand-green" /> : <Copy className="w-3.5 h-3.5 text-brand-text-faint" />}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main DealSell Page ───────────────────────────────────────────────────────
export default function DealSell() {
  const { user, isVerified } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  // productId → CouponCode[]
  const [couponMap, setCouponMap] = useState<Record<string, CouponCode[]>>({});
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [selectorProduct, setSelectorProduct] = useState<Product | null>(null);
  const [revealData, setRevealData] = useState<{ codes: CouponCode[]; product: Product } | null>(null);
  const [viewingCoupons, setViewingCoupons] = useState<string | null>(null);
  const [tab, setTab] = useState<"products" | "mycoupons">("products");

  // Load products
  useEffect(() => {
    getActiveProducts().then((dbProds) => {
      setProducts(dbProds.map(mapDbProduct));
      setLoadingProducts(false);
    });
  }, []);

  // Load user coupons
  useEffect(() => {
    if (!user) return;
    getUserCoupons(user.id).then((dbCoupons) => {
      const grouped: Record<string, CouponCode[]> = {};
      for (const c of dbCoupons) {
        if (!grouped[c.product_id]) grouped[c.product_id] = [];
        grouped[c.product_id].push(mapDbCoupon(c));
      }
      setCouponMap(grouped);
    });
  }, [user]);

  const handleConfirmGenerate = async (discountValue: number) => {
    if (!selectorProduct || !user) return;
    setGenerating(true);
    setGenerateError(null);
    const tier = selectorProduct.tiers.find((t) => t.discountValue === discountValue);
    const commission = tier ? tier.baseCommission : selectorProduct.baseCommission - discountValue;
    const { codes, error } = await generateCoupons(
      user.id,
      selectorProduct.id,
      discountValue as 50 | 100 | 150,
      commission,
      selectorProduct.coupons_per_user
    );
    setGenerating(false);
    if (error) { setGenerateError(error); return; }
    const newCodes: CouponCode[] = codes.map((code) => ({ code, discountValue, status: "unused" }));
    setCouponMap((prev) => ({ ...prev, [selectorProduct.id]: newCodes }));
    setRevealData({ codes: newCodes, product: selectorProduct });
    setSelectorProduct(null);
  };

  const myProductIds = Object.keys(couponMap);

  return (
    <div className="p-6 max-w-4xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag className="w-5 h-5 text-brand-green" />
          <div className="text-xs font-mono font-semibold text-brand-green-dim uppercase tracking-widest">Earning Engine #2</div>
        </div>
        <h1 className="font-display font-extrabold text-2xl text-brand-forest mb-2">DealSell — Coupon Affiliate Engine</h1>
        <p className="text-sm text-brand-text-dim">Generate exclusive coupon codes for GrowthGurukul courses. Share → buyer purchases → you earn up to ₹200 per sale.</p>
      </div>

      {/* Verification gate */}
      {!isVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
          <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-amber-800 text-sm mb-0.5">Verification required to generate coupons</div>
            <p className="text-xs text-amber-700/70">Complete your social profile verification. Preview products below — coupons unlock once approved (6–12 hrs).</p>
          </div>
          <Link to="/dashboard/profile"
            className="shrink-0 text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded-xl hover:bg-amber-600 transition-colors">
            Verify Now
          </Link>
        </div>
      )}

      {generateError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-700 mb-4">
          ⚠️ {generateError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-surface2 border border-brand-border rounded-xl p-1 mb-6">
        {([["products", "Browse Products"], ["mycoupons", `My Coupons (${myProductIds.length})`]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === t ? "bg-white text-brand-forest shadow-sm" : "text-brand-text-faint hover:text-brand-text-dim"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Products Tab ── */}
      {tab === "products" && (
        <div className="space-y-6">
          {/* How it works */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { step: "1", icon: "🎟️", text: "Get 5 coupon codes" },
              { step: "2", icon: "📲", text: "Share with network" },
              { step: "3", icon: "💰", text: "Earn per sale" },
            ].map(s => (
              <div key={s.step} className="bg-white border border-brand-border rounded-2xl p-4 text-center">
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="text-xs text-brand-text-dim">{s.text}</div>
              </div>
            ))}
          </div>

          {/* Product grid */}
          {loadingProducts ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="bg-white border border-brand-border rounded-3xl h-64 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {products.map((p, i) => {
                const hasCoupons = !!couponMap[p.id];
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className="bg-white border-2 border-brand-border rounded-3xl overflow-hidden hover:shadow-lg hover:shadow-brand-green/10 hover:-translate-y-0.5 transition-all">
                    <div className={`bg-gradient-to-br ${p.bg} px-6 pt-5 pb-6 text-center`}>
                      <div className="text-4xl mb-2">{p.emoji}</div>
                      <div className="font-display font-black text-sm text-white leading-snug">{p.name}</div>
                      <div className="text-[10px] text-brand-green-light/60 font-mono mt-1">GrowthGurukul.store</div>
                    </div>
                    <div className="p-5">
                      <p className="text-xs text-brand-text-faint mb-4 leading-relaxed">{p.desc}</p>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-[10px] text-brand-text-faint">COURSE PRICE</div>
                          <div className="font-display font-black text-xl text-brand-text">₹{p.price}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-brand-text-faint">YOU EARN UP TO</div>
                          <div className="font-display font-black text-2xl text-brand-green-dim">₹{p.baseCommission}</div>
                        </div>
                      </div>
                      <div className="bg-brand-green/6 border border-brand-green/20 rounded-xl px-3 py-2 text-xs text-brand-green-dim mb-4">
                        🎟️ Give buyers ₹{p.minCoupon}–₹{p.maxCoupon} discount coupon
                      </div>

                      {hasCoupons ? (
                        <button onClick={() => { setTab("mycoupons"); setViewingCoupons(p.id); }}
                          className="w-full flex items-center justify-center gap-2 border-2 border-brand-green/30 bg-brand-green/6 text-brand-green-dim font-bold text-sm py-3 rounded-xl hover:bg-brand-green/12 transition-colors">
                          <Zap className="w-4 h-4" /> View My Coupons <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => isVerified && setSelectorProduct(p)}
                          className={`w-full flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-xl transition-all ${
                            isVerified
                              ? "bg-gradient-to-r from-brand-green to-brand-green-dim text-white hover:shadow-lg hover:shadow-brand-green/30"
                              : "bg-brand-border text-brand-text-faint cursor-not-allowed"
                          }`}>
                          {isVerified ? <><Gift className="w-4 h-4" /> Get Coupons + Promo Kit</> : <><Lock className="w-3.5 h-3.5" /> Verify to Unlock</>}
                        </button>
                      )}

                      <div className="flex justify-between text-[10px] text-brand-text-faint mt-3">
                        <span>✅ {p.sellers} active sellers</span>
                        <span>🎟️ {p.redeemed.toLocaleString()} redeemed</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Seller tier preview */}
          <div className="bg-white border border-brand-border rounded-2xl p-5">
            <div className="font-semibold text-brand-text text-sm mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-green" /> Seller Tier Progression
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { tier: "🥉 Bronze", sales: "0–4 sales",  bonus: "Base",    active: true },
                { tier: "🥈 Silver", sales: "5+ sales",   bonus: "+10%",    active: false },
                { tier: "🥇 Gold",   sales: "10+ sales",  bonus: "+20%",    active: false },
                { tier: "💎 Platinum", sales: "25+ sales", bonus: "Custom", active: false },
              ].map((t, i) => (
                <div key={i} className={`rounded-2xl p-3 text-center border ${t.active ? "border-brand-green/30 bg-brand-green/6" : "border-brand-border bg-brand-surface2"}`}>
                  <div className="text-lg mb-1">{t.tier.split(" ")[0]}</div>
                  <div className="text-[10px] font-bold text-brand-text">{t.tier.split(" ").slice(1).join(" ")}</div>
                  <div className="text-[10px] text-brand-text-faint">{t.sales}</div>
                  <div className={`text-[10px] font-semibold mt-1 ${t.active ? "text-brand-green-dim" : "text-brand-text-faint"}`}>{t.bonus}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── My Coupons Tab ── */}
      {tab === "mycoupons" && (
        <div>
          {viewingCoupons ? (
            <MyCouponsView
              product={products.find(p => p.id === viewingCoupons)!}
              codes={couponMap[viewingCoupons] ?? []}
              onBack={() => setViewingCoupons(null)}
            />
          ) : myProductIds.length === 0 ? (
            <div className="bg-white border border-brand-border rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">🎟️</div>
              <div className="font-semibold text-brand-text mb-1">No coupons generated yet</div>
              <p className="text-xs text-brand-text-faint mb-4">Browse products and generate your first batch of coupon codes to start earning.</p>
              <button onClick={() => setTab("products")}
                className="text-sm font-bold text-brand-green-dim border border-brand-green/25 bg-brand-green/6 px-4 py-2 rounded-xl hover:bg-brand-green/12 transition-colors">
                Browse Products →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myProductIds.map(pid => {
                const p = products.find(x => x.id === pid);
                if (!p) return null;
                const codes = couponMap[pid];
                const redeemed = codes.filter(c => c.status === "redeemed").length;
                const earned = codes.filter(c => c.status === "redeemed").reduce((s, c) => s + (c.commissionEarned || 0), 0);
                return (
                  <button key={pid} onClick={() => setViewingCoupons(pid)}
                    className="w-full bg-white border border-brand-border rounded-2xl p-4 flex items-center gap-4 hover:border-brand-green/40 hover:shadow-md transition-all text-left">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.bg} flex items-center justify-center text-2xl shrink-0`}>{p.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-brand-text truncate">{p.name}</div>
                      <div className="text-xs text-brand-text-faint mt-0.5">{codes.length} codes · {redeemed} redeemed · ₹{earned} earned</div>
                      <div className="mt-1.5 h-1.5 bg-brand-surface2 rounded-full w-32 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-brand-green to-brand-teal rounded-full" style={{ width: `${(redeemed / 5) * 100}%` }} />
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-brand-text-faint shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {selectorProduct && (
          <CouponValueSelector
            product={selectorProduct}
            onConfirm={handleConfirmGenerate}
            onClose={() => setSelectorProduct(null)}
            generating={generating}
          />
        )}
        {revealData && (
          <CouponReveal
            codes={revealData.codes}
            product={revealData.product}
            onClose={() => { setRevealData(null); setTab("mycoupons"); setViewingCoupons(revealData.product.id); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
