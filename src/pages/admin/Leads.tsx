import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { PaginationControls } from "@/components/admin/PaginationControls";
import { usePagination } from "@/hooks/usePagination";
import {
  Phone,
  Store,
  Gift,
  Calendar,
  Search,
  Download,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  Tag,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

interface Lead {
  id: string;
  whatsapp_number: string;
  session_id: string | null;
  shop_id: string | null;
  product_id: string | null;
  campaign_id: string | null;
  result_type: string | null;
  redeemed: boolean;
  redeemed_at: string | null;
  device_type: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  tags: string[] | null;
  status: string;
  created_at: string;
  shops?: { name: string; shop_code: string } | null;
  products?: { name: string; emoji: string } | null;
  quiz_campaigns?: { name: string } | null;
}

interface Product {
  id: string;
  name: string;
  emoji: string;
}

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-blue-500" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { value: "converted", label: "Converted", color: "bg-green-500" },
  { value: "rejected", label: "Rejected", color: "bg-red-500" },
  { value: "unresponsive", label: "Unresponsive", color: "bg-gray-500" },
];

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const { toast } = useToast();

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    converted: 0,
    redeemed: 0,
  });

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          shops:shop_id (name, shop_code),
          products:product_id (name, emoji),
          quiz_campaigns:campaign_id (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads((data as Lead[]) || []);

      // Calculate stats
      const total = data?.length || 0;
      const newCount = data?.filter((l) => l.status === "new").length || 0;
      const contactedCount = data?.filter((l) => l.status === "contacted").length || 0;
      const convertedCount = data?.filter((l) => l.status === "converted").length || 0;
      const redeemedCount = data?.filter((l) => l.redeemed).length || 0;

      setStats({
        total,
        new: newCount,
        contacted: contactedCount,
        converted: convertedCount,
        redeemed: redeemedCount,
      });
    } catch (err) {
      console.error("Failed to fetch leads:", err);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, emoji")
      .order("name");
    setProducts(data || []);
  };

  useEffect(() => {
    fetchLeads();
    fetchProducts();
  }, []);

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      !searchQuery ||
      lead.whatsapp_number.includes(searchQuery) ||
      lead.shops?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.city?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesProduct = productFilter === "all" || lead.product_id === productFilter;
    const matchesResult =
      resultFilter === "all" ||
      (resultFilter === "success" && lead.result_type === "success") ||
      (resultFilter === "failure" && lead.result_type === "failure") ||
      (resultFilter === "redeemed" && lead.redeemed);

    return matchesSearch && matchesStatus && matchesProduct && matchesResult;
  });

  const pagination = usePagination(filteredLeads, { pageSize: 20 });

  const handleUpdateLead = async () => {
    if (!selectedLead) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({
          status: editStatus,
          notes: editNotes || null,
          tags: editTags ? editTags.split(",").map((t) => t.trim()) : null,
        })
        .eq("id", selectedLead.id);

      if (error) throw error;

      toast({ title: "Lead updated successfully" });
      setSelectedLead(null);
      fetchLeads();
    } catch (err) {
      console.error("Failed to update lead:", err);
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const headers = [
      "WhatsApp",
      "Shop",
      "Product",
      "Campaign",
      "Result",
      "Redeemed",
      "Status",
      "City",
      "State",
      "Device",
      "Notes",
      "Tags",
      "Created At",
    ];

    const rows = filteredLeads.map((lead) => [
      `+91${lead.whatsapp_number}`,
      lead.shops?.name || "",
      lead.products?.name || "",
      lead.quiz_campaigns?.name || "",
      lead.result_type || "",
      lead.redeemed ? "Yes" : "No",
      lead.status,
      lead.city || "",
      lead.state || "",
      lead.device_type || "",
      lead.notes || "",
      lead.tags?.join("; ") || "",
      format(new Date(lead.created_at), "yyyy-MM-dd HH:mm"),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n"
    );

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "CSV exported successfully" });
  };

  const openWhatsApp = (number: string) => {
    window.open(`https://wa.me/91${number}`, "_blank");
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find((s) => s.value === status);
    return (
      <Badge className={`${option?.color || "bg-gray-500"} text-white`}>
        {option?.label || status}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Lead Management</h1>
            <p className="text-muted-foreground">
              Manage WhatsApp leads collected from quiz campaigns
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchLeads}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportToCSV} className="btn-fire">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.new}</p>
                  <p className="text-xs text-muted-foreground">New</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-yellow-500/10">
                  <MessageSquare className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.contacted}</p>
                  <p className="text-xs text-muted-foreground">Contacted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.converted}</p>
                  <p className="text-xs text-muted-foreground">Converted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <Gift className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.redeemed}</p>
                  <p className="text-xs text-muted-foreground">Redeemed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by phone, shop, city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="w-[150px]">
                  <Gift className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.emoji} {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={resultFilter} onValueChange={setResultFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="success">Won</SelectItem>
                  <SelectItem value="failure">Lost</SelectItem>
                  <SelectItem value="redeemed">Redeemed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Leads ({filteredLeads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No leads found
              </div>
            ) : (
              <>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>Shop</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagination.paginatedItems.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">
                                +91 {lead.whatsapp_number}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openWhatsApp(lead.whatsapp_number)}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.shops ? (
                              <div>
                                <p className="font-medium">{lead.shops.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {lead.shops.shop_code}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {lead.products ? (
                              <span>
                                {lead.products.emoji} {lead.products.name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {lead.result_type === "success" ? (
                              <Badge className="bg-green-500 text-white">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Won
                              </Badge>
                            ) : lead.result_type === "failure" ? (
                              <Badge variant="destructive">
                                <XCircle className="w-3 h-3 mr-1" />
                                Lost
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                            {lead.redeemed && (
                              <Badge className="ml-1 bg-secondary text-secondary-foreground">
                                Redeemed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(lead.status)}</TableCell>
                          <TableCell>
                            {lead.city || lead.state ? (
                              <span>
                                {lead.city}
                                {lead.city && lead.state && ", "}
                                {lead.state}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {format(new Date(lead.created_at), "dd MMM, HH:mm")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setEditNotes(lead.notes || "");
                                  setEditTags(lead.tags?.join(", ") || "");
                                  setEditStatus(lead.status);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => openWhatsApp(lead.whatsapp_number)}
                              >
                                <MessageSquare className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Lead Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">WhatsApp Number</label>
              <p className="font-mono text-lg">
                +91 {selectedLead?.whatsapp_number}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Tags (comma separated)</label>
              <Input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="interested, premium, follow-up"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add notes about this lead..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLead(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLead} className="btn-fire">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
