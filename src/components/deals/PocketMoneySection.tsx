import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";

interface TaskType {
  id: string;
  platform: string;
  icon: string;
  payout: string;
  duration: string;
  color: string;
  requirements?: string;
}

const taskTypes: TaskType[] = [
  {
    id: "instagram-story",
    platform: "Instagram Story",
    icon: "📸",
    payout: "₹15–₹25",
    duration: "24 hrs live",
    color: "from-pink-500 to-purple-600",
  },
  {
    id: "whatsapp-status",
    platform: "WhatsApp Status",
    icon: "💚",
    payout: "₹15–₹20",
    duration: "24 hrs live",
    color: "from-green-500 to-teal-500",
  },
  {
    id: "instagram-post",
    platform: "Instagram Feed Post",
    icon: "🖼️",
    payout: "₹25–₹50",
    duration: "7–30 days up",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "instagram-reel",
    platform: "Instagram Reel",
    icon: "🎬",
    payout: "₹20–₹40",
    duration: "7 days min",
    color: "from-orange-500 to-red-500",
  },
  {
    id: "video-testimonial",
    platform: "Video Testimonial",
    icon: "🎥",
    payout: "₹70–₹400",
    duration: "Script + delivery",
    color: "from-brand-green-dim to-brand-teal",
  },
  {
    id: "long-campaign",
    platform: "Long Campaign",
    icon: "📅",
    payout: "₹50–₹150",
    duration: "30-day premium",
    color: "from-blue-500 to-indigo-600",
  },
];

export const PocketMoneySection = () => {
  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-brand-bg">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 lg:mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/25 rounded-full px-3 py-1 mb-3">
              <span className="text-xs font-mono font-semibold text-brand-green-dim uppercase tracking-wider">
                Earning Engine #1
              </span>
            </div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-brand-forest mb-2 sm:mb-3">
              PocketMoney Tasks
            </h2>
            <p className="text-sm sm:text-base text-brand-text-dim max-w-lg">
              Share brand content on your social media, get verified, and get paid. Real brands, real money, real simple.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/25 rounded-2xl px-4 py-2 shrink-0">
            <Zap className="w-4 h-4 text-brand-green" />
            <span className="text-sm font-bold text-brand-green-dim">Instant Task Access</span>
          </div>
        </div>

        {/* Task Type Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {taskTypes.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-xl sm:rounded-2xl border border-brand-border p-4 sm:p-5 flex items-start gap-3 sm:gap-4 hover:shadow-md hover:shadow-brand-green/10 hover:-translate-y-0.5 transition-all"
            >
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br ${task.color} flex items-center justify-center text-lg sm:text-xl shrink-0 shadow-sm`}
              >
                {task.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-brand-text text-sm truncate mb-1">
                  {task.platform}
                </div>
                <div className="font-display font-black text-brand-green-dim text-base sm:text-lg mb-0.5">
                  {task.payout}
                </div>
                <div className="text-xs text-brand-text-faint">{task.duration}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-br from-brand-forest to-brand-forest-mid rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-7 text-white flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-5">
          <div>
            <div className="font-display font-black text-lg sm:text-xl mb-1">
              Ready to start earning?
            </div>
            <div className="text-white/60 text-sm">
              Get verified, pick tasks, earn every week.
            </div>
          </div>
          <Link
            to="/dashboard/pocket-money"
            className="w-full sm:w-auto shrink-0 bg-brand-green text-brand-forest font-bold text-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl hover:bg-brand-green-light transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            Browse Available Tasks <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
