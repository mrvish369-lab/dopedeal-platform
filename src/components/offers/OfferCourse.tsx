import { CSSProperties } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OfferCourseProps {
  block: {
    id: string;
    title: string | null;
    subtitle: string | null;
    content_json: Record<string, unknown>;
  };
  onDownload: () => void;
  style?: CSSProperties;
}

export const OfferCourse = ({ block, onDownload, style }: OfferCourseProps) => {
  const content = block.content_json as {
    description?: string;
    pdf_url?: string;
    download_text?: string;
    thumbnail_url?: string;
  };

  const handleDownload = () => {
    onDownload();
    if (content.pdf_url) {
      window.open(content.pdf_url, "_blank");
    }
  };

  return (
    <div
      className="slide-up rounded-2xl overflow-hidden bg-card border border-border"
      style={style}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
            {content.thumbnail_url ? (
              <img
                src={content.thumbnail_url}
                alt={block.title || "Course"}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <FileText className="w-8 h-8 text-accent" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {block.title && (
              <h3 className="text-lg font-bold text-foreground mb-1">
                {block.title}
              </h3>
            )}
            {(content.description || block.subtitle) && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {content.description || block.subtitle}
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={handleDownload}
          className="w-full mt-4 btn-success gap-2"
          size="lg"
        >
          <Download className="w-5 h-5" />
          {content.download_text || "Download Now"}
        </Button>
      </div>
    </div>
  );
};
