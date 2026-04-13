import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { updateSuccessRule } from "@/lib/admin";
import { Settings, Percent, AlertTriangle, MessageCircle, Link, ExternalLink, Phone } from "lucide-react";

interface QuizSettings {
  id: string;
  category: string;
  success_probability: number;
  fail_probability: number;
  is_active: boolean;
}

interface SuccessRule {
  id: string;
  rule_type: string;
  success_probability: number;
  is_active: boolean;
}

interface AppSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
}

export default function AdminSettings() {
  const [quizSettings, setQuizSettings] = useState<QuizSettings[]>([]);
  const [globalRule, setGlobalRule] = useState<SuccessRule | null>(null);
  const [whatsappChannelLink, setWhatsappChannelLink] = useState("");
  const [whatsappSettingId, setWhatsappSettingId] = useState<string | null>(null);
  const [skipNumberInput, setSkipNumberInput] = useState(false);
  const [skipNumberSettingId, setSkipNumberSettingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingWhatsApp, setIsSavingWhatsApp] = useState(false);
  const [isSavingSkipNumber, setIsSavingSkipNumber] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    const [quizResult, rulesResult, settingsResult] = await Promise.all([
      supabase.from("quiz_settings").select("*").order("category"),
      supabase.from("success_rules").select("*").eq("rule_type", "global").single(),
      supabase.from("app_settings").select("*").in("setting_key", ["whatsapp_channel_link", "skip_whatsapp_number_input"]),
    ]);

    if (quizResult.data) {
      setQuizSettings(quizResult.data);
    }
    if (rulesResult.data) {
      setGlobalRule(rulesResult.data);
    }
    if (settingsResult.data) {
      settingsResult.data.forEach((setting) => {
        if (setting.setting_key === "whatsapp_channel_link") {
          setWhatsappChannelLink(setting.setting_value);
          setWhatsappSettingId(setting.id);
        }
        if (setting.setting_key === "skip_whatsapp_number_input") {
          setSkipNumberInput(setting.setting_value === "true");
          setSkipNumberSettingId(setting.id);
        }
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGlobalRuleUpdate = async () => {
    if (!globalRule) return;
    
    setIsSaving(true);
    const success = await updateSuccessRule("global", globalRule.success_probability);
    
    if (success) {
      toast({
        title: "Saved",
        description: "Global success probability updated",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  const handleCategoryUpdate = async (setting: QuizSettings) => {
    const { error } = await supabase
      .from("quiz_settings")
      .update({
        success_probability: setting.success_probability,
        fail_probability: 100 - setting.success_probability,
      })
      .eq("id", setting.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update category settings",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Saved",
        description: `${setting.category} probability updated`,
      });
    }
  };

  const handleWhatsAppChannelUpdate = async () => {
    if (!whatsappChannelLink.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid WhatsApp channel link",
        variant: "destructive",
      });
      return;
    }

    setIsSavingWhatsApp(true);

    if (whatsappSettingId) {
      // Update existing setting
      const { error } = await supabase
        .from("app_settings")
        .update({ setting_value: whatsappChannelLink.trim() })
        .eq("id", whatsappSettingId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update WhatsApp channel link",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Saved",
          description: "WhatsApp channel link updated successfully",
        });
      }
    } else {
      // Insert new setting
      const { data, error } = await supabase
        .from("app_settings")
        .insert({
          setting_key: "whatsapp_channel_link",
          setting_value: whatsappChannelLink.trim(),
          description: "DopeDeal WhatsApp Channel invite link",
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save WhatsApp channel link",
          variant: "destructive",
        });
      } else {
        setWhatsappSettingId(data.id);
        toast({
          title: "Saved",
          description: "WhatsApp channel link saved successfully",
        });
      }
    }

    setIsSavingWhatsApp(false);
  };

  const handleSkipNumberToggle = async (checked: boolean) => {
    setIsSavingSkipNumber(true);
    setSkipNumberInput(checked);

    if (skipNumberSettingId) {
      const { error } = await supabase
        .from("app_settings")
        .update({ setting_value: checked ? "true" : "false" })
        .eq("id", skipNumberSettingId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update setting",
          variant: "destructive",
        });
        setSkipNumberInput(!checked);
      } else {
        toast({
          title: "Saved",
          description: checked ? "WhatsApp number collection disabled" : "WhatsApp number collection enabled",
        });
      }
    } else {
      const { data, error } = await supabase
        .from("app_settings")
        .insert({
          setting_key: "skip_whatsapp_number_input",
          setting_value: checked ? "true" : "false",
          description: "Skip WhatsApp number input and go directly to channel join",
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save setting",
          variant: "destructive",
        });
        setSkipNumberInput(!checked);
      } else {
        setSkipNumberSettingId(data.id);
        toast({
          title: "Saved",
          description: checked ? "WhatsApp number collection disabled" : "WhatsApp number collection enabled",
        });
      }
    }

    setIsSavingSkipNumber(false);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure app settings and probabilities</p>
        </div>

        {/* WhatsApp Channel Settings */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">WhatsApp Channel</h2>
              <p className="text-sm text-muted-foreground">
                Configure the DopeDeal WhatsApp Channel link for verification
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp-channel">Channel Invite Link</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="whatsapp-channel"
                    type="url"
                    placeholder="https://whatsapp.com/channel/..."
                    value={whatsappChannelLink}
                    onChange={(e) => setWhatsappChannelLink(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {whatsappChannelLink && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(whatsappChannelLink, "_blank")}
                    title="Test link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Users will be redirected to this link to join your WhatsApp Channel during verification
              </p>
            </div>

            <Button
              onClick={handleWhatsAppChannelUpdate}
              disabled={isSavingWhatsApp}
              className="btn-success"
            >
              {isSavingWhatsApp ? "Saving..." : "Save Channel Link"}
            </Button>
          </div>
        </div>

        {/* Skip WhatsApp Number Collection Toggle */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Phone className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Lead Collection Mode</h2>
              <p className="text-sm text-muted-foreground">
                Control whether to collect WhatsApp numbers during verification
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-1">
              <p className="font-medium text-foreground">Skip Number Collection</p>
              <p className="text-sm text-muted-foreground">
                When enabled, users go directly to "Join Channel" without entering their number
              </p>
            </div>
            <Switch
              checked={skipNumberInput}
              onCheckedChange={handleSkipNumberToggle}
              disabled={isSavingSkipNumber}
            />
          </div>

          <div className={`mt-4 p-3 rounded-lg ${skipNumberInput ? "bg-amber-500/10 border border-amber-500/30" : "bg-secondary/10 border border-secondary/30"}`}>
            <p className="text-sm">
              <span className="font-medium">Current Mode:</span>{" "}
              {skipNumberInput ? (
                <span className="text-amber-600 dark:text-amber-400">
                  Direct Channel Join (No number collection)
                </span>
              ) : (
                <span className="text-secondary">
                  Full Lead Collection (Number + Channel)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Global Success Rule */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Global Success Rate</h2>
              <p className="text-sm text-muted-foreground">
                Default probability for all quizzes
              </p>
            </div>
          </div>

          {globalRule && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Success Probability</span>
                <span className="text-2xl font-bold text-primary">
                  {globalRule.success_probability}%
                </span>
              </div>

              <Slider
                value={[globalRule.success_probability]}
                onValueChange={([value]) =>
                  setGlobalRule({ ...globalRule, success_probability: value })
                }
                max={100}
                min={0}
                step={5}
                className="w-full"
              />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0% (All Fail)</span>
                <span>100% (All Success)</span>
              </div>

              <Button
                onClick={handleGlobalRuleUpdate}
                disabled={isSaving}
                className="btn-fire"
              >
                {isSaving ? "Saving..." : "Save Global Setting"}
              </Button>
            </div>
          )}
        </div>

        {/* Category-specific Settings */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Percent className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Category Settings</h2>
              <p className="text-sm text-muted-foreground">
                Override success rate per quiz category
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {quizSettings.map((setting) => (
              <div key={setting.id} className="border-b border-border pb-6 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-foreground capitalize">
                    {setting.category.replace("_", " ")}
                  </h3>
                  <span className="text-lg font-bold text-primary">
                    {setting.success_probability}%
                  </span>
                </div>

                <Slider
                  value={[setting.success_probability]}
                  onValueChange={([value]) => {
                    setQuizSettings(
                      quizSettings.map((s) =>
                        s.id === setting.id ? { ...s, success_probability: value } : s
                      )
                    );
                  }}
                  onValueCommit={() => handleCategoryUpdate(setting)}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />

                <div className="flex justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    Fail: {100 - setting.success_probability}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Success: {setting.success_probability}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-foreground">Important Note</h4>
            <p className="text-sm text-muted-foreground">
              Quiz results are determined by these probability settings, NOT by answer correctness.
              A user can answer all questions "wrong" and still win if they fall within the success
              probability.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
