import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Eye,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Clock,
  Filter,
  Search,
  ChevronDown,
  Users,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type Platform = "instagram" | "facebook" | "whatsapp" | "youtube" | "twitter";
type VerificationStatus = "pending" | "approved" | "rejected";

interface SocialSubmission {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  platform: Platform;
  handleUrl: string;
  followerCount: number;
  screenshotUrl: string;
  submittedAt: string;
  status: VerificationStatus;
  reviewNote?: string;
  city?: string;
}

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_SUBMISSIONS: SocialSubmission[] = [
  {
    id: "sub_001",
    userId: "usr_a1b2c3",
    userName: "Priya Sharma",
    userPhone: "+91 98765 43210",
    platform: "instagram",
    handleUrl: "https://instagram.com/priya.sharma",
    followerCount: 12400,
    screenshotUrl: "https://placehold.co/600x400/003D1F/69F0AE?text=Screenshot",
    submittedAt: "2026-04-14T08:32:00Z",
    status: "pending",
    city: "Mumbai",
  },
  {
    id: "sub_002",
    userId: "usr_d4e5f6",
    userName: "Rahul Verma",
    userPhone: "+91 87654 32109",
    platform: "youtube",
    handleUrl: "https://youtube.com/@rahulverma",
    followerCount: 3200,
    screenshotUrl: "https://placehold.co/600x400/003D1F/69F0AE?text=Screenshot",
    submittedAt: "2026-04-14T07:15:00Z",
    status: "pending",
    city: "Delhi",
  },
  {
    id: "sub_003",
    userId: "usr_g7h8i9",
    userName: "Meera Nair",
    userPhone: "+91 76543 21098",
    platform: "facebook",
    handleUrl: "https://facebook.com/meera.nair.official",
    followerCount: 850,
    screenshotUrl: "https://placehold.co/600x400/003D1F/69F0AE?text=Screenshot",
    submittedAt: "2026-04-13T22:45:00Z",
    status: "pending",
    city: "Kochi",
  },
  {
    id: "sub_004",
    userId: "usr_j1k2l3",
    userName: "Arjun Reddy",
    userPhone: "+91 65432 10987",
    platform: "instagram",
    handleUrl: "https://instagram.com/arjun.reddy",
    followerCount: 650,
    screenshotUrl: "https://placehold.co/600x400/003D1F/69F0AE?text=Screenshot",
    submittedAt: "2026-04-13T18:20:00Z",
    status: "approved",
    city: "Hyderabad",
  },
  {
    id: "sub_005",
    userId: "usr_m4n5o6",
    userName: "Sneha Patel",
    userPhone: "+91 54321 09876",
    platform: "twitter",
    handleUrl: "https://twitter.com/snehapatel",
    followerCount: 420,
    screenshotUrl: "https://placehold.co/600x400/003D1F/69F0AE?text=Screenshot",
    submittedAt: "2026-04-13T14:05:00Z",
    status: "rejected",
    reviewNote: "Follower count below minimum threshold of 500.",
    city: "Ahmedabad",
  },
];

// ── Platform helpers ─────────────────────────────────────────────────────────
const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; Icon: React.FC<{ className?: string }> }> = {
  instagram: { label: "Instagram", color: "from-pink-500 to-purple-600", Icon: Instagram },
  facebook: { label: "Facebook", color: "from-blue-500 to-blue-700", Icon: Facebook },
  whatsapp: { label: "WhatsApp", color: "from-green-400 to-green-600", Icon: MessageSquare },
  youtube: { label: "YouTube", color: "from-red-500 to-red-700", Icon: Youtube },
  twitter: { label: "Twitter / X", color: "from-sky-400 to-sky-600", Icon: Twitter },
};

const STATUS_STYLE: Record<VerificationStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
  approved: { bg: "bg-green-100", text: "text-green-700", label: "Approved" },
  rejected: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
};

// ── Checklist ────────────────────────────────────────────────────────────────
const CHECKLIST_ITEMS = [
  "Profile is public (not private)",
  "Minimum 500 followers confirmed",
  "Account is 30+ days old",
  "Handle URL is reachable",
  "Screenshot matches claimed platform",
  "No signs of bot/purchased followers",
];

