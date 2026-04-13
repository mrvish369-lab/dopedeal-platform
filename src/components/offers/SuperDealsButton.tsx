import { useNavigate } from "react-router-dom";
import { Sparkles, Gift, ChevronRight, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export const SuperDealsButton = () => {
  const navigate = useNavigate();

  return (
    <div className="px-4 py-4">
      <button
        onClick={() => navigate("/super-deals")}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl cursor-pointer",
          "bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600",
          "bg-[length:200%_100%] animate-gradient-x",
          "shadow-[0_0_30px_rgba(168,85,247,0.5)]",
          "hover:shadow-[0_0_50px_rgba(168,85,247,0.7)]",
          "transition-shadow duration-300",
          "animate-breathing",
          "group"
        )}
      >
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 opacity-50 blur-sm animate-pulse" />
        
        {/* Inner content container */}
        <div className="relative z-10 p-5 bg-gradient-to-r from-purple-600/90 via-pink-500/90 to-purple-600/90 rounded-2xl m-[2px]">
          {/* Floating sparkles */}
          <div className="absolute top-2 right-4 animate-bounce">
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </div>
          <div className="absolute bottom-3 right-12 animate-pulse delay-300">
            <Sparkles className="w-4 h-4 text-yellow-200" />
          </div>
          <div className="absolute top-4 left-[40%] animate-ping opacity-75">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>

          <div className="flex items-center gap-4">
            {/* Icon container with glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-white/30 rounded-xl blur-md animate-pulse" />
              <div className="relative w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <Gift className="w-7 h-7 text-white" />
              </div>
              {/* Coin badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gold flex items-center justify-center shadow-lg animate-bounce">
                <Coins className="w-3.5 h-3.5 text-background" />
              </div>
            </div>

            {/* Text content */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white drop-shadow-lg">
                  🎁 Super Deals
                </h3>
                <span className="px-2 py-0.5 text-xs font-bold bg-white/20 text-white rounded-full border border-white/30 animate-pulse">
                  NEW
                </span>
              </div>
              <p className="text-sm text-white/90 mt-0.5 font-medium">
                Unlock exclusive coupons with your coins!
              </p>
              <div className="flex items-center gap-1 mt-1 text-yellow-200 text-xs">
                <Sparkles className="w-3 h-3" />
                <span>Premium products at amazing discounts</span>
              </div>
            </div>

            {/* Arrow indicator */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
              <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Bottom shine effect */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
        </div>
      </button>
    </div>
  );
};
