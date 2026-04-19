import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Image, MessageSquare, Settings, X, Plus, Eye, Package } from "lucide-react";
import { CampaignImageUpload } from "./CampaignImageUpload";
import { CampaignPreview } from "./CampaignPreview";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

interface Product {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  offer_price: number;
  original_price: number;
  image_url: string | null;
  status: string;
}

const CATEGORIES = [
  { value: "bollywood", label: "Bollywood 🎬" },
  { value: "social_media", label: "Social Media 📱" },
  { value: "cricket", label: "Cricket / IPL 🏏" },
  { value: "sports", label: "Sports ⚽" },
  { value: "tech", label: "Technology 💻" },
  { value: "music", label: "Music 🎵" },
  { value: "food", label: "Food 🍕" },
  { value: "general", label: "General Knowledge 📚" },
];

interface QuizCampaignEditorProps {
  campaign?: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

interface Campaign {
  id?: string;
  name: string;
  slug: string;
  template_type: string;
  product_id: string | null;
  goodie_title: string;
  goodie_subtitle: string;
  goodie_emoji: string;
  goodie_image_url: string;
  goodie_price: string;
  goodie_original_price: string;
  success_title: string;
  success_message: string;
  failure_title: string;
  failure_message: string;
  redemption_steps: string[];
  validity_hours: number;
  hero_banner_enabled: boolean;
  hero_banner_image_url: string;
  hero_banner_title: string;
  hero_banner_subtitle: string;
  hero_banner_gradient_from: string;
  hero_banner_gradient_to: string;
  bottom_banner_enabled: boolean;
  bottom_banner_image_url: string;
  bottom_banner_title: string;
  bottom_banner_subtitle: string;
  bottom_banner_redirect_url: string;
  bottom_banner_cta_text: string;
  quiz_categories: string[];
  questions_count: number;
  success_probability: number;
  status: string;
}

const defaultCampaign: Campaign = {
  name: "",
  slug: "",
  template_type: "custom",
  product_id: null,
  goodie_title: "",
  goodie_subtitle: "",
  goodie_emoji: "🎁",
  goodie_image_url: "",
  goodie_price: "",
  goodie_original_price: "",
  success_title: "Congratulations! 🎉",
  success_message: "You've won your DopeDeal Goodie!",
  failure_title: "Better Luck Next Time!",
  failure_message: "Don't worry, you can try again from another stall!",
  redemption_steps: [
    "Go to the shopkeeper where you scanned the QR",
    "Show this screen to them",
    "Pay the amount and collect your goodie!",
  ],
  validity_hours: 24,
  hero_banner_enabled: false,
  hero_banner_image_url: "",
  hero_banner_title: "",
  hero_banner_subtitle: "",
  hero_banner_gradient_from: "",
  hero_banner_gradient_to: "",
  bottom_banner_enabled: false,
  bottom_banner_image_url: "",
  bottom_banner_title: "",
  bottom_banner_subtitle: "",
  bottom_banner_redirect_url: "",
  bottom_banner_cta_text: "Learn More",
  quiz_categories: ["bollywood", "social_media", "cricket"],
  questions_count: 3,
  success_probability: 0.7,
  status: "active",
};

// Merge campaign with defaults to ensure arrays are always defined
const mergeCampaignWithDefaults = (campaign: Campaign | null | undefined): Campaign => {
  if (!campaign) return defaultCampaign;
  return {
    ...defaultCampaign,
    ...campaign,
    redemption_steps: Array.isArray(campaign.redemption_steps) 
      ? campaign.redemption_steps 
      : defaultCampaign.redemption_steps,
    quiz_categories: Array.isArray(campaign.quiz_categories) 
      ? campaign.quiz_categories 
      : defaultCampaign.quiz_categories,
  };
};

export const QuizCampaignEditor = ({
  campaign,
  open,
  onOpenChange,
  onSaved,
}: QuizCampaignEditorProps) => {
  const [formData, setFormData] = useState<Campaign>(() => mergeCampaignWithDefaults(campaign));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const { toast } = useToast();
  const { verifySensitiveAction } = useAdminAuth();

  const isEditing = !!campaign?.id;

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, emoji, offer_price, original_price, image_url, status")
        .eq("status", "active")
        .order("name");
      
      if (!error && data) {
        setProducts(data);
      }
      setLoadingProducts(false);
    };
    fetchProducts();
  }, []);

  // Reset form when campaign changes
  useEffect(() => {
    setFormData(mergeCampaignWithDefaults(campaign));
  }, [campaign]);

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setFormData({
        ...formData,
        product_id: productId,
        template_type: product.slug,
        goodie_title: product.name,
        goodie_emoji: product.emoji || "🎁",
        goodie_price: `₹${product.offer_price}`,
        goodie_original_price: `₹${product.original_price}`,
        goodie_image_url: product.image_url || formData.goodie_image_url,
        slug: formData.slug || product.slug,
      });
    }
  };

  const handleCategoryToggle = (category: string) => {
    const current = formData.quiz_categories;
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    setFormData({ ...formData, quiz_categories: updated });
  };


  const addRedemptionStep = () => {
    setFormData({
      ...formData,
      redemption_steps: [...formData.redemption_steps, ""],
    });
  };

  const updateRedemptionStep = (index: number, value: string) => {
    const steps = [...formData.redemption_steps];
    steps[index] = value;
    setFormData({ ...formData, redemption_steps: steps });
  };

  const removeRedemptionStep = (index: number) => {
    const steps = formData.redemption_steps.filter((_, i) => i !== index);
    setFormData({ ...formData, redemption_steps: steps });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug || !formData.goodie_title) {
      toast({
        title: "Validation Error",
        description: "Name, slug, and goodie title are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Verify admin status before performing sensitive action
      const isVerified = await verifySensitiveAction();
      if (!isVerified) {
        toast({
          title: "Authorization Required",
          description: "Admin verification failed. Please sign in again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const payload = {
        ...formData,
        redemption_steps: formData.redemption_steps.filter((s) => s.trim()),
      };

      if (isEditing) {
        const { error } = await supabase
          .from("quiz_campaigns")
          .update(payload)
          .eq("id", campaign.id);

        if (error) throw error;
        toast({ title: "Success", description: "Campaign updated successfully" });
      } else {
        const { error } = await supabase.from("quiz_campaigns").insert([payload]);

        if (error) throw error;
        toast({ title: "Success", description: "Campaign created successfully" });
      }

      onSaved();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Save error:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save campaign",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] max-h-[95vh] p-0 overflow-hidden">
        <div className="flex h-[90vh]">
          {/* Left Panel - Form */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
            <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle>
                  {isEditing ? "Edit Quiz Campaign" : "Create Quiz Campaign"}
                </DialogTitle>
                <Button
                  variant={showPreview ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <Tabs defaultValue="basics" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="basics" className="gap-1">
                    <Gift className="w-4 h-4" />
                    Basics
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="gap-1">
                    <MessageSquare className="w-4 h-4" />
                    Messages
                  </TabsTrigger>
                  <TabsTrigger value="banners" className="gap-1">
                    <Image className="w-4 h-4" />
                    Banners
                  </TabsTrigger>
                  <TabsTrigger value="config" className="gap-1">
                    <Settings className="w-4 h-4" />
                    Config
                  </TabsTrigger>
                </TabsList>

                {/* Basics Tab */}
                <TabsContent value="basics" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Campaign Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Diwali Lighter Campaign"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL Slug *</Label>
                      <Input
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                          })
                        }
                        placeholder="diwali-lighter"
                      />
                      <p className="text-xs text-muted-foreground">
                        Access via: /start?campaign={formData.slug || "slug"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Link to Product *
                    </Label>
                    <Select 
                      value={formData.product_id || ""} 
                      onValueChange={handleProductChange}
                      disabled={loadingProducts}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingProducts ? "Loading products..." : "Select a product"} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.emoji || "📦"} {p.name} - ₹{p.offer_price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Selecting a product auto-fills goodie details and links this campaign to stock management.
                    </p>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold mb-3">Goodie/Freebie Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Goodie Title *</Label>
                        <Input
                          value={formData.goodie_title}
                          onChange={(e) =>
                            setFormData({ ...formData, goodie_title: e.target.value })
                          }
                          placeholder="DopeDeal Lighter"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Subtitle</Label>
                        <Input
                          value={formData.goodie_subtitle}
                          onChange={(e) =>
                            setFormData({ ...formData, goodie_subtitle: e.target.value })
                          }
                          placeholder="Premium Quality"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Emoji</Label>
                        <Input
                          value={formData.goodie_emoji}
                          onChange={(e) =>
                            setFormData({ ...formData, goodie_emoji: e.target.value })
                          }
                          placeholder="🔥"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price</Label>
                        <Input
                          value={formData.goodie_price}
                          onChange={(e) =>
                            setFormData({ ...formData, goodie_price: e.target.value })
                          }
                          placeholder="₹2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Original Price</Label>
                        <Input
                          value={formData.goodie_original_price}
                          onChange={(e) =>
                            setFormData({ ...formData, goodie_original_price: e.target.value })
                          }
                          placeholder="₹50"
                        />
                      </div>
                    </div>

                    {/* Goodie Image Upload */}
                    <div className="mt-4 space-y-2">
                      <Label>Goodie Image (optional - replaces emoji on success screen)</Label>
                      <CampaignImageUpload
                        value={formData.goodie_image_url}
                        onChange={(url) => setFormData({ ...formData, goodie_image_url: url })}
                        folder="goodies"
                        label="Upload Goodie Image"
                        aspectRatio="square"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Messages Tab */}
                <TabsContent value="messages" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Success Title</Label>
                      <Input
                        value={formData.success_title}
                        onChange={(e) =>
                          setFormData({ ...formData, success_title: e.target.value })
                        }
                        placeholder="Congratulations! 🎉"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Failure Title</Label>
                      <Input
                        value={formData.failure_title}
                        onChange={(e) =>
                          setFormData({ ...formData, failure_title: e.target.value })
                        }
                        placeholder="Better Luck Next Time!"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Success Message</Label>
                    <Textarea
                      value={formData.success_message}
                      onChange={(e) =>
                        setFormData({ ...formData, success_message: e.target.value })
                      }
                      placeholder="You've won your DopeDeal Goodie!"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Failure Message</Label>
                    <Textarea
                      value={formData.failure_message}
                      onChange={(e) =>
                        setFormData({ ...formData, failure_message: e.target.value })
                      }
                      placeholder="Don't worry, you can try again!"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Validity (hours)</Label>
                    <Input
                      type="number"
                      value={formData.validity_hours}
                      onChange={(e) =>
                        setFormData({ ...formData, validity_hours: parseInt(e.target.value) || 24 })
                      }
                      min={1}
                    />
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label>Redemption Steps</Label>
                      <Button variant="outline" size="sm" onClick={addRedemptionStep}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Step
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.redemption_steps.map((step, index) => (
                        <div key={index} className="flex gap-2">
                          <span className="w-6 h-9 flex items-center justify-center text-sm font-bold text-muted-foreground">
                            {index + 1}.
                          </span>
                          <Input
                            value={step}
                            onChange={(e) => updateRedemptionStep(index, e.target.value)}
                            placeholder={`Step ${index + 1}`}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRedemptionStep(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Banners Tab */}
                <TabsContent value="banners" className="space-y-6">
                  {/* Hero Banner */}
                  <div className="border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">Hero Banner</h4>
                        <p className="text-sm text-muted-foreground">
                          Displayed above quiz content
                        </p>
                      </div>
                      <Switch
                        checked={formData.hero_banner_enabled}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, hero_banner_enabled: checked })
                        }
                      />
                    </div>

                    {formData.hero_banner_enabled && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Banner Image</Label>
                          <CampaignImageUpload
                            value={formData.hero_banner_image_url}
                            onChange={(url) =>
                              setFormData({ ...formData, hero_banner_image_url: url })
                            }
                            folder="hero-banners"
                            label="Upload Hero Banner"
                            aspectRatio="banner"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              value={formData.hero_banner_title}
                              onChange={(e) =>
                                setFormData({ ...formData, hero_banner_title: e.target.value })
                              }
                              placeholder="Win Amazing Prizes!"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Subtitle</Label>
                            <Input
                              value={formData.hero_banner_subtitle}
                              onChange={(e) =>
                                setFormData({ ...formData, hero_banner_subtitle: e.target.value })
                              }
                              placeholder="Limited time offer"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Gradient From (if no image)</Label>
                            <div className="flex gap-2">
                              <Input
                                value={formData.hero_banner_gradient_from}
                                onChange={(e) =>
                                  setFormData({ ...formData, hero_banner_gradient_from: e.target.value })
                                }
                                placeholder="#ff5500"
                              />
                              <input
                                type="color"
                                value={formData.hero_banner_gradient_from || "#ff5500"}
                                onChange={(e) =>
                                  setFormData({ ...formData, hero_banner_gradient_from: e.target.value })
                                }
                                className="w-10 h-10 rounded border cursor-pointer"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Gradient To</Label>
                            <div className="flex gap-2">
                              <Input
                                value={formData.hero_banner_gradient_to}
                                onChange={(e) =>
                                  setFormData({ ...formData, hero_banner_gradient_to: e.target.value })
                                }
                                placeholder="#ffd700"
                              />
                              <input
                                type="color"
                                value={formData.hero_banner_gradient_to || "#ffd700"}
                                onChange={(e) =>
                                  setFormData({ ...formData, hero_banner_gradient_to: e.target.value })
                                }
                                className="w-10 h-10 rounded border cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Banner */}
                  <div className="border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">Bottom Card Banner</h4>
                        <p className="text-sm text-muted-foreground">
                          Clickable card at the bottom with redirect link
                        </p>
                      </div>
                      <Switch
                        checked={formData.bottom_banner_enabled}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, bottom_banner_enabled: checked })
                        }
                      />
                    </div>

                    {formData.bottom_banner_enabled && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Banner Image</Label>
                          <CampaignImageUpload
                            value={formData.bottom_banner_image_url}
                            onChange={(url) =>
                              setFormData({ ...formData, bottom_banner_image_url: url })
                            }
                            folder="bottom-banners"
                            label="Upload Bottom Banner"
                            aspectRatio="banner"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              value={formData.bottom_banner_title}
                              onChange={(e) =>
                                setFormData({ ...formData, bottom_banner_title: e.target.value })
                              }
                              placeholder="Check out our deals!"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Subtitle</Label>
                            <Input
                              value={formData.bottom_banner_subtitle}
                              onChange={(e) =>
                                setFormData({ ...formData, bottom_banner_subtitle: e.target.value })
                              }
                              placeholder="Exclusive offers waiting"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Redirect URL</Label>
                            <Input
                              value={formData.bottom_banner_redirect_url}
                              onChange={(e) =>
                                setFormData({ ...formData, bottom_banner_redirect_url: e.target.value })
                              }
                              placeholder="https://example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>CTA Button Text</Label>
                            <Input
                              value={formData.bottom_banner_cta_text}
                              onChange={(e) =>
                                setFormData({ ...formData, bottom_banner_cta_text: e.target.value })
                              }
                              placeholder="Learn More"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Config Tab */}
                <TabsContent value="config" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Quiz Categories</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Select which categories users can choose from
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <Button
                          key={cat.value}
                          variant={formData.quiz_categories.includes(cat.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleCategoryToggle(cat.value)}
                        >
                          {cat.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Questions Count</Label>
                      <Input
                        type="number"
                        value={formData.questions_count}
                        onChange={(e) =>
                          setFormData({ ...formData, questions_count: parseInt(e.target.value) || 3 })
                        }
                        min={1}
                        max={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Success Probability (%)</Label>
                      <Input
                        type="number"
                        value={Math.round(formData.success_probability * 100)}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            success_probability: (parseInt(e.target.value) || 70) / 100,
                          })
                        }
                        min={0}
                        max={100}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Campaign Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-2 p-4 border-t border-border shrink-0 bg-background">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting} className="btn-fire">
                {isSubmitting ? "Saving..." : isEditing ? "Update Campaign" : "Create Campaign"}
              </Button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          {showPreview && (
            <div className="w-[500px] bg-muted/30 overflow-hidden flex flex-col">
              <CampaignPreview campaign={formData as any} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
