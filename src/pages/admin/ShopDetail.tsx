import { useEffect, useState, lazy, Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getShopWithStats, assignStockBatch, regenerateQRCode, updateShop, Shop } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  QrCode,
  Download,
  RefreshCw,
  Package,
  CheckCircle,
  MessageCircle,
  TrendingUp,
  Map,
  Flame,
  Edit,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ShopTrafficTimeline } from "@/components/admin/ShopTrafficTimeline";
import { StockBatchCard } from "@/components/admin/StockBatchCard";
import { ShopQRCard } from "@/components/admin/ShopQRCard";

// Lazy load map components
const ShopMiniMap = lazy(() => 
  import("@/components/maps/ShopMiniMap").then(m => ({ default: m.ShopMiniMap }))
);
const ShopMapPicker = lazy(() => 
  import("@/components/maps/ShopMapPicker").then(m => ({ default: m.ShopMapPicker }))
);

interface Product {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  hasCampaign?: boolean;
}

const SHOP_TYPES = [
  { value: "tea_stall", label: "Tea Stall" },
  { value: "pan_stall", label: "Pan Stall" },
  { value: "general_store", label: "General Store" },
  { value: "other", label: "Other" },
];

interface ShopStock {
  id: string;
  product_type: string;
  product_id?: string;
  quantity_assigned: number;
  quantity_redeemed: number;
  batch_name?: string;
  status?: string;
  created_at?: string;
  products?: {
    name: string;
    emoji: string | null;
  };
}

interface QRCode {
  id: string;
  qr_url: string;
  status: string;
  version: number;
  qr_type?: string;
  batch_id?: string;
}

