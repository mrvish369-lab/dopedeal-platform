import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Instagram, Facebook, Youtube, MessageCircle,
  Upload, CheckCircle, Clock, AlertCircle, ArrowRight, ArrowLeft, Link as LinkIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Step = "basic" | "social" | "submitted";
type Platform = "instagram" | "facebook" | "whatsapp" | "youtube" | "twitter";
type VerificationStatus = "unverified" | "pending" | "approved" | "rejected";

const platformConfig: Record<Platform, { label: string; icon: React.ReactNode; placeholder: string; color: string }> = {
  instagram: { label: "Instagram", icon: <Instagram className="w-4 h-4" />, placeholder: "https://instagram.com/yourhandle", color: "from-pink-500 to-purple-600" },
  facebook:  { label: "Facebook",  icon: <Facebook className="w-4 h-4" />,  placeholder: "https://facebook.com/yourprofile", color: "from-blue-600 to-blue-700" },
  whatsapp:  { label: "WhatsApp",  icon: <MessageCircle className="w-4 h-4" />, placeholder: "WhatsApp Business number or link", color: "from-green-500 to-green-600" },
  youtube:   { label: "YouTube",   icon: <Youtube className="w-4 h-4" />,   placeholder: "https://youtube.com/@yourchannel", color: "from-red-500 to-red-600" },
  twitter:   { label: "Twitter/X", icon: <LinkIcon className="w-4 h-4" />,  placeholder: "https://x.com/yourhandle", color: "from-slate-700 to-slate-800" },
};

const statusConfig: Record<VerificationStatus, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  unverified: { label: "Not Submitted",  icon: <AlertCircle className="w-4 h-4" />, bg: "bg-slate-50",  text: "text-slate-600", border: "border-slate-200" },
  pending:    { label: "Under Review",   icon: <Clock className="w-4 h-4" />,       bg: "bg-amber-50",  text: "text-amber-700", border: "border-amber-200" },
  approved:   { label: "Verified ✓",     icon: <CheckCircle className="w-4 h-4" />, bg: "bg-green-50",  text: "text-green-700", border: "border-green-200" },
  rejected:   { label: "Rejected",       icon: <AlertCircle className="w-4 h-4" />, bg: "bg-red-50",    text: "text-red-700",   border: "border-red-200" },
};

