import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo, lazy, Suspense } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useShops, useInvalidateAdminData, Shop } from "@/hooks/useAdminData";
import { usePagination } from "@/hooks/usePagination";
import { createShop, updateShop } from "@/lib/admin";
import { Plus, Store, MapPin, Phone, Eye, Pause, Play, Search, Map } from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy load map component to avoid SSR issues
const ShopMapPicker = lazy(() => 
  import("@/components/maps/ShopMapPicker").then(m => ({ default: m.ShopMapPicker }))
);

const SHOP_TYPES = [
  { value: "tea_stall", label: "Tea Stall" },
  { value: "pan_stall", label: "Pan Stall" },
  { value: "general_store", label: "General Store" },
  { value: "other", label: "Other" },
];

export default function AdminShops() {
  const { data: shops = [], isLoading } = useShops();
  const { invalidateShops, invalidateDashboard } = useInvalidateAdminData();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(12);
  const [formData, setFormData] = useState({
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocationValid, setIsLocationValid] = useState(true);
  const { toast } = useToast();

  // Filter shops based on search
  const filteredShops = useMemo(() => {
    if (!searchQuery.trim()) return shops;
    const query = searchQuery.toLowerCase();
    return shops.filter(
      (shop) =>
        shop.name.toLowerCase().includes(query) ||
        shop.shop_code.toLowerCase().includes(query) ||
        shop.city?.toLowerCase().includes(query) ||
        shop.owner_name?.toLowerCase().includes(query)
    );
  }, [shops, searchQuery]);

  // Pagination
  const pagination = usePagination(filteredShops, { pageSize });

  const handleCreate = async () => {
    if (!formData.name) {
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

    setIsSubmitting(true);
    const shop = await createShop(formData);

    if (shop) {
      toast({
        title: "Success!",
        description: "Shop created successfully with QR code",
      });
      setIsCreateOpen(false);
      setFormData({
        name: "",
        owner_name: "",
        owner_contact: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        shop_type: "general_store",
        geo_lat: undefined,
        geo_lng: undefined,
      });
      setIsLocationValid(true);
      invalidateShops();
      invalidateDashboard();
    } else {
      toast({
        title: "Error",
        description: "Failed to create shop",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  const toggleShopStatus = async (shop: Shop) => {
    const newStatus = shop.status === "active" ? "paused" : "active";
    const success = await updateShop(shop.id, { status: newStatus });

    if (success) {
      toast({
        title: "Updated",
        description: `Shop ${newStatus === "active" ? "activated" : "paused"}`,
      });
      invalidateShops();
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    pagination.resetPage();
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Shops</h1>
            <p className="text-muted-foreground">Manage your offline distribution points</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-fire gap-2">
                <Plus className="w-5 h-5" />
                Add Shop
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Shop</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Shop Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter shop name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner_name">Owner Name</Label>
                    <Input
                      id="owner_name"
                      value={formData.owner_name}
                      onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                      placeholder="Owner name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner_contact">Contact Number</Label>
                    <Input
                      id="owner_contact"
                      value={formData.owner_contact}
                      onChange={(e) => setFormData({ ...formData, owner_contact: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shop_type">Shop Type</Label>
                  <Select
                    value={formData.shop_type}
                    onValueChange={(value) => setFormData({ ...formData, shop_type: value })}
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
                  <Label htmlFor="address">Full Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
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
                  <Suspense fallback={
                    <div className="h-[300px] bg-muted rounded-xl flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  }>
                    <ShopMapPicker
                      initialLat={formData.geo_lat}
                      initialLng={formData.geo_lng}
                      onLocationSelect={(lat, lng) => {
                        setFormData({ ...formData, geo_lat: lat, geo_lng: lng });
                      }}
                      onAddressData={(data) => {
                        setFormData((prev) => ({
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
                  onClick={handleCreate}
                  disabled={isSubmitting || !isLocationValid}
                  className="w-full btn-fire"
                >
                  {isSubmitting ? "Creating..." : "Create Shop"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        {shops.length > 0 && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search shops by name, code, city..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                pagination.resetPage();
              }}
              className="pl-10"
            />
          </div>
        )}

        {/* Shops Grid */}
        {shops.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pagination.paginatedItems.map((shop) => (
                <div
                  key={shop.id}
                  className={cn(
                    "bg-card border border-border rounded-2xl p-6 transition-all hover:border-primary/50",
                    shop.status !== "active" && "opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Store className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{shop.name}</h3>
                        <p className="text-xs text-muted-foreground">{shop.shop_code}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        shop.status === "active"
                          ? "bg-secondary/20 text-secondary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {shop.status}
                    </span>
                  </div>

                  {shop.city && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <MapPin className="w-4 h-4" />
                      {shop.city}, {shop.state}
                    </div>
                  )}

                  {shop.owner_contact && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                      <Phone className="w-4 h-4" />
                      {shop.owner_contact}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link to={`/admin/shops/${shop.id}`} className="flex-1">
                      <Button variant="outline" className="w-full gap-2">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleShopStatus(shop)}
                      className={shop.status === "active" ? "text-destructive" : "text-secondary"}
                    >
                      {shop.status === "active" ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <PaginationControls
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
              onNextPage={pagination.nextPage}
              onPrevPage={pagination.prevPage}
              onFirstPage={pagination.firstPage}
              onLastPage={pagination.lastPage}
              onPageSizeChange={handlePageSizeChange}
              pageSize={pageSize}
            />
          </>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No Shops Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first shop to start distributing QR codes
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="btn-fire gap-2">
              <Plus className="w-5 h-5" />
              Add Your First Shop
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
