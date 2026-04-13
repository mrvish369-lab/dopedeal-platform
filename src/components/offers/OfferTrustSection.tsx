import { Shield, Users, RefreshCw, CheckCircle } from "lucide-react";

export const OfferTrustSection = () => {
  const trustPoints = [
    {
      icon: Shield,
      title: "100% Verified Deals",
      description: "Every offer is hand-picked and verified",
    },
    {
      icon: Users,
      title: "Trusted Offline Network",
      description: "Connected with 1000+ retail partners across India",
    },
    {
      icon: RefreshCw,
      title: "Check Daily",
      description: "New exclusive deals added every day",
    },
    {
      icon: CheckCircle,
      title: "Secure & Safe",
      description: "Your privacy is our priority",
    },
  ];

  return (
    <section className="px-4 py-8 bg-card/50">
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-foreground mb-1">Why DopeDeal?</h2>
        <p className="text-sm text-muted-foreground">
          India's most authentic deal discovery platform
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {trustPoints.map((point, idx) => (
          <div
            key={idx}
            className="bg-card border border-border rounded-xl p-4 text-center transition-all duration-200 hover:border-primary/50"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <point.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">{point.title}</h3>
            <p className="text-xs text-muted-foreground">{point.description}</p>
          </div>
        ))}
      </div>

      {/* Daily Check Reminder */}
      <div className="mt-6 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl p-4 text-center border border-primary/30">
        <p className="text-sm font-medium text-foreground">
          🔔 Bookmark this page & check daily for new exclusive deals!
        </p>
      </div>
    </section>
  );
};
