import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CampaignImageUpload } from "@/components/admin/CampaignImageUpload";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  IndianRupee,
} from "lucide-react";
import { format } from "date-fns";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  offer_price: number;
  original_price: number;
  emoji: string;
  status: string;
  created_at: string;
}

const defaultProduct: Omit<Product, "id" | "created_at"> = {
  name: "",
  slug: "",
  description: "",
  image_url: null,
  offer_price: 2,
  original_price: 50,
  emoji: "🎁",
  status: "active",
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState(defaultProduct);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const slug = formData.slug || generateSlug(formData.name);
      const payload = {
        name: formData.name,
        slug,
        description: formData.description || null,
        image_url: formData.image_url,
        offer_price: formData.offer_price,
        original_price: formData.original_price,
        emoji: formData.emoji,
        status: formData.status,
      };

      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        toast({ title: "Product updated successfully" });
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        toast({ title: "Product created successfully" });
      }

      setShowDialog(false);
      setFormData(defaultProduct);
      setEditingId(null);
      fetchProducts();
    } catch (err: any) {
      console.error("Failed to save product:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description,
      image_url: product.image_url,
      offer_price: product.offer_price,
      original_price: product.original_price,
      emoji: product.emoji,
      status: product.status,
    });
    setEditingId(product.id);
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Product deleted" });
      fetchProducts();
    } catch (err) {
      console.error("Failed to delete product:", err);
      toast({
        title: "Error",
        description: "Failed to delete product. It may be in use.",
        variant: "destructive",
      });
    }
  };

  const toggleStatus = async (product: Product) => {
    try {
      const newStatus = product.status === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("products")
        .update({ status: newStatus })
        .eq("id", product.id);
      if (error) throw error;
      fetchProducts();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">
              Manage products distributed through quiz campaigns
            </p>
          </div>
          <Button
            onClick={() => {
              setFormData(defaultProduct);
              setEditingId(null);
              setShowDialog(true);
            }}
            className="btn-fire"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              All Products ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No products yet. Create your first product!
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Offer Price</TableHead>
                      <TableHead>Original Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                                {product.emoji}
                              </div>
                            )}
                            <div>
                              <p className="font-medium">
                                {product.emoji} {product.name}
                              </p>
                              {product.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {product.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center text-green-600 font-bold">
                            <IndianRupee className="w-3 h-3" />
                            {product.offer_price}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center text-muted-foreground line-through">
                            <IndianRupee className="w-3 h-3" />
                            {product.original_price}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.status === "active"
                                ? "default"
                                : "secondary"
                            }
                            className="cursor-pointer"
                            onClick={() => toggleStatus(product)}
                          >
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(product.created_at), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(product)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <label className="text-sm font-medium">Emoji</label>
                <Input
                  value={formData.emoji}
                  onChange={(e) =>
                    setFormData({ ...formData, emoji: e.target.value })
                  }
                  className="text-center text-2xl"
                  maxLength={2}
                />
              </div>
              <div className="col-span-3">
                <label className="text-sm font-medium">Product Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    })
                  }
                  placeholder="DopeDeal Lighter"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Slug</label>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="dopedeal-lighter"
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL-friendly identifier, auto-generated from name
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Premium quality refillable lighter..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Offer Price (₹)</label>
                <Input
                  type="number"
                  value={formData.offer_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      offer_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  min={0}
                  step={0.5}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Original Price (₹)</label>
                <Input
                  type="number"
                  value={formData.original_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      original_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  min={0}
                  step={0.5}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Product Image</label>
              <CampaignImageUpload
                value={formData.image_url || ""}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                folder="products"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Active</label>
              <Switch
                checked={formData.status === "active"}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    status: checked ? "active" : "inactive",
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-fire"
            >
              {isSubmitting ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
