import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface WalletData {
  coins_balance: number;
  total_earned: number;
  total_spent: number;
}

interface CheckinStatus {
  canCheckin: boolean;
  lastCheckin: string | null;
  streak: number;
  nextCheckinAt: Date | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  wallet: WalletData | null;
  checkinStatus: CheckinStatus;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  performDailyCheckin: () => Promise<{ success: boolean; coins?: number; streak?: number; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus>({
    canCheckin: true,
    lastCheckin: null,
    streak: 0,
    nextCheckinAt: null,
  });

  // Set up auth state listener FIRST
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer wallet fetch to avoid blocking
          setTimeout(() => {
            fetchWallet(session.user.id);
            fetchCheckinStatus(session.user.id);
          }, 0);
        } else {
          setWallet(null);
          setCheckinStatus({
            canCheckin: true,
            lastCheckin: null,
            streak: 0,
            nextCheckinAt: null,
          });
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchWallet(session.user.id);
        fetchCheckinStatus(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchWallet = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_wallets")
      .select("coins_balance, total_earned, total_spent")
      .eq("user_id", userId)
      .single();

    if (data && !error) {
      setWallet(data);
    }
  };

  const fetchCheckinStatus = async (userId: string) => {
    // Get today's check-in status
    const today = new Date().toISOString().split('T')[0];
    
    const { data: todayCheckin } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", userId)
      .eq("checkin_date", today)
      .single();

    // Get last check-in for streak info
    const { data: lastCheckin } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", userId)
      .order("checkin_date", { ascending: false })
      .limit(1)
      .single();

    if (todayCheckin) {
      // Already checked in today
      const nextCheckin = new Date();
      nextCheckin.setDate(nextCheckin.getDate() + 1);
      nextCheckin.setHours(0, 0, 0, 0);
      
      setCheckinStatus({
        canCheckin: false,
        lastCheckin: todayCheckin.checkin_date,
        streak: todayCheckin.streak_day,
        nextCheckinAt: nextCheckin,
      });
    } else {
      setCheckinStatus({
        canCheckin: true,
        lastCheckin: lastCheckin?.checkin_date || null,
        streak: lastCheckin?.streak_day || 0,
        nextCheckinAt: null,
      });
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setWallet(null);
  };

  const refreshWallet = async () => {
    if (user) {
      await fetchWallet(user.id);
    }
  };

  const performDailyCheckin = async () => {
    if (!user) {
      return { success: false, error: "Not logged in" };
    }

    const { data, error } = await supabase.rpc("process_daily_checkin", {
      p_user_id: user.id,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; coins_earned?: number; streak_day?: number; error?: string };

    if (result.success) {
      // Refresh wallet and checkin status
      await fetchWallet(user.id);
      await fetchCheckinStatus(user.id);
      
      return {
        success: true,
        coins: result.coins_earned,
        streak: result.streak_day,
      };
    }

    return { success: false, error: result.error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        wallet,
        checkinStatus,
        signUp,
        signIn,
        signOut,
        refreshWallet,
        performDailyCheckin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
