import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface WalletBalances {
  available_balance: number;
  pending_balance: number;
  referral_balance: number;
  total_earned: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  wallet: WalletBalances | null;
  isVerified: boolean;
  // Email OTP auth (free — no SMS provider needed)
  sendOtp: (email: string) => Promise<{ error: string | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshWallet: () => Promise<void>;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletBalances | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchWallet(session.user.id);
            fetchVerificationStatus(session.user.id);
          }, 0);
        } else {
          setWallet(null);
          setIsVerified(false);
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
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchWallet = async (userId: string) => {
    const { data } = await supabase
      .from("dd_wallet_balances" as never)
      .select("available_balance,pending_balance,referral_balance,total_earned")
      .eq("user_id", userId)
      .single();
    if (data) setWallet(data as WalletBalances);
    else setWallet({ available_balance: 0, pending_balance: 0, referral_balance: 0, total_earned: 0 });
  };

  const fetchVerificationStatus = async (userId: string) => {
    const { data } = await supabase
      .from("dd_social_profiles")
      .select("status")
      .eq("user_id", userId)
      .single();
    setIsVerified(data?.status === "approved");
  };

  /** Send email OTP via Edge Function → Resend API (bypasses Supabase SMTP entirely) */
  const sendOtp = async (email: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.functions.invoke("send-otp", {
      body: { email },
    });
    if (error) return { error: error.message };
    if (data?.error) return { error: data.error };
    return { error: null };
  };

  /** Verify OTP via Edge Function, then create real Supabase session */
  const verifyOtp = async (email: string, otp: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.functions.invoke("verify-otp", {
      body: { email, otp },
    });
    if (error) return { error: error.message };
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
        .single();

      if (!existing) {
        await supabase.from("dd_user_profiles").insert({
          user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name ?? null,
          city: user.user_metadata?.city ?? null,
          phone: user.user_metadata?.phone ?? null,
        });
      }
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setWallet(null);
    setIsVerified(false);
  };

  const refreshWallet = async () => {
    if (user) await fetchWallet(user.id);
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading, wallet, isVerified,
      sendOtp, verifyOtp, signOut, refreshWallet,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
