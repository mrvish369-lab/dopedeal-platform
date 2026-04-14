import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Instagram, Facebook, Youtube, Twitter, MessageSquare,
  Lock, CheckCircle, Clock, XCircle, Upload, X,
  ChevronRight, Zap, Eye, ArrowRight, Info,
  AlertTriangle, IndianRupee,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type TaskPlatform = "instagram" | "facebook" | "whatsapp" | "youtube" | "twitter";
type TaskStatus = "available" | "submitted" | "approved" | "rejected";

interface Task {
  id: string;
  platform: TaskPlatform;
  title: string;
  description: string;
  instructions: string[];
  payout: number;
  minFollowers: number;
  estimatedTime: string;
  status: TaskStatus;
  submittedAt?: string;
  rejectionReason?: string;
}

// ── Mock tasks ────────────────────────────────────────────────────────────────
const TASKS: Task[] = [
  {
    id: "t_ig_001",
    platform: "instagram",
    title: "Share DopeDeal on Instagram Feed",
    description: "Post the provided creative on your Instagram feed with the required caption and tags.",
    instructions: [
      "Download the promo image from the kit link below",
      "Post it on your Instagram feed (not story)",
      "Use caption: 'Earn money by sharing deals 💸 @dopedeal.store #DopeDeal #EarnOnline'",
      "Keep the post live for at least 7 days",
      "Screenshot the post showing likes + your handle",
    ],
    payout: 80,
    minFollowers: 500,
    estimatedTime: "5 min",
    status: "available",
  },
  {
    id: "t_ig_002",
    platform: "instagram",
    title: "Post DopeDeal Story with Link Sticker",
    description: "Share a 24-hr story using the DopeDeal story template with a link sticker.",
    instructions: [
      "Download the story template from the promo kit",
      "Add the link sticker pointing to dopedeal.store",
      "Tag @dopedeal.store in the story",
      "Screenshot before posting showing the sticker",
      "Screenshot after posting showing it on your profile",
    ],
    payout: 50,
    minFollowers: 500,
    estimatedTime: "3 min",
    status: "available",
  },
  {
    id: "t_ig_003",
    platform: "instagram",
    title: "Watch & Share DopeDeal Reel",
    description: "Watch our latest reel, like it, comment, and share to your story.",
    instructions: [
      "Visit the DopeDeal Instagram page",
      "Watch the latest reel completely (30 sec)",
      "Like + Leave a genuine comment",
      "Share the reel to your own story",
      "Screenshot showing your comment and story share",
    ],
    payout: 30,
    minFollowers: 500,
    estimatedTime: "2 min",
    status: "available",
  },
  {
    id: "t_wa_001",
    platform: "whatsapp",
    title: "Share DopeDeal on WhatsApp Status",
    description: "Post the DopeDeal promotional image as your WhatsApp status for 24 hours.",
    instructions: [
      "Download the WhatsApp status image from the promo kit",
      "Post it as your WhatsApp status",
      "Set visibility to 'My Contacts' or wider",
      "Screenshot your status screen showing the post",
      "Keep it active for at least 12 hours",
    ],
    payout: 40,
    minFollowers: 200,
    estimatedTime: "2 min",
    status: "submitted",
    submittedAt: "2026-04-14T06:00:00Z",
  },
  {
    id: "t_fb_001",
    platform: "facebook",
    title: "Share DopeDeal Post on Facebook",
    description: "Share the DopeDeal promotional post to your Facebook timeline.",
    instructions: [
      "Visit the DopeDeal Facebook page",
      "Share our latest promotional post to your timeline",
      "Add caption: 'Earning money from social media is real now 🔥 #DopeDeal'",
      "Set post visibility to Public",
      "Screenshot the shared post showing your name and the content",
    ],
    payout: 60,
    minFollowers: 500,
    estimatedTime: "3 min",
    status: "available",
  },
  {
    id: "t_yt_001",
    platform: "youtube",
    title: "Subscribe & Ring Bell on DopeDeal YT",
    description: "Subscribe to the DopeDeal YouTube channel and enable all notifications.",
    instructions: [
      "Go to the DopeDeal YouTube channel",
      "Click Subscribe button",
      "Click the Bell icon and select 'All'",
      "Like the latest video",
      "Screenshot showing subscribed + bell active state",
    ],
    payout: 25,
    minFollowers: 0,
    estimatedTime: "2 min",
    status: "approved",
    submittedAt: "2026-04-13T10:00:00Z",
  },
  {
    id: "t_tw_001",
    platform: "twitter",
    title: "Retweet DopeDeal Announcement",
    description: "Retweet our latest announcement tweet with a personal comment.",
    instructions: [
      "Find the pinned tweet on @DopeDealStore",
      "Quote retweet (not plain retweet)",
      "Add your own comment: why you joined DopeDeal",
      "Screenshot the quote tweet from your profile",
    ],
    payout: 35,
    minFollowers: 500,
    estimatedTime: "3 min",
    status: "rejected",
    submittedAt: "2026-04-13T09:00:00Z",
    rejectionReason: "Screenshot was blurry and handle was not visible.",
  },
];

