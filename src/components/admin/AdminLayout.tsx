import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Store,
  QrCode,
  HelpCircle,
  Settings,
  LogOut,
  Activity,
  Layers,
  BarChart3,
  Link as LinkIcon,
  Shield,
  Building2,
  MapPin,
  FileText,
  Map,
  CreditCard,
  Image,
  Sparkles,
  Gift,
  Users,
  Coins,
  Phone,
  Package,
  Menu,
  X,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { path: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { path: "/admin/reports", label: "Reports", icon: FileText },
    ],
  },
  {
    title: "Content Management",
    items: [
      { path: "/admin/offer-cards", label: "Offer Cards", icon: CreditCard },
      { path: "/admin/super-deals", label: "Super Deals", icon: Gift },
      { path: "/admin/offer-builder", label: "Offer Builder", icon: Layers },
      { path: "/admin/banners", label: "Hero Banners", icon: Image },
      { path: "/admin/quizzes", label: "Quizzes", icon: HelpCircle },
      { path: "/admin/recommendation-settings", label: "AI Recommendations", icon: Sparkles },
    ],
  },
  {
    title: "User Management",
    items: [
      { path: "/admin/users", label: "Users", icon: Users },
      { path: "/admin/leads", label: "Leads", icon: Phone },
      { path: "/admin/coin-settings", label: "Coin Settings", icon: Coins },
    ],
  },
  {
    title: "Shop & Products",
    items: [
      { path: "/admin/shops", label: "Shops", icon: Store },
      { path: "/admin/products", label: "Products", icon: Package },
      { path: "/admin/qr-codes", label: "QR Codes", icon: QrCode },
      { path: "/admin/geo-intelligence", label: "Geo Intelligence", icon: Map },
    ],
  },
  {
    title: "Business",
    items: [
      { path: "/admin/affiliates", label: "Affiliates", icon: LinkIcon },
      { path: "/admin/brands", label: "Brands", icon: Building2 },
      { path: "/admin/regions", label: "Regions", icon: MapPin },
    ],
  },
  {
    title: "System",
    items: [
      { path: "/admin/system-health", label: "System Health", icon: Activity },
      { path: "/admin/fraud-alerts", label: "Fraud Alerts", icon: Shield },
      { path: "/admin/compliance", label: "Compliance", icon: FileText },
      { path: "/admin/logs", label: "Logs", icon: Activity },
      { path: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, signOut, isLoading, isAdmin, authError, refetchAuth } = useAdminAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on navigation (mobile)
  const handleNavClick = () => {
    setIsSidebarOpen(false);
  };

  // Show loading state while auth is being checked (with timeout hint)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-green/5 via-background to-brand-teal/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brand-text font-medium">Verifying admin access...</p>
          <p className="text-xs text-brand-text-dim mt-2">This should take just a moment</p>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-green/5 via-background to-brand-teal/5 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-brand-forest mb-2">Connection Issue</h1>
          <p className="text-brand-text-dim mb-6">{authError}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={refetchAuth} className="bg-brand-green hover:bg-brand-green-dim text-white">
              Try Again
            </Button>
            <Link to="/admin/login">
              <Button variant="outline" className="border-brand-border">Go to Login</Button>
            </Link>
          </div>
          <p className="text-xs text-brand-text-faint mt-4">
            If this keeps happening, try refreshing the page or clearing your browser cache.
          </p>
        </div>
      </div>
    );
  }

  // If we somehow ended up with no loading state but admin status is still unknown,
  // don't show "Access Denied" (null does not mean false).
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-green/5 via-background to-brand-teal/5 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-brand-forest mb-2">Verifying admin access…</h1>
          <p className="text-brand-text-dim mb-6">Please wait a moment, then try again if needed.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={refetchAuth} className="bg-brand-green hover:bg-brand-green-dim text-white">
              Retry Check
            </Button>
            <Link to="/admin/login">
              <Button variant="outline" className="border-brand-border">Go to Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-green/5 via-background to-brand-teal/5 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand-forest mb-4">Access Denied</h1>
          <p className="text-brand-text-dim mb-6">You don't have admin privileges</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={refetchAuth} variant="outline" className="border-brand-border">
              Retry Check
            </Button>
            <Link to="/admin/login">
              <Button className="bg-brand-green hover:bg-brand-green-dim text-white">Go to Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-green/5 via-background to-brand-teal/5 flex">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-brand-border px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-green to-brand-teal flex items-center justify-center font-display font-black text-white text-xs shadow-md">
            DD
          </div>
          <div>
            <h1 className="text-sm font-display font-black text-brand-forest">DopeDeal</h1>
            <p className="text-[10px] text-brand-text-faint">Admin Panel</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-brand-forest"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "w-64 bg-white border-r border-brand-border flex flex-col shadow-sm",
          "fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-brand-border">
          <Link to="/admin" className="block" onClick={handleNavClick}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-green to-brand-teal flex items-center justify-center font-display font-black text-white text-sm shadow-lg shadow-brand-green/30">
                DD
              </div>
              <div>
                <h1 className="text-xl font-display font-black text-brand-forest">DopeDeal</h1>
                <p className="text-xs text-brand-text-faint">Admin Panel</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="px-4 text-xs font-semibold text-brand-text-faint uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={handleNavClick}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium",
                        isActive
                          ? "bg-brand-green text-white shadow-md shadow-brand-green/20"
                          : "text-brand-text-dim hover:text-brand-forest hover:bg-brand-green/5"
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-brand-border bg-brand-green/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-green to-brand-teal flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-forest truncate">
                {user?.email}
              </p>
              <p className="text-xs text-brand-text-faint">Super Admin</p>
            </div>
          </div>
          <Button
            onClick={signOut}
            variant="outline"
            className="w-full justify-start gap-2 border-brand-border hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">{children}</div>
      </main>
    </div>
  );
};