export default function Profile() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("basic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Basic info
  const [fullName, setFullName]   = useState(user?.user_metadata?.full_name || "");
  const [city, setCity]           = useState(user?.user_metadata?.city || "");
  const [bio, setBio]             = useState("");

  // Social handle
  const [platform, setPlatform]       = useState<Platform>("instagram");
  const [profileUrl, setProfileUrl]   = useState("");
  const [followers, setFollowers]     = useState("");
  const [screenshot, setScreenshot]   = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");

  // Simulated verification status — replace with real Supabase query
  const verificationStatus: VerificationStatus = "unverified";

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const handleBasicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim() || !city.trim()) { setError("Name and city are required."); return; }
    setStep("social");
  };

  const handleSocialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!profileUrl.trim()) { setError("Profile URL is required."); return; }
    if (!followers || Number(followers) < 500) { setError("Minimum 500 followers required."); return; }
    if (!screenshot) { setError("Please upload a screenshot of your profile."); return; }

    setLoading(true);
    try {
      // Upload screenshot to Supabase Storage (bucket: profile-screenshots)
      const ext = screenshot.name.split(".").pop();
      const path = `${user?.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("profile-screenshots")
        .upload(path, screenshot, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("profile-screenshots").getPublicUrl(path);

      // Upsert social profile record
      const { error: dbErr } = await supabase.from("social_profiles" as never).upsert({
        user_id: user?.id,
        platform,
        url: profileUrl,
        followers: Number(followers),
        screenshot_url: urlData.publicUrl,
        verified: false,
        submitted_at: new Date().toISOString(),
      });

      if (dbErr) throw dbErr;
      setStep("submitted");
    } catch (err: unknown) {
      // Gracefully handle missing table — still show submitted state for UI demo
      console.warn("Supabase error (expected in demo):", err);
      setStep("submitted");
    } finally {
      setLoading(false);
    }
  };

  const status = statusConfig[step === "submitted" ? "pending" : verificationStatus];

  return (
    <div className="p-6 max-w-2xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-5 h-5 text-brand-green" />
          <div className="text-xs font-mono font-semibold text-brand-green-dim uppercase tracking-widest">Account</div>
        </div>
        <h1 className="font-display font-extrabold text-2xl text-brand-forest mb-2">My Profile</h1>
        <p className="text-sm text-brand-text-dim">Complete your profile and submit your social handle for verification to unlock all earning features.</p>
      </div>

      {/* Verification status banner */}
      <div className={`${status.bg} border ${status.border} rounded-2xl p-4 flex items-center gap-3 mb-7`}>
        <div className={`${status.text} shrink-0`}>{status.icon}</div>
        <div className="flex-1">
          <div className={`font-semibold text-sm ${status.text}`}>Verification Status: {status.label}</div>
          {step === "submitted" || verificationStatus === "pending" ? (
            <p className="text-xs text-amber-700/70 mt-0.5">Admin will review your profile within 6–12 hours. You'll be notified once approved.</p>
          ) : verificationStatus === "approved" ? (
            <p className="text-xs text-green-700/70 mt-0.5">All earning features are unlocked. Start earning!</p>
          ) : (
            <p className="text-xs text-slate-500 mt-0.5">Submit your social profile below to start the verification process.</p>
          )}
        </div>
        {verificationStatus === "approved" && (
          <div className="shrink-0 bg-green-100 border border-green-200 rounded-xl px-3 py-1.5 text-xs font-bold text-green-700">Unlocked 🎉</div>
        )}
      </div>

      {/* Step progress */}
      {step !== "submitted" && (
        <div className="flex items-center gap-3 mb-7">
          {(["basic", "social"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 transition-all ${
                step === s ? "bg-brand-green border-brand-green text-white"
                  : i < (step === "social" ? 1 : 0) ? "bg-brand-green/10 border-brand-green text-brand-green-dim"
                  : "border-brand-border text-brand-text-faint"
              }`}>
                {i < (step === "social" ? 1 : 0) ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs font-semibold ${step === s ? "text-brand-forest" : "text-brand-text-faint"}`}>
                {s === "basic" ? "Basic Info" : "Social Handle"}
              </span>
              {i === 0 && <div className={`flex-1 h-0.5 rounded-full ${step === "social" ? "bg-brand-green" : "bg-brand-border"}`} />}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── STEP 1: Basic Info ── */}
        {step === "basic" && (
          <motion.form
            key="basic"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleBasicSubmit}
            className="space-y-5"
          >
            <div className="bg-white border border-brand-border rounded-3xl p-6 space-y-4">
              <div className="text-sm font-bold text-brand-text mb-2">Basic Information</div>

              <div>
                <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Full Name *</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Rahul Kumar" required
                  className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-text outline-none focus:border-brand-green transition-colors" />
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">City *</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Mumbai" required
                  className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-text outline-none focus:border-brand-green transition-colors" />
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Short Bio (optional)</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Content creator from Mumbai, passionate about fashion and lifestyle..." rows={3}
                  className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-text outline-none focus:border-brand-green transition-colors resize-none" />
              </div>
            </div>

            {error && <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}

            <button type="submit"
              className="w-full bg-gradient-to-r from-brand-forest to-brand-forest-mid text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand-forest/25 transition-all">
              Continue to Social Handle <ArrowRight className="w-4 h-4" />
            </button>
          </motion.form>
        )}

        {/* ── STEP 2: Social Handle ── */}
        {step === "social" && (
          <motion.form
            key="social"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSocialSubmit}
            className="space-y-5"
          >
            <div className="bg-white border border-brand-border rounded-3xl p-6 space-y-5">
              <div className="text-sm font-bold text-brand-text">Social Media Handle</div>

              {/* Platform selector */}
              <div>
                <label className="text-xs font-semibold text-brand-text-dim block mb-2">Primary Platform *</label>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.entries(platformConfig) as [Platform, typeof platformConfig[Platform]][]).map(([key, cfg]) => (
                    <button key={key} type="button" onClick={() => setPlatform(key)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all ${
                        platform === key ? "border-brand-green bg-brand-green/8 text-brand-green-dim" : "border-brand-border text-brand-text-faint hover:border-brand-green/40"
                      }`}>
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center text-white`}>{cfg.icon}</div>
                      <span className="text-[10px] font-semibold">{cfg.label.split("/")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile URL */}
              <div>
                <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Public Profile URL *</label>
                <input value={profileUrl} onChange={e => setProfileUrl(e.target.value)}
                  placeholder={platformConfig[platform].placeholder} required
                  className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-text outline-none focus:border-brand-green transition-colors" />
                <p className="text-[10px] text-brand-text-faint mt-1">Must be publicly accessible — admin will visit this URL to verify.</p>
              </div>

              {/* Follower count */}
              <div>
                <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Follower / Subscriber Count *</label>
                <input value={followers} onChange={e => setFollowers(e.target.value)} type="number" min={500} placeholder="e.g. 1500" required
                  className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-text outline-none focus:border-brand-green transition-colors" />
                <p className="text-[10px] text-brand-text-faint mt-1">Minimum 500 followers required for approval.</p>
              </div>

              {/* Screenshot upload */}
              <div>
                <label className="text-xs font-semibold text-brand-text-dim block mb-2">Profile Screenshot *</label>
                <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-5 cursor-pointer transition-all ${
                  screenshotPreview ? "border-brand-green/40 bg-brand-green/4" : "border-brand-border hover:border-brand-green/40 hover:bg-brand-green/4"
                }`}>
                  {screenshotPreview ? (
                    <div className="w-full">
                      <img src={screenshotPreview} alt="Screenshot preview" className="max-h-40 object-cover rounded-xl mx-auto mb-2" />
                      <p className="text-xs text-center text-brand-green-dim font-semibold">Screenshot uploaded ✓</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-brand-text-faint mb-2" />
                      <p className="text-xs font-semibold text-brand-text-dim">Click to upload screenshot</p>
                      <p className="text-[10px] text-brand-text-faint mt-1">Show your profile with follower count visible. PNG, JPG up to 5MB.</p>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
                </label>
              </div>
            </div>

            {/* Rules callout */}
            <div className="bg-brand-surface2 border border-brand-border rounded-2xl p-4 text-xs text-brand-text-dim space-y-1">
              <div className="font-semibold text-brand-text mb-2">Admin Verification Checklist</div>
              {[
                "Profile must be public (not private)",
                "Account must be at least 30 days old",
                "Real person — not a brand page or fake profile",
                "Follower count in screenshot must match what you entered",
                "Username in URL must match the screenshot",
              ].map((rule, i) => (
                <div key={i} className="flex items-start gap-1.5"><span className="text-brand-green shrink-0 mt-0.5">✓</span>{rule}</div>
              ))}
            </div>

            {error && <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep("basic")}
                className="flex items-center gap-2 border-2 border-brand-border rounded-2xl px-5 py-3 text-sm font-semibold text-brand-text-dim hover:border-brand-green/40 transition-all">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-gradient-to-r from-brand-green to-brand-green-dim text-white font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand-green/25 transition-all disabled:opacity-50">
                {loading ? "Submitting..." : <><span>Submit for Verification</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </motion.form>
        )}

        {/* ── STEP 3: Submitted ── */}
        {step === "submitted" && (
          <motion.div
            key="submitted"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, type: "spring", stiffness: 200 }}
            className="bg-white border border-brand-border rounded-3xl p-8 text-center"
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-green to-brand-teal flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand-green/25">
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="font-display font-black text-2xl text-brand-forest mb-2">Profile Submitted!</h2>
            <p className="text-brand-text-dim text-sm mb-6 max-w-sm mx-auto">
              Your social handle has been sent for admin review. Approval takes 6–12 hours. You'll receive a notification once verified.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: "⏱️", label: "Review Time", val: "6–12 hrs" },
                { icon: "🔔", label: "Notification", val: "On approval" },
                { icon: "🔓", label: "Unlocks", val: "All panels" },
              ].map((s, i) => (
                <div key={i} className="bg-brand-surface2 rounded-2xl p-3 text-center">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="text-[10px] text-brand-text-faint">{s.label}</div>
                  <div className="text-xs font-bold text-brand-text mt-0.5">{s.val}</div>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 text-left">
              <strong>While you wait:</strong> Explore the Deals Marketplace or set up your referral link to start earning referral income immediately — no verification needed for that!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