export default function ShopDetail() {
  const { shopId } = useParams<{ shopId: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [stats, setStats] = useState({
    total_scans: 0,
    verified_users: 0,
    success_redemptions: 0,
    failure_count: 0,
    quiz_scans: 0,
    lighter_scans: 0,
  });
  const [stock, setStock] = useState<ShopStock[]>([]);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newStock, setNewStock] = useState({ product_id: "", quantity: 0, batch_name: "" });
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    owner_name: "",
    owner_contact: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    shop_type: "general_store",
    geo_lat: undefined as number | undefined,
    geo_lng: undefined as number | undefined,
  });
  const [isLocationValid, setIsLocationValid] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { toast } = useToast();

  const fetchData = async () => {
    if (!shopId) return;
    const data = await getShopWithStats(shopId);
    setShop(data.shop);
    setStats(data.stats);
    setStock(data.stock);
    setQrCodes(data.qrCodes);
    setIsLoading(false);
  };

  const fetchProducts = async () => {
    // Fetch products with their linked campaigns
    const { data: productsData } = await supabase
      .from("products")
      .select("id, name, slug, emoji")
      .eq("status", "active")
      .order("name", { ascending: true });
    
    if (productsData) {
      // Check which products have active campaigns
      const { data: campaigns } = await supabase
        .from("quiz_campaigns")
        .select("product_id")
        .eq("status", "active")
        .not("product_id", "is", null);
      
      const campaignProductIds = new Set(campaigns?.map(c => c.product_id) || []);
      
      const productsWithCampaignStatus = productsData.map(p => ({
        ...p,
        hasCampaign: campaignProductIds.has(p.id)
      }));
      
      setProducts(productsWithCampaignStatus);
    }
  };

  useEffect(() => {
    fetchData();
    fetchProducts();
  }, [shopId]);

  // Populate edit form when shop loads or edit modal opens
  useEffect(() => {
    if (shop && isEditOpen) {
      setEditFormData({
        name: shop.name || "",
        owner_name: shop.owner_name || "",
        owner_contact: shop.owner_contact || "",
        address: shop.address || "",
        city: shop.city || "",
        state: shop.state || "",
        pincode: shop.pincode || "",
        shop_type: shop.shop_type || "general_store",
        geo_lat: shop.geo_lat ? Number(shop.geo_lat) : undefined,
        geo_lng: shop.geo_lng ? Number(shop.geo_lng) : undefined,
      });
      setIsLocationValid(true);
    }
  }, [shop, isEditOpen]);

  const handleAssignStock = async () => {
    if (!shopId || newStock.quantity <= 0 || !newStock.product_id) return;
    
    setIsAssigning(true);
    const selectedProduct = products.find(p => p.id === newStock.product_id);
    const result = await assignStockBatch(shopId, newStock.product_id, newStock.quantity, newStock.batch_name);
    
    if (result) {
      toast({
        title: "Stock Batch Created",
        description: `${newStock.quantity} ${selectedProduct?.name || 'items'} assigned with Product QR generated`,
      });
      fetchData();
      setNewStock({ product_id: "", quantity: 0, batch_name: "" });
    } else {
      toast({
        title: "Error",
        description: "Failed to assign stock. Make sure the product has a linked quiz campaign.",
        variant: "destructive",
      });
    }
    setIsAssigning(false);
  };

  const handleRegenerateQR = async () => {
    if (!shopId) return;
    
    setIsRegenerating(true);
    const newUrl = await regenerateQRCode(shopId);
    
    if (newUrl) {
      toast({
        title: "QR Regenerated",
        description: "New QR code generated. Old QR is now disabled.",
      });
      fetchData();
    } else {
      toast({
        title: "Error",
        description: "Failed to regenerate QR",
        variant: "destructive",
      });
    }
    setIsRegenerating(false);
  };

  const handleUpdateShop = async () => {
    if (!shopId || !editFormData.name) {
      toast({
        title: "Error",
        description: "Shop name is required",
        variant: "destructive",
      });
      return;
    }

    if (!isLocationValid) {
      toast({
        title: "Error",
        description: "Please select a valid location within India",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    const success = await updateShop(shopId, editFormData);

    if (success) {
      toast({
        title: "Success!",
        description: "Shop updated successfully",
      });
      setIsEditOpen(false);
      fetchData();
    } else {
      toast({
        title: "Error",
        description: "Failed to update shop",
        variant: "destructive",
      });
    }
    setIsUpdating(false);
  };

  const downloadQR = (qrCode: QRCode) => {
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrCode.qr_url)}`;
    const link = document.createElement("a");
    link.href = qrImageUrl;
    const suffix = qrCode.qr_type === "lighter" ? "lighter" : "quiz";
    link.download = `QR_${shop?.shop_code || "shop"}_${suffix}.png`;
    link.click();
  };

  // Separate QR codes by type
  const quizQR = qrCodes.find(qr => qr.qr_type === "quiz" || !qr.qr_type);
  const productQRs = qrCodes.filter(qr => qr.qr_type === "lighter" || qr.qr_type === "product");
  
  // Group product QRs by batch and get product info
  const getProductInfoForQR = (qr: QRCode) => {
    const batch = stock.find(s => s.id === qr.batch_id);
    if (batch?.products) {
      return { name: batch.products.name, emoji: batch.products.emoji };
    }
    return { name: batch?.product_type || "Unknown", emoji: null };
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

  if (!shop) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground">Shop not found</h2>
          <Link to="/admin/shops" className="text-primary mt-4 inline-block">
            Back to Shops
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const conversionRate =
    stats.total_scans > 0
      ? Math.round((stats.success_redemptions / stats.total_scans) * 100)
      : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/shops">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{shop.name}</h1>
              <p className="text-muted-foreground">{shop.shop_code}</p>
            </div>
          </div>
          <Button onClick={() => setIsEditOpen(true)} variant="outline" className="gap-2">
            <Edit className="w-4 h-4" />
            Edit Shop
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Scans", value: stats.total_scans, icon: QrCode, color: "text-primary" },
                { label: "Verified Users", value: stats.verified_users, icon: MessageCircle, color: "text-secondary" },
                { label: "Success", value: stats.success_redemptions, icon: CheckCircle, color: "text-green-500" },
                { label: "Conversion", value: `${conversionRate}%`, icon: TrendingUp, color: "text-gold" },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
                    <Icon className={cn("w-5 h-5 mb-2", stat.color)} />
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Tabs for Stock and Traffic */}
            <Tabs defaultValue="stock" className="bg-card border border-border rounded-2xl p-6">
              <TabsList className="mb-4">
                <TabsTrigger value="stock" className="gap-2">
                  <Package className="w-4 h-4" /> Stock
                </TabsTrigger>
                <TabsTrigger value="traffic" className="gap-2">
                  <Activity className="w-4 h-4" /> Traffic Timeline
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stock">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Stock Management
              </h2>

              {/* Current Stock - Using StockBatchCard with expandable traffic */}
              {stock.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Stock Batches ({stock.length})
                  </h3>
                  <div className="space-y-3">
                    {stock.map((item) => {
                      // Find the corresponding QR code for this batch
                      const batchQR = productQRs.find(qr => qr.batch_id === item.id);
                      return (
                        <StockBatchCard
                          key={item.id}
                          batch={item}
                          qrCode={batchQR}
                          shopCode={shop?.shop_code}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add Stock */}
              <div className="flex gap-4 items-end flex-wrap">
                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label>Product</Label>
                  <Select
                    value={newStock.product_id}
                    onValueChange={(value) => setNewStock({ ...newStock, product_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem 
                          key={product.id} 
                          value={product.id}
                          className={!product.hasCampaign ? "opacity-60" : ""}
                        >
                          <span className="flex items-center gap-2">
                            {product.emoji} {product.name}
                            {product.hasCampaign ? (
                              <span className="text-xs text-secondary font-medium">✓ Campaign</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">(No campaign)</span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32 space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={newStock.quantity}
                    onChange={(e) => setNewStock({ ...newStock, quantity: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
                <Button
                  onClick={handleAssignStock}
                  disabled={isAssigning || newStock.quantity <= 0 || !newStock.product_id}
                  className="btn-success"
                >
                  {isAssigning ? "Assigning..." : "Assign Stock"}
                </Button>
              </div>
              {products.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No products available. <Link to="/admin/products" className="text-primary underline">Create products first</Link>.
                </p>
              )}
              </TabsContent>

              <TabsContent value="traffic">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Traffic Timeline
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Detailed event log showing all QR scans, page views, and clicks from this shop
                </p>
                {shopId && <ShopTrafficTimeline shopId={shopId} />}
              </TabsContent>
            </Tabs>
          </div>

          {/* Shop Location & QR Codes */}
          <div className="space-y-6">
            {/* Mini Map */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Map className="w-5 h-5" />
                  Shop Location
                </h2>
                {!shop.geo_lat && !shop.geo_lng && (
                  <Button onClick={() => setIsEditOpen(true)} size="sm" variant="outline">
                    Add Location
                  </Button>
                )}
              </div>
              {shop.geo_lat && shop.geo_lng ? (
                <>
                  <Suspense fallback={
                    <div className="h-[200px] bg-muted rounded-xl flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  }>
                    <ShopMiniMap
                      lat={Number(shop.geo_lat)}
                      lng={Number(shop.geo_lng)}
                      shopName={shop.name}
                      height="200px"
                    />
                  </Suspense>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {[shop.address, shop.city, shop.state, shop.pincode].filter(Boolean).join(", ")}
                  </p>
                </>
              ) : (
                <div className="h-[200px] bg-muted/30 rounded-xl flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">No location set</p>
                </div>
              )}
            </div>

            {/* QR Codes Section */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                QR Codes
              </h2>

              <div className="space-y-4">
                {/* Quiz QR with expandable analytics */}
                {quizQR && shopId && (
                  <ShopQRCard
                    qrCode={quizQR}
                    shopId={shopId}
                    shopCode={shop?.shop_code}
                    title="🎯 Quiz QR (Goodie Entry)"
                    variant="quiz"
                  />
                )}

                {/* Product QRs with expandable analytics */}
                {productQRs.length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 pt-2">
                      <Package className="w-4 h-4" />
                      Product QRs ({productQRs.length})
                    </h3>
                    {productQRs.map((qr) => {
                      const productInfo = getProductInfoForQR(qr);
                      return (
                        <ShopQRCard
                          key={qr.id}
                          qrCode={qr}
                          shopId={shopId!}
                          shopCode={shop?.shop_code}
                          title={productInfo.name}
                          emoji={productInfo.emoji || "📦"}
                          variant="product"
                        />
                      );
                    })}
                  </>
                )}

                {!quizQR && productQRs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No QR codes generated yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Shop Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Shop</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Shop Name *</Label>
              <Input
                id="edit_name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Enter shop name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_owner_name">Owner Name</Label>
                <Input
                  id="edit_owner_name"
                  value={editFormData.owner_name}
                  onChange={(e) => setEditFormData({ ...editFormData, owner_name: e.target.value })}
                  placeholder="Owner name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_owner_contact">Contact Number</Label>
                <Input
                  id="edit_owner_contact"
                  value={editFormData.owner_contact}
                  onChange={(e) => setEditFormData({ ...editFormData, owner_contact: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_shop_type">Shop Type</Label>
              <Select
                value={editFormData.shop_type}
                onValueChange={(value) => setEditFormData({ ...editFormData, shop_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHOP_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_address">Full Address</Label>
              <Input
                id="edit_address"
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_city">City</Label>
                <Input
                  id="edit_city"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_state">State</Label>
                <Input
                  id="edit_state"
                  value={editFormData.state}
                  onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                  placeholder="State"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_pincode">Pincode</Label>
                <Input
                  id="edit_pincode"
                  value={editFormData.pincode}
                  onChange={(e) => setEditFormData({ ...editFormData, pincode: e.target.value })}
                  placeholder="123456"
                />
              </div>
            </div>

            {/* Map Section for Geo Location */}
            <div className="space-y-2 border-t border-border pt-4">
              <Label className="flex items-center gap-2">
                <Map className="w-4 h-4" />
                Pin Shop Location on Map
              </Label>
              <p className="text-xs text-muted-foreground">
                Only locations within India are allowed
              </p>
              <Suspense fallback={
                <div className="h-[300px] bg-muted rounded-xl flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              }>
                <ShopMapPicker
                  initialLat={editFormData.geo_lat}
                  initialLng={editFormData.geo_lng}
                  onLocationSelect={(lat, lng) => {
                    setEditFormData({ ...editFormData, geo_lat: lat, geo_lng: lng });
                  }}
                  onAddressData={(data) => {
                    setEditFormData((prev) => ({
                      ...prev,
                      city: data.city || prev.city,
                      state: data.state || prev.state,
                      pincode: data.pincode || prev.pincode,
                    }));
                  }}
                  onValidationChange={setIsLocationValid}
                />
              </Suspense>
            </div>

            <Button
              onClick={handleUpdateShop}
              disabled={isUpdating || !isLocationValid}
              className="w-full btn-fire"
            >
              {isUpdating ? "Updating..." : "Update Shop"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
