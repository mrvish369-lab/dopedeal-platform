import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet as WalletIcon, ArrowDownToLine, Clock, CheckCircle,
  AlertCircle, IndianRupee, ArrowUpRight, ArrowDownLeft,
  Users, ShoppingBag, Share2, Copy, BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactions, submitWithdrawalRequest } from "@/lib/db/wallet";
import type { WalletTransaction } from "@/lib/db/wallet";

// ── Types ─────────────────────────────────────────────────────────────────────
type PaymentMethod = "upi" | "bank";
type TxnType = "task" | "coupon" | "referral" | "withdrawal";

const TXN_ICON: Record<TxnType, { Icon: React.FC<{ className?: string }>; bg: string }> = {
  task:       { Icon: Share2,          bg: "bg-pink-100 text-pink-600"    },
  coupon:     { Icon: ShoppingBag,     bg: "bg-blue-100 text-blue-600"    },
  referral:   { Icon: Users,           bg: "bg-purple-100 text-purple-600" },
  withdrawal: { Icon: ArrowDownToLine, bg: "bg-red-100 text-red-500"      },
};

const STATUS_PILL: Record<string, { bg: string; text: string }> = {
  completed:  { bg: "bg-green-50", text: "text-green-700"  },
  pending:    { bg: "bg-amber-50", text: "text-amber-700"  },
  processing: { bg: "bg-blue-50",  text: "text-blue-600"   },
};

