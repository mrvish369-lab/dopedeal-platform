import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Save, RotateCcw, Clock, Heart, TrendingUp, Users, Percent, Star, Shuffle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

interface RecommendationSetting {
  id: string;
  setting_key: string;
  setting_value: Record<string, number>;
  description: string;
}

const SETTING_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  time_based_weights: Clock,
  interest_weights: Heart,
  engagement_weights: TrendingUp,
  new_user_weights: Users,
  discount_weights: Percent,
  rating_weights: Star,
  diversity_settings: Shuffle,
};

const SETTING_LABELS: Record<string, Record<string, string>> = {
  time_based_weights: {
    morning_health_boost: "Morning Health Boost",
    evening_money_boost: "Evening Money Boost",
    night_gaming_boost: "Night Gaming Boost",
  },
  interest_weights: {
    money_making_match: "Money Making Interest Match",
    health_match: "Health Interest Match",
    gaming_match: "Gaming Interest Match",
    deals_match: "Deals Interest Match",
  },
  engagement_weights: {
    category_affinity: "Category Affinity Boost",
    high_scroll_premium: "High Scroll Engagement Boost",
    mobile_quick_deals: "Mobile Quick Deals Boost",
  },
  new_user_weights: {
    popular_item_boost: "Popular Item Boost",
    click_threshold: "New User Click Threshold",
  },
  discount_weights: {
    high_discount_boost: "High Discount Boost (50%+)",
    medium_discount_boost: "Medium Discount Boost (20-49%)",
    high_discount_threshold: "High Discount Threshold (%)",
    medium_discount_threshold: "Medium Discount Threshold (%)",
  },
  rating_weights: {
    high_rating_boost: "High Rating Boost",
    high_rating_threshold: "High Rating Threshold",
  },
  diversity_settings: {
    max_per_segment: "Max Cards Per Segment",
    min_total_before_diversity: "Min Cards Before Diversity",
    randomization_range: "Randomization Range (±)",
  },
};

const SETTING_DESCRIPTIONS: Record<string, string> = {
  time_based_weights: "Adjust how much the time of day affects recommendations",
  interest_weights: "Control boost amounts when user interests match card segments",
  engagement_weights: "Fine-tune scores based on user engagement patterns",
  new_user_weights: "Settings for users with few interactions",
  discount_weights: "How much discounts affect recommendation scores",
  rating_weights: "Boost cards based on their ratings",
  diversity_settings: "Control variety in recommendation results",
};

export default function RecommendationSettings() {
  const [settings, setSettings] = useState<RecommendationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("recommendation_settings")
      .select("*")
      .order("setting_key");

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSettings(data as RecommendationSetting[]);
    }
    setLoading(false);
  };

  const updateSettingValue = (settingKey: string, field: string, value: number) => {
    setSettings((prev) =>
      prev.map((s) =>
        s.setting_key === settingKey
          ? { ...s, setting_value: { ...s.setting_value, [field]: value } }
          : s
      )
    );
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      for (const setting of settings) {
        const { error } = await supabase
          .from("recommendation_settings")
          .update({ setting_value: setting.setting_value })
          .eq("setting_key", setting.setting_key);

        if (error) throw error;
      }
      toast({ title: "Settings saved", description: "AI recommendation weights updated" });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    // Reset to default values
    const defaults: Record<string, Record<string, number>> = {
      time_based_weights: { morning_health_boost: 15, evening_money_boost: 15, night_gaming_boost: 10 },
      interest_weights: { money_making_match: 25, health_match: 25, gaming_match: 20, deals_match: 15 },
      engagement_weights: { category_affinity: 20, high_scroll_premium: 10, mobile_quick_deals: 10 },
      new_user_weights: { popular_item_boost: 15, click_threshold: 3 },
      discount_weights: { high_discount_boost: 15, medium_discount_boost: 8, high_discount_threshold: 50, medium_discount_threshold: 20 },
      rating_weights: { high_rating_boost: 12, high_rating_threshold: 4.5 },
      diversity_settings: { max_per_segment: 2, min_total_before_diversity: 3, randomization_range: 5 },
    };

    setSettings((prev) =>
      prev.map((s) => ({
        ...s,
        setting_value: defaults[s.setting_key] || s.setting_value,
      }))
    );
    setHasChanges(true);
    toast({ title: "Reset to defaults", description: "Save to apply changes" });
  };

  const getMaxValue = (settingKey: string, field: string): number => {
    if (field.includes("threshold") && settingKey === "discount_weights") return 100;
    if (field.includes("threshold") && settingKey === "rating_weights") return 5;
    if (field === "click_threshold") return 10;
    if (field === "max_per_segment") return 5;
    if (field === "min_total_before_diversity") return 6;
    if (field === "randomization_range") return 20;
    return 50;
  };

  const getStep = (settingKey: string, field: string): number => {
    if (field.includes("threshold") && settingKey === "rating_weights") return 0.1;
    return 1;
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">AI Recommendation Settings</h1>
              <p className="text-muted-foreground">
                Fine-tune the AI recommendation algorithm weights and parameters
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetToDefaults} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </Button>
            <Button
              onClick={saveSettings}
              disabled={!hasChanges || saving}
              className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground">How it works</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Each card starts with a base score of 50. The weights below are added to boost cards based on
                user behavior, time of day, interests, and card attributes. Higher weights = stronger recommendation priority.
              </p>
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {settings.map((setting) => {
            const Icon = SETTING_ICONS[setting.setting_key] || Sparkles;
            const labels = SETTING_LABELS[setting.setting_key] || {};
            const description = SETTING_DESCRIPTIONS[setting.setting_key] || "";

            return (
              <Card key={setting.id} className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {setting.setting_key
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </CardTitle>
                      <CardDescription>{description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(setting.setting_value).map(([field, value]) => (
                    <div key={field} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">{labels[field] || field}</Label>
                        <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                          {typeof value === "number" ? value : 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[typeof value === "number" ? value : 0]}
                          onValueChange={([v]) => updateSettingValue(setting.setting_key, field, v)}
                          max={getMaxValue(setting.setting_key, field)}
                          step={getStep(setting.setting_key, field)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={typeof value === "number" ? value : 0}
                          onChange={(e) =>
                            updateSettingValue(setting.setting_key, field, parseFloat(e.target.value) || 0)
                          }
                          className="w-20 text-center"
                          step={getStep(setting.setting_key, field)}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Save Reminder */}
        {hasChanges && (
          <div className="fixed bottom-6 right-6 bg-card border border-primary/50 rounded-xl p-4 shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
            <div className="text-sm">
              <p className="font-medium text-foreground">Unsaved changes</p>
              <p className="text-muted-foreground">Don't forget to save your changes</p>
            </div>
            <Button
              onClick={saveSettings}
              disabled={saving}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
