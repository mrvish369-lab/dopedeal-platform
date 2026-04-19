import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Mail, Shield, CheckCircle, User, MapPin, Phone, Send } from "lucide-react";
import { useAuth, toE164 } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Step = "details" | "otp" | "done";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") ?? "";
  const { sendOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<Step>("details");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    referralCode: refCode,
  });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useEmail, setUseEmail] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // ── Step 1: Validate & Send OTP ──────────────────────────────────────────
  const handleSendOtp = async () => {
    setError(null);
    if (!form.fullName.trim()) return setError("Please enter your full name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return setError("Enter a valid email address");
    
    setLoading(true);

    if (useEmail) {
      const { error: err } = await sendOtp(form.email.trim().toLowerCase());
      setLoading(false);
      if (err) return setError(err);
      setStep("otp");
    } else {
      const { data, error: err } = await supabase.functions.invoke("generate-telegram-token", {
        body: { email: form.email.trim().toLowerCase() },
      });
      
      setLoading(false);
      
      if (err || data?.error) {
        return setError(err?.message || data?.error || "Failed to generate Telegram link");
      }

      const botUsername = "DopeDealOTPBot";
      const telegramUrl = `https://t.me/${botUsername}?start=${data.token}`;
      window.open(telegramUrl, '_blank');
      setStep("otp");
    }
  };

  // ── Step 2: Verify OTP & save profile ────────────────────────────────────
  const handleVerifyOtp = async () => {
    setError(null);
    if (otp.length < 6) return setError("Enter the 6-digit OTP sent to your email");
    setLoading(true);

    const { error: err } = await verifyOtp(form.email.trim().toLowerCase(), otp);
    if (err) { setLoading(false); return setError(err); }

    // Upsert full profile with collected form data
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("dd_user_profiles").upsert({
        user_id: user.id,
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone ? toE164(form.phone) : null,
        city: form.city.trim() || null,
      }, { onConflict: "user_id" });

      // Handle referral
      if (form.referralCode.trim()) {
        const { data: referrer } = await supabase
          .from("dd_user_profiles")
          .select("id, user_id")
          .eq("referral_code", form.referralCode.trim().toUpperCase())
          .single();
        if (referrer) {
          await supabase.from("dd_referrals").insert({
            referrer_id: referrer.user_id,
            referred_id: user.id,
            referral_code: form.referralCode.trim().toUpperCase(),
          }).onConflict("referred_id").ignore();
        }
      }
    }

    setLoading(false);
    setStep("done");
    setTimeout(() => navigate("/dashboard"), 1500);
  };

  const steps: Step[] = ["details", "otp", "done"];
  const stepIdx = steps.indexOf(step);

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

        {/* Step progress */}
        <div className="flex items-center gap-2 mb-6">
          {["Details", "Verify", "Done"].map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < stepIdx ? "bg-brand-green text-white" : i === stepIdx ? "bg-brand-forest text-white" : "bg-gray-100 text-gray-400"
              }`}>
                {i < stepIdx ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[10px] font-semibold ${i === stepIdx ? "text-brand-forest" : "text-gray-400"}`}>{label}</span>
              {i < 2 && <div className={`flex-1 h-0.5 rounded ${i < stepIdx ? "bg-brand-green" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-3xl shadow-xl shadow-brand-forest/8 border border-brand-border p-6"
        >
          {step === "details" && (
            <>
              <h1 className="font-display font-extrabold text-2xl text-brand-forest mb-1">Create Account</h1>
              <p className="text-sm text-brand-text-dim mb-6">Join free. Start earning within 24 hours.</p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Full Name *</label>
                  <div className="flex items-center border border-brand-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-green">
                    <User className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                    <input type="text" value={form.fullName} onChange={(e) => set("fullName", e.target.value)}
                      placeholder="Rahul Kumar" className="flex-1 py-2.5 px-3 text-sm text-gray-900 bg-white focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Email Address * <span className="text-brand-text-faint font-normal">(OTP will be sent here)</span></label>
                  <div className="flex items-center border border-brand-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-green">
                    <Mail className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                    <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                      placeholder="you@example.com" className="flex-1 py-2.5 px-3 text-sm text-gray-900 bg-white focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Mobile Number <span className="text-brand-text-faint font-normal">(optional)</span></label>
                  <div className="flex items-center border border-brand-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-green">
                    <div className="flex items-center gap-1.5 px-3 py-2.5 border-r border-brand-border bg-brand-surface2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm font-semibold text-brand-text-dim">+91</span>
                    </div>
                    <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="9876543210" className="flex-1 py-2.5 px-3 text-sm text-gray-900 bg-white focus:outline-none" maxLength={10} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">City</label>
                  <div className="flex items-center border border-brand-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-green">
                    <MapPin className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                    <input type="text" value={form.city} onChange={(e) => set("city", e.target.value)}
                      placeholder="Mumbai" className="flex-1 py-2.5 px-3 text-sm text-gray-900 bg-white focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Referral Code <span className="text-brand-text-faint font-normal">(optional)</span></label>
                  <input type="text" value={form.referralCode} onChange={(e) => set("referralCode", e.target.value.toUpperCase())}
                    placeholder="DOPE-XXXX" className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green" />
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
                Already have an account? <Link to="/auth/login" className="text-brand-green font-semibold">Login</Link>
              </p>
            </>
          )}

          {step === "otp" && (
            <>
              <button onClick={() => setStep("details")} className="flex items-center gap-1 text-xs text-brand-text-faint mb-4 hover:text-brand-text transition-colors">
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
                  ? <>OTP sent to <span className="font-semibold">{form.email}</span></>
                  : "OTP sent to your Telegram"}
              </p>
              <p className="text-xs text-brand-text-faint mb-6">
                {useEmail 
                  ? "Check your inbox (and spam folder). Valid for 10 minutes."
                  : "Check your Telegram messages. Valid for 10 minutes."}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Enter 6-digit OTP</label>
                  <input
                    type="text" inputMode="numeric" value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="• • • • • •"
                    className="w-full border-2 border-brand-border rounded-2xl px-4 py-3.5 text-center text-2xl font-mono font-bold tracking-[0.5em] text-gray-900 bg-white focus:outline-none focus:border-brand-green"
                    maxLength={6}
                    autoFocus
                  />
                </div>

                {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>}

                <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6}
                  className="w-full bg-brand-green hover:bg-brand-green-dim text-white font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                  {loading ? "Verifying..." : <><span>Verify & Continue</span><ArrowRight className="w-4 h-4" /></>}
                </button>

                <button onClick={() => { setOtp(""); handleSendOtp(); }}
                  className="w-full text-xs text-brand-text-faint hover:text-brand-green transition-colors py-1">
                  Resend OTP
                </button>
              </div>
            </>
          )}

          {step === "done" && (
            <div className="text-center py-4">
              <motion.div
                className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
              >
                <CheckCircle className="w-9 h-9 text-green-500" />
              </motion.div>
              <h2 className="font-display font-extrabold text-xl text-brand-forest mb-1">Welcome to DopeDeal!</h2>
              <p className="text-sm text-brand-text-dim">Redirecting to your dashboard...</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
