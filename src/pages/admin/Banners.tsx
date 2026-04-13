import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Edit2, GripVertical, Plus, Image, ExternalLink, Upload, 
  Flame, TrendingUp, Sparkles, Gift, Star, Zap
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  badge_text: string | null;
  gradient_from: string;
  gradient_via: string;
  gradient_to: string;
  icon_name: string;
  redirect_url: string | null;
  image_url: string | null;
  display_order: number;
  status: string;
  landing_enabled: boolean | null;
  landing_description: string | null;
  landing_long_description: string | null;
  landing_features: string[] | null;
  landing_cta_text: string | null;
  landing_cta_url: string | null;
  landing_coupon_code: string | null;
  landing_discount_text: string | null;
  landing_image_url: string | null;
}

const GRADIENT_OPTIONS = [
  { value: "primary", label: "Primary (Orange)" },
  { value: "orange-500", label: "Orange" },
  { value: "yellow-500", label: "Yellow" },
  { value: "emerald-500", label: "Emerald" },
  { value: "teal-500", label: "Teal" },
  { value: "cyan-500", label: "Cyan" },
  { value: "green-500", label: "Green" },
  { value: "blue-500", label: "Blue" },
  { value: "purple-500", label: "Purple" },
  { value: "pink-500", label: "Pink" },
  { value: "red-500", label: "Red" },
];

const ICON_OPTIONS = [
  { value: "Flame", label: "Flame 🔥", icon: Flame },
  { value: "TrendingUp", label: "Trending 📈", icon: TrendingUp },
  { value: "Sparkles", label: "Sparkles ✨", icon: Sparkles },
  { value: "Gift", label: "Gift 🎁", icon: Gift },
  { value: "Star", label: "Star ⭐", icon: Star },
  { value: "Zap", label: "Zap ⚡", icon: Zap },
];

