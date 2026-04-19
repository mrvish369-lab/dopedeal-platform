import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface WalletBalances {
  available_balance: number;
  pending_balance: number;
  referral_balance: number;
  total_earned: number;
}

interface CheckinStatus {
  canCheckin: boolean;
  streak: number;
  nextCheckinAt: Date | null;
  lastCheckinDate: string | null;
}

interface CheckinResult {
  success: boolean;
  coins?: number;
  streak?: number;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  wallet: WalletBalances | null;
  isVerified: boolean;
  checkinStatus: CheckinStatus;
  // Email OTP auth (free — no SMS provider needed) + Telegram support
  sendOtp: (email: string, options?: { telegram_chat_id?: string }) => Promise<{ error: string | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  performDailyCheckin: () => Promise<CheckinResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

/** Normalise phone to E.164 +91XXXXXXXXXX */
export const toE164 = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
};

/** All localStorage keys written by session.ts — must be cleared on sign-out. */
const SESSION_STORAGE_KEYS = [
  "dopedeal_session_id",
  "dopedeal_session_created_at",
  "dopedeal_anonymous_id",
  "dopedeal_session_shop_id",
  "dopedeal_session_batch_id",
  "dopedeal_session_qr_type",
  "dopedeal_session_campaign_slug",
  "dopedeal_session_qr_url",
];

/** Client-side OTP cooldown: minimum seconds between requests per email. */
const OTP_COOLDOWN_MS = 60_000; // 60 seconds

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletBalances | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus>({
    canCheckin: false,
    streak: 0,
    nextCheckinAt: null,
    lastCheckinDate: null,
  });

