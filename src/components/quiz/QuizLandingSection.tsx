import { CategoryCard } from "@/components/CategoryCard";
import { QuizCampaign } from "@/hooks/useQuizCampaign";
import { QuizBranding } from "./QuizBranding";
import { QuizHeroBanner } from "./QuizHeroBanner";
import { QuizBottomBanner } from "./QuizBottomBanner";
import { DealsCtaButton } from "./DealsCtaButton";

interface QuizLandingSectionProps {
  campaign: QuizCampaign;
  onCategorySelect: (category: string) => void;
}

const CATEGORY_CONFIG: Record<string, { title: string; emoji: string; description: string }> = {
  bollywood: { title: "Bollywood", emoji: "🎬", description: "Movies, actors & songs" },
  social_media: { title: "Social Media", emoji: "📱", description: "Trends, reels & viral" },
  cricket: { title: "Cricket / IPL", emoji: "🏏", description: "Players, teams & stats" },
  sports: { title: "Sports", emoji: "⚽", description: "Games, players & records" },
  tech: { title: "Technology", emoji: "💻", description: "Gadgets, apps & trends" },
  music: { title: "Music", emoji: "🎵", description: "Songs, artists & albums" },
  food: { title: "Food", emoji: "🍕", description: "Cuisine, recipes & flavors" },
  general: { title: "General Knowledge", emoji: "📚", description: "Facts, trivia & more" },
};

export const QuizLandingSection = ({
  campaign,
  onCategorySelect,
}: QuizLandingSectionProps) => {
  const categories = campaign.quiz_categories.map((cat) => ({
    category: cat,
    ...(CATEGORY_CONFIG[cat] || { title: cat, emoji: "❓", description: "Test your knowledge" }),
  }));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Branding Header */}
      <QuizBranding variant="header" />

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl mx-auto">
          {/* Hero Banner */}
          {campaign.hero_banner_enabled && (
            <div className="mb-8 slide-up">
              <QuizHeroBanner campaign={campaign} />
            </div>
          )}

          {/* Main Hero Section */}
          <div className="text-center mb-10 slide-up">
            <div className="inline-block mb-4 px-4 py-2 bg-primary/20 rounded-full">
              <span className="text-primary font-medium">🔥 Limited Time Offer</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-foreground">Unlock Your </span>
              <span className="text-gradient-fire">{campaign.goodie_price} {campaign.goodie_title.split(" ")[0]}</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Answer {campaign.questions_count} fun questions & win a{" "}
              <span className="font-semibold text-foreground">{campaign.goodie_title}</span>!
            </p>

            {/* Value Proposition */}
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <span className="line-through">{campaign.goodie_original_price}</span>
              <span className="text-gold font-bold">{campaign.goodie_emoji}</span>
              <span className="text-secondary font-bold">{campaign.goodie_price} only!</span>
            </div>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {categories.map((cat, i) => (
              <CategoryCard
                key={cat.category}
                title={cat.title}
                emoji={cat.emoji}
                description={cat.description}
                category={cat.category}
                onClick={onCategorySelect}
                delay={i * 100}
              />
            ))}
          </div>

          {/* Bottom Banner */}
          <QuizBottomBanner campaign={campaign} />

          {/* Deals CTA Button */}
          <div className="mt-8">
            <DealsCtaButton />
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <QuizBranding variant="footer" />
    </div>
  );
};