// ── Platform config ───────────────────────────────────────────────────────────
const PLATFORM: Record<TaskPlatform, { label: string; bg: string; Icon: React.FC<{ className?: string }> }> = {
  instagram: { label: "Instagram", bg: "from-pink-500 to-purple-600", Icon: Instagram },
  facebook:  { label: "Facebook",  bg: "from-blue-500 to-blue-700",   Icon: Facebook  },
  whatsapp:  { label: "WhatsApp",  bg: "from-green-400 to-green-600", Icon: MessageSquare },
  youtube:   { label: "YouTube",   bg: "from-red-500 to-red-700",     Icon: Youtube   },
  twitter:   { label: "Twitter/X", bg: "from-sky-400 to-sky-600",     Icon: Twitter   },
};

const STATUS_CHIP: Record<TaskStatus, { bg: string; text: string; label: string }> = {
  available: { bg: "bg-brand-green/10", text: "text-brand-green-dim", label: "Available" },
  submitted: { bg: "bg-amber-50",       text: "text-amber-600",       label: "Under Review" },
  approved:  { bg: "bg-green-50",       text: "text-green-700",       label: "Approved" },
  rejected:  { bg: "bg-red-50",         text: "text-red-600",         label: "Rejected" },
};

const PLATFORM_FILTERS: Array<TaskPlatform | "all"> = ["all", "instagram", "whatsapp", "facebook", "youtube", "twitter"];

