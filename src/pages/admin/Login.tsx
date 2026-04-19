import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const validatePasswordComplexity = (password: string): { isValid: boolean; error?: string } => {
    const hasMinLength = password.length >= 12;
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasMinLength) {
      return { isValid: false, error: "Password must be at least 12 characters long." };
    }
    if (!hasUppercase) {
      return { isValid: false, error: "Password must contain at least one uppercase letter." };
    }
    if (!hasDigit) {
      return { isValid: false, error: "Password must contain at least one digit." };
    }
    if (!hasSpecial) {
      return { isValid: false, error: "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)." };
    }

    return { isValid: true };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate password complexity before attempting sign-in
      const validation = validatePasswordComplexity(password);
      if (!validation.isValid) {
        toast({
          title: "Password Complexity Error",
          description: validation.error,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast({
          title: "Login Failed",
          description: "Invalid email or password.",
          variant: "destructive",
        });
        return;
      }

      // AdminAuthProvider (on /admin) will verify is_admin and show a retry UI if needed.
      toast({
        title: "Signed in",
        description: "Redirecting to admin panel…",
      });

      navigate("/admin");
    } catch {
      toast({
        title: "Login Error",
        description: "Something went wrong while signing in.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gradient-fire mb-2">DopeDeal</h1>
            <p className="text-muted-foreground">Admin Panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="admin@dopedeal.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 btn-fire"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>

        <p className="text-center text-muted-foreground text-sm mt-4">
          Only authorized accounts can access the admin panel.
          Contact your system administrator to request access.
        </p>
      </div>
    </div>
  );
}