const SortableBannerItem = ({
  banner,
  onEdit,
  onToggleStatus,
}: {
  banner: Banner;
  onEdit: (banner: Banner) => void;
  onToggleStatus: (banner: Banner) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border border-border rounded-xl p-4 flex items-center gap-4 ${
        isDragging ? "shadow-xl" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </button>

      <div 
        className={`w-24 h-14 rounded-lg bg-gradient-to-r from-${banner.gradient_from} via-${banner.gradient_via} to-${banner.gradient_to} flex items-center justify-center shrink-0 overflow-hidden`}
        style={{
          background: `linear-gradient(to right, 
            ${banner.gradient_from === 'primary' ? 'hsl(var(--primary))' : `var(--${banner.gradient_from}, #f97316)`}, 
            ${banner.gradient_via === 'primary' ? 'hsl(var(--primary))' : `var(--${banner.gradient_via}, #f97316)`}, 
            ${banner.gradient_to === 'primary' ? 'hsl(var(--primary))' : `var(--${banner.gradient_to}, #eab308)`})`
        }}
      >
        {banner.image_url ? (
          <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white text-xs font-bold">Preview</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-foreground truncate">{banner.title}</h3>
          {banner.badge_text && (
            <Badge variant="secondary" className="text-xs">
              {banner.badge_text}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{banner.subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-xs ${banner.status === "active" ? "text-secondary" : "text-muted-foreground"}`}>
          {banner.status === "active" ? "Active" : "Draft"}
        </span>
        <Switch
          checked={banner.status === "active"}
          onCheckedChange={() => onToggleStatus(banner)}
        />
      </div>

      <Button variant="ghost" size="icon" onClick={() => onEdit(banner)}>
        <Edit2 className="w-4 h-4" />
      </Button>

      {banner.redirect_url && (
        <a
          href={banner.redirect_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
};

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    const { data, error } = await supabase
      .from("deal_banners")
      .select("*")
      .order("display_order", { ascending: true });

    if (data) {
      setBanners(data as Banner[]);
    }
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = banners.findIndex((b) => b.id === active.id);
      const newIndex = banners.findIndex((b) => b.id === over.id);

      const newBanners = arrayMove(banners, oldIndex, newIndex);
      setBanners(newBanners);

      for (let i = 0; i < newBanners.length; i++) {
        await supabase
          .from("deal_banners")
          .update({ display_order: i })
          .eq("id", newBanners[i].id);
      }

      toast({ title: "Order updated", description: "Banner positions saved" });
    }
  };

  const toggleStatus = async (banner: Banner) => {
    const newStatus = banner.status === "active" ? "draft" : "active";
    const { error } = await supabase
      .from("deal_banners")
      .update({ status: newStatus })
      .eq("id", banner.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setBanners(banners.map((b) => (b.id === banner.id ? { ...b, status: newStatus } : b)));
      toast({
        title: "Success",
        description: `Banner ${newStatus === "active" ? "activated" : "deactivated"}`,
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editBanner) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('banners')
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('banners')
      .getPublicUrl(filePath);

    setEditBanner({ ...editBanner, image_url: publicUrl });
    setUploading(false);
    toast({ title: "Success", description: "Image uploaded" });
  };

  const saveBanner = async () => {
    if (!editBanner) return;

    if (isCreateMode) {
      const { data, error } = await supabase
        .from("deal_banners")
        .insert({
          title: editBanner.title,
          subtitle: editBanner.subtitle,
          badge_text: editBanner.badge_text,
          gradient_from: editBanner.gradient_from,
          gradient_via: editBanner.gradient_via,
          gradient_to: editBanner.gradient_to,
          icon_name: editBanner.icon_name,
          redirect_url: editBanner.redirect_url,
          image_url: editBanner.image_url,
          display_order: banners.length,
          status: "draft",

          // Landing page fields
          landing_enabled: !!editBanner.landing_enabled,
          landing_description: editBanner.landing_description,
          landing_long_description: editBanner.landing_long_description,
          landing_features: editBanner.landing_features,
          landing_cta_text: editBanner.landing_cta_text,
          landing_cta_url: editBanner.landing_cta_url,
          landing_coupon_code: editBanner.landing_coupon_code,
          landing_discount_text: editBanner.landing_discount_text,
          landing_image_url: editBanner.landing_image_url,
        })
        .select()
        .single();

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setIsDialogOpen(false);
        setIsCreateMode(false);
        setBanners([...banners, data as Banner]);
        toast({ title: "Success", description: "Banner created" });
      }
    } else {
      const { error } = await supabase
        .from("deal_banners")
        .update({
          title: editBanner.title,
          subtitle: editBanner.subtitle,
          badge_text: editBanner.badge_text,
          gradient_from: editBanner.gradient_from,
          gradient_via: editBanner.gradient_via,
          gradient_to: editBanner.gradient_to,
          icon_name: editBanner.icon_name,
          redirect_url: editBanner.redirect_url,
          image_url: editBanner.image_url,

          // Landing page fields
          landing_enabled: !!editBanner.landing_enabled,
          landing_description: editBanner.landing_description,
          landing_long_description: editBanner.landing_long_description,
          landing_features: editBanner.landing_features,
          landing_cta_text: editBanner.landing_cta_text,
          landing_cta_url: editBanner.landing_cta_url,
          landing_coupon_code: editBanner.landing_coupon_code,
          landing_discount_text: editBanner.landing_discount_text,
          landing_image_url: editBanner.landing_image_url,
        })
        .eq("id", editBanner.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setIsDialogOpen(false);
        setBanners(banners.map((b) => (b.id === editBanner.id ? editBanner : b)));
        toast({ title: "Success", description: "Banner updated" });
      }
    }
  };

  const openCreateDialog = () => {
    setEditBanner({
      id: "",
      title: "",
      subtitle: "",
      badge_text: "🔥 Trending",
      gradient_from: "primary",
      gradient_via: "orange-500",
      gradient_to: "yellow-500",
      icon_name: "Flame",
      redirect_url: "",
      image_url: null,
      display_order: banners.length,
      status: "draft",
      landing_enabled: false,
      landing_description: null,
      landing_long_description: null,
      landing_features: null,
      landing_cta_text: "Get This Deal",
      landing_cta_url: null,
      landing_coupon_code: null,
      landing_discount_text: null,
      landing_image_url: null,
    });
    setIsCreateMode(true);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Image className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Hero Banners</h1>
            <p className="text-muted-foreground">
              Manage sliding banners for the deals page hero section
            </p>
          </div>
        </div>

        <Button onClick={openCreateDialog} className="btn-fire gap-2">
          <Plus className="w-4 h-4" />
          Add New Banner
        </Button>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={banners.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {banners.map((banner) => (
                <SortableBannerItem
                  key={banner.id}
                  banner={banner}
                  onEdit={(b) => {
                    setEditBanner(b);
                    setIsDialogOpen(true);
                  }}
                  onToggleStatus={toggleStatus}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {banners.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No banners yet.</p>
            <p className="text-sm mt-1">Create your first hero banner above.</p>
          </div>
        )}

        {/* Edit/Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setIsCreateMode(false);
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isCreateMode ? "Create New Banner" : "Edit Banner"}</DialogTitle>
            </DialogHeader>
            {editBanner && (
              <div className="space-y-6 pt-4">
                {/* Preview */}
                <div 
                  className="relative overflow-hidden rounded-2xl p-6 min-h-[140px] flex flex-col justify-center"
                  style={{
                    background: editBanner.image_url 
                      ? `url(${editBanner.image_url}) center/cover`
                      : `linear-gradient(to right, 
                          ${editBanner.gradient_from === 'primary' ? 'hsl(var(--primary))' : `var(--tw-${editBanner.gradient_from}, #f97316)`}, 
                          ${editBanner.gradient_via === 'primary' ? 'hsl(var(--primary))' : `var(--tw-${editBanner.gradient_via}, #f97316)`}, 
                          ${editBanner.gradient_to === 'primary' ? 'hsl(var(--primary))' : `var(--tw-${editBanner.gradient_to}, #eab308)`})`
                  }}
                >
                  {editBanner.image_url && <div className="absolute inset-0 bg-black/30" />}
                  <div className="relative z-10">
                    {editBanner.badge_text && (
                      <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                        <span className="text-xs font-bold text-white uppercase tracking-wide">
                          {editBanner.badge_text}
                        </span>
                      </div>
                    )}
                    <h2 className="text-xl font-bold text-white mb-1">{editBanner.title || "Banner Title"}</h2>
                    <p className="text-white/90 text-sm">{editBanner.subtitle || "Banner subtitle goes here"}</p>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Upload className="w-4 h-4" />
                    Banner Image (Optional - overrides gradient)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={editBanner.image_url || ""}
                      onChange={(e) => setEditBanner({ ...editBanner, image_url: e.target.value })}
                      placeholder="https://example.com/banner.jpg"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? "..." : "Upload"}
                    </Button>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={editBanner.title}
                      onChange={(e) => setEditBanner({ ...editBanner, title: e.target.value })}
                      placeholder="India's #1 Deal Platform"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Badge Text</label>
                    <Input
                      value={editBanner.badge_text || ""}
                      onChange={(e) => setEditBanner({ ...editBanner, badge_text: e.target.value })}
                      placeholder="🔥 Trending"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Subtitle</label>
                  <Input
                    value={editBanner.subtitle || ""}
                    onChange={(e) => setEditBanner({ ...editBanner, subtitle: e.target.value })}
                    placeholder="Verified offers • Real earnings • Daily updates"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Redirect URL (Click destination)</label>
                  <Input
                    value={editBanner.redirect_url || ""}
                    onChange={(e) => setEditBanner({ ...editBanner, redirect_url: e.target.value })}
                    placeholder="https://example.com/offer"
                  />
                </div>

                {/* Landing Page Settings */}
                <div className="border-t border-border pt-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground">Landing Page Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        When enabled, clicking this banner opens a dedicated landing page at
                        <span className="font-mono"> /banner/{editBanner.id || "..."}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Enable</span>
                      <Switch
                        checked={!!editBanner.landing_enabled}
                        onCheckedChange={(checked) =>
                          setEditBanner({ ...editBanner, landing_enabled: checked })
                        }
                      />
                    </div>
                  </div>

                  {!!editBanner.landing_enabled && (
                    <div className="space-y-4">
                      {!isCreateMode && !!editBanner.id && (
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          onClick={() => window.open(`/banner/${editBanner.id}`, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Preview Landing Page
                        </Button>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Landing Discount Text</label>
                          <Input
                            value={editBanner.landing_discount_text || ""}
                            onChange={(e) =>
                              setEditBanner({ ...editBanner, landing_discount_text: e.target.value })
                            }
                            placeholder="e.g. 70% OFF Today"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Landing Coupon Code</label>
                          <Input
                            value={editBanner.landing_coupon_code || ""}
                            onChange={(e) =>
                              setEditBanner({ ...editBanner, landing_coupon_code: e.target.value })
                            }
                            placeholder="e.g. DOPE70"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Landing Image URL (Optional)</label>
                        <Input
                          value={editBanner.landing_image_url || ""}
                          onChange={(e) =>
                            setEditBanner({ ...editBanner, landing_image_url: e.target.value })
                          }
                          placeholder="https://example.com/landing.jpg"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          If empty, the banner image will be used.
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Short Description</label>
                        <Textarea
                          value={editBanner.landing_description || ""}
                          onChange={(e) =>
                            setEditBanner({ ...editBanner, landing_description: e.target.value })
                          }
                          placeholder="1-2 lines about the product/deal"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Long Description (Optional)</label>
                        <Textarea
                          value={editBanner.landing_long_description || ""}
                          onChange={(e) =>
                            setEditBanner({
                              ...editBanner,
                              landing_long_description: e.target.value,
                            })
                          }
                          placeholder="More details, terms, how to redeem, etc."
                          rows={5}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Features (one per line)</label>
                        <Textarea
                          value={(editBanner.landing_features || []).join("\n")}
                          onChange={(e) => {
                            const lines = e.target.value
                              .split("\n")
                              .map((l) => l.trim())
                              .filter(Boolean);
                            setEditBanner({
                              ...editBanner,
                              landing_features: lines.length ? lines : null,
                            });
                          }}
                          placeholder="Feature 1\nFeature 2\nFeature 3"
                          rows={4}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">CTA Button Text</label>
                          <Input
                            value={editBanner.landing_cta_text || ""}
                            onChange={(e) =>
                              setEditBanner({ ...editBanner, landing_cta_text: e.target.value })
                            }
                            placeholder="Get This Deal"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">CTA URL (Optional)</label>
                          <Input
                            value={editBanner.landing_cta_url || ""}
                            onChange={(e) =>
                              setEditBanner({ ...editBanner, landing_cta_url: e.target.value })
                            }
                            placeholder="If empty, Redirect URL is used"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Gradient Colors */}
                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold text-foreground mb-4">Gradient Colors (if no image)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">From</label>
                      <Select
                        value={editBanner.gradient_from}
                        onValueChange={(v) => setEditBanner({ ...editBanner, gradient_from: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {GRADIENT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Via</label>
                      <Select
                        value={editBanner.gradient_via}
                        onValueChange={(v) => setEditBanner({ ...editBanner, gradient_via: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {GRADIENT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">To</label>
                      <Select
                        value={editBanner.gradient_to}
                        onValueChange={(v) => setEditBanner({ ...editBanner, gradient_to: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {GRADIENT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Icon */}
                <div>
                  <label className="text-sm font-medium">Icon</label>
                  <Select
                    value={editBanner.icon_name}
                    onValueChange={(v) => setEditBanner({ ...editBanner, icon_name: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={saveBanner} className="w-full btn-fire">
                  {isCreateMode ? "Create Banner" : "Save Changes"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
