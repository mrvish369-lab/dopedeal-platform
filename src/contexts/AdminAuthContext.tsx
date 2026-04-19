import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  clearAdminAccessCache,
  getOrCreateDeviceId,
  isAdminCacheFresh,
  readAdminAccessCache,
  writeAdminAccessCache,
} from "@/lib/adminAuthCache";

interface AdminUser {
  id: string;
  email: string;
}

interface AdminAuthContextType {
  isAdmin: boolean | null;
  isLoading: boolean;
  user: AdminUser | null;
  authError: string | null;
  signOut: () => Promise<void>;
  refetchAuth: () => Promise<void>;
  verifySensitiveAction: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

// Hard fail-safe: max time to wait for the *blocking* auth check.
// (We avoid running blocking checks on every admin navigation.)
const AUTH_CHECK_TIMEOUT_MS = 15000;

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const navigate = useNavigate();

  const authCheckInProgress = useRef(false);
  const failSafeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVerifiedUserIdRef = useRef<string | null>(null);

  const checkIsAdminRpc = useCallback(async () => {
    // Device id is stored client-side only (useful for future device allowlists / auditing).
    // We do NOT trust it for authorization.
    getOrCreateDeviceId();

    const { data, error } = await supabase.rpc("is_admin");

    if (error) return { isAdmin: false, error: error.message };
    return { isAdmin: Boolean(data), error: null };
  }, []);


  type CheckAuthOptions = {
    force?: boolean;
    showLoading?: boolean;
    reason?: "boot" | "signin" | "manual" | "token_refresh";
  };

