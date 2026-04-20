import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log("ProtectedRoute check:", { user: user?.email, loading, path: location.pathname });
  }, [user, loading, location.pathname]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-surface to-brand-surface2">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-green to-brand-teal flex items-center justify-center font-display font-black text-brand-forest text-xl shadow-lg shadow-brand-green/30 mx-auto mb-4 animate-pulse">
            DD
          </div>
          <div className="text-sm font-semibold text-brand-text-dim">Loading...</div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log("No user found, redirecting to login");
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}
