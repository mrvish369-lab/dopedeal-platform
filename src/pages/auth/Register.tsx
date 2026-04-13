import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Eye, EyeOff, BadgeCheck, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Step = "details" | "verify";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || "";

  const [step, setStep] = useState<Step>("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [referral, setReferral] = useState(refCode);
  const [otp, setOtp] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState("");

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !phone.trim() || !password) {
      setError("Please fill all required fields.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    try {
      // Use Supabase signUp with email derived from phone for now
      // In production, use Firebase Phone Auth or Supabase Phone OTP
      const email = `${phone.replace(/\D/g, "")}@dopedeal.store`;
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            city,
            referral_code: referral,
            phone,
          },
        },
      });
      if (signUpError) throw signUpError;
      setStep("verify");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // In V1, skip OTP if using email-based auth — just navigate to dashboard
    // Full phone OTP will be implemented with Firebase Auth in V2
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    navigate("/dashboard");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#F7FAF8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* BG decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-green opacity-[0.06] blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-brand-teal opacity-[0.05] blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="relative w-full max-w-md mx-auto px-4 py-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-green to-brand-green-dim flex items-center justify-center font-display font-black text-sm text-brand-forest shadow-lg shadow-brand-green/25">DD</div>
          <span className="font-display font-black text-xl text-brand-forest">DopeDeal</span>
        </Link>

        <div className="bg-white border border-brand-border rounded-3xl shadow-lg shadow-brand-forest/5 p-7">
          {/* Progress */}
          <div className="flex items-center gap-3 mb-7">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              step === "details" ? "bg-brand-green border-brand-green text-white" : "bg-brand-green/10 border-brand-green text-brand-green-dim"
            }`}>
              {step === "verify" ? <BadgeCheck className="w-4 h-4" /> : "1"}
            </div>
            <div className={`flex-1 h-0.5 rounded-full transition-all ${step === "verify" ? "bg-brand-green" : "bg-brand-border"}`} />
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              step === "verify" ? "bg-brand-green border-brand-green text-white" : "border-brand-border text-brand-text-faint"
            }`}>2</div>
          </div>

          <AnimatePresence mode="wait">
            {step === "details" && (
              <motion.form
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSendOTP}
                className="space-y-4"
              >
                <div>
                  <h2 className="font-display font-extrabold text-2xl text-brand-forest mb-1">Create Account</h2>
                  <p className="text-sm text-brand-text-dim">Join free. Start earning within 24 hours.</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Full Name *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Kumar"
                    required
                    className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-text outline-none focus:border-brand-green transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Mobile Number *</label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 bg-brand-surface2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text-dim shrink-0">
                      <Phone className="w-3.5 h-3.5" /> +91
                    </div>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      type="tel"
                      required
                      className="flex-1 border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-text outline-none focus:border-brand-green transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">City</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Mumbai"
                    className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-text outline-none focus:border-brand-green transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Password *</label>
                  <div className="relative">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPass ? "text" : "password"}
                      placeholder="Create a strong password"
                      required
                      className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-text outline-none focus:border-brand-green transition-colors pr-10"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-faint">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Referral Code (optional)</label>
                  <input
                    value={referral}
                    onChange={(e) => setReferral(e.target.value)}
                    placeholder="DOPE-XXXX"
                    className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-text outline-none focus:border-brand-green transition-colors font-mono"
                  />
                </div>

                {error && (
                  <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-brand-forest to-brand-forest-mid text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand-forest/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating Account..." : <><span>Continue</span><ArrowRight className="w-4 h-4" /></>}
                </button>

                <p className="text-center text-xs text-brand-text-faint">
                  Already have an account?{" "}
                  <Link to="/auth/login" className="text-brand-green-dim font-semibold hover:underline">Login</Link>
                </p>
              </motion.form>
            )}

            {step === "verify" && (
              <motion.form
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleVerify}
                className="space-y-5"
              >
                <div>
                  <h2 className="font-display font-extrabold text-2xl text-brand-forest mb-1">Check Your Email</h2>
                  <p className="text-sm text-brand-text-dim">
                    We've sent a verification link to{" "}
                    <strong className="text-brand-text">{phone.replace(/\D/g, "")}@dopedeal.store</strong>
                  </p>
                </div>

                <div className="bg-brand-green/6 border border-brand-green/20 rounded-2xl p-4 text-sm text-brand-green-dim">
                  ✅ Account created! Click the link in your email to verify, or proceed to your dashboard and complete verification later.
                </div>

                {error && (
                  <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-brand-green to-brand-green-dim text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? "Entering Dashboard..." : <><span>Go to My Dashboard</span><ArrowRight className="w-4 h-4" /></>}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="w-full flex items-center justify-center gap-2 text-sm text-brand-text-dim hover:text-brand-text transition-colors py-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-brand-text-faint mt-6">
          By joining, you agree to our{" "}
          <Link to="/legal/terms" className="underline">Terms</Link>
          {" "}and{" "}
          <Link to="/legal/privacy" className="underline">Privacy Policy</Link>
          . 🇮🇳 Made in India.
        </p>
      </div>
    </div>
  );
}
