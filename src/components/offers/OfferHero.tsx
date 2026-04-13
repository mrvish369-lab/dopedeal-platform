import { useState, useEffect } from "react";
import { ChevronRight, Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const OfferHero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    {
      title: "Exclusive Deals Daily",
      subtitle: "India's Most Authentic Offer Platform",
      gradient: "from-primary via-orange-500 to-yellow-500",
      icon: Gift,
    },
    {
      title: "Earn While You Shop",
      subtitle: "Cashback, Rewards & Free Courses",
      gradient: "from-secondary via-emerald-500 to-teal-400",
      icon: Sparkles,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const current = banners[currentSlide];
  const Icon = current.icon;

  return (
    <section className="px-4 py-6">
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${current.gradient} p-6 min-h-[160px] flex flex-col justify-center transition-all duration-500`}
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-5 h-5 text-white" />
            <span className="text-xs font-medium text-white/80 uppercase tracking-wide">
              Featured
            </span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 animate-pulse">
            {current.title}
          </h1>
          <p className="text-white/90 text-sm md:text-base mb-4">
            {current.subtitle}
          </p>

          <Button
            size="sm"
            className="bg-white text-foreground hover:bg-white/90 font-semibold gap-1"
          >
            Explore Now
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentSlide ? "bg-white w-6" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