  // Track last OTP send time per email to enforce client-side cooldown
  const otpLastSentRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchWallet(session.user.id);
            fetchVerificationStatus(session.user.id);
            fetchCheckinStatus(session.user.id);
          }, 0);
        } else {
          setWallet(null);
          setIsVerified(false);
          setCheckinStatus({
            canCheckin: false,
            streak: 0,
            nextCheckinAt: null,
            lastCheckinDate: null,
          });
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchWallet(session.user.id);
        fetchVerificationStatus(session.user.id);
        fetchCheckinStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchWallet = async (userId: string) => {
    // Try dd_wallet_balances view first (maps user_wallets columns)
    const { data } = await supabase
      .from("user_wallets" as never)
      .select("coins_balance,total_earned,total_spent")
      .eq("user_id", userId)
      .single();
    if (data) {
      const d = data as { coins_balance: number; total_earned: number; total_spent: number };
      setWallet({
        available_balance: d.coins_balance ?? 0,
        pending_balance: 0,
        referral_balance: 0,
        total_earned: d.total_earned ?? 0,
      });
    } else {
      setWallet({ available_balance: 0, pending_balance: 0, referral_balance: 0, total_earned: 0 });
    }
  };

  const fetchVerificationStatus = async (userId: string) => {
    const { data } = await supabase
      .from("dd_social_profiles")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle(); // use maybeSingle so no error when row doesn't exist
    setIsVerified(data?.status === "approved");
  };

  const fetchCheckinStatus = async (userId: string) => {
    try {
      // Get the last checkin record
      const { data: lastCheckin } = await supabase
        .from("daily_checkins")
        .select("checkin_date, streak_day")
        .eq("user_id", userId)
        .order("checkin_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!lastCheckin) {
        // No checkins yet - user can checkin
        setCheckinStatus({
          canCheckin: true,
          streak: 0,
          nextCheckinAt: null,
          lastCheckinDate: null,
        });
        return;
      }

      const lastCheckinDate = lastCheckin.checkin_date;
      const canCheckin = lastCheckinDate !== today;

      // Calculate next checkin time (midnight of next day)
      let nextCheckinAt: Date | null = null;
      if (!canCheckin) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        nextCheckinAt = tomorrow;
      }

      setCheckinStatus({
        canCheckin,
        streak: lastCheckin.streak_day || 0,
        nextCheckinAt,
        lastCheckinDate,
      });
    } catch (error) {
      console.error("Error fetching checkin status:", error);
      // Set safe defaults on error
      setCheckinStatus({
        canCheckin: false,
        streak: 0,
        nextCheckinAt: null,
        lastCheckinDate: null,
      });
    }
  };

  const performDailyCheckin = async (): Promise<CheckinResult> => {
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      // Call the database function to process checkin
      const { data, error } = await supabase.rpc("process_daily_checkin", {
        p_user_id: user.id,
      });

      if (error) {
        console.error("Checkin error:", error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        return { success: false, error: data.error || "Failed to check in" };
      }

      // Refresh wallet and checkin status
      await fetchWallet(user.id);
      await fetchCheckinStatus(user.id);

      return {
        success: true,
        coins: data.coins_earned,
        streak: data.streak_day,
      };
    } catch (error) {
      console.error("Checkin error:", error);
      return { success: false, error: "Something went wrong. Please try again." };
    }
  };

  /** Extract the real error body from a Supabase FunctionsHttpError */
  const extractFnError = async (error: unknown): Promise<string> => {
    try {
      const ctx = (error as { context?: Response })?.context;
      if (ctx?.json) {
        const body = await ctx.json();
        if (body?.error) return body.error;
      }
    } catch {}
    return (error as Error)?.message ?? "Something went wrong. Please try again.";
  };

  /**
   * Send email OTP via Edge Function → Resend API or Telegram.
   * Enforces a 60-second client-side cooldown per email address.
   */
  const sendOtp = async (
    email: string,
    options?: { telegram_chat_id?: string }
  ): Promise<{ error: string | null }> => {
    const normalizedEmail = email.trim().toLowerCase();

    // Client-side rate limit check
    const lastSent = otpLastSentRef.current.get(normalizedEmail) ?? 0;
    const elapsed = Date.now() - lastSent;
    if (elapsed < OTP_COOLDOWN_MS) {
      const remaining = Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000);
      return { error: `Please wait ${remaining} seconds before requesting another OTP.` };
    }

    const { data, error } = await supabase.functions.invoke("send-otp", {
      body: { 
        email: normalizedEmail,
        telegram_chat_id: options?.telegram_chat_id,
      },
    });

    if (error) {
      const msg = await extractFnError(error);
      // On rate-limit from server (429), still update the cooldown timer
      otpLastSentRef.current.set(normalizedEmail, Date.now());
      return { error: msg };
    }
    if (data?.error) return { error: data.error };

    // Record successful send time
    otpLastSentRef.current.set(normalizedEmail, Date.now());
    return { error: null };
  };

  /** Verify OTP via Edge Function, then create real Supabase session */
  const verifyOtp = async (email: string, otp: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.functions.invoke("verify-otp", {
      body: { email: email.trim().toLowerCase(), otp },
    });
    if (error) return { error: await extractFnError(error) };
    if (data?.error) return { error: data.error };

    // Use the hashed token from the edge function to create a real client session
    const { error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: data.token_hash,
      type: "email",
    });
    if (sessionError) return { error: sessionError.message };

    // Auto-create profile row if first sign-in
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: existing } = await supabase
        .from("dd_user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("dd_user_profiles").insert({
          user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name ?? null,
          city: user.user_metadata?.city ?? null,
          phone: user.user_metadata?.phone ?? null,
        });
        // Send welcome email for new users (fire-and-forget)
        supabase.functions.invoke("send-email", {
          body: {
            type: "welcome",
            to: user.email,
            name: user.user_metadata?.full_name ?? "there",
          },
        }).catch(() => {});
      }
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();

    // Clear all session-related localStorage keys to prevent stale data leakage
    SESSION_STORAGE_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore storage errors
      }
    });

    setUser(null);
    setSession(null);
    setWallet(null);
    setIsVerified(false);
    setCheckinStatus({
      canCheckin: false,
      streak: 0,
      nextCheckinAt: null,
      lastCheckinDate: null,
    });
  };

  const refreshWallet = async () => {
    if (user) await fetchWallet(user.id);
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading, wallet, isVerified, checkinStatus,
      sendOtp, verifyOtp, signOut, refreshWallet, performDailyCheckin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
