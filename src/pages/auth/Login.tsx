import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!phone.trim() || !password) {
      setError("Please enter your mobile number and password.");
      return;
    }
    setLoading(true);
    try {
      const email = `${phone.replace(/\D/g, "")}@dopedeal.store`;
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#F7FAF8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-green opacity-[0.06] blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-brand-teal opacity-[0.05] blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="relative w-full max-w-sm mx-auto px-4 py-12">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-green to-brand-green-dim flex items-center justify-center font-display font-black text-sm text-brand-forest shadow-lg shadow-brand-green/25">DD</div>
          <span className="font-display font-black text-xl text-brand-forest">DopeDeal</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-brand-border rounded-3xl shadow-lg shadow-brand-forest/5 p-7"
        >
          <div className="mb-6">
            <h2 className="font-display font-extrabold text-2xl text-brand-forest mb-1">Welcome Back</h2>
            <p className="text-sm text-brand-text-dim">Login to your DopeDeal account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Mobile Number</label>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-brand-text-dim">Password</label>
                <button type="button" className="text-xs text-brand-green-dim hover:underline">Forgot?</button>
              </div>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPass ? "text" : "password"}
                  placeholder="Your password"
                  required
                  className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-text outline-none focus:border-brand-green transition-colors pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-faint">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-forest to-brand-forest-mid text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand-forest/25 transition-all disabled:opacity-50"
            >
              {loading ? "Logging in..." : <><span>Login</span><ArrowRight className="w-4 h-4" /></>}
            </button>

            <p className="text-center text-xs text-brand-text-faint">
              New to DopeDeal?{" "}
              <Link to="/auth/register" className="text-brand-green-dim font-semibold hover:underline">Create Free Account</Link>
            </p>
          </form>
        </motion.div>

        <p className="text-center text-xs text-brand-text-faint mt-6">
          🇮🇳 Made in India · <Link to="/" className="underline">Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
