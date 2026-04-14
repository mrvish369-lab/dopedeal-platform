import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Instagram, Facebook, Youtube, Twitter, MessageSquare,
  CheckCircle, XCircle, Eye, Clock, Search, Filter,
  ChevronDown, IndianRupee, AlertTriangle, X, Users,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type TaskPlatform = "instagram" | "facebook" | "whatsapp" | "youtube" | "twitter";
type ReviewStatus = "pending" | "approved" | "rejected";

interface TaskSubmission {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  taskTitle: string;
  platform: TaskPlatform;
  payout: number;
  screenshotUrl: string;
  submittedAt: string;
  status: ReviewStatus;
  reviewNote?: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_SUBMISSIONS: TaskSubmission[] = [
  {
    id: "ts_001", userId: "usr_a1", userName: "Priya Sharma", userPhone: "+91 98765 43210",
    taskTitle: "Share DopeDeal on Instagram Feed", platform: "instagram", payout: 80,
    screenshotUrl: "https://placehold.co/600x400/1a1a2e/69F0AE?text=IG+Post+Screenshot",
    submittedAt: "2026-04-14T09:15:00Z", status: "pending",
  },
  {
    id: "ts_002", userId: "usr_b2", userName: "Rahul Verma", userPhone: "+91 87654 32109",
    taskTitle: "Share DopeDeal on WhatsApp Status", platform: "whatsapp", payout: 40,
    screenshotUrl: "https://placehold.co/600x400/1a1a2e/69F0AE?text=WA+Status+Screenshot",
    submittedAt: "2026-04-14T08:30:00Z", status: "pending",
  },
  {
    id: "ts_003", userId: "usr_c3", userName: "Meera Nair", userPhone: "+91 76543 21098",
    taskTitle: "Subscribe & Ring Bell on DopeDeal YT", platform: "youtube", payout: 25,
    screenshotUrl: "https://placehold.co/600x400/1a1a2e/69F0AE?text=YT+Subscribe+Screenshot",
    submittedAt: "2026-04-14T07:45:00Z", status: "pending",
  },
  {
    id: "ts_004", userId: "usr_d4", userName: "Arjun Reddy", userPhone: "+91 65432 10987",
    taskTitle: "Share DopeDeal Post on Facebook", platform: "facebook", payout: 60,
    screenshotUrl: "https://placehold.co/600x400/1a1a2e/69F0AE?text=FB+Share+Screenshot",
    submittedAt: "2026-04-13T22:10:00Z", status: "approved",
  },
  {
    id: "ts_005", userId: "usr_e5", userName: "Sneha Patel", userPhone: "+91 54321 09876",
    taskTitle: "Retweet DopeDeal Announcement", platform: "twitter", payout: 35,
    screenshotUrl: "https://placehold.co/600x400/1a1a2e/69F0AE?text=Twitter+Screenshot",
    submittedAt: "2026-04-13T20:00:00Z", status: "rejected",
    reviewNote: "Handle not visible in screenshot.",
  },
  {
    id: "ts_006", userId: "usr_f6", userName: "Karan Singh", userPhone: "+91 44321 09876",
    taskTitle: "Post DopeDeal Story with Link Sticker", platform: "instagram", payout: 50,
    screenshotUrl: "https://placehold.co/600x400/1a1a2e/69F0AE?text=Story+Screenshot",
    submittedAt: "2026-04-13T18:30:00Z", status: "pending",
  },
];

// ── Platform config ───────────────────────────────────────────────────────────
const PLATFORM: Record<TaskPlatform, { label: string; color: string; Icon: React.FC<{ className?: string }> }> = {
  instagram: { label: "Instagram", color: "from-pink-500 to-purple-600", Icon: Instagram },
  facebook:  { label: "Facebook",  color: "from-blue-500 to-blue-700",   Icon: Facebook  },
  whatsapp:  { label: "WhatsApp",  color: "from-green-400 to-green-600", Icon: MessageSquare },
  youtube:   { label: "YouTube",   color: "from-red-500 to-red-700",     Icon: Youtube   },
  twitter:   { label: "Twitter/X", color: "from-sky-400 to-sky-600",     Icon: Twitter   },
};

// ── Review Modal ──────────────────────────────────────────────────────────────
function ReviewModal({
  sub,
  onClose,
  onDecide,
}: {
  sub: TaskSubmission;
  onClose: () => void;
  onDecide: (id: string, decision: ReviewStatus, note: string) => void;
}) {
  const [note, setNote] = useState(sub.reviewNote ?? "");
  const [imgOpen, setImgOpen] = useState(false);
  const { Icon, color } = PLATFORM[sub.platform];

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
          initial={{ y: 32, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          exit={{ y: 32, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{sub.userName}</p>
                <p className="text-xs text-gray-500">{sub.userPhone}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Task info */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
              <p className="text-sm font-semibold text-gray-800">{sub.taskTitle}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" />₹{sub.payout} payout
                </span>
                <span>·</span>
                <span>{fmt(sub.submittedAt)}</span>
              </div>
            </div>

            {/* Screenshot */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Submitted Screenshot</p>
              <div
                className="relative rounded-xl overflow-hidden border border-gray-200 cursor-zoom-in"
                onClick={() => setImgOpen(!imgOpen)}
              >
                <img
                  src={sub.screenshotUrl}
                  alt="proof"
                  className={`w-full object-cover transition-all duration-300 ${imgOpen ? "max-h-none" : "max-h-40"}`}
                />
                {!imgOpen && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 flex items-end justify-center pb-2">
                    <span className="text-white text-xs font-medium flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Click to expand
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick checklist */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 space-y-1">
              <p className="font-semibold text-blue-800 mb-1.5">Quick checks before approving:</p>
              {[
                "User's handle/username is visible",
                "Content matches the task requirement",
                "Screenshot is not cropped or blurred",
                "Post appears live (not a draft/preview)",
              ].map((item, i) => (
                <p key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">•</span> {item}
                </p>
              ))}
            </div>

            {/* Note */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Review Note (shown to user)</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Optional — required if rejecting"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="p-5 border-t border-gray-100 flex gap-3">
            <button
              onClick={() => onDecide(sub.id, "rejected", note)}
              className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl py-3 transition-colors"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
            <button
              onClick={() => onDecide(sub.id, "approved", note)}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl py-3 transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> Approve & Pay ₹{sub.payout}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Table Row ─────────────────────────────────────────────────────────────────
function SubmissionRow({ sub, onReview }: { sub: TaskSubmission; onReview: () => void }) {
  const { Icon, color } = PLATFORM[sub.platform];

  const statusStyle: Record<ReviewStatus, { bg: string; text: string }> = {
    pending:  { bg: "bg-amber-100", text: "text-amber-700" },
    approved: { bg: "bg-green-100", text: "text-green-700" },
    rejected: { bg: "bg-red-100",   text: "text-red-600"   },
  };
  const { bg, text } = statusStyle[sub.status];
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3.5">
        <p className="font-medium text-gray-900 text-sm">{sub.userName}</p>
        <p className="text-xs text-gray-400">{sub.userPhone}</p>
      </td>
      <td className="px-4 py-3.5">
        <p className="text-sm text-gray-700 line-clamp-1 max-w-[200px]">{sub.taskTitle}</p>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className="font-semibold text-brand-green text-sm">₹{sub.payout}</span>
      </td>
      <td className="px-4 py-3.5 text-xs text-gray-400">{fmt(sub.submittedAt)}</td>
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
          {sub.status === "pending"  && <Clock className="w-3 h-3" />}
          {sub.status === "approved" && <CheckCircle className="w-3 h-3" />}
          {sub.status === "rejected" && <XCircle className="w-3 h-3" />}
          {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <button
          onClick={onReview}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-green hover:text-brand-green-dim border border-brand-green/30 hover:border-brand-green/60 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> Review
        </button>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TaskQueue() {
  const [subs, setSubs] = useState<TaskSubmission[]>(MOCK_SUBMISSIONS);
  const [selected, setSelected] = useState<TaskSubmission | null>(null);
  const [filter, setFilter] = useState<ReviewStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const counts = {
    all: subs.length,
    pending:  subs.filter((s) => s.status === "pending").length,
    approved: subs.filter((s) => s.status === "approved").length,
    rejected: subs.filter((s) => s.status === "rejected").length,
  };

  const pendingPayout = subs.filter((s) => s.status === "pending").reduce((a, s) => a + s.payout, 0);

  const displayed = subs.filter((s) => {
    const matchFilter = filter === "all" || s.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || s.userName.toLowerCase().includes(q) || s.taskTitle.toLowerCase().includes(q) || s.platform.includes(q);
    return matchFilter && matchSearch;
  });

  const handleDecide = (id: string, decision: ReviewStatus, note: string) => {
    setSubs((prev) => prev.map((s) => s.id === id ? { ...s, status: decision, reviewNote: note } : s));
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Task Proof Queue</h1>
        <p className="text-sm text-gray-500 mt-1">Review PocketMoney task submissions and approve payouts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {(["all", "pending", "approved", "rejected"] as const).map((s) => {
          const styleMap = {
            all:      "bg-white border-gray-200 text-gray-700",
            pending:  "bg-amber-50 border-amber-200 text-amber-700",
            approved: "bg-green-50 border-green-200 text-green-700",
            rejected: "bg-red-50 border-red-200 text-red-700",
          };
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`border rounded-xl p-4 text-left transition-all ${styleMap[s]} ${filter === s ? "ring-2 ring-brand-green ring-offset-1" : ""}`}
            >
              <p className="text-2xl font-bold">{counts[s]}</p>
              <p className="text-xs font-medium capitalize mt-0.5">{s === "all" ? "Total" : s}</p>
            </button>
          );
        })}
      </div>

      {/* Pending payout callout */}
      {counts.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-bold">{counts.pending} submissions</span> pending — ₹{pendingPayout} in potential payouts awaiting review.
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, task, platform..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-gray-300 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              {filter === "all" ? "All Status" : filter.charAt(0).toUpperCase() + filter.slice(1)}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10 min-w-[140px]"
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                >
                  {(["all", "pending", "approved", "rejected"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setFilter(s); setFilterOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        filter === s ? "bg-brand-green/10 text-brand-green font-medium" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["User", "Task", "Platform", "Payout", "Submitted", "Status", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No submissions found.</td>
                </tr>
              ) : (
                displayed.map((sub) => (
                  <SubmissionRow key={sub.id} sub={sub} onReview={() => setSelected(sub)} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <ReviewModal sub={selected} onClose={() => setSelected(null)} onDecide={handleDecide} />
      )}
    </div>
  );
}
