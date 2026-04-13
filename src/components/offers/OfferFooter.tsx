import { Shield, Lock } from "lucide-react";

export const OfferFooter = () => {
  return (
    <footer className="px-4 py-8 border-t border-border">
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <div className="flex items-center justify-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="text-xs">Verified Offers</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="text-xs">Secure & Safe</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2024 DopeDeal. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
