import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Users, 
  Coins, 
  Search, 
  Plus, 
  Minus, 
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

interface UserWithWallet {
  user_id: string;
  email: string;
  display_name: string | null;
  coins_balance: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithWallet | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [adjustType, setAdjustType] = useState<"credit" | "debit">("credit");
  const [showTransactionsDialog, setShowTransactionsDialog] = useState(false);
  
  const queryClient = useQueryClient();
  const { verifySensitiveAction } = useAdminAuth();

  // Fetch users with wallets
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Get wallets with user info
      const { data: wallets, error: walletsError } = await supabase
        .from("user_wallets")
        .select("*")
        .order("created_at", { ascending: false });

      if (walletsError) throw walletsError;

      // Get profiles
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, display_name");

      // Get auth users emails via admin function or join
      const usersWithData: UserWithWallet[] = await Promise.all(
        (wallets || []).map(async (wallet) => {
          const profile = profiles?.find(p => p.user_id === wallet.user_id);
          
          // Try to get email from auth - this might not work without admin access
          // For now, use user_id as fallback
          return {
            user_id: wallet.user_id,
            email: wallet.user_id.slice(0, 8) + "...", // Placeholder
            display_name: profile?.display_name || null,
            coins_balance: wallet.coins_balance,
            total_earned: wallet.total_earned,
            total_spent: wallet.total_spent,
            created_at: wallet.created_at,
          };
        })
      );

      return usersWithData;
    },
  });

  // Fetch transactions for selected user
  const { data: transactions } = useQuery({
    queryKey: ["user-transactions", selectedUser?.user_id],
    queryFn: async () => {
      if (!selectedUser) return [];
      
      const { data, error } = await supabase
        .from("coin_transactions")
        .select("*")
        .eq("user_id", selectedUser.user_id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!selectedUser,
  });

  // Adjust coins mutation
  const adjustCoinsMutation = useMutation({
    mutationFn: async ({ userId, amount, description }: { userId: string; amount: number; description: string }) => {
      // Verify admin status before performing sensitive action
      const isVerified = await verifySensitiveAction();
      if (!isVerified) {
        throw new Error("Admin verification failed. Please sign in again.");
      }

      const { data, error } = await supabase.rpc("admin_adjust_coins", {
        p_user_id: userId,
        p_amount: amount,
        p_description: description,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; new_balance?: number };
      if (!result.success) {
        throw new Error(result.error || "Failed to adjust coins");
      }
      
      return result;
    },
    onSuccess: (data) => {
      toast.success(`Coins adjusted successfully! New balance: ${data.new_balance}`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["user-transactions"] });
      setShowAdjustDialog(false);
      setAdjustAmount("");
      setAdjustReason("");
    },
    onError: (error) => {
      toast.error(`Failed to adjust coins: ${error.message}`);
    },
  });

  const handleAdjust = () => {
    if (!selectedUser || !adjustAmount || !adjustReason) {
      toast.error("Please fill in all fields");
      return;
    }

    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive number");
      return;
    }

    const finalAmount = adjustType === "debit" ? -amount : amount;

    adjustCoinsMutation.mutate({
      userId: selectedUser.user_id,
      amount: finalAmount,
      description: `[Admin] ${adjustType === "credit" ? "Credit" : "Debit"}: ${adjustReason}`,
    });
  };

  const filteredUsers = users?.filter(user => 
    user.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCoins = users?.reduce((sum, u) => sum + u.coins_balance, 0) || 0;
  const totalEarned = users?.reduce((sum, u) => sum + u.total_earned, 0) || 0;
  const totalSpent = users?.reduce((sum, u) => sum + u.total_spent, 0) || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage users, view balances, and adjust coins
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Coins className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Coins in Circulation</p>
                  <p className="text-2xl font-bold">{totalCoins.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-2xl font-bold">{totalEarned.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <ArrowDownRight className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">{totalSpent.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Users</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Earned</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-mono text-sm">
                        {user.user_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {user.display_name || (
                          <span className="text-muted-foreground italic">No name</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="font-mono">
                          <Coins className="w-3 h-3 mr-1" />
                          {user.coins_balance.toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-green-500 font-medium">
                        +{user.total_earned.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-500 font-medium">
                        -{user.total_spent.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowTransactionsDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-500 hover:text-green-600"
                            onClick={() => {
                              setSelectedUser(user);
                              setAdjustType("credit");
                              setShowAdjustDialog(true);
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => {
                              setSelectedUser(user);
                              setAdjustType("debit");
                              setShowAdjustDialog(true);
                            }}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Adjust Coins Dialog */}
        <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {adjustType === "credit" ? (
                  <>
                    <Plus className="w-5 h-5 text-green-500" />
                    Credit Coins
                  </>
                ) : (
                  <>
                    <Minus className="w-5 h-5 text-red-500" />
                    Debit Coins
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Selected User</p>
                <p className="font-mono">{selectedUser?.user_id}</p>
                <p className="text-sm mt-1">
                  Current Balance:{" "}
                  <span className="font-bold">{selectedUser?.coins_balance.toLocaleString()}</span> coins
                </p>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Input
                  placeholder="Enter reason for adjustment"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAdjust}
                disabled={adjustCoinsMutation.isPending}
                className={adjustType === "credit" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              >
                {adjustCoinsMutation.isPending ? "Processing..." : `${adjustType === "credit" ? "Credit" : "Debit"} Coins`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transactions Dialog */}
        <Dialog open={showTransactionsDialog} onOpenChange={setShowTransactionsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Transaction History
              </DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <div className="p-4 bg-muted rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">User</p>
                    <p className="font-mono text-sm">{selectedUser?.user_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-2xl font-bold flex items-center gap-1">
                      <Coins className="w-5 h-5 text-yellow-500" />
                      {selectedUser?.coins_balance.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Badge
                            variant={tx.amount >= 0 ? "default" : "destructive"}
                            className="capitalize"
                          >
                            {tx.transaction_type.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={tx.amount >= 0 ? "text-green-500" : "text-red-500"}>
                            {tx.amount >= 0 ? (
                              <ArrowUpRight className="w-4 h-4 inline mr-1" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 inline mr-1" />
                            )}
                            {tx.amount >= 0 ? "+" : ""}{tx.amount}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {tx.description || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(tx.created_at), "MMM d, yyyy HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {transactions?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;