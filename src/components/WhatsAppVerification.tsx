import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { 
  getCurrentSessionId, 
  updateSessionWhatsApp, 
  isWhatsAppNumberUsed,
  trackEvent,
  captureLead
} from "@/lib/session";

interface WhatsAppVerificationProps {
  onVerified: () => void;
  onError: (message: string) => void;
}

// Default fallback channel link
const DEFAULT_CHANNEL_LINK = "https://whatsapp.com/channel/YOUR_CHANNEL_ID";

export const WhatsAppVerification = ({
  onVerified,
  onError,
}: WhatsAppVerificationProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"loading" | "input" | "verify">("loading");
  const [channelLink, setChannelLink] = useState(DEFAULT_CHANNEL_LINK);
  const [skipNumberInput, setSkipNumberInput] = useState(false);

  // Fetch settings from database
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["whatsapp_channel_link", "skip_whatsapp_number_input"]);
      
      if (data) {
        data.forEach((setting) => {
          if (setting.setting_key === "whatsapp_channel_link" && setting.setting_value) {
            setChannelLink(setting.setting_value);
          }
          if (setting.setting_key === "skip_whatsapp_number_input") {
            setSkipNumberInput(setting.setting_value === "true");
          }
        });
      }

      // Determine initial step based on settings
      setStep(skipNumberInput ? "verify" : "input");
    };
    fetchSettings();
  }, [skipNumberInput]);

  const validatePhone = (phone: string): boolean => {
    // Indian mobile number validation
    const cleaned = phone.replace(/\D/g, "");
    return /^[6-9]\d{9}$/.test(cleaned);
  };

  const handleSubmit = async () => {
    setError(null);
    const cleaned = phoneNumber.replace(/\D/g, "");

    if (!validatePhone(cleaned)) {
      setError("Please enter a valid 10-digit Indian mobile number");
      return;
    }

    setIsLoading(true);

    // Check if number already used
    const isUsed = await isWhatsAppNumberUsed(cleaned);
    if (isUsed) {
      setError("This number has already claimed a reward. Try another number!");
      setIsLoading(false);
      return;
    }

    // Save number to session
    const sessionId = getCurrentSessionId();
    if (sessionId) {
      await updateSessionWhatsApp(sessionId, cleaned, false);
    }

    await trackEvent("whatsapp_number_entered", { phone: cleaned.slice(-4) });

    setStep("verify");
    setIsLoading(false);
  };

  const handleJoinChannel = async () => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    
    // Track verification attempt
    await trackEvent("whatsapp_channel_join_started", { 
      phone: cleaned ? cleaned.slice(-4) : "skipped",
      skip_mode: skipNumberInput 
    });

    // Open WhatsApp Channel link
    window.open(channelLink, "_blank");

    // After a short delay, mark as verified and proceed
    setTimeout(async () => {
      const sessionId = getCurrentSessionId();
      if (sessionId) {
        // Only update with phone if we collected it
        if (cleaned) {
          await updateSessionWhatsApp(sessionId, cleaned, true);
          // Capture as lead for future remarketing
          await captureLead(cleaned, { sessionId });
        } else {
          // Just mark as verified without phone
          await supabase
            .from("sessions")
            .update({ whatsapp_verified: true })
            .eq("id", sessionId);
        }
      }
      await trackEvent("whatsapp_channel_joined", { 
        phone: cleaned ? cleaned.slice(-4) : "skipped" 
      });
      onVerified();
    }, 2000);
  };

  // Loading state while fetching settings
  if (step === "loading") {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto scale-in">
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
        {/* WhatsApp Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-secondary/20 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-secondary"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>

        {step === "input" ? (
          <>
            <h2 className="text-2xl font-bold text-center text-foreground mb-2">
              Verify Your WhatsApp
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              Enter your WhatsApp number to claim your reward
            </p>

            {/* Phone Input */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="w-20 px-3 py-3 bg-muted rounded-xl text-center text-foreground font-medium">
                  +91
                </div>
                <Input
                  type="tel"
                  placeholder="Enter 10-digit number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className={cn(
                    "flex-1 h-12 text-lg rounded-xl",
                    error && "border-destructive"
                  )}
                  maxLength={10}
                />
              </div>

              {error && (
                <p className="text-destructive text-sm animate-fade-in">
                  {error}
                </p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={phoneNumber.length !== 10 || isLoading}
                className="w-full h-14 text-lg font-bold btn-success rounded-xl glow-secondary"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Checking...
                  </span>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-center text-foreground mb-2">
              Join Our WhatsApp Channel
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              Tap the button below to join DopeDeal WhatsApp Channel
              {!skipNumberInput && " and verify your number"}
            </p>

            {!skipNumberInput && phoneNumber && (
              <div className="bg-muted/50 rounded-xl p-4 mb-6">
                <p className="text-center text-foreground font-mono text-lg">
                  +91 {phoneNumber}
                </p>
              </div>
            )}

            <Button
              onClick={handleJoinChannel}
              className="w-full h-14 text-lg font-bold btn-success rounded-xl glow-secondary"
            >
              <svg
                className="w-6 h-6 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Join DopeDeal WhatsApp Channel
            </Button>

            {!skipNumberInput && (
              <button
                onClick={() => setStep("input")}
                className="w-full mt-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                Change number
              </button>
            )}
          </>
        )}
      </div>

      {/* Security note */}
      <p className="text-center text-muted-foreground text-xs mt-4">
        🔒 Your data is secure and will only be used for verification
      </p>
    </div>
  );
};
