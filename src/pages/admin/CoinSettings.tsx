import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Coins, 
  Save,
  MousePointerClick,
  HelpCircle,
  Calendar,
  Settings2,
} from "lucide-react";

interface CoinSetting {
  id: string;
  setting_key: string;
  setting_value: number;
  description: string | null;
}

const SETTING_ICONS: Record<string, React.ReactNode> = {
  daily_checkin_base: <Calendar className="w-5 h-5" />,
  daily_checkin_streak_bonus: <Coins className="w-5 h-5" />,
  offer_click_coins: <MousePointerClick className="w-5 h-5" />,
  quiz_completion_coins: <HelpCircle className="w-5 h-5" />,
  max_offer_clicks_per_day: <Settings2 className="w-5 h-5" />,
};

const SETTING_LABELS: Record<string, string> = {
  daily_checkin_base: "Daily Check-in Base Coins",
  daily_checkin_streak_bonus: "Streak Bonus (per day)",
  offer_click_coins: "Coins per Offer Click",
  quiz_completion_coins: "Coins for Quiz Completion",
  max_offer_clicks_per_day: "Max Rewarded Clicks/Day",
};

const CoinSettings = () => {
  const [editedSettings, setEditedSettings] = useState<Record<string, number>>({});
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["coin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coin_settings")
        .select("*")
        .order("setting_key");

      if (error) throw error;
      return data as CoinSetting[];
    },
  });

  useEffect(() => {
    if (settings) {
      const initial: Record<string, number> = {};
      settings.forEach(s => {
        initial[s.setting_key] = s.setting_value;
      });
      setEditedSettings(initial);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (updates: { key: string; value: number }[]) => {
      for (const update of updates) {
        const { error } = await supabase
          .from("coin_settings")
          .update({ setting_value: update.value, updated_at: new Date().toISOString() })
          .eq("setting_key", update.key);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Coin settings updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["coin-settings"] });
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!settings) return;

    const updates = settings
      .filter(s => editedSettings[s.setting_key] !== s.setting_value)
      .map(s => ({
        key: s.setting_key,
        value: editedSettings[s.setting_key],
      }));

    if (updates.length === 0) {
      toast.info("No changes to save");
      return;
    }

    updateMutation.mutate(updates);
  };

  const hasChanges = settings?.some(s => editedSettings[s.setting_key] !== s.setting_value);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Coin Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure coin rewards for different user actions
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            className="btn-fire"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily Check-in Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Daily Check-in Rewards
                </CardTitle>
                <CardDescription>
                  Configure coins earned for daily check-ins and streak bonuses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings?.filter(s => s.setting_key.includes("checkin")).map(setting => (
                  <div key={setting.id} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      {SETTING_ICONS[setting.setting_key]}
                      {SETTING_LABELS[setting.setting_key] || setting.setting_key}
                    </Label>
                    <Input
                      type="number"
                      value={editedSettings[setting.setting_key] || 0}
                      onChange={(e) => setEditedSettings(prev => ({
                        ...prev,
                        [setting.setting_key]: parseInt(e.target.value) || 0,
                      }))}
                      min="0"
                    />
                    {setting.description && (
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Offer Click Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointerClick className="w-5 h-5 text-primary" />
                  Offer Click Rewards
                </CardTitle>
                <CardDescription>
                  Configure coins earned when users click on offers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings?.filter(s => s.setting_key.includes("click") || s.setting_key.includes("offer")).map(setting => (
                  <div key={setting.id} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      {SETTING_ICONS[setting.setting_key]}
                      {SETTING_LABELS[setting.setting_key] || setting.setting_key}
                    </Label>
                    <Input
                      type="number"
                      value={editedSettings[setting.setting_key] || 0}
                      onChange={(e) => setEditedSettings(prev => ({
                        ...prev,
                        [setting.setting_key]: parseInt(e.target.value) || 0,
                      }))}
                      min="0"
                    />
                    {setting.description && (
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quiz Completion Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  Quiz Completion Rewards
                </CardTitle>
                <CardDescription>
                  Configure coins earned when users complete quizzes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings?.filter(s => s.setting_key.includes("quiz")).map(setting => (
                  <div key={setting.id} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      {SETTING_ICONS[setting.setting_key]}
                      {SETTING_LABELS[setting.setting_key] || setting.setting_key}
                    </Label>
                    <Input
                      type="number"
                      value={editedSettings[setting.setting_key] || 0}
                      onChange={(e) => setEditedSettings(prev => ({
                        ...prev,
                        [setting.setting_key]: parseInt(e.target.value) || 0,
                      }))}
                      min="0"
                    />
                    {setting.description && (
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border-yellow-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  How Coins Work
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Daily Check-in:</strong> Users earn base coins + (streak day × bonus) each day they check in.
                </p>
                <p>
                  <strong className="text-foreground">Offer Clicks:</strong> Users earn coins each time they click an offer, up to the daily limit.
                </p>
                <p>
                  <strong className="text-foreground">Quiz Completion:</strong> Users earn coins once per quiz upon completing it (not per attempt).
                </p>
                <p>
                  <strong className="text-foreground">Spending Coins:</strong> Users can spend coins to unlock exclusive Super Deals with coupons.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CoinSettings;