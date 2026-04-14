import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, Share2, ShoppingBag, Users, BarChart3, LogOut,
  Menu, X, Bell, ChevronRight, BadgeCheck, Lock, UserCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  {
    path: "/dashboard",
    exact: true,
    icon: <BarChart3 className="w-5 h-5" />,
    label: "Overview",
    desc: "Your earnings snapshot",
  },
  {
    path: "/dashboard/pocket-money",
    icon: <Share2 className="w-5 h-5" />,
    label: "PocketMoney",
    desc: "Social task earnings",
    badge: "NEW",
  },
  {
    path: "/dashboard/deal-sell",
    icon: <ShoppingBag className="w-5 h-5" />,
    label: "DealSell",
    desc: "Coupon commissions",
    badge: "HOT",
  },
  {
    path: "/dashboard/wallet",
    icon: <Wallet className="w-5 h-5" />,
    label: "Wallet",
    desc: "Balance & withdrawals",
  },
  {
    path: "/dashboard/referral",
    icon: <Users className="w-5 h-5" />,
    label: "Referral",
    desc: "Invite & earn 10%",
  },
  {
    path: "/dashboard/profile",
    icon: <UserCircle className="w-5 h-5" />,
    label: "Profile",
    desc: "Verification & social handle",
  },
];

function Sidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div
      className={`flex flex-col h-full ${mobile ? "w-72" : "w-64"}`}
      style={{ background: "#003D1F" }}
    >
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-green to-brand-green-dim flex items-center justify-center font-display font-black text-sm text-brand-forest shadow-lg shadow-brand-green/30">
            DD
          </div>
          <div>
            <div className="font-display font-black text-base text-white">DopeDeal</div>
            <div className="text-[9px] font-mono text-brand-green-light/50 uppercase tracking-widest">dopedeal.store</div>
          </div>
        </Link>
        {mobile && (
          <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User quick info */}
      <div className="px-4 py-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-green/20 border-2 border-brand-green/30 flex items-center justify-center font-display font-black text-brand-green-light text-sm shrink-0">
            {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">
              {user?.user_metadata?.full_name || "DopeDeal User"}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-xs text-white/40">Pending Verification</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.path, item.exact);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all group ${
                active
                  ? "bg-brand-green/15 border border-brand-green/30 text-white"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className={`shrink-0 transition-colors ${active ? "text-brand-green-light" : "text-white/40 group-hover:text-white/70"}`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold flex items-center gap-2">
                  {item.label}
                  {item.badge && (
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                      item.badge === "HOT" ? "bg-red-500/20 text-red-300" : "bg-brand-green/20 text-brand-green-light"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-white/30 truncate">{item.desc}</div>
              </div>
              {active && <ChevronRight className="w-3.5 h-3.5 text-brand-green-light shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Deals shortcut */}
      <div className="px-3 py-3 border-t border-white/8">
        <Link
          to="/deals"
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/5 transition-all text-xs"
        >
          <ShoppingBag className="w-4 h-4" />
          Browse Deals (Legacy)
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all text-xs mt-1"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── Overview (Dashboard Home) ────────────────────────────────────────────────
function DashboardOverview() {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  const stats = [
    { label: "Available Balance", value: "₹0.00", sub: "Ready to withdraw", color: "from-brand-green to-brand-teal", icon: <Wallet className="w-5 h-5" /> },
    { label: "Pending Balance", value: "₹0.00", sub: "In verification", color: "from-amber-500 to-orange-500", icon: <BadgeCheck className="w-5 h-5" /> },
    { label: "Total Earned", value: "₹0.00", sub: "All time", color: "from-blue-500 to-indigo-600", icon: <BarChart3 className="w-5 h-5" /> },
    { label: "Referral Balance", value: "₹0.00", sub: "From referrals", color: "from-purple-500 to-violet-600", icon: <Users className="w-5 h-5" /> },
  ];

  const quickLinks = [
    { to: "/dashboard/pocket-money", icon: "📸", title: "Browse Tasks", desc: "Pick a social media task to earn money", label: "PocketMoney" },
    { to: "/dashboard/deal-sell", icon: "🎟️", title: "Get Coupon Codes", desc: "Generate coupons & earn commission per sale", label: "DealSell" },
    { to: "/dashboard/referral", icon: "🤝", title: "Refer & Earn", desc: "Share your code, earn 10% of their earnings", label: "Referral" },
    { to: "/dashboard/wallet", icon: "💸", title: "Request Payout", desc: "Withdraw earnings to UPI or bank account", label: "Wallet" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Welcome */}
      <div className="mb-7">
        <h1 className="font-display font-extrabold text-2xl text-brand-forest mb-1">
          Welcome, {name} 👋
        </h1>
        <p className="text-sm text-brand-text-dim">Your DopeDeal dashboard. Start earning by picking tasks or sharing coupon codes.</p>
      </div>

      {/* Verification banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 mb-7">
        <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-amber-800 text-sm mb-0.5">Profile Verification Pending</div>
          <p className="text-xs text-amber-700/70">Submit your social media handle for admin review. Once approved (6–12 hrs), PocketMoney and DealSell panels will unlock.</p>
        </div>
        <Link
          to="/dashboard/profile"
          className="shrink-0 text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded-xl hover:bg-amber-600 transition-colors"
        >
          Complete Profile
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {stats.map((s, i) => (
          <div key={i} className="bg-white border border-brand-border rounded-2xl p-4">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3`}>
              {s.icon}
            </div>
            <div className="font-display font-black text-xl text-brand-forest">{s.value}</div>
            <div className="text-xs font-semibold text-brand-text-dim mt-0.5">{s.label}</div>
            <div className="text-[10px] text-brand-text-faint mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="mb-6">
        <div className="text-xs font-mono font-semibold text-brand-text-faint uppercase tracking-widest mb-3">Quick Access</div>
        <div className="grid sm:grid-cols-2 gap-3">
          {quickLinks.map((q, i) => (
            <Link
              key={i}
              to={q.to}
              className="bg-white border border-brand-border rounded-2xl p-4 flex items-center gap-4 hover:border-brand-green/40 hover:shadow-md hover:shadow-brand-green/8 hover:-translate-y-0.5 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-surface2 flex items-center justify-center text-2xl shrink-0">{q.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm text-brand-text">{q.title}</span>
                  <span className="text-[9px] font-mono bg-brand-green/10 text-brand-green-dim px-1.5 py-0.5 rounded-full font-semibold">{q.label}</span>
                </div>
                <div className="text-xs text-brand-text-faint">{q.desc}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-brand-text-faint shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Browse legacy deals */}
      <div className="bg-brand-surface2 border border-brand-border rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-brand-text-dim">Explore Deals Marketplace</div>
          <div className="text-xs text-brand-text-faint">Browse offers, super deals & campaign pages</div>
        </div>
        <Link
          to="/deals"
          className="text-xs font-bold text-brand-green-dim border border-brand-green/30 bg-brand-green/6 px-3 py-1.5 rounded-xl hover:bg-brand-green/12 transition-colors"
        >
          Browse Deals →
        </Link>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD LAYOUT ────────────────────────────────────────────────────
export default function Dashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Determine if we're at the root dashboard
  const isOverview = location.pathname === "/dashboard";

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#F7FAF8" }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col shrink-0 border-r border-brand-border shadow-lg shadow-brand-forest/5" style={{ position: "sticky", top: 0, height: "100vh" }}>
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50 flex lg:hidden shadow-2xl"
            >
              <Sidebar mobile onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-brand-border px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-brand-text-dim hover:text-brand-text"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="lg:hidden font-display font-black text-brand-forest">DopeDeal</div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <button className="relative w-8 h-8 flex items-center justify-center rounded-xl hover:bg-brand-surface2 transition-colors text-brand-text-dim">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-green" />
            </button>
            <Link
              to="/"
              className="hidden sm:block text-xs font-semibold text-brand-text-dim hover:text-brand-text border border-brand-border rounded-xl px-3 py-1.5 transition-colors"
            >
              ← Home
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {isOverview ? <DashboardOverview /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
