import { Gift } from "lucide-react";

export const OfferHeader = () => {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-gradient-fire">DopeDeal</span>
        </div>
        <span className="text-xs text-muted-foreground">Rewards & Offers</span>
      </div>
    </header>
  );
};
