import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Loader2, Upload, Coins, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SuperDeal {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  long_description: string | null;
  image_url: string | null;
  category: string;
  original_price: number | null;
  discounted_price: number | null;
  discount_percent: number | null;
  platform_name: string | null;
  platform_url: string | null;
  coins_required: number;
  total_coupons: number;
  coupons_claimed: number;
  features: string[] | null;
  status: string;
  display_order: number;
}

interface CouponCode {
  id: string;
  code: string;
  is_claimed: boolean;
  claimed_by: string | null;
  claimed_at: string | null;
}

const SuperDealsAdmin = () => {
  const [deals, setDeals] = useState<SuperDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<SuperDeal | null>(null);
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [bulkCoupons, setBulkCoupons] = useState("");
  
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    long_description: "",
    image_url: "",
    category: "digital_course",
    original_price: "",
    discounted_price: "",
    discount_percent: "",
    platform_name: "",
    platform_url: "",
    coins_required: "50",
    features: "",
    status: "active",
    display_order: "0",
  });

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    const { data, error } = await supabase
      .from("super_deals")
      .select("*")
      .order("display_order", { ascending: true });

    if (data && !error) {
      setDeals(data as SuperDeal[]);
    }
    setLoading(false);
  };

  const fetchCoupons = async (dealId: string) => {
    const { data } = await supabase
      .from("coupon_codes")
      .select("*")
      .eq("super_deal_id", dealId)
      .order("created_at", { ascending: false });

    if (data) {
      setCoupons(data as CouponCode[]);
    }
  };

  const openCreateDialog = () => {
    setSelectedDeal(null);
    setForm({
      title: "",
      subtitle: "",
      description: "",
      long_description: "",
      image_url: "",
      category: "digital_course",
      original_price: "",
      discounted_price: "",
      discount_percent: "",
      platform_name: "",
      platform_url: "",
      coins_required: "50",
      features: "",
      status: "active",
      display_order: "0",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (deal: SuperDeal) => {
    setSelectedDeal(deal);
    setForm({
      title: deal.title,
      subtitle: deal.subtitle || "",
      description: deal.description || "",
      long_description: deal.long_description || "",
      image_url: deal.image_url || "",
      category: deal.category,
      original_price: deal.original_price?.toString() || "",
      discounted_price: deal.discounted_price?.toString() || "",
      discount_percent: deal.discount_percent?.toString() || "",
      platform_name: deal.platform_name || "",
      platform_url: deal.platform_url || "",
      coins_required: deal.coins_required.toString(),
      features: deal.features?.join("\n") || "",
      status: deal.status,
      display_order: deal.display_order.toString(),
    });
    setDialogOpen(true);
  };

  const openCouponDialog = async (deal: SuperDeal) => {
    setSelectedDeal(deal);
    await fetchCoupons(deal.id);
    setBulkCoupons("");
    setCouponDialogOpen(true);
  };

  const saveDeal = async () => {
    if (!form.title) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);

    const dealData = {
      title: form.title,
      subtitle: form.subtitle || null,
      description: form.description || null,
      long_description: form.long_description || null,
      image_url: form.image_url || null,
      category: form.category,
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      discounted_price: form.discounted_price ? parseFloat(form.discounted_price) : null,
      discount_percent: form.discount_percent ? parseInt(form.discount_percent) : null,
      platform_name: form.platform_name || null,
      platform_url: form.platform_url || null,
      coins_required: parseInt(form.coins_required) || 50,
      features: form.features ? form.features.split("\n").filter(Boolean) : [],
      status: form.status,
      display_order: parseInt(form.display_order) || 0,
    };

    if (selectedDeal) {
      const { error } = await supabase
        .from("super_deals")
        .update(dealData)
        .eq("id", selectedDeal.id);

      if (error) {
        toast.error("Failed to update deal");
      } else {
        toast.success("Deal updated!");
        fetchDeals();
        setDialogOpen(false);
      }
    } else {
      const { error } = await supabase.from("super_deals").insert([dealData]);

      if (error) {
        toast.error("Failed to create deal");
      } else {
        toast.success("Deal created!");
        fetchDeals();
        setDialogOpen(false);
      }
    }

    setSaving(false);
  };

  const deleteDeal = async (id: string) => {
    if (!confirm("Delete this deal and all its coupons?")) return;

    const { error } = await supabase.from("super_deals").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete deal");
    } else {
      toast.success("Deal deleted");
      fetchDeals();
    }
  };

  const addBulkCoupons = async () => {
    if (!selectedDeal || !bulkCoupons.trim()) return;

    const codes = bulkCoupons
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);

    if (codes.length === 0) {
      toast.error("No valid coupon codes");
      return;
    }

    setSaving(true);

    const couponsToInsert = codes.map((code) => ({
      super_deal_id: selectedDeal.id,
      code,
    }));

    const { error } = await supabase.from("coupon_codes").insert(couponsToInsert);

    if (error) {
      toast.error("Failed to add coupons");
    } else {
      // Update total_coupons count
      await supabase
        .from("super_deals")
        .update({ total_coupons: selectedDeal.total_coupons + codes.length })
        .eq("id", selectedDeal.id);

      toast.success(`Added ${codes.length} coupon codes!`);
      fetchCoupons(selectedDeal.id);
      fetchDeals();
      setBulkCoupons("");
    }

    setSaving(false);
  };

  const deleteCoupon = async (couponId: string) => {
    const { error } = await supabase.from("coupon_codes").delete().eq("id", couponId);

    if (error) {
      toast.error("Failed to delete coupon");
    } else {
      toast.success("Coupon deleted");
      if (selectedDeal) {
        fetchCoupons(selectedDeal.id);
        // Update total count
        await supabase
          .from("super_deals")
          .update({ total_coupons: Math.max(0, selectedDeal.total_coupons - 1) })
          .eq("id", selectedDeal.id);
        fetchDeals();
      }
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="w-6 h-6 text-purple-500" />
              Super Deals Management
            </h1>
            <p className="text-muted-foreground">
              Manage exclusive coupon deals for users
            </p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Deal
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Coins</TableHead>
                <TableHead>Coupons</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{deal.title}</p>
                      <p className="text-xs text-muted-foreground">{deal.subtitle}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{deal.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      {deal.coins_required}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {deal.coupons_claimed}/{deal.total_coupons}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={deal.status === "active" ? "default" : "secondary"}
                    >
                      {deal.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCouponDialog(deal)}
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(deal)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDeal(deal.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Deal Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDeal ? "Edit Deal" : "Create New Deal"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Digital Marketing Mastery"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Complete Course Bundle"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Short Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description for cards..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Full Description</Label>
              <Textarea
                value={form.long_description}
                onChange={(e) => setForm({ ...form, long_description: e.target.value })}
                placeholder="Detailed description for the landing page..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital_course">Digital Course</SelectItem>
                    <SelectItem value="ebook">eBook</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="sold_out">Sold Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Original Price (₹)</Label>
                <Input
                  type="number"
                  value={form.original_price}
                  onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                  placeholder="4999"
                />
              </div>
              <div className="space-y-2">
                <Label>Discounted Price (₹)</Label>
                <Input
                  type="number"
                  value={form.discounted_price}
                  onChange={(e) => setForm({ ...form, discounted_price: e.target.value })}
                  placeholder="999"
                />
              </div>
              <div className="space-y-2">
                <Label>Discount %</Label>
                <Input
                  type="number"
                  value={form.discount_percent}
                  onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                  placeholder="80"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform Name</Label>
                <Input
                  value={form.platform_name}
                  onChange={(e) => setForm({ ...form, platform_name: e.target.value })}
                  placeholder="Udemy"
                />
              </div>
              <div className="space-y-2">
                <Label>Platform URL</Label>
                <Input
                  value={form.platform_url}
                  onChange={(e) => setForm({ ...form, platform_url: e.target.value })}
                  placeholder="https://udemy.com/course/..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Coins Required</Label>
                <Input
                  type="number"
                  value={form.coins_required}
                  onChange={(e) => setForm({ ...form, coins_required: e.target.value })}
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Features (one per line)</Label>
              <Textarea
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
                placeholder="50+ Hours Content&#10;Lifetime Access&#10;Certificate"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveDeal} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedDeal ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Coupon Management Dialog */}
      <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Coupons: {selectedDeal?.title}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="add">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add">Add Coupons</TabsTrigger>
              <TabsTrigger value="view">View All ({coupons.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="add" className="space-y-4">
              <div className="space-y-2">
                <Label>Add Coupon Codes (one per line)</Label>
                <Textarea
                  value={bulkCoupons}
                  onChange={(e) => setBulkCoupons(e.target.value)}
                  placeholder="SAVE20&#10;DISCOUNT30&#10;FLASH50"
                  rows={8}
                />
              </div>
              <Button onClick={addBulkCoupons} disabled={saving} className="w-full">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Coupons
              </Button>
            </TabsContent>

            <TabsContent value="view">
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <code className="font-mono">{coupon.code}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={coupon.is_claimed ? "secondary" : "default"}>
                            {coupon.is_claimed ? "Claimed" : "Available"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCoupon(coupon.id)}
                            disabled={coupon.is_claimed}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default SuperDealsAdmin;
