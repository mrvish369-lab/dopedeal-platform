import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  objectFit?: "cover" | "contain" | "fill" | "scale-down";
  fallbackSrc?: string;
  fallbackIcon?: React.ReactNode;
  onError?: () => void;
}

export const LazyImage = ({
  src,
  alt,
  className,
  containerClassName,
  objectFit = "cover",
  fallbackSrc,
  fallbackIcon,
  onError,
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px", threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load image when in view
  useEffect(() => {
    if (!isInView || !src) return;

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
      setHasError(false);
    };

    img.onerror = () => {
      if (fallbackSrc && fallbackSrc !== src) {
        // Try fallback
        const fallbackImg = new Image();
        fallbackImg.src = fallbackSrc;
        fallbackImg.onload = () => {
          setCurrentSrc(fallbackSrc);
          setIsLoaded(true);
          setHasError(false);
        };
        fallbackImg.onerror = () => {
          setHasError(true);
          setIsLoaded(true);
          onError?.();
        };
      } else {
        setHasError(true);
        setIsLoaded(true);
        onError?.();
      }
    };
  }, [isInView, src, fallbackSrc, onError]);

  const objectFitClass = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
    "scale-down": "object-scale-down",
  }[objectFit];

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10",
        containerClassName
      )}
    >
      {/* Blur placeholder - always visible until loaded */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          isLoaded ? "opacity-0" : "opacity-100"
        )}
      >
        {/* Animated gradient placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-muted/30 to-muted/50 animate-pulse" />
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      </div>

      {/* Actual image */}
      {currentSrc && !hasError && (
        <img
          src={currentSrc}
          alt={alt}
          className={cn(
            "w-full h-full transition-all duration-500",
            objectFitClass,
            isLoaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-sm scale-105",
            className
          )}
        />
      )}

      {/* Fallback icon for errors */}
      {hasError && fallbackIcon && (
        <div className="absolute inset-0 flex items-center justify-center">
          {fallbackIcon}
        </div>
      )}
    </div>
  );
};