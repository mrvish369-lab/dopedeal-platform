import { Gift, Sparkles } from "lucide-react";
import { WalletButton } from "@/components/wallet/WalletButton";

export const OfferSearchBar = () => {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-gradient-fire">DopeDeal</span>
          </div>

          {/* Wallet Button */}
          <WalletButton />
        </div>
      </div>
    </header>
  );
};