  const checkAuth = useCallback(
    async (options: CheckAuthOptions = {}) => {
      const { force = false, showLoading = true } = options;

      // Do not re-run expensive checks if we're already verified for this user.
      if (!force && user?.id && isAdmin === true && lastVerifiedUserIdRef.current === user.id) {
        return;
      }

      if (authCheckInProgress.current && !force) return;
      authCheckInProgress.current = true;
      setAuthError(null);

      if (showLoading) setIsLoading(true);

      if (failSafeTimeoutRef.current) clearTimeout(failSafeTimeoutRef.current);
      failSafeTimeoutRef.current = setTimeout(() => {
        if (!authCheckInProgress.current) return;
        authCheckInProgress.current = false;
        setIsLoading(false);
        setAuthError("Authentication check timed out. Please try again.");
      }, AUTH_CHECK_TIMEOUT_MS);

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          // Not logged in
          clearAdminAccessCache();
          lastVerifiedUserIdRef.current = null;
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
          authCheckInProgress.current = false;
          if (failSafeTimeoutRef.current) clearTimeout(failSafeTimeoutRef.current);
          return;
        }

        const nextUser: AdminUser = {
          id: session.user.id,
          email: session.user.email || "",
        };
        setUser(nextUser);

        // 1) Fast-path: use cache (avoids repeated "Verifying admin access..." on navigation)
        const cache = readAdminAccessCache();
        if (!force && isAdminCacheFresh(cache, nextUser.id)) {
          setIsAdmin(cache!.isAdmin);
          setIsLoading(false);
          authCheckInProgress.current = false;
          if (failSafeTimeoutRef.current) clearTimeout(failSafeTimeoutRef.current);

          // Background refresh (non-blocking) to keep things accurate long-term.
          // This does NOT flip UI back to loading and handles failures gracefully.
          void (async () => {
            try {
              const { isAdmin: adminStatus, error: adminErr } = await checkIsAdminRpc();
              
              // On error, keep existing cache - don't disrupt user experience
              if (adminErr) {
                console.warn("Background admin verification failed:", adminErr);
                return;
              }
              
              // Only update if status changed or cache is getting stale
              if (adminStatus !== cache!.isAdmin || Date.now() - cache!.checkedAt > 60000) {
                writeAdminAccessCache({
                  userId: nextUser.id,
                  email: nextUser.email,
                  isAdmin: adminStatus,
                  checkedAt: Date.now(),
                });
                
                // Update state only if status changed
                if (adminStatus !== cache!.isAdmin) {
                  setIsAdmin(adminStatus);
                  lastVerifiedUserIdRef.current = nextUser.id;
                }
              }
            } catch (err) {
              // Silently ignore background failures - user experience remains stable
              console.warn("Background admin check exception:", err);
            }
          })();

          return;
        }

        // 2) Blocking verification (first load, manual refresh, or stale cache)
        const { isAdmin: adminStatus, error: adminErr } = await checkIsAdminRpc();

        if (adminErr) {
          setIsAdmin(null);
          setAuthError("Couldn't verify admin access. Please try again.");
          setIsLoading(false);
          authCheckInProgress.current = false;
          if (failSafeTimeoutRef.current) clearTimeout(failSafeTimeoutRef.current);
          return;
        }

        setIsAdmin(adminStatus);
        lastVerifiedUserIdRef.current = nextUser.id;
        writeAdminAccessCache({
          userId: nextUser.id,
          email: nextUser.email,
          isAdmin: adminStatus,
          checkedAt: Date.now(),
        });

        setIsLoading(false);
        authCheckInProgress.current = false;
        if (failSafeTimeoutRef.current) clearTimeout(failSafeTimeoutRef.current);
      } catch (error: unknown) {
        authCheckInProgress.current = false;
        if (failSafeTimeoutRef.current) clearTimeout(failSafeTimeoutRef.current);

        const errMsg = error instanceof Error ? error.message : String(error);
        console.error("Admin auth check error:", error);

        // Keep previous good state if we already know admin=true (avoid locking admins out on transient errors)
        if (isAdmin === true && user?.id) {
          setIsLoading(false);
          setAuthError(null);
          return;
        }

        setAuthError(
          errMsg.toLowerCase().includes("abort")
            ? "Connection issue. Please try again."
            : "Connection issue. Please check your internet and try again."
        );
        setIsLoading(false);
      }
    },
    [checkIsAdminRpc, isAdmin, user?.id, user?.email]
  );

  useEffect(() => {
    // One-time bootstrap on mount (NOT on every /admin route navigation)
    void checkAuth({ reason: "boot", showLoading: true });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        clearAdminAccessCache();
        lastVerifiedUserIdRef.current = null;
        setIsAdmin(false);
        setUser(null);
        setAuthError(null);
        setIsLoading(false);
        navigate("/admin/login");
        return;
      }

      if (event === "SIGNED_IN") {
        // Re-check once on sign-in. After that, cache prevents re-checks on navigation.
        void checkAuth({ force: true, reason: "signin", showLoading: true });
        return;
      }

      if (event === "TOKEN_REFRESHED") {
        // Silent refresh: keep UI stable.
        void checkAuth({ force: false, reason: "token_refresh", showLoading: false });
      }
    });

    return () => {
      subscription.unsubscribe();
      if (failSafeTimeoutRef.current) clearTimeout(failSafeTimeoutRef.current);
    };
  }, [checkAuth, navigate]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Sign out error:", e);
    }

    clearAdminAccessCache();
    lastVerifiedUserIdRef.current = null;
    setIsAdmin(false);
    setUser(null);
    navigate("/admin/login");
  }, [navigate]);

  const refetchAuth = useCallback(async () => {
    authCheckInProgress.current = false;
    setAuthError(null);
    await checkAuth({ force: true, reason: "manual", showLoading: true });
  }, [checkAuth]);

  /**
   * Verify admin status for sensitive actions.
   * Always performs a fresh RPC check regardless of cache state.
   * Use this before any state-mutating admin operation.
   * 
   * @returns Promise<boolean> - true if user is admin, false otherwise
   */
  const verifySensitiveAction = useCallback(async (): Promise<boolean> => {
    try {
      // Always check session first
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return false;
      }

      // Always perform fresh RPC check - never trust cache for sensitive actions
      const { isAdmin: adminStatus, error: adminErr } = await checkIsAdminRpc();

      if (adminErr || !adminStatus) {
        return false;
      }

      // Update cache with fresh verification result
      writeAdminAccessCache({
        userId: session.user.id,
        email: session.user.email || "",
        isAdmin: adminStatus,
        checkedAt: Date.now(),
      });

      return adminStatus;
    } catch (error) {
      console.error("Sensitive action verification error:", error);
      return false;
    }
  }, [checkIsAdminRpc]);

  return (
    <AdminAuthContext.Provider value={{ isAdmin, isLoading, user, authError, signOut, refetchAuth, verifySensitiveAction }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    return {
      isAdmin: null,
      isLoading: true,
      user: null,
      authError: null,
      signOut: async () => {},
      refetchAuth: async () => {},
      verifySensitiveAction: async () => false,
    };
  }
  return context;
};