// ── Review Modal ─────────────────────────────────────────────────────────────
function ReviewModal({
  sub,
  onClose,
  onDecide,
}: {
  sub: SocialSubmission;
  onClose: () => void;
  onDecide: (id: string, decision: "approved" | "rejected", note: string) => void;
}) {
  const [checks, setChecks] = useState<boolean[]>(Array(CHECKLIST_ITEMS.length).fill(false));
  const [note, setNote] = useState(sub.reviewNote ?? "");
  const [imageOpen, setImageOpen] = useState(false);

  const allChecked = checks.every(Boolean);
  const { Icon, label, color } = PLATFORM_CONFIG[sub.platform];

  const toggle = (i: number) =>
    setChecks((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const formatFollowers = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Panel */}
        <motion.div
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
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
                <p className="text-xs text-gray-500">{sub.userPhone} · {sub.city}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <XCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5">
            {/* Profile info */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{formatFollowers(sub.followerCount)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Followers</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">Platform</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-gray-900">{formatDate(sub.submittedAt)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Submitted</p>
              </div>
            </div>

            {/* Handle URL */}
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <a
                href={sub.handleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm font-medium hover:underline break-all"
              >
                {sub.handleUrl}
              </a>
            </div>

            {/* Screenshot */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Screenshot</p>
              <div
                className="relative rounded-xl overflow-hidden border border-gray-200 cursor-zoom-in"
                onClick={() => setImageOpen(!imageOpen)}
              >
                <img
                  src={sub.screenshotUrl}
                  alt="Profile screenshot"
                  className={`w-full object-cover transition-all duration-300 ${imageOpen ? "max-h-none" : "max-h-32"}`}
                />
                {!imageOpen && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 flex items-end justify-center pb-2">
                    <span className="text-white text-xs font-medium flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Click to expand
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Checklist */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Verification Checklist</p>
              <div className="space-y-2">
                {CHECKLIST_ITEMS.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => toggle(i)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      checks[i]
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        checks[i] ? "bg-green-500 border-green-500" : "border-gray-300"
                      }`}
                    >
                      {checks[i] && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm ${checks[i] ? "text-green-700 font-medium" : "text-gray-600"}`}>
                      {item}
                    </span>
                  </button>
                ))}
              </div>

              {!allChecked && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Complete all checklist items before approving
                </p>
              )}
            </div>

            {/* Review note */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Review Note (sent to user)</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Add a note explaining the decision..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
              />
            </div>
          </div>

          {/* Action bar */}
          <div className="p-5 border-t border-gray-100 flex gap-3">
            <button
              onClick={() => onDecide(sub.id, "rejected", note)}
              className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl py-3 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={() => {
                if (!allChecked) return;
                onDecide(sub.id, "approved", note);
              }}
              className={`flex-1 flex items-center justify-center gap-2 font-semibold rounded-xl py-3 transition-colors ${
                allChecked
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Submission Row ────────────────────────────────────────────────────────────
function SubmissionRow({ sub, onReview }: { sub: SocialSubmission; onReview: () => void }) {
  const { Icon, label, color } = PLATFORM_CONFIG[sub.platform];
  const { bg, text, label: statusLabel } = STATUS_STYLE[sub.status];

  const formatFollowers = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });

  return (
    <motion.tr
      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <td className="px-4 py-4">
        <div>
          <p className="font-medium text-gray-900 text-sm">{sub.userName}</p>
          <p className="text-xs text-gray-500">{sub.userPhone}</p>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm text-gray-700">{label}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-medium text-gray-800">
            {formatFollowers(sub.followerCount)}
          </span>
          {sub.followerCount < 500 && (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 ml-1" />
          )}
        </div>
      </td>
      <td className="px-4 py-4 text-xs text-gray-500">{formatDate(sub.submittedAt)}</td>
      <td className="px-4 py-4">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
          {sub.status === "pending" && <Clock className="w-3 h-3" />}
          {sub.status === "approved" && <CheckCircle className="w-3 h-3" />}
          {sub.status === "rejected" && <XCircle className="w-3 h-3" />}
          {statusLabel}
        </span>
      </td>
      <td className="px-4 py-4">
        <button
          onClick={onReview}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-green hover:text-brand-green-dim transition-colors border border-brand-green/30 hover:border-brand-green/60 px-3 py-1.5 rounded-lg"
        >
          <Eye className="w-3.5 h-3.5" />
          Review
        </button>
      </td>
    </motion.tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VerificationQueue() {
  const [submissions, setSubmissions] = useState<SocialSubmission[]>(MOCK_SUBMISSIONS);
  const [selected, setSelected] = useState<SocialSubmission | null>(null);
  const [filter, setFilter] = useState<VerificationStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const counts = {
    all: submissions.length,
    pending: submissions.filter((s) => s.status === "pending").length,
    approved: submissions.filter((s) => s.status === "approved").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };

  const displayed = submissions.filter((s) => {
    const matchesFilter = filter === "all" || s.status === filter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      s.userName.toLowerCase().includes(q) ||
      s.userPhone.includes(q) ||
      s.platform.includes(q) ||
      (s.city ?? "").toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const handleDecide = (id: string, decision: "approved" | "rejected", note: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: decision, reviewNote: note } : s))
    );
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Verification Queue</h1>
        <p className="text-sm text-gray-500 mt-1">Review social media profile submissions from DealSell applicants</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {(["all", "pending", "approved", "rejected"] as const).map((s) => {
          const style =
            s === "all"
              ? "bg-white border-gray-200 text-gray-700"
              : s === "pending"
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : s === "approved"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700";
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`border rounded-xl p-4 text-left transition-all ${style} ${
                filter === s ? "ring-2 ring-offset-1 ring-brand-green" : ""
              }`}
            >
              <p className="text-2xl font-bold">{counts[s]}</p>
              <p className="text-xs font-medium capitalize mt-0.5">{s === "all" ? "Total" : s}</p>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, platform..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          {/* Filter dropdown */}
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
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
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
                {["User", "Platform", "Followers", "Submitted", "Status", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                    No submissions found.
                  </td>
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

      {/* Review modal */}
      {selected && (
        <ReviewModal
          sub={selected}
          onClose={() => setSelected(null)}
          onDecide={handleDecide}
        />
      )}
    </div>
  );
}
