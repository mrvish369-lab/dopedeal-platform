import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Mail, Shield, CheckCircle, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Step = "email" | "otp";

export default function Login() {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useEmail, setUseEmail] = useState(false);

  const handleSendOtp = async () => {
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError("Enter a valid email address");
    
    setLoading(true);

    if (useEmail) {
      const { error: err } = await sendOtp(email.trim().toLowerCase());
      setLoading(false);
      if (err) return setError(err);
      setStep("otp");
    } else {
      const { data, error: err } = await supabase.functions.invoke("generate-telegram-token", {
        body: { email: email.trim().toLowerCase() },
      });
      
      setLoading(false);
      
      if (err || data?.error) {
        return setError(err?.message || data?.error || "Failed to generate Telegram link");
      }

      setStep("otp");

      const botUsername = "dopedealbot";
      const telegramUrl = `https://t.me/${botUsername}?start=${data.token}`;
      window.location.href = telegramUrl;
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (otp.length < 6) return setError("Enter the 6-digit OTP sent to your email");
    setLoading(true);
    const { error: err } = await verifyOtp(email.trim().toLowerCase(), otp);
    setLoading(false);
    if (err) return setError(err);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #F7FAF8 0%, #E8F5EE 100%)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-green to-brand-teal flex items-center justify-center font-display font-black text-brand-forest text-sm shadow-lg shadow-brand-green/30">DD</div>
            <span className="font-display font-black text-xl text-brand-forest">DopeDeal</span>
          </Link>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl shadow-xl shadow-brand-forest/8 border border-brand-border p-6"
        >
          {step === "email" && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center mb-4">
                <Send className="w-6 h-6 text-brand-green" />
              </div>
              <h1 className="font-display font-extrabold text-2xl text-brand-forest mb-1">Welcome Back</h1>
              <p className="text-sm text-brand-text-dim mb-6">Enter your email — we'll send a one-time code via Telegram.</p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Email Address</label>
                  <div className="flex items-center border border-brand-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-green">
                    <Mail className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="flex-1 py-2.5 px-3 text-sm text-gray-900 bg-white focus:outline-none"
                      onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                      autoFocus
                    />
                  </div>
                </div>

                {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>}

                <button onClick={handleSendOtp} disabled={loading}
                  className="w-full bg-brand-green hover:bg-brand-green-dim text-white font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                  {loading ? "Sending..." : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send OTP via Telegram</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    onClick={() => setUseEmail(!useEmail)}
                    className="text-[10px] text-brand-text-faint hover:text-brand-text transition-colors"
                  >
                    {useEmail ? "← Use Telegram (Recommended)" : "Use Email (Beta - May not work reliably)"}
                  </button>
                </div>
              </div>

              <p className="text-center text-xs text-brand-text-faint mt-5">
                New to DopeDeal? <Link to="/auth/register" className="text-brand-green font-semibold">Create Account</Link>
              </p>
            </>
          )}

          {step === "otp" && (
            <>
              <button onClick={() => { setStep("email"); setOtp(""); setError(null); }}
                className="flex items-center gap-1 text-xs text-brand-text-faint mb-4 hover:text-brand-text transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-brand-green" />
              </div>
              <h2 className="font-display font-extrabold text-xl text-brand-forest mb-1">
                {useEmail ? "Check Your Email" : "Check Your Telegram"}
              </h2>
              <p className="text-sm text-brand-text-dim mb-1">
                {useEmail 
                  ? <>OTP sent to <span className="font-semibold">{email}</span></>
                  : "Opening Telegram... Get your OTP and come back here"}
              </p>
              <p className="text-xs text-brand-text-faint mb-6">
                {useEmail 
                  ? "Check your inbox (and spam folder). Valid for 10 minutes."
                  : "After getting OTP from Telegram, return to this page and enter it below. Valid for 10 minutes."}
              </p>

              <div className="space-y-4">
                <input
                  type="text" inputMode="numeric" value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="• • • • • •"
                  className="w-full border-2 border-brand-border rounded-2xl px-4 py-3.5 text-center text-2xl font-mono font-bold tracking-[0.5em] text-gray-900 bg-white focus:outline-none focus:border-brand-green"
                  maxLength={6}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                  autoFocus
                />

                {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>}

                <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6}
                  className="w-full bg-brand-green hover:bg-brand-green-dim text-white font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                  {loading ? "Verifying..." : <><CheckCircle className="w-4 h-4" /><span>Verify & Login</span></>}
                </button>

                <button onClick={() => { setOtp(""); handleSendOtp(); }}
                  className="w-full text-xs text-brand-text-faint hover:text-brand-green transition-colors py-1">
                  Resend OTP
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