// ── Task Modal ────────────────────────────────────────────────────────────────
function TaskModal({ task, onClose, onSubmit }: {
  task: Task;
  onClose: () => void;
  onSubmit: (taskId: string, file: File) => void;
}) {
  const [step, setStep] = useState<"instructions" | "upload">("instructions");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { Icon, bg } = PLATFORM[task.platform];

  const pickFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    onSubmit(task.id, file);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
        >
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          {/* Header */}
          <div className="px-5 pb-4 pt-2 border-b border-gray-100 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm leading-tight">{task.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">₹{task.payout} on approval</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 flex-shrink-0">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Step tabs */}
          <div className="flex border-b border-gray-100">
            {(["instructions", "upload"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${
                  step === s
                    ? "text-brand-green border-b-2 border-brand-green"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {s === "instructions" ? "1. Instructions" : "2. Submit Proof"}
              </button>
            ))}
          </div>

          <div className="p-5 max-h-[60vh] overflow-y-auto">
            <AnimatePresence mode="wait">
              {step === "instructions" ? (
                <motion.div key="inst" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="space-y-4">
                  <div className="bg-brand-green/8 border border-brand-green/20 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center">
                      <IndianRupee className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-forest">₹{task.payout} on approval</p>
                      <p className="text-xs text-brand-text-dim">Credited to wallet within 24 hrs</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">{task.description}</p>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Steps</p>
                    <div className="space-y-2.5">
                      {task.instructions.map((inst, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-brand-green/10 text-brand-green-dim text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <p className="text-sm text-gray-700">{inst}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                      Download creative assets from the{" "}
                      <span className="font-semibold underline cursor-pointer">DopeDeal Promo Kit</span>
                    </p>
                  </div>

                  <button
                    onClick={() => setStep("upload")}
                    className="w-full bg-brand-green text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-brand-green-dim transition-colors"
                  >
                    I've done it — Submit Proof <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.div key="upload" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
                  <p className="text-sm text-gray-600">Upload a clear screenshot proving task completion. Your handle must be visible.</p>

                  <div
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      preview ? "border-brand-green/40 bg-brand-green/5" : "border-gray-200 hover:border-brand-green/40 hover:bg-gray-50"
                    }`}
                  >
                    {preview ? (
                      <div>
                        <img src={preview} alt="proof" className="w-full max-h-48 object-contain rounded-xl" />
                        <p className="mt-2 text-xs text-brand-green-dim font-medium flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Uploaded — tap to change
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                          <Upload className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Tap to upload screenshot</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])} />
                  </div>

                  <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <p>Fake or irrelevant screenshots may result in account suspension.</p>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!file || submitting}
                    className={`w-full font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors ${
                      file && !submitting
                        ? "bg-brand-green text-white hover:bg-brand-green-dim"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {submitting ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                        />
                        Submitting...
                      </>
                    ) : (
                      <><Upload className="w-4 h-4" /> Submit for Review</>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, isVerified, onOpen }: { task: Task; isVerified: boolean; onOpen: () => void }) {
  const { Icon, bg } = PLATFORM[task.platform];
  const { bg: chipBg, text: chipText, label: chipLabel } = STATUS_CHIP[task.status];
  const isLocked = !isVerified && task.status === "available";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border rounded-2xl overflow-hidden transition-all ${
        isLocked
          ? "opacity-60 border-brand-border"
          : task.status === "approved"
          ? "border-green-200"
          : "border-brand-border hover:shadow-md hover:shadow-brand-green/8 hover:-translate-y-0.5 cursor-pointer"
      }`}
    >
      <div className={`h-1.5 bg-gradient-to-r ${bg}`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${chipBg} ${chipText}`}>
            {chipLabel}
          </span>
        </div>

        <h3 className="font-bold text-sm text-gray-900 leading-snug mb-1">{task.title}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.estimatedTime}</span>
          {task.minFollowers > 0 && (
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{task.minFollowers.toLocaleString()}+ followers</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xs text-gray-500">Earn</span>
            <span className="text-xl font-black text-brand-green ml-1">₹{task.payout}</span>
          </div>

          {task.status === "approved" ? (
            <div className="flex items-center gap-1 text-green-600 text-xs font-semibold bg-green-50 px-3 py-1.5 rounded-lg">
              <CheckCircle className="w-3.5 h-3.5" /> Paid ₹{task.payout}
            </div>
          ) : task.status === "submitted" ? (
            <div className="flex items-center gap-1 text-amber-600 text-xs font-semibold bg-amber-50 px-3 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5" /> Reviewing...
            </div>
          ) : isLocked ? (
            <div className="flex items-center gap-1 text-gray-400 text-xs font-semibold bg-gray-50 px-3 py-1.5 rounded-lg">
              <Lock className="w-3.5 h-3.5" /> Locked
            </div>
          ) : (
            <button
              onClick={onOpen}
              className="flex items-center gap-1.5 bg-brand-green text-white text-xs font-bold px-4 py-1.5 rounded-xl hover:bg-brand-green-dim transition-colors"
            >
              Start <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {task.status === "rejected" && task.rejectionReason && (
          <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-2.5 text-xs text-red-600">
            <span className="font-semibold">Rejected: </span>{task.rejectionReason}
            <button onClick={onOpen} className="ml-2 underline font-semibold">Resubmit</button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── My Tasks Panel ────────────────────────────────────────────────────────────
function MyTasksPanel({ tasks }: { tasks: Task[] }) {
  const active = tasks.filter((t) => t.status !== "available");

  if (active.length === 0) {
    return (
      <div className="text-center py-14 text-gray-400">
        <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">No tasks started yet</p>
        <p className="text-xs mt-1">Browse tasks and start earning</p>
      </div>
    );
  }

  const totalEarned = active.filter((t) => t.status === "approved").reduce((s, t) => s + t.payout, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Submitted", value: active.filter((t) => t.status === "submitted").length, color: "text-amber-600" },
          { label: "Approved", value: active.filter((t) => t.status === "approved").length, color: "text-green-600" },
          { label: "Earned (₹)", value: totalEarned, color: "text-brand-green" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-brand-border rounded-xl p-3 text-center">
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {active.map((task) => {
        const { Icon, bg } = PLATFORM[task.platform];
        const { bg: chipBg, text: chipText, label: chipLabel } = STATUS_CHIP[task.status];
        return (
          <div key={task.id} className="bg-white border border-brand-border rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
              {task.status === "rejected" && task.rejectionReason && (
                <p className="text-xs text-red-500 mt-0.5 line-clamp-1">{task.rejectionReason}</p>
              )}
              {task.submittedAt && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(task.submittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${chipBg} ${chipText}`}>{chipLabel}</span>
              <span className="text-sm font-black text-brand-green">₹{task.payout}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PocketMoney() {
  const isVerified = false; // wire to auth in production

  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [tab, setTab] = useState<"browse" | "my-tasks">("browse");
  const [platformFilter, setPlatformFilter] = useState<TaskPlatform | "all">("all");

  const myTaskCount = tasks.filter((t) => t.status !== "available").length;

  const filtered = tasks.filter((t) =>
    platformFilter === "all" || t.platform === platformFilter
  );

  const handleSubmit = (taskId: string, _file: File) => {
    setTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, status: "submitted" as TaskStatus, submittedAt: new Date().toISOString() } : t)
    );
    setActiveTask(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <span className="text-[10px] font-mono font-bold text-brand-green-dim bg-brand-green/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
          EARNING ENGINE #1
        </span>
        <h1 className="font-display font-extrabold text-2xl text-brand-forest mt-2">PocketMoney Panel</h1>
        <p className="text-sm text-brand-text-dim mt-1">
          Complete social media tasks, submit proof → earn ₹25–₹200 per task.
        </p>
      </div>

      {/* Verification banner */}
      {!isVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Tasks locked — verification required</p>
            <p className="text-xs text-amber-700/70 mt-0.5">Submit your social profile for admin review. Unlocks in 6–12 hrs.</p>
          </div>
          <Link to="/dashboard/profile" className="flex-shrink-0 text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded-xl hover:bg-amber-600 transition-colors">
            Verify Now
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-brand-surface2 border border-brand-border rounded-2xl p-1 mb-5">
        {([
          { key: "browse", label: "Browse Tasks" },
          { key: "my-tasks", label: `My Tasks${myTaskCount ? ` (${myTaskCount})` : ""}` },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === key
                ? "bg-white text-brand-forest shadow-sm border border-brand-border"
                : "text-brand-text-faint hover:text-brand-text-dim"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Platform filters (browse only) */}
      {tab === "browse" && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {PLATFORM_FILTERS.map((p) => {
            const cfg = p !== "all" ? PLATFORM[p] : null;
            return (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold flex-shrink-0 transition-all ${
                  platformFilter === p
                    ? "bg-brand-green text-white border-brand-green"
                    : "bg-white text-gray-600 border-gray-200 hover:border-brand-green/40"
                }`}
              >
                {cfg && <cfg.Icon className="w-3 h-3" />}
                {p === "all" ? "All" : cfg!.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {tab === "browse" ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} isVerified={isVerified} onOpen={() => setActiveTask(task)} />
          ))}
        </div>
      ) : (
        <MyTasksPanel tasks={tasks} />
      )}

      {/* Modal */}
      {activeTask && (
        <TaskModal task={activeTask} onClose={() => setActiveTask(null)} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
