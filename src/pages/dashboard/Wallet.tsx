import { useState } from "react";
import { Wallet as WalletIcon, ArrowDownToLine, Clock, CheckCircle, AlertCircle } from "lucide-react";

const transactions: { type: string; amount: string; source: string; status: "paid" | "pending" | "processing"; date: string }[] = [];

export default function Wallet() {
  const [tab, setTab] = useState<"balance" | "history" | "withdraw">("balance");

  return (
    <div className="p-6 max-w-3xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <WalletIcon className="w-5 h-5 text-brand-green" />
          <div className="text-xs font-mono font-semibold text-brand-green-dim uppercase tracking-widest">Finance</div>
        </div>
        <h1 className="font-display font-extrabold text-2xl text-brand-forest mb-2">My Wallet</h1>
        <p className="text-sm text-brand-text-dim">Track your earnings and request withdrawals via UPI or bank transfer.</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Available", amount: "₹0.00", desc: "Ready to withdraw", color: "from-brand-green to-brand-teal", icon: <CheckCircle className="w-4 h-4" /> },
          { label: "Pending", amount: "₹0.00", desc: "Under verification", color: "from-amber-500 to-orange-500", icon: <Clock className="w-4 h-4" /> },
          { label: "Referral", amount: "₹0.00", desc: "From referrals", color: "from-purple-500 to-violet-600", icon: <AlertCircle className="w-4 h-4" /> },
        ].map((b, i) => (
          <div key={i} className="bg-white border border-brand-border rounded-2xl p-4">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${b.color} flex items-center justify-center text-white mb-3`}>
              {b.icon}
            </div>
            <div className="font-display font-black text-xl text-brand-forest">{b.amount}</div>
            <div className="text-xs font-semibold text-brand-text-dim mt-0.5">{b.label}</div>
            <div className="text-[10px] text-brand-text-faint">{b.desc}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-surface2 border border-brand-border rounded-xl p-1 mb-6">
        {(["balance", "history", "withdraw"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
              tab === t ? "bg-white text-brand-forest shadow-sm" : "text-brand-text-faint hover:text-brand-text-dim"
            }`}
          >
            {t === "balance" ? "Overview" : t === "history" ? "History" : "Withdraw"}
          </button>
        ))}
      </div>

      {tab === "balance" && (
        <div className="space-y-4">
          <div className="bg-white border border-brand-border rounded-2xl p-5">
            <div className="text-sm font-semibold text-brand-text mb-3">How Wallet Works</div>
            <div className="space-y-2">
              {[
                { icon: "✅", text: "Task verified + monitoring period complete → credited to Available Balance" },
                { icon: "⏳", text: "Task approved but monitoring ongoing → in Pending Balance (not withdrawable)" },
                { icon: "🎟️", text: "Coupon redeemed → 48hr verification hold → then credited to Available" },
                { icon: "🤝", text: "Referral earnings → directly in Referral Balance, same withdrawal rules" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-brand-text-dim">
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-surface2 border border-brand-border rounded-2xl p-4 text-center">
            <div className="text-2xl mb-2">💸</div>
            <div className="font-semibold text-brand-text text-sm mb-1">Minimum Withdrawal: ₹200</div>
            <div className="text-xs text-brand-text-faint">Once per week · UPI or Bank Transfer · Processed within 24–48 hrs</div>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="bg-white border border-brand-border rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">📋</div>
          <div className="font-semibold text-brand-text mb-1">No Transactions Yet</div>
          <p className="text-xs text-brand-text-faint">Complete tasks or earn from coupons to see your transaction history here.</p>
        </div>
      )}

      {tab === "withdraw" && (
        <div className="space-y-4">
          <div className="bg-white border border-brand-border rounded-2xl p-5">
            <div className="font-semibold text-brand-text text-sm mb-4">Request Withdrawal</div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 mb-4">
              ⚠️ Minimum ₹200 required. Your available balance is ₹0.00 — earn first, then withdraw!
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Amount (₹)</label>
                <input
                  disabled
                  placeholder="₹200 minimum"
                  className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-text-faint bg-brand-surface2 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button disabled className="border-2 border-brand-border rounded-xl py-2.5 text-xs font-semibold text-brand-text-faint cursor-not-allowed">UPI ID</button>
                  <button disabled className="border-2 border-brand-border rounded-xl py-2.5 text-xs font-semibold text-brand-text-faint cursor-not-allowed">Bank Transfer</button>
                </div>
              </div>
              <button
                disabled
                className="w-full bg-brand-border text-brand-text-faint font-bold py-3 rounded-2xl text-sm cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ArrowDownToLine className="w-4 h-4" />
                Withdraw (Unlock after earning ₹200)
              </button>
            </div>
          </div>

          <div className="bg-white border border-brand-border rounded-2xl p-4 text-xs text-brand-text-faint">
            <div className="font-semibold text-brand-text mb-2">Withdrawal Rules</div>
            <ul className="space-y-1">
              <li>• Minimum withdrawal: ₹200</li>
              <li>• Maximum once per week</li>
              <li>• Admin processes within 24–48 hours</li>
              <li>• You'll receive UTR/transaction ID as proof</li>
              <li>• KYC (Aadhaar + PAN) required for cumulative withdrawals above ₹10,000</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
