import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// ── New v2 pages ────────────────────────────────────────────────────────────
import Landing from "./pages/Landing";
import Join from "./pages/Join";
import AuthRegister from "./pages/auth/Register";
import AuthLogin from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import PocketMoney from "./pages/dashboard/PocketMoney";
import DealSell from "./pages/dashboard/DealSell";
import DashWallet from "./pages/dashboard/Wallet";
import DashReferral from "./pages/dashboard/Referral";
import DashProfile from "./pages/dashboard/Profile";
import DashLeaderboard from "./pages/dashboard/Leaderboard";

// ── Legacy / secondary pages ────────────────────────────────────────────────
import Start from "./pages/Start";
import Offers from "./pages/Offers";
import LighterOffers from "./pages/LighterOffers";
import CategoryDeals from "./pages/CategoryDeals";
import SuperDeals from "./pages/SuperDeals";
import SuperDealDetail from "./pages/SuperDealDetail";
import BannerLanding from "./pages/BannerLanding";
import Legal from "./pages/Legal";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import OfferCardDetail from "./pages/OfferCardDetail";

// Admin Pages
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminShops from "./pages/admin/Shops";
import ShopDetail from "./pages/admin/ShopDetail";
import AdminQRCodes from "./pages/admin/QRCodes";
import AdminQuizzes from "./pages/admin/Quizzes";
import AdminSettings from "./pages/admin/Settings";
import AdminLogs from "./pages/admin/Logs";
import OfferBuilder from "./pages/admin/OfferBuilder";
import OfferCards from "./pages/admin/OfferCards";
import Banners from "./pages/admin/Banners";
import Analytics from "./pages/admin/Analytics";
import Affiliates from "./pages/admin/Affiliates";
import FraudAlerts from "./pages/admin/FraudAlerts";
import Reports from "./pages/admin/Reports";
import Brands from "./pages/admin/Brands";
import Regions from "./pages/admin/Regions";
import Compliance from "./pages/admin/Compliance";
import SystemHealth from "./pages/admin/SystemHealth";
import GeoIntelligence from "./pages/admin/GeoIntelligence";
import RecommendationSettings from "./pages/admin/RecommendationSettings";
import SuperDealsAdmin from "./pages/admin/SuperDealsAdmin";
import UserManagement from "./pages/admin/UserManagement";
import CoinSettings from "./pages/admin/CoinSettings";
import Leads from "./pages/admin/Leads";
import Products from "./pages/admin/Products";
import VerificationQueue from "./pages/admin/VerificationQueue";
import DealSellProducts from "./pages/admin/DealSellProducts";
import TaskQueue from "./pages/admin/TaskQueue";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Provides admin auth context to all nested /admin routes
const AdminRouteRoot = () => (
  <ErrorBoundary>
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  </ErrorBoundary>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              {/* ── Primary v2 Routes ─────────────────────────────────── */}
              <Route path="/" element={<Landing />} />
              <Route path="/join/:referralCode" element={<Join />} />
              <Route path="/auth/register" element={<AuthRegister />} />
              <Route path="/auth/login" element={<AuthLogin />} />

              {/* Dashboard (protected shell + nested sub-pages) */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
                <Route path="pocket-money" element={<PocketMoney />} />
                <Route path="deal-sell" element={<DealSell />} />
                <Route path="wallet" element={<DashWallet />} />
                <Route path="referral" element={<DashReferral />} />
                <Route path="profile" element={<DashProfile />} />
                <Route path="leaderboard" element={<DashLeaderboard />} />
              </Route>

              {/* ── Legacy / secondary routes ─────────────────────────── */}
              <Route path="/deals" element={<LighterOffers />} />
              <Route path="/start" element={<Start />} />
              <Route path="/start/:campaignSlug" element={<Start />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/super-deals" element={<SuperDeals />} />
              <Route path="/super-deals/:dealId" element={<SuperDealDetail />} />
              <Route path="/category/:category" element={<CategoryDeals />} />
              <Route path="/offer/:cardId" element={<OfferCardDetail />} />
              <Route path="/banner/:bannerId" element={<BannerLanding />} />
              <Route path="/legal/:slug" element={<Legal />} />
              <Route path="/support" element={<Support />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRouteRoot />}>
              <Route path="login" element={<AdminLogin />} />
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="coin-settings" element={<CoinSettings />} />
              <Route path="leads" element={<Leads />} />
              <Route path="products" element={<Products />} />
              <Route path="verification-queue" element={<VerificationQueue />} />
              <Route path="dealsell-products" element={<DealSellProducts />} />
              <Route path="task-queue" element={<TaskQueue />} />
              <Route path="shops" element={<AdminShops />} />
              <Route path="shops/:shopId" element={<ShopDetail />} />
              <Route path="qr-codes" element={<AdminQRCodes />} />
              <Route path="quizzes" element={<AdminQuizzes />} />
              <Route path="offer-builder" element={<OfferBuilder />} />
              <Route path="offer-cards" element={<OfferCards />} />
              <Route path="banners" element={<Banners />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="affiliates" element={<Affiliates />} />
              <Route path="fraud-alerts" element={<FraudAlerts />} />
              <Route path="reports" element={<Reports />} />
              <Route path="brands" element={<Brands />} />
              <Route path="regions" element={<Regions />} />
              <Route path="compliance" element={<Compliance />} />
              <Route path="system-health" element={<SystemHealth />} />
              <Route path="geo-intelligence" element={<GeoIntelligence />} />
              <Route path="recommendation-settings" element={<RecommendationSettings />} />
              <Route path="super-deals" element={<SuperDealsAdmin />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="logs" element={<AdminLogs />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
</QueryClientProvider>
);

export default App;
