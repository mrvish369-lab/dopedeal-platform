import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  FileText,
  Clock,
  Check,
  Edit,
  Save,
  Database,
  Lock,
} from "lucide-react";
import { format } from "date-fns";

interface LegalPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  is_published: boolean;
  updated_at: string;
}

interface RetentionSetting {
  id: string;
  data_type: string;
  retention_months: number;
  auto_delete: boolean;
  last_cleanup_at: string | null;
}

interface ConsentStats {
  total: number;
  granted: number;
  today: number;
}

const useComplianceData = () => {
  return useQuery({
    queryKey: ["admin", "compliance"],
    queryFn: async () => {
      const [pagesResult, retentionResult, consentsResult] = await Promise.all([
        supabase.from("legal_pages").select("*").order("title"),
        supabase.from("data_retention_settings").select("*"),
        supabase.from("consents").select("granted, created_at"),
      ]);

      const today = new Date().toISOString().split("T")[0];
      const consents = consentsResult.data || [];
      
      return {
        legalPages: (pagesResult.data || []) as LegalPage[],
        retentionSettings: (retentionResult.data || []) as RetentionSetting[],
        consentStats: {
          total: consents.length,
          granted: consents.filter((c) => c.granted).length,
          today: consents.filter((c) => c.created_at.startsWith(today)).length,
        } as ConsentStats,
      };
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
};

const Compliance = () => {
  const { data, isLoading, refetch } = useComplianceData();
  const [editingPage, setEditingPage] = useState<LegalPage | null>(null);
  const [editContent, setEditContent] = useState("");
  const { toast } = useToast();

  const legalPages = data?.legalPages || [];
  const retentionSettings = data?.retentionSettings || [];
  const consentStats = data?.consentStats || { total: 0, granted: 0, today: 0 };

  const startEditingPage = (page: LegalPage) => {
    setEditingPage(page);
    setEditContent(page.content);
  };

  const savePage = async () => {
    if (!editingPage) return;

    try {
      const { error } = await supabase
        .from("legal_pages")
        .update({ content: editContent })
        .eq("id", editingPage.id);

      if (error) throw error;

      toast({ title: "Success", description: "Page content saved" });
      setEditingPage(null);
      refetch();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save page", variant: "destructive" });
    }
  };

  const togglePagePublished = async (page: LegalPage) => {
    try {
      const { error } = await supabase
        .from("legal_pages")
        .update({ is_published: !page.is_published })
        .eq("id", page.id);

      if (error) throw error;
      refetch();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update page", variant: "destructive" });
    }
  };

  const updateRetention = async (setting: RetentionSetting, months: number) => {
    try {
      const { error } = await supabase
        .from("data_retention_settings")
        .update({ retention_months: months })
        .eq("id", setting.id);

      if (error) throw error;
      toast({ title: "Success", description: "Retention period updated" });
      refetch();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

  const toggleAutoDelete = async (setting: RetentionSetting) => {
    try {
      const { error } = await supabase
        .from("data_retention_settings")
        .update({ auto_delete: !setting.auto_delete })
        .eq("id", setting.id);

      if (error) throw error;
      refetch();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Legal & Compliance</h1>
          <p className="text-muted-foreground">Manage privacy, data retention, and legal pages</p>
        </div>

        {/* Consent Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Check className="w-8 h-8 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold">{consentStats.granted}</p>
              <p className="text-sm text-muted-foreground">Consents Granted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{consentStats.total}</p>
              <p className="text-sm text-muted-foreground">Total Records</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold">{consentStats.today}</p>
              <p className="text-sm text-muted-foreground">Today's Consents</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="legal">
          <TabsList className="mb-4">
            <TabsTrigger value="legal">Legal Pages</TabsTrigger>
            <TabsTrigger value="retention">Data Retention</TabsTrigger>
          </TabsList>

          {/* Legal Pages Tab */}
          <TabsContent value="legal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Legal Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {legalPages.map((page) => (
                    <div
                      key={page.id}
                      className="p-4 rounded-xl border border-border"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-bold text-foreground">{page.title}</p>
                            <p className="text-xs text-muted-foreground">
                              /{page.slug} • Updated {format(new Date(page.updated_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={page.is_published}
                              onCheckedChange={() => togglePagePublished(page)}
                            />
                            <Label className="text-sm">Published</Label>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditingPage(page)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                      {editingPage?.id === page.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={10}
                            className="font-mono text-sm"
                          />
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setEditingPage(null)}>
                              Cancel
                            </Button>
                            <Button className="btn-fire" onClick={savePage}>
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg max-h-24 overflow-hidden">
                          {page.content.substring(0, 200)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Retention Tab */}
          <TabsContent value="retention">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Data Retention Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {retentionSettings.map((setting) => (
                    <div
                      key={setting.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground capitalize">
                            {setting.data_type.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {setting.last_cleanup_at
                              ? `Last cleanup: ${format(new Date(setting.last_cleanup_at), "MMM d, yyyy")}`
                              : "No cleanup performed yet"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={setting.retention_months}
                            onChange={(e) => updateRetention(setting, parseInt(e.target.value) || 12)}
                            className="w-20 text-center"
                            min={1}
                            max={60}
                          />
                          <span className="text-sm text-muted-foreground">months</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={setting.auto_delete}
                            onCheckedChange={() => toggleAutoDelete(setting)}
                          />
                          <Label className="text-sm">Auto-delete</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-muted rounded-xl">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> Auto-delete will permanently remove data older than the specified retention period. 
                    This action cannot be undone. A backup is recommended before enabling.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Compliance;
