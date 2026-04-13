import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { supabase } from "@/integrations/supabase/client";
import { useAffiliateLinks, useOfferBlocks, useInvalidateAdminData } from "@/hooks/useAdminData";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Link as LinkIcon,
  DollarSign,
  MousePointer,
  Download,
  Edit,
  Trash2,
  Search,
} from "lucide-react";

interface AffiliateLink {
  id: string;
  platform_name: string;
  tracking_url: string;
  commission_value: number;
  block_id: string | null;
  total_clicks: number;
  total_installs: number;
  estimated_earnings: number;
  status: string;
}

const Affiliates = () => {
  const { data: links = [], isLoading: linksLoading } = useAffiliateLinks();
  const { data: blocks = [], isLoading: blocksLoading } = useOfferBlocks();
  const { invalidateAffiliates } = useInvalidateAdminData();
  const [showEditor, setShowEditor] = useState(false);
  const [editingLink, setEditingLink] = useState<AffiliateLink | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const { toast } = useToast();

  // Form state
  const [platformName, setPlatformName] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [commissionValue, setCommissionValue] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");

  const loading = linksLoading || blocksLoading;

  // Filter links based on search
  const filteredLinks = useMemo(() => {
    if (!searchQuery.trim()) return links;
    const query = searchQuery.toLowerCase();
    return links.filter(
      (link) =>
        link.platform_name.toLowerCase().includes(query) ||
        link.tracking_url.toLowerCase().includes(query)
    );
  }, [links, searchQuery]);

  // Pagination
  const pagination = usePagination(filteredLinks, { pageSize });

  const resetForm = () => {
    setPlatformName("");
    setTrackingUrl("");
    setCommissionValue("");
    setSelectedBlockId("");
    setEditingLink(null);
  };

  const openEditor = (link?: AffiliateLink) => {
    if (link) {
      setEditingLink(link);
      setPlatformName(link.platform_name);
      setTrackingUrl(link.tracking_url);
      setCommissionValue(link.commission_value.toString());
      setSelectedBlockId(link.block_id || "");
    } else {
      resetForm();
    }
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!platformName || !trackingUrl) {
      toast({
        title: "Error",
        description: "Platform name and URL are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = {
        platform_name: platformName,
        tracking_url: trackingUrl,
        commission_value: parseFloat(commissionValue) || 0,
        block_id: selectedBlockId || null,
      };

      if (editingLink) {
        const { error } = await supabase
          .from("affiliate_links")
          .update(data)
          .eq("id", editingLink.id);
        if (error) throw error;
        toast({ title: "Success", description: "Affiliate link updated" });
      } else {
        const { error } = await supabase.from("affiliate_links").insert(data);
        if (error) throw error;
        toast({ title: "Success", description: "Affiliate link created" });
      }

      setShowEditor(false);
      resetForm();
      invalidateAffiliates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save affiliate link",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this affiliate link?")) return;

    try {
      const { error } = await supabase.from("affiliate_links").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Affiliate link deleted" });
      invalidateAffiliates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete affiliate link",
        variant: "destructive",
      });
    }
  };

  const updateInstalls = async (id: string, installs: number) => {
    try {
      const link = links.find((l) => l.id === id);
      if (!link) return;

      const earnings = installs * link.commission_value;
      const { error } = await supabase
        .from("affiliate_links")
        .update({
          total_installs: installs,
          estimated_earnings: earnings,
        })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Success", description: "Installs updated" });
      invalidateAffiliates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update installs",
        variant: "destructive",
      });
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    pagination.resetPage();
  };

  // Calculate totals
  const totalClicks = links.reduce((sum, l) => sum + l.total_clicks, 0);
  const totalInstalls = links.reduce((sum, l) => sum + l.total_installs, 0);
  const totalEarnings = links.reduce((sum, l) => sum + l.estimated_earnings, 0);

  if (loading) {
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
            <h1 className="text-2xl font-bold text-foreground">
              Affiliate & Revenue
            </h1>
            <p className="text-muted-foreground">
              Track affiliate links and earnings
            </p>
          </div>
          <Button className="btn-fire gap-2" onClick={() => openEditor()}>
            <Plus className="w-4 h-4" />
            Add Link
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <MousePointer className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{totalClicks}</p>
              <p className="text-sm text-muted-foreground">Total Clicks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Download className="w-8 h-8 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold">{totalInstalls}</p>
              <p className="text-sm text-muted-foreground">Total Installs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold">₹{totalEarnings.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Est. Earnings</p>
            </CardContent>
          </Card>
        </div>

        {/* Affiliate Links List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Affiliate Links
              </CardTitle>
              {links.length > 0 && (
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search links..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      pagination.resetPage();
                    }}
                    className="pl-10 h-9"
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {links.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No affiliate links yet.</p>
                <p className="text-sm mt-1">
                  Add your first affiliate link to start tracking.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {pagination.paginatedItems.map((link) => (
                    <div
                      key={link.id}
                      className="p-4 rounded-xl border border-border bg-card"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground">
                            {link.platform_name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {link.tracking_url}
                          </p>
                          {link.block_id && (
                            <p className="text-xs text-primary mt-1">
                              Linked to:{" "}
                              {blocks.find((b) => b.id === link.block_id)?.title ||
                                "Unknown block"}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditor(link)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(link.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Commission
                          </p>
                          <p className="font-medium">₹{link.commission_value}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Clicks</p>
                          <p className="font-medium">{link.total_clicks}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Installs</p>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={link.total_installs}
                              onChange={(e) =>
                                updateInstalls(link.id, parseInt(e.target.value) || 0)
                              }
                              className="w-16 h-8 text-center"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Earnings</p>
                          <p className="font-medium text-secondary">
                            ₹{link.estimated_earnings.toFixed(2)}
                          </p>
                        </div>
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLink ? "Edit" : "Add"} Affiliate Link
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                placeholder="e.g., Amazon, Flipkart"
              />
            </div>
            <div className="space-y-2">
              <Label>Tracking URL</Label>
              <Input
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Commission Value (₹)</Label>
              <Input
                type="number"
                value={commissionValue}
                onChange={(e) => setCommissionValue(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Link to Block (Optional)</Label>
              <Select value={selectedBlockId} onValueChange={setSelectedBlockId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a block" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {blocks.map((block) => (
                    <SelectItem key={block.id} value={block.id}>
                      {block.title || `Untitled ${block.block_type}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowEditor(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button className="flex-1 btn-fire" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Affiliates;
