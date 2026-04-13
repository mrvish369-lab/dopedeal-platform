import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Json } from "@/integrations/supabase/types";

interface OfferBlockEditorProps {
  block: {
    id: string;
    block_type: string;
    title: string | null;
    subtitle: string | null;
    content_json: Json;
    position: number;
    status: string;
    target_categories: string[];
    target_cities: string[];
  } | null;
  blockType: string;
  onSave: (data: {
    title: string | null;
    subtitle: string | null;
    content_json: Record<string, unknown>;
    target_categories: string[];
    status: string;
  }) => void;
  onClose: () => void;
}

export const OfferBlockEditor = ({
  block,
  blockType,
  onSave,
  onClose,
}: OfferBlockEditorProps) => {
  const [title, setTitle] = useState(block?.title || "");
  const [subtitle, setSubtitle] = useState(block?.subtitle || "");
  const [contentJson, setContentJson] = useState<Record<string, unknown>>(
    (block?.content_json as Record<string, unknown>) || {}
  );
  const [targetCategories, setTargetCategories] = useState<string[]>(
    block?.target_categories || []
  );

  const updateContent = (key: string, value: unknown) => {
    setContentJson((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave({
      title: title || null,
      subtitle: subtitle || null,
      content_json: contentJson,
      target_categories: targetCategories,
      status: block?.status || "active",
    });
  };

  const renderBannerFields = () => (
    <>
      <div className="space-y-2">
        <Label>Banner Image URL</Label>
        <Input
          value={(contentJson.image_url as string) || ""}
          onChange={(e) => updateContent("image_url", e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </div>
      <div className="space-y-2">
        <Label>CTA Button Text</Label>
        <Input
          value={(contentJson.cta_text as string) || ""}
          onChange={(e) => updateContent("cta_text", e.target.value)}
          placeholder="Shop Now"
        />
      </div>
      <div className="space-y-2">
        <Label>Redirect URL</Label>
        <Input
          value={(contentJson.redirect_url as string) || ""}
          onChange={(e) => updateContent("redirect_url", e.target.value)}
          placeholder="https://example.com"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={(contentJson.open_new_tab as boolean) || false}
          onCheckedChange={(checked) => updateContent("open_new_tab", checked)}
        />
        <Label>Open in new tab</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={(contentJson.glow_enabled as boolean) || false}
          onCheckedChange={(checked) => updateContent("glow_enabled", checked)}
        />
        <Label>Enable glow effect</Label>
      </div>
      <div className="space-y-2">
        <Label>Animation</Label>
        <Select
          value={(contentJson.animation as string) || "none"}
          onValueChange={(value) => updateContent("animation", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="fade">Fade In</SelectItem>
            <SelectItem value="slide">Slide Up</SelectItem>
            <SelectItem value="breathing">Breathing Glow</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );

  const renderButtonFields = () => (
    <>
      <div className="space-y-2">
        <Label>Button Text</Label>
        <Input
          value={(contentJson.button_text as string) || ""}
          onChange={(e) => updateContent("button_text", e.target.value)}
          placeholder="Click Here"
        />
      </div>
      <div className="space-y-2">
        <Label>Button Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={(contentJson.button_color as string) || "#ff6b35"}
            onChange={(e) => updateContent("button_color", e.target.value)}
            className="w-16 h-10 p-1"
          />
          <Input
            value={(contentJson.button_color as string) || "#ff6b35"}
            onChange={(e) => updateContent("button_color", e.target.value)}
            placeholder="#ff6b35"
            className="flex-1"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Icon (Lucide icon name)</Label>
        <Input
          value={(contentJson.icon as string) || ""}
          onChange={(e) => updateContent("icon", e.target.value)}
          placeholder="Gift, Star, Heart, etc."
        />
      </div>
      <div className="space-y-2">
        <Label>Redirect URL</Label>
        <Input
          value={(contentJson.redirect_url as string) || ""}
          onChange={(e) => updateContent("redirect_url", e.target.value)}
          placeholder="https://example.com"
        />
      </div>
      <div className="space-y-2">
        <Label>Animation</Label>
        <Select
          value={(contentJson.animation as string) || "none"}
          onValueChange={(value) => updateContent("animation", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="pulse">Pulse</SelectItem>
            <SelectItem value="breathing">Breathing Glow</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );

  const renderCourseFields = () => (
    <>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={(contentJson.description as string) || ""}
          onChange={(e) => updateContent("description", e.target.value)}
          placeholder="Course or PDF description"
        />
      </div>
      <div className="space-y-2">
        <Label>PDF/Document URL</Label>
        <Input
          value={(contentJson.pdf_url as string) || ""}
          onChange={(e) => updateContent("pdf_url", e.target.value)}
          placeholder="https://example.com/document.pdf"
        />
      </div>
      <div className="space-y-2">
        <Label>Download Button Text</Label>
        <Input
          value={(contentJson.download_text as string) || ""}
          onChange={(e) => updateContent("download_text", e.target.value)}
          placeholder="Download Now"
        />
      </div>
      <div className="space-y-2">
        <Label>Thumbnail URL</Label>
        <Input
          value={(contentJson.thumbnail_url as string) || ""}
          onChange={(e) => updateContent("thumbnail_url", e.target.value)}
          placeholder="https://example.com/thumbnail.jpg"
        />
      </div>
    </>
  );

  const renderVideoFields = () => (
    <>
      <div className="space-y-2">
        <Label>Google Drive Video URL</Label>
        <Input
          value={(contentJson.video_url as string) || ""}
          onChange={(e) => updateContent("video_url", e.target.value)}
          placeholder="https://drive.google.com/file/d/.../view"
        />
      </div>
      <div className="space-y-2">
        <Label>Thumbnail URL</Label>
        <Input
          value={(contentJson.thumbnail_url as string) || ""}
          onChange={(e) => updateContent("thumbnail_url", e.target.value)}
          placeholder="https://example.com/thumbnail.jpg"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={(contentJson.allow_download as boolean) || false}
          onCheckedChange={(checked) => updateContent("allow_download", checked)}
        />
        <Label>Allow download</Label>
      </div>
    </>
  );

  const renderFieldsByType = () => {
    switch (blockType) {
      case "banner":
        return renderBannerFields();
      case "button":
        return renderButtonFields();
      case "course":
        return renderCourseFields();
      case "video":
        return renderVideoFields();
      default:
        return null;
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {block ? "Edit" : "Create"} {blockType.charAt(0).toUpperCase() + blockType.slice(1)} Block
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Block title"
            />
          </div>

          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Optional subtitle"
            />
          </div>

          {renderFieldsByType()}

          <div className="space-y-2">
            <Label>Target Categories (comma separated)</Label>
            <Input
              value={targetCategories.join(", ")}
              onChange={(e) =>
                setTargetCategories(
                  e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                )
              }
              placeholder="fitness, gadgets, fashion"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to show to all users
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1 btn-fire" onClick={handleSave}>
              Save Block
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
