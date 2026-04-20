import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Coins, User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const WalletButton = () => {
  const { user, wallet, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="w-20 h-9 rounded-full bg-muted animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => navigate("/auth/login")}
        className="gap-2 rounded-full border-primary/30 bg-primary/10 hover:bg-primary/20"
      >
        <User className="w-4 h-4" />
        <span className="hidden sm:inline">Sign In</span>
      </Button>
    );
  }

  const formatCoins = (coins: number) => {
    if (coins >= 1000) {
      return `${(coins / 1000).toFixed(1)}K`;
    }
    return coins.toString();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "gap-2 rounded-full px-3 py-2 h-auto",
            "bg-gradient-to-r from-yellow-500/20 to-orange-500/20",
            "border border-yellow-500/30",
            "hover:from-yellow-500/30 hover:to-orange-500/30",
            "transition-all duration-300"
          )}
        >
          <div className="relative">
            <Coins className="w-5 h-5 text-yellow-500" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <span className="font-bold text-yellow-600 dark:text-yellow-400">
            {wallet ? formatCoins(wallet.coins_balance) : "0"}
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="text-sm font-medium truncate">{user.email}</p>
          <p className="text-xs text-muted-foreground">
            Total Earned: {wallet?.total_earned || 0} coins
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2">
          <Coins className="w-4 h-4 text-yellow-500" />
          <span>Balance: <strong>{wallet?.coins_balance || 0}</strong> coins</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="gap-2 text-destructive">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
