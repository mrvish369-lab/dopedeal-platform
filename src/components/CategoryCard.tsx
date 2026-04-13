import { cn } from "@/lib/utils";

interface CategoryCardProps {
  title: string;
  emoji: string;
  description: string;
  category: string;
  onClick: (category: string) => void;
  delay?: number;
}

export const CategoryCard = ({
  title,
  emoji,
  description,
  category,
  onClick,
  delay = 0,
}: CategoryCardProps) => {
  return (
    <div
      className={cn(
        "category-card group slide-up",
        "hover:glow-primary"
      )}
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => onClick(category)}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:animate-float">
          {emoji}
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-gradient-fire transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm">
          {description}
        </p>
      </div>

      {/* Arrow indicator */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        <svg
          className="w-6 h-6 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </div>
    </div>
  );
};