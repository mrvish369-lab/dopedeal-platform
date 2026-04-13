import { ReactNode } from "react";
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
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/leads", label: "Lead Management", icon: Phone },
  { path: "/admin/users", label: "User Management", icon: Users },
  { path: "/admin/coin-settings", label: "Coin Settings", icon: Coins },
  { path: "/admin/products", label: "Products", icon: Package },
  { path: "/admin/shops", label: "Shops", icon: Store },
  { path: "/admin/geo-intelligence", label: "Geo Intelligence", icon: Map },
  { path: "/admin/qr-codes", label: "QR Codes", icon: QrCode },
  { path: "/admin/quizzes", label: "Quizzes", icon: HelpCircle },
  { path: "/admin/offer-builder", label: "Offer Builder", icon: Layers },
  { path: "/admin/offer-cards", label: "Offer Cards", icon: CreditCard },
  { path: "/admin/recommendation-settings", label: "AI Recommendations", icon: Sparkles },
  { path: "/admin/super-deals", label: "Super Deals", icon: Gift },
  { path: "/admin/banners", label: "Hero Banners", icon: Image },
  { path: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/admin/affiliates", label: "Affiliates", icon: LinkIcon },
  { path: "/admin/reports", label: "Reports", icon: BarChart3 },
  { path: "/admin/brands", label: "Brands", icon: Building2 },
  { path: "/admin/regions", label: "Regions", icon: MapPin },
  { path: "/admin/fraud-alerts", label: "Fraud Alerts", icon: Shield },
  { path: "/admin/compliance", label: "Compliance", icon: FileText },
  { path: "/admin/system-health", label: "System Health", icon: Activity },
  { path: "/admin/settings", label: "Settings", icon: Settings },
  { path: "/admin/logs", label: "Logs", icon: Activity },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, signOut, isLoading, isAdmin, authError, refetchAuth } = useAdminAuth();
  const location = useLocation();

  // Show loading state while auth is being checked (with timeout hint)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying admin access...</p>
          <p className="text-xs text-muted-foreground mt-2">This should take just a moment</p>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (authError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Connection Issue</h1>
          <p className="text-muted-foreground mb-6">{authError}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={refetchAuth} className="btn-fire">
              Try Again
            </Button>
            <Link to="/admin/login">
              <Button variant="outline">Go to Login</Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
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
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Verifying admin access…</h1>
          <p className="text-muted-foreground mb-6">Please wait a moment, then try again if needed.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={refetchAuth} className="btn-fire">
              Retry Check
            </Button>
            <Link to="/admin/login">
              <Button variant="outline">Go to Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You don't have admin privileges</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={refetchAuth} variant="outline">
              Retry Check
            </Button>
            <Link to="/admin/login">
              <Button className="btn-fire">Go to Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/admin">
            <h1 className="text-2xl font-bold text-gradient-fire">DopeDeal</h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.email}
              </p>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
          </div>
          <Button
            onClick={signOut}
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};
