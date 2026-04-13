import { useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp, ChevronRight, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export const DealsCtaButton = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6">
      <button
        onClick={() => navigate("/deals")}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl cursor-pointer",
          "bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600",
          "bg-[length:200%_100%] animate-gradient-x",
          "shadow-[0_0_40px_rgba(16,185,129,0.5)]",
          "hover:shadow-[0_0_60px_rgba(16,185,129,0.7)]",
          "transition-shadow duration-300",
          "animate-breathing",
          "group"
        )}
      >
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 opacity-50 blur-sm animate-pulse" />
        
        {/* Inner content container */}
        <div className="relative z-10 p-6 bg-gradient-to-r from-emerald-600/90 via-teal-500/90 to-emerald-600/90 rounded-2xl m-[2px]">
          {/* Floating sparkles */}
          <div className="absolute top-3 right-5 animate-bounce">
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </div>
          <div className="absolute bottom-4 right-14 animate-pulse delay-300">
            <Sparkles className="w-4 h-4 text-yellow-200" />
          </div>
          <div className="absolute top-5 left-[45%] animate-ping opacity-75">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>

          <div className="flex items-center gap-4">
            {/* Icon container with glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-white/30 rounded-xl blur-md animate-pulse" />
              <div className="relative w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              {/* Coin badge */}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gold flex items-center justify-center shadow-lg animate-bounce">
                <Coins className="w-4 h-4 text-background" />
              </div>
            </div>

            {/* Text content */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">
                  💰 Start Earning Now!
                </h3>
                <span className="px-2 py-0.5 text-xs font-bold bg-white/20 text-white rounded-full border border-white/30 animate-pulse">
                  FREE
                </span>
              </div>
              <p className="text-sm md:text-base text-white/95 mt-1 font-semibold">
                Earn Daily Without Investing a Single ₹!
              </p>
              <div className="flex items-center gap-1 mt-1.5 text-yellow-200 text-xs md:text-sm">
                <Sparkles className="w-3 h-3" />
                <span>Exclusive deals, offers & rewards await</span>
              </div>
            </div>

            {/* Arrow indicator */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors shrink-0">
              <ChevronRight className="w-7 h-7 text-white group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Bottom shine effect */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
        </div>
      </button>
    </div>
  );
};
