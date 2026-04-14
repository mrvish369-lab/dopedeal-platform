import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Instagram, Facebook, Youtube, Twitter, MessageSquare,
  CheckCircle, Clock, XCircle, Upload, ArrowRight, ArrowLeft,
  User, MapPin, FileText, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, upsertProfile } from "@/lib/db/profile";
import { getSocialProfile, upsertSocialProfile, uploadScreenshot } from "@/lib/db/social";

type Platform = "instagram" | "facebook" | "whatsapp" | "youtube" | "twitter";
type Step = "basic" | "social";

const PLATFORMS: { id: Platform; label: string; bg: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: "instagram", label: "Instagram", bg: "from-pink-500 to-purple-600", Icon: Instagram },
  { id: "facebook",  label: "Facebook",  bg: "from-blue-500 to-blue-700",   Icon: Facebook  },
  { id: "whatsapp",  label: "WhatsApp",  bg: "from-green-400 to-green-600", Icon: MessageSquare },
  { id: "youtube",   label: "YouTube",   bg: "from-red-500 to-red-700",     Icon: Youtube   },
  { id: "twitter",   label: "Twitter/X", bg: "from-sky-400 to-sky-600",     Icon: Twitter   },
];

export default function Profile() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("basic");
  const [basicForm, setBasicForm] = useState({ full_name: "", city: "", bio: "" });
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [handleUrl, setHandleUrl] = useState("");
  const [followerCount, setFollowerCount] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"not_submitted" | "pending" | "approved" | "rejected">("not_submitted");
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setFetching(true);
      const [profile, social] = await Promise.all([getProfile(user.id), getSocialProfile(user.id)]);
      if (profile) setBasicForm({ full_name: profile.full_name ?? "", city: profile.city ?? "", bio: profile.bio ?? "" });
      if (social) {
        setPlatform(social.platform as Platform);
        setHandleUrl(social.handle_url);
        setFollowerCount(String(social.follower_count));
        setVerificationStatus(
          social.status === "approved" ? "approved" :
          social.status === "rejected" ? "rejected" :
          social.status === "pending"  ? "pending"  : "not_submitted"
        );
        setReviewNote(social.review_note);
      }
      setFetching(false);
    })();
  }, [user]);

  const handleFileChange = (file: File) => {
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setScreenshotPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleBasicNext = async () => {
    setError(null);
    if (!basicForm.full_name.trim()) return setError("Please enter your full name");
    setLoading(true);
    const { error: err } = await upsertProfile(user!.id, {
      full_name: basicForm.full_name.trim(),
      city: basicForm.city.trim() || null,
      bio: basicForm.bio.trim() || null,
    });
    setLoading(false);
    if (err) return setError(err);
    setStep("social");
  };

  const handleSocialSubmit = async () => {
    setError(null);
    if (!handleUrl.trim()) return setError("Please enter your social media profile URL");
    if (!followerCount || isNaN(Number(followerCount))) return setError("Please enter your follower count");
    setLoading(true);
    let screenshotUrl: string | null = null;
    if (screenshotFile) {
      const { url, error: uploadErr } = await uploadScreenshot(user!.id, screenshotFile);
      if (uploadErr) { setLoading(false); return setError("Screenshot upload failed: " + uploadErr); }
      screenshotUrl = url;
    }
    const { error: err } = await upsertSocialProfile(user!.id, {
      platform,
      handle_url: handleUrl.trim(),
      follower_count: Number(followerCount),
      screenshot_url: screenshotUrl,
    });
    setLoading(false);
    if (err) return setError(err);
    setVerificationStatus("pending");
    setSubmitted(true);
  };

  const statusConfig = {
    not_submitted: { color: "border-gray-200 bg-gray-50",   icon: <AlertCircle className="w-4 h-4 text-gray-400" />,  text: "Not Submitted", desc: "Submit your social profile below to start the verification process." },
    pending:       { color: "border-amber-200 bg-amber-50",  icon: <Clock className="w-4 h-4 text-amber-500" />,       text: "Under Review",  desc: "Admin will review within 6–12 hours. You'll be notified once approved." },
    approved:      { color: "border-green-200 bg-green-50",  icon: <CheckCircle className="w-4 h-4 text-green-500" />, text: "Verified ✓",    desc: "Your profile is verified. PocketMoney & DealSell are unlocked!" },
    rejected:      { color: "border-red-200 bg-red-50",      icon: <XCircle className="w-4 h-4 text-red-500" />,       text: "Rejected",      desc: reviewNote ?? "Your submission was rejected. Please resubmit with a clearer screenshot." },
  };
  const status = statusConfig[verificationStatus];

  if (fetching) {
    return <div className="flex items-center justify-center min-h-64"><div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1 text-brand-green-dim">
          <User className="w-4 h-4" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Account</span>
        </div>
        <h1 className="font-display font-extrabold text-2xl text-brand-forest">My Profile</h1>
        <p className="text-sm text-brand-text-dim mt-1">Complete your profile and submit your social handle for verification.</p>
      </div>

      {/* Status banner */}
      <div className={`border rounded-2xl p-4 flex items-start gap-3 mb-6 ${status.color}`}>
        <div className="mt-0.5 flex-shrink-0">{status.icon}</div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Verification Status: {status.text}</p>
          <p className="text-xs text-gray-600 mt-0.5">{status.desc}</p>
        </div>
      </div>

      {verificationStatus === "approved" ? (
        <div className="bg-white border border-green-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-green-500" />
          </div>
          <h3 className="font-bold text-brand-forest text-lg mb-1">Profile Verified!</h3>
          <p className="text-sm text-brand-text-dim">All earning features are now unlocked.</p>
        </div>
      ) : submitted ? (
        <motion.div className="bg-white border border-brand-border rounded-2xl p-8 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <motion.div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
            <Clock className="w-8 h-8 text-amber-500" />
          </motion.div>
          <h3 className="font-bold text-brand-forest text-lg mb-1">Submission Received!</h3>
          <p className="text-sm text-brand-text-dim">Admin will review your profile within 6–12 hours.</p>
        </motion.div>
      ) : (
        <>
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            {(["basic", "social"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === s ? "bg-brand-forest text-white" : i < (step === "social" ? 1 : 0) ? "bg-brand-green text-white" : "bg-gray-100 text-gray-400"}`}>
                  {i < (step === "social" ? 1 : 0) ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-semibold ${step === s ? "text-brand-forest" : "text-gray-400"}`}>{s === "basic" ? "Basic Info" : "Social Handle"}</span>
                {i < 1 && <div className={`flex-1 h-0.5 rounded ${step === "social" ? "bg-brand-green" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === "basic" ? (
              <motion.div key="basic" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                className="bg-white border border-brand-border rounded-2xl p-5 space-y-4">
                <p className="font-semibold text-brand-text">Basic Information</p>
                <div>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Full Name *</label>
                  <input type="text" value={basicForm.full_name} onChange={(e) => setBasicForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Rahul Kumar"
                    className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">City</label>
                  <div className="flex items-center border border-brand-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-green">
                    <MapPin className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                    <input type="text" value={basicForm.city} onChange={(e) => setBasicForm((p) => ({ ...p, city: e.target.value }))} placeholder="Mumbai" className="flex-1 py-2.5 px-3 text-sm focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Short Bio (optional)</label>
                  <div className="flex items-start border border-brand-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-green">
                    <FileText className="w-4 h-4 text-gray-400 ml-3 mt-3 flex-shrink-0" />
                    <textarea value={basicForm.bio} onChange={(e) => setBasicForm((p) => ({ ...p, bio: e.target.value }))} placeholder="Content creator from Mumbai..." rows={2} className="flex-1 py-2.5 px-3 text-sm focus:outline-none resize-none" />
                  </div>
                </div>
                {error && <p className="text-xs text-red-500 bg-red-50 rounded-xl p-3 border border-red-100">{error}</p>}
                <button onClick={handleBasicNext} disabled={loading}
                  className="w-full bg-brand-green text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-brand-green-dim transition-colors disabled:opacity-60">
                  {loading ? "Saving..." : <><span>Next: Social Handle</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </motion.div>
            ) : (
              <motion.div key="social" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                className="bg-white border border-brand-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setStep("basic")} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                  <p className="font-semibold text-brand-text">Social Handle</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-2">Platform</label>
                  <div className="grid grid-cols-5 gap-2">
                    {PLATFORMS.map(({ id, label, bg, Icon }) => (
                      <button key={id} onClick={() => setPlatform(id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${platform === id ? "border-brand-green bg-brand-green/8" : "border-brand-border hover:border-brand-green/40"}`}>
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${bg} flex items-center justify-center`}><Icon className="w-4 h-4 text-white" /></div>
                        <span className="text-[9px] font-semibold text-gray-600">{label.split("/")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Profile URL *</label>
                  <input type="url" value={handleUrl} onChange={(e) => setHandleUrl(e.target.value)} placeholder="https://instagram.com/yourhandle"
                    className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-1.5">Follower / Subscriber Count *</label>
                  <input type="number" value={followerCount} onChange={(e) => setFollowerCount(e.target.value)} placeholder="e.g. 5000" min={0}
                    className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                  <p className="text-[10px] text-gray-400 mt-1">Min 500 for most platforms (200 for WhatsApp)</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-text-dim block mb-2">Screenshot of Profile Page</label>
                  <div onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${screenshotPreview ? "border-brand-green/40 bg-brand-green/5" : "border-gray-200 hover:border-brand-green/40 hover:bg-gray-50"}`}>
                    {screenshotPreview ? (
                      <div>
                        <img src={screenshotPreview} alt="preview" className="w-full max-h-40 object-contain rounded-xl mx-auto" />
                        <p className="text-xs text-brand-green-dim font-medium mt-2 flex items-center justify-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Uploaded — tap to change</p>
                      </div>
                    ) : (
                      <><Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-sm font-medium text-gray-600">Tap to upload screenshot</p><p className="text-xs text-gray-400 mt-0.5">PNG, JPG up to 10MB</p></>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])} />
                  </div>
                </div>
                {error && <p className="text-xs text-red-500 bg-red-50 rounded-xl p-3 border border-red-100">{error}</p>}
                <button onClick={handleSocialSubmit} disabled={loading}
                  className="w-full bg-brand-green text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-brand-green-dim transition-colors disabled:opacity-60">
                  {loading ? (
                    <><motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />Submitting...</>
                  ) : <><Upload className="w-4 h-4" /> Submit for Verification</>}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
