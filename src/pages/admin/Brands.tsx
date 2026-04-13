import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useBrands, useInvalidateAdminData, type Brand } from "@/hooks/useAdminData";
import {
  Plus,
  Building2,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/admin/PaginationControls";

interface Campaign {
  id: string;
  brand_id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  total_impressions: number;
  total_clicks: number;
  status: string;
}

const Brands = () => {
  const { data: brands = [], isLoading } = useBrands();
  const { invalidateBrands } = useInvalidateAdminData();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);

  // Filter brands
  const filteredBrands = brands.filter((brand) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      brand.name.toLowerCase().includes(query) ||
      brand.contact_person?.toLowerCase().includes(query) ||
      brand.contact_email?.toLowerCase().includes(query)
    );
  });

  // Pagination
  const {
    paginatedItems: paginatedBrands,
    currentPage,
    totalPages,
    totalItems,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    startIndex,
    endIndex,
    resetPage,
  } = usePagination(filteredBrands, { pageSize });

  // Reset page when search changes
  useEffect(() => {
    resetPage();
  }, [searchQuery]);

  const fetchCampaigns = async (brandId: string) => {
    try {
      const { data, error } = await supabase
        .from("brand_campaigns")
        .select("*")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns((data || []) as Campaign[]);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  const resetForm = () => {
    setName("");
    setContactPerson("");
    setContactEmail("");
    setContactPhone("");
    setLogoUrl("");
    setEditingBrand(null);
  };

  const openEditor = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setName(brand.name);
      setContactPerson(brand.contact_person || "");
      setContactEmail(brand.contact_email || "");
      setContactPhone(brand.contact_phone || "");
      setLogoUrl(brand.logo_url || "");
    } else {
      resetForm();
    }
    setShowEditor(true);
  };

  const viewCampaigns = async (brand: Brand) => {
    setSelectedBrand(brand);
    await fetchCampaigns(brand.id);
    setShowCampaigns(true);
  };

  const handleSave = async () => {
    if (!name) {
      toast({ title: "Error", description: "Brand name is required", variant: "destructive" });
      return;
    }

    try {
      const data = {
        name,
        contact_person: contactPerson || null,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        logo_url: logoUrl || null,
      };

      if (editingBrand) {
        const { error } = await supabase.from("brands").update(data).eq("id", editingBrand.id);
        if (error) throw error;
        toast({ title: "Success", description: "Brand updated" });
      } else {
        const { error } = await supabase.from("brands").insert([data]);
        if (error) throw error;
        toast({ title: "Success", description: "Brand created" });
      }

      setShowEditor(false);
      resetForm();
      invalidateBrands();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save brand", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this brand and all its campaigns?")) return;

    try {
      const { error } = await supabase.from("brands").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Brand deleted" });
      invalidateBrands();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete brand", variant: "destructive" });
    }
  };

  // Calculate totals
  const totalBrands = brands.length;
  const activeBrands = brands.filter(b => b.status === "active").length;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
            <h1 className="text-2xl font-bold text-foreground">Brand Partners</h1>
            <p className="text-muted-foreground">Manage advertiser accounts and campaigns</p>
          </div>
          <Button className="btn-fire gap-2" onClick={() => openEditor()}>
            <Plus className="w-4 h-4" />
            Add Brand
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Building2 className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{totalBrands}</p>
              <p className="text-sm text-muted-foreground">Total Brands</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-8 h-8 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold">{activeBrands}</p>
              <p className="text-sm text-muted-foreground">Active Brands</p>
            </CardContent>
          </Card>
        </div>

        {/* Brands List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Brands</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </CardHeader>
          <CardContent>
            {paginatedBrands.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{searchQuery ? "No brands match your search" : "No brands added yet"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedBrands.map((brand) => (
                  <div
                    key={brand.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                        {brand.logo_url ? (
                          <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground">{brand.name}</p>
                          <Badge variant={brand.status === "active" ? "default" : "secondary"}>
                            {brand.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {brand.contact_person || "No contact"} • {brand.contact_email || "No email"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => viewCampaigns(brand)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Campaigns
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditor(brand)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(brand.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalItems > 0 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                onNextPage={nextPage}
                onPrevPage={prevPage}
                onFirstPage={firstPage}
                onLastPage={lastPage}
                onPageSizeChange={setPageSize}
                pageSize={pageSize}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Brand Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBrand ? "Edit" : "Add"} Brand</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Brand Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Brand name" />
            </div>
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Contact name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@brand.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+91..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowEditor(false); resetForm(); }}>
                Cancel
              </Button>
              <Button className="flex-1 btn-fire" onClick={handleSave}>
                Save Brand
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaigns Dialog */}
      <Dialog open={showCampaigns} onOpenChange={setShowCampaigns}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedBrand?.name} Campaigns</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {campaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No campaigns yet</p>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <div key={campaign.id} className="p-4 rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{campaign.name}</p>
                    <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p>{format(new Date(campaign.start_date), "MMM d")} - {campaign.end_date ? format(new Date(campaign.end_date), "MMM d") : "Ongoing"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Impressions</p>
                      <p className="font-medium">{campaign.total_impressions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Clicks</p>
                      <p className="font-medium">{campaign.total_clicks.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Brands;
