import { CSSProperties, useState } from "react";
import { Play, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OfferVideoProps {
  block: {
    id: string;
    title: string | null;
    content_json: Record<string, unknown>;
  };
  onPlay: () => void;
  onDownload: () => void;
  style?: CSSProperties;
}

export const OfferVideo = ({ block, onPlay, onDownload, style }: OfferVideoProps) => {
  const [showPlayer, setShowPlayer] = useState(false);

  const content = block.content_json as {
    video_url?: string;
    thumbnail_url?: string;
    allow_download?: boolean;
  };

  // Convert Google Drive URL to embeddable format
  const getEmbedUrl = (url: string) => {
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }
    return url;
  };

  const handlePlay = () => {
    onPlay();
    setShowPlayer(true);
  };

  const handleDownload = () => {
    onDownload();
    if (content.video_url) {
      // Convert to download URL
      const fileIdMatch = content.video_url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        window.open(
          `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`,
          "_blank"
        );
      } else {
        window.open(content.video_url, "_blank");
      }
    }
  };

  return (
    <div
      className="slide-up rounded-2xl overflow-hidden bg-card border border-border"
      style={style}
    >
      {showPlayer && content.video_url ? (
        <div className="aspect-video">
          <iframe
            src={getEmbedUrl(content.video_url)}
            className="w-full h-full"
            allow="autoplay"
            allowFullScreen
          />
        </div>
      ) : (
        <div
          className="relative aspect-video bg-muted cursor-pointer group"
          onClick={handlePlay}
        >
          {content.thumbnail_url ? (
            <img
              src={content.thumbnail_url}
              alt={block.title || "Video"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <Play className="w-16 h-16 text-primary" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <Play className="w-8 h-8 text-primary-foreground ml-1" />
            </div>
          </div>
        </div>
      )}
      <div className="p-5">
        {block.title && (
          <h3 className="text-lg font-bold text-foreground mb-3">
            {block.title}
          </h3>
        )}
        <div className="flex gap-3">
          <Button
            onClick={handlePlay}
            className="flex-1 btn-fire gap-2"
            variant={showPlayer ? "outline" : "default"}
          >
            <Play className="w-4 h-4" />
            {showPlayer ? "Playing" : "Play"}
          </Button>
          {content.allow_download && (
            <Button
              onClick={handleDownload}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
