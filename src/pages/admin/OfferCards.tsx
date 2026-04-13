import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Edit2, GripVertical, ExternalLink, CreditCard, MapPin, Store, Package, Plus, DollarSign, Sparkles, Wand2, Loader2 } from "lucide-react";
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

interface OfferCard {
  id: string;
  template_key: string | null;
  title: string;
  subtitle: string | null;
  logo_url: string | null;
  image_url: string | null;
  image_fit: string | null;
  cta_text: string;
  redirect_url: string;
  open_new_tab: boolean;
  display_order: number;
  status: string;
  glow_enabled: boolean;
  click_count: number;
  impression_count: number;
  target_cities: string[];
  target_shop_ids: string[];
  target_batch_ids: string[];
  card_segment: string;
  description: string | null;
  features: string[] | null;
  original_price: string | null;
  discounted_price: string | null;
  discount_percent: string | null;
  rating: string | null;
  reviews_count: string | null;
  category: string | null;
  video_url: string | null;
}

interface Shop {
  id: string;
  name: string;
  shop_code: string;
  city: string | null;
}

interface Batch {
  id: string;
  batch_name: string | null;
  product_type: string;
  shop_id: string;
}

// Sortable Card Item Component
const SortableCardItem = ({
  card,
  onEdit,
  onToggleStatus,
}: {
  card: OfferCard;
  onEdit: (card: OfferCard) => void;
  onToggleStatus: (card: OfferCard) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  const hasTargeting = 
    (card.target_cities?.length || 0) > 0 || 
    (card.target_shop_ids?.length || 0) > 0 || 
    (card.target_batch_ids?.length || 0) > 0;

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

      <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        {card.logo_url ? (
          <img src={card.logo_url} alt="" className="w-10 h-10 object-contain" />
        ) : (
          <span className="text-2xl">🎁</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-foreground truncate">{card.title}</h3>
          {card.template_key && (
            <Badge variant="secondary" className="text-xs">
              {card.template_key}
            </Badge>
          )}
          {card.card_segment === "money_making" && (
            <Badge className="text-xs gap-1 bg-green-500/20 text-green-400 border-green-500/30">
              <DollarSign className="w-3 h-3" />
              Money
            </Badge>
          )}
          {card.card_segment === "viral_deals" && (
            <Badge className="text-xs gap-1 bg-orange-500/20 text-orange-400 border-orange-500/30">
              <Sparkles className="w-3 h-3" />
              Deals
            </Badge>
          )}
          {hasTargeting && (
            <Badge variant="outline" className="text-xs gap-1">
              <MapPin className="w-3 h-3" />
              Targeted
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{card.subtitle}</p>
      </div>

      <div className="text-right text-sm text-muted-foreground hidden md:block">
        <div>{card.click_count || 0} clicks</div>
        <div>{card.impression_count || 0} views</div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-xs ${card.status === "active" ? "text-secondary" : "text-muted-foreground"}`}>
          {card.status === "active" ? "Active" : "Draft"}
        </span>
        <Switch
          checked={card.status === "active"}
          onCheckedChange={() => onToggleStatus(card)}
        />
      </div>

      <Button variant="ghost" size="icon" onClick={() => onEdit(card)}>
        <Edit2 className="w-4 h-4" />
      </Button>

      <a
        href={card.redirect_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground"
      >
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
};

export default function OfferCards() {
  const [cards, setCards] = useState<OfferCard[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCard, setEditCard] = useState<OfferCard | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch cards, shops, and batches in parallel
    const [cardsRes, shopsRes, batchesRes] = await Promise.all([
      supabase.from("offer_cards").select("*").order("display_order", { ascending: true }),
      supabase.from("shops").select("id, name, shop_code, city").eq("status", "active"),
      supabase.from("shop_stock").select("id, batch_name, product_type, shop_id"),
    ]);

    if (cardsRes.data) {
      setCards(cardsRes.data as OfferCard[]);
    }
    
    if (shopsRes.data) {
      setShops(shopsRes.data as Shop[]);
      const uniqueCities = [...new Set(shopsRes.data.map(s => s.city).filter(Boolean))] as string[];
      setCities(uniqueCities.sort());
    }
    
    if (batchesRes.data) {
      setBatches(batchesRes.data as Batch[]);
    }

    setLoading(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = cards.findIndex((c) => c.id === active.id);
      const newIndex = cards.findIndex((c) => c.id === over.id);

      const newCards = arrayMove(cards, oldIndex, newIndex);
      setCards(newCards);

      // Update display_order for all affected cards
      const updates = newCards.map((card, index) => ({
        id: card.id,
        display_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from("offer_cards")
          .update({ display_order: update.display_order })
          .eq("id", update.id);
      }

      toast({ title: "Order updated", description: "Card positions saved" });
    }
  };

  const toggleStatus = async (card: OfferCard) => {
    const newStatus = card.status === "active" ? "draft" : "active";
    const { error } = await supabase
      .from("offer_cards")
      .update({ status: newStatus })
      .eq("id", card.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setCards(cards.map((c) => (c.id === card.id ? { ...c, status: newStatus } : c)));
      toast({
        title: "Success",
        description: `Card ${newStatus === "active" ? "activated" : "deactivated"}`,
      });
    }
  };

  const saveCard = async () => {
    if (!editCard) return;

    if (isCreateMode) {
      // Create new card
      const { data, error } = await supabase
        .from("offer_cards")
        .insert({
          title: editCard.title,
          subtitle: editCard.subtitle,
          logo_url: editCard.logo_url,
          image_url: editCard.image_url,
          image_fit: editCard.image_fit || "cover",
          cta_text: editCard.cta_text,
          redirect_url: editCard.redirect_url,
          open_new_tab: editCard.open_new_tab,
          glow_enabled: editCard.glow_enabled,
          card_segment: editCard.card_segment || "viral_deals",
          target_cities: editCard.target_cities || [],
          target_shop_ids: editCard.target_shop_ids || [],
          target_batch_ids: editCard.target_batch_ids || [],
          description: editCard.description,
          features: editCard.features,
          original_price: editCard.original_price,
          discounted_price: editCard.discounted_price,
          discount_percent: editCard.discount_percent,
          rating: editCard.rating,
          reviews_count: editCard.reviews_count,
          category: editCard.category,
          video_url: editCard.video_url,
          display_order: cards.length,
          status: "draft",
        })
        .select()
        .single();

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setIsDialogOpen(false);
        setIsCreateMode(false);
        setCards([...cards, data as OfferCard]);
        toast({ title: "Success", description: "Card created" });
      }
    } else {
      // Update existing card
      const { error } = await supabase
        .from("offer_cards")
        .update({
          title: editCard.title,
          subtitle: editCard.subtitle,
          logo_url: editCard.logo_url,
          image_url: editCard.image_url,
          image_fit: editCard.image_fit || "cover",
          cta_text: editCard.cta_text,
          redirect_url: editCard.redirect_url,
          open_new_tab: editCard.open_new_tab,
          glow_enabled: editCard.glow_enabled,
          card_segment: editCard.card_segment || "viral_deals",
          target_cities: editCard.target_cities || [],
          target_shop_ids: editCard.target_shop_ids || [],
          target_batch_ids: editCard.target_batch_ids || [],
          description: editCard.description,
          features: editCard.features,
          original_price: editCard.original_price,
          discounted_price: editCard.discounted_price,
          discount_percent: editCard.discount_percent,
          rating: editCard.rating,
          reviews_count: editCard.reviews_count,
          category: editCard.category,
          video_url: editCard.video_url,
        })
        .eq("id", editCard.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setIsDialogOpen(false);
        setCards(cards.map((c) => (c.id === editCard.id ? editCard : c)));
        toast({ title: "Success", description: "Card updated" });
      }
    }
  };

  const openCreateDialog = (segment: string = "viral_deals") => {
    setEditCard({
      id: "",
      template_key: null,
      title: "",
      subtitle: "",
      logo_url: "",
      image_url: "",
      image_fit: "cover",
      cta_text: "Get Offer",
      redirect_url: "",
      open_new_tab: true,
      display_order: cards.length,
      status: "draft",
      glow_enabled: false,
      click_count: 0,
      impression_count: 0,
      target_cities: [],
      target_shop_ids: [],
      target_batch_ids: [],
      card_segment: segment,
      description: null,
      features: null,
      original_price: null,
      discounted_price: null,
      discount_percent: null,
      rating: null,
      reviews_count: null,
      category: null,
      video_url: null,
    });
    setIsCreateMode(true);
    setIsDialogOpen(true);
  };

  const toggleCity = (city: string) => {
    if (!editCard) return;
    const current = editCard.target_cities || [];
    const updated = current.includes(city)
      ? current.filter((c) => c !== city)
      : [...current, city];
    setEditCard({ ...editCard, target_cities: updated });
  };

  const toggleShop = (shopId: string) => {
    if (!editCard) return;
    const current = editCard.target_shop_ids || [];
    const updated = current.includes(shopId)
      ? current.filter((s) => s !== shopId)
      : [...current, shopId];
    setEditCard({ ...editCard, target_shop_ids: updated });
  };

  const toggleBatch = (batchId: string) => {
    if (!editCard) return;
    const current = editCard.target_batch_ids || [];
    const updated = current.includes(batchId)
      ? current.filter((b) => b !== batchId)
      : [...current, batchId];
    setEditCard({ ...editCard, target_batch_ids: updated });
  };

  const handleAiAutofill = async () => {
    if (!editCard?.redirect_url) {
      toast({ title: "Error", description: "Enter a redirect URL first", variant: "destructive" });
      return;
    }
    setIsAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-offer-details", {
        body: { url: editCard.redirect_url },
      });
      if (error) throw error;
      if (data?.success && data.data) {
        const d = data.data;
        setEditCard({
          ...editCard,
          title: d.title || editCard.title,
          subtitle: d.subtitle || editCard.subtitle,
          description: d.description || null,
          features: d.features || null,
          cta_text: d.cta_text || editCard.cta_text,
          logo_url: d.logo_url || editCard.logo_url,
          original_price: d.original_price || null,
          discounted_price: d.discounted_price || null,
          discount_percent: d.discount_percent || null,
          rating: d.rating || null,
          reviews_count: d.reviews_count || null,
          category: d.category || null,
        });
        toast({ title: "AI filled details!", description: "Review and edit as needed" });
      } else {
        toast({ title: "AI couldn't extract details", description: data?.error || "Try manually", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "AI failed", variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
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
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Offer Cards</h1>
            <p className="text-muted-foreground">
              Manage CashKaro-style offer cards for lighter QR traffic • Drag to reorder
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={() => openCreateDialog("money_making")} 
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            <DollarSign className="w-4 h-4" />
            New Money Making Card
          </Button>
          <Button 
            onClick={() => openCreateDialog("viral_deals")} 
            className="bg-orange-600 hover:bg-orange-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            <Sparkles className="w-4 h-4" />
            New Viral Deals Card
          </Button>
          <Button 
            onClick={() => openCreateDialog("health")} 
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            🌿 New Health Course Card
          </Button>
        </div>

        {/* Info Banner */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="font-medium text-foreground">Lighter QR Monetization</p>
            <p className="text-sm text-muted-foreground">
              These cards appear on the <code className="bg-muted px-1 rounded">/deals</code> page when
              users scan lighter QR codes. Drag cards to reorder. Toggle to activate. Click edit to set targeting.
            </p>
          </div>
        </div>

        {/* Drag & Drop List */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {cards.map((card) => (
                <SortableCardItem
                  key={card.id}
                  card={card}
                  onEdit={(c) => {
                    setEditCard({
                      ...c,
                      target_cities: c.target_cities || [],
                      target_shop_ids: c.target_shop_ids || [],
                      target_batch_ids: c.target_batch_ids || [],
                    });
                    setIsDialogOpen(true);
                  }}
                  onToggleStatus={toggleStatus}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {cards.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No offer cards found.</p>
            <p className="text-sm mt-1">Run the migration to add pre-built templates.</p>
          </div>
        )}

        {/* Edit/Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setIsCreateMode(false);
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isCreateMode ? "Create New Offer Card" : "Edit Offer Card"}</DialogTitle>
            </DialogHeader>
            {editCard && (
              <div className="space-y-6 pt-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={editCard.title}
                      onChange={(e) => setEditCard({ ...editCard, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subtitle</label>
                    <Input
                      value={editCard.subtitle || ""}
                      onChange={(e) => setEditCard({ ...editCard, subtitle: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Logo URL (Small Icon)</label>
                    <Input
                      value={editCard.logo_url || ""}
                      onChange={(e) => setEditCard({ ...editCard, logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Small icon for card lists</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">CTA Text</label>
                    <Input
                      value={editCard.cta_text}
                      onChange={(e) => setEditCard({ ...editCard, cta_text: e.target.value })}
                    />
                  </div>
                </div>

                {/* Full Size Product Image for Recommendations */}
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-4">
                  <label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Full Size Product Image (for AI Recommendations)
                  </label>
                  <Input
                    value={editCard.image_url || ""}
                    onChange={(e) => setEditCard({ ...editCard, image_url: e.target.value })}
                    placeholder="https://example.com/product-image.jpg"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    📌 This larger image will be displayed in the "Recommended For You" section. 
                    Use a high-quality product photo (400x400px recommended).
                  </p>
                  
                  {/* Image Fit Option */}
                  <div className="mt-3">
                    <label className="text-sm font-medium mb-1 block">Image Display Mode</label>
                    <Select
                      value={editCard.image_fit || "cover"}
                      onValueChange={(value) => setEditCard({ ...editCard, image_fit: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select display mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">
                          <span className="flex items-center gap-2">
                            📐 Cover - Fill entire area (may crop)
                          </span>
                        </SelectItem>
                        <SelectItem value="contain">
                          <span className="flex items-center gap-2">
                            🖼️ Contain - Show full image (may have gaps)
                          </span>
                        </SelectItem>
                        <SelectItem value="fill">
                          <span className="flex items-center gap-2">
                            ↔️ Fill - Stretch to fill (may distort)
                          </span>
                        </SelectItem>
                        <SelectItem value="scale-down">
                          <span className="flex items-center gap-2">
                            🔍 Scale Down - Never larger than original
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Controls how the product image fits within the card
                    </p>
                  </div>

                  {editCard.image_url && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="w-20 h-16 rounded-lg bg-muted/30 overflow-hidden border border-border">
                        <img 
                          src={editCard.image_url} 
                          alt="Preview" 
                          className={`w-full h-full ${
                            editCard.image_fit === "contain" ? "object-contain" :
                            editCard.image_fit === "fill" ? "object-fill" :
                            editCard.image_fit === "scale-down" ? "object-scale-down" :
                            "object-cover"
                          }`}
                          onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect fill='%23f3f4f6' width='64' height='64'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='12'%3E❌%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Preview ({editCard.image_fit || "cover"} mode)
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Redirect URL</label>
                  <div className="flex gap-2">
                    <Input
                      value={editCard.redirect_url}
                      onChange={(e) => setEditCard({ ...editCard, redirect_url: e.target.value })}
                      placeholder="https://example.com/offer"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAiAutofill}
                      disabled={isAiLoading || !editCard.redirect_url}
                      className="gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30"
                    >
                      {isAiLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4 text-purple-400" />
                      )}
                      AI Fill
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter URL and click AI Fill to auto-extract offer details
                  </p>
                </div>

                {/* Video URL for Detail Page */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <label className="text-sm font-medium flex items-center gap-2 mb-2">
                    🎬 Video URL (for Detail Page)
                  </label>
                  <Input
                    value={(editCard as any).video_url || ""}
                    onChange={(e) => setEditCard({ ...editCard, video_url: e.target.value } as any)}
                    placeholder="https://www.youtube.com/watch?v=... or unlisted link"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Add a YouTube (unlisted or public) video explaining this offer. Shown on the dedicated detail page when users click the card.
                  </p>
                </div>

                {/* Segment Selection */}
                <div>
                  <label className="text-sm font-medium">Card Segment</label>
                  <Select
                    value={editCard.card_segment || "viral_deals"}
                    onValueChange={(value) => setEditCard({ ...editCard, card_segment: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select segment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="money_making">
                        <span className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          💰 Money Making Opportunities
                        </span>
                      </SelectItem>
                      <SelectItem value="viral_deals">
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-orange-500" />
                          🛒 Viral Top Deals
                        </span>
                      </SelectItem>
                      <SelectItem value="health">
                        <span className="flex items-center gap-2">
                          <span className="text-green-500">🌿</span>
                          Health & Wellness Courses
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cards will appear in their respective dedicated category pages
                  </p>
                </div>

                {/* Enhanced Details Section */}
                <div className="border-t border-border pt-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Product Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={editCard.description || ""}
                        onChange={(e) => setEditCard({ ...editCard, description: e.target.value })}
                        placeholder="Detailed product description..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Features (one per line)</label>
                      <Textarea
                        value={(editCard.features || []).join("\n")}
                        onChange={(e) => setEditCard({ 
                          ...editCard, 
                          features: e.target.value.split("\n").filter(f => f.trim()) 
                        })}
                        placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Category</label>
                        <Input
                          value={editCard.category || ""}
                          onChange={(e) => setEditCard({ ...editCard, category: e.target.value })}
                          placeholder="e.g., Health, Finance, Apps"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Discount %</label>
                        <Input
                          value={editCard.discount_percent || ""}
                          onChange={(e) => setEditCard({ ...editCard, discount_percent: e.target.value })}
                          placeholder="e.g., 50%"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Original Price</label>
                        <Input
                          value={editCard.original_price || ""}
                          onChange={(e) => setEditCard({ ...editCard, original_price: e.target.value })}
                          placeholder="e.g., ₹999"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Discounted Price</label>
                        <Input
                          value={editCard.discounted_price || ""}
                          onChange={(e) => setEditCard({ ...editCard, discounted_price: e.target.value })}
                          placeholder="e.g., ₹499"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Rating</label>
                        <Input
                          value={editCard.rating || ""}
                          onChange={(e) => setEditCard({ ...editCard, rating: e.target.value })}
                          placeholder="e.g., 4.5"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Reviews Count</label>
                        <Input
                          value={editCard.reviews_count || ""}
                          onChange={(e) => setEditCard({ ...editCard, reviews_count: e.target.value })}
                          placeholder="e.g., 1.2K"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editCard.open_new_tab}
                      onCheckedChange={(c) => setEditCard({ ...editCard, open_new_tab: c })}
                    />
                    <span className="text-sm">Open in new tab</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editCard.glow_enabled}
                      onCheckedChange={(c) => setEditCard({ ...editCard, glow_enabled: c })}
                    />
                    <span className="text-sm">Glow effect</span>
                  </div>
                </div>

                {/* Targeting Section */}
                <div className="border-t border-border pt-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Targeting (Optional)
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Leave empty to show to all users. Select specific cities, shops, or batches to restrict visibility.
                  </p>

                  {/* City Targeting */}
                  <div className="mb-4">
                    <label className="text-sm font-medium flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Target Cities
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {cities.map((city) => (
                        <Badge
                          key={city}
                          variant={(editCard.target_cities || []).includes(city) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleCity(city)}
                        >
                          {city}
                        </Badge>
                      ))}
                      {cities.length === 0 && (
                        <span className="text-sm text-muted-foreground">No cities available</span>
                      )}
                    </div>
                  </div>

                  {/* Shop Targeting */}
                  <div className="mb-4">
                    <label className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Store className="w-4 h-4 text-primary" />
                      Target Shops ({(editCard.target_shop_ids || []).length} selected)
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-border rounded-lg p-2">
                      <div className="flex flex-wrap gap-2">
                        {shops.slice(0, 20).map((shop) => (
                          <Badge
                            key={shop.id}
                            variant={(editCard.target_shop_ids || []).includes(shop.id) ? "default" : "outline"}
                            className="cursor-pointer text-xs"
                            onClick={() => toggleShop(shop.id)}
                          >
                            {shop.name} ({shop.shop_code})
                          </Badge>
                        ))}
                        {shops.length > 20 && (
                          <span className="text-xs text-muted-foreground">+{shops.length - 20} more</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Batch Targeting */}
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-primary" />
                      Target Batches ({(editCard.target_batch_ids || []).length} selected)
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-border rounded-lg p-2">
                      <div className="flex flex-wrap gap-2">
                        {batches.slice(0, 20).map((batch) => (
                          <Badge
                            key={batch.id}
                            variant={(editCard.target_batch_ids || []).includes(batch.id) ? "default" : "outline"}
                            className="cursor-pointer text-xs"
                            onClick={() => toggleBatch(batch.id)}
                          >
                            {batch.batch_name || batch.product_type}
                          </Badge>
                        ))}
                        {batches.length === 0 && (
                          <span className="text-sm text-muted-foreground">No batches available</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={saveCard} className="w-full btn-fire">
                  {isCreateMode ? "Create Card" : "Save Changes"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