// ── Withdraw Form ─────────────────────────────────────────────────────────────
function WithdrawForm({
  availableBalance,
  userId,
  onSuccess,
}: {
  availableBalance: number;
  userId: string;
  onSuccess: () => void;
}) {
  const MIN = 200;
  const canWithdraw = availableBalance >= MIN;

  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankDetails, setBankDetails] = useState({ accountNo: "", ifsc: "", name: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNum = Number(amount);
  const isValid =
    canWithdraw &&
    amountNum >= MIN &&
    amountNum <= availableBalance &&
    (method === "upi" ? upiId.trim().length > 3 : bankDetails.accountNo && bankDetails.ifsc && bankDetails.name);

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    const payload =
      method === "upi"
        ? { amount: amountNum, method: "upi" as const, upi_id: upiId }
        : {
            amount: amountNum,
            method: "bank" as const,
            bank_account_no: bankDetails.accountNo,
            bank_ifsc: bankDetails.ifsc,
            bank_account_name: bankDetails.name,
          };
    const { error: err } = await submitWithdrawalRequest(userId, payload);
    setSubmitting(false);
    if (err) { setError(err); return; }
    setSubmitted(true);
    onSuccess();
  };

  if (submitted) {
    return (
      <motion.div
        className="bg-white border border-brand-border rounded-2xl p-8 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
        >
          <CheckCircle className="w-8 h-8 text-green-500" />
        </motion.div>
        <h3 className="font-bold text-brand-forest text-lg mb-1">Withdrawal Requested!</h3>
        <p className="text-sm text-brand-text-dim mb-1">₹{amountNum} via {method === "upi" ? `UPI (${upiId})` : "Bank Transfer"}</p>
        <p className="text-xs text-brand-text-faint">Admin will process within 24–48 hrs. You'll receive a UTR confirmation.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {!canWithdraw && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700">
          ⚠️ Minimum ₹{MIN} required. Your available balance is ₹{availableBalance.toFixed(2)} — keep earning!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white border border-brand-border rounded-2xl p-5 space-y-4">
        <p className="font-semibold text-brand-text text-sm">Request Withdrawal</p>

        {/* Amount */}
        <div>
          <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Amount (₹)</label>
          <div className="flex items-center border border-brand-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-green bg-white">
            <span className="px-3 text-brand-text-faint text-sm">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`${MIN} minimum`}
              disabled={!canWithdraw}
              className="flex-1 py-2.5 pr-3 text-sm focus:outline-none disabled:bg-brand-surface2 disabled:cursor-not-allowed"
              min={MIN}
              max={availableBalance}
            />
            {canWithdraw && (
              <button
                onClick={() => setAmount(String(availableBalance))}
                className="px-3 py-2.5 text-xs font-bold text-brand-green hover:text-brand-green-dim border-l border-brand-border"
              >
                Max
              </button>
            )}
          </div>
          {amountNum > 0 && amountNum < MIN && (
            <p className="text-xs text-red-500 mt-1">Minimum withdrawal is ₹{MIN}</p>
          )}
          {amountNum > availableBalance && availableBalance > 0 && (
            <p className="text-xs text-red-500 mt-1">Exceeds available balance of ₹{availableBalance}</p>
          )}
        </div>

        {/* Payment method toggle */}
        <div>
          <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            {(["upi", "bank"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                disabled={!canWithdraw}
                className={`border-2 rounded-xl py-2.5 text-xs font-semibold transition-all disabled:cursor-not-allowed ${
                  method === m && canWithdraw
                    ? "border-brand-green bg-brand-green/8 text-brand-green-dim"
                    : "border-brand-border text-brand-text-faint"
                }`}
              >
                {m === "upi" ? "UPI ID" : "Bank Transfer"}
              </button>
            ))}
          </div>
        </div>

        {/* UPI / Bank fields */}
        <AnimatePresence mode="wait">
          {method === "upi" ? (
            <motion.div key="upi" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                disabled={!canWithdraw}
                className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green disabled:bg-brand-surface2 disabled:cursor-not-allowed"
              />
            </motion.div>
          ) : (
            <motion.div key="bank" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
              {[
                { label: "Account Number", key: "accountNo", placeholder: "XXXXXXXXXXXXXXXX" },
                { label: "IFSC Code", key: "ifsc", placeholder: "SBIN0001234" },
                { label: "Account Holder Name", key: "name", placeholder: "As per bank records" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">{label}</label>
                  <input
                    type="text"
                    value={bankDetails[key as keyof typeof bankDetails]}
                    onChange={(e) => setBankDetails((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    disabled={!canWithdraw}
                    className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green disabled:bg-brand-surface2 disabled:cursor-not-allowed"
                  />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className={`w-full font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors ${
            isValid && !submitting
              ? "bg-brand-green text-white hover:bg-brand-green-dim"
              : "bg-brand-border text-brand-text-faint cursor-not-allowed"
          }`}
        >
          {submitting ? (
            <>
              <motion.div
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              />
              Submitting...
            </>
          ) : (
            <><ArrowDownToLine className="w-4 h-4" /> Withdraw ₹{amountNum || "—"}</>
          )}
        </button>
      </div>

      {/* Rules */}
      <div className="bg-white border border-brand-border rounded-2xl p-4 text-xs text-brand-text-faint space-y-1">
        <p className="font-semibold text-brand-text mb-2">Withdrawal Rules</p>
        {[
          "Minimum withdrawal: ₹200",
          "Maximum once per week",
          "Processed within 24–48 hours by admin",
          "You'll receive UTR/transaction ID as proof",
          "KYC required for cumulative withdrawals above ₹10,000",
        ].map((r, i) => <p key={i}>• {r}</p>)}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Wallet() {
  const { user, wallet, refreshWallet } = useAuth();
  const [tab, setTab] = useState<"overview" | "history" | "withdraw">("overview");
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(true);

  useEffect(() => {
    if (!user) return;
    getTransactions(user.id).then((txns) => {
      setTransactions(txns);
      setLoadingTxns(false);
    });
  }, [user]);

  const available = wallet?.available_balance ?? 0;
  const pending   = wallet?.pending_balance ?? 0;
  const referral  = wallet?.referral_balance ?? 0;
  const total     = wallet?.total_earned ?? 0;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <WalletIcon className="w-4 h-4 text-brand-green" />
          <span className="text-xs font-mono font-semibold text-brand-green-dim uppercase tracking-widest">Finance</span>
        </div>
        <h1 className="font-display font-extrabold text-2xl text-brand-forest">My Wallet</h1>
        <p className="text-sm text-brand-text-dim mt-1">Track earnings and request withdrawals via UPI or bank.</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Available", amount: available, desc: "Ready to withdraw", color: "from-brand-green to-brand-teal", Icon: CheckCircle },
          { label: "Pending",   amount: pending,   desc: "Under verification", color: "from-amber-500 to-orange-500", Icon: Clock },
          { label: "Referral",  amount: referral,  desc: "From referrals",     color: "from-purple-500 to-violet-600", Icon: Users },
          { label: "Total Earned", amount: total, desc: "All time",            color: "from-blue-500 to-indigo-600",  Icon: BadgeCheck },
        ].map(({ label, amount, desc, color, Icon }) => (
          <div key={label} className="bg-white border border-brand-border rounded-2xl p-4">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-3`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="font-display font-black text-xl text-brand-forest">₹{amount.toFixed(2)}</div>
            <div className="text-xs font-semibold text-brand-text-dim mt-0.5">{label}</div>
            <div className="text-[10px] text-brand-text-faint">{desc}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-surface2 border border-brand-border rounded-2xl p-1 mb-6">
        {(["overview", "history", "withdraw"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              tab === t ? "bg-white text-brand-forest shadow-sm border border-brand-border" : "text-brand-text-faint hover:text-brand-text-dim"
            }`}
          >
            {t === "overview" ? "Overview" : t === "history" ? "History" : "Withdraw"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="bg-white border border-brand-border rounded-2xl p-5">
              <p className="text-sm font-semibold text-brand-text mb-3">How Your Wallet Works</p>
              <div className="space-y-2.5">
                {[
                  { icon: "✅", text: "Task approved + monitoring complete → Available Balance" },
                  { icon: "⏳", text: "Task approved but monitoring ongoing → Pending (not withdrawable yet)" },
                  { icon: "🎟️", text: "Coupon redeemed → 48-hr verification hold → then credited" },
                  { icon: "🤝", text: "Referral earnings → credited once referred user earns ₹50+" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-brand-text-dim">
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-brand-green/6 border border-brand-green/20 rounded-2xl p-4 text-center">
              <IndianRupee className="w-6 h-6 text-brand-green mx-auto mb-2" />
              <p className="font-bold text-brand-forest text-sm">Minimum Withdrawal: ₹200</p>
              <p className="text-xs text-brand-text-faint mt-1">Once per week · UPI or Bank Transfer · Processed in 24–48 hrs</p>
            </div>
          </motion.div>
        )}

        {tab === "history" && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {loadingTxns ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="bg-white border border-brand-border rounded-2xl h-16 animate-pulse" />)}
              </div>
            ) : transactions.length === 0 ? (
              <div className="bg-white border border-brand-border rounded-2xl p-10 text-center text-brand-text-faint">
                <p className="text-4xl mb-3">📋</p>
                <p className="font-semibold text-brand-text text-sm">No transactions yet</p>
                <p className="text-xs mt-1">Complete tasks or earn from coupons to see your history.</p>
              </div>
            ) : (
              transactions.map((txn) => {
                const { Icon, bg } = TXN_ICON[txn.type] ?? TXN_ICON.task;
                const { bg: pillBg, text: pillText } = STATUS_PILL[txn.status] ?? STATUS_PILL.pending;
                const isCredit = txn.direction === "credit";
                return (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white border border-brand-border rounded-2xl p-4 flex items-center gap-3"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{txn.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${pillBg} ${pillText}`}>
                          {txn.status}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(txn.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                    </div>
                    <div className={`text-sm font-black flex-shrink-0 ${isCredit ? "text-green-600" : "text-red-500"}`}>
                      {isCredit ? "+" : "−"}₹{txn.amount}
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {tab === "withdraw" && (
          <motion.div key="withdraw" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {user && (
              <WithdrawForm
                availableBalance={available}
                userId={user.id}
                onSuccess={refreshWallet}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
