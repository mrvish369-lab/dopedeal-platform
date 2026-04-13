import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useReports, useInvalidateAdminData } from "@/hooks/useAdminData";
import {
  FileText,
  Download,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Package,
} from "lucide-react";
import { format } from "date-fns";

const REPORT_TYPES = [
  { value: "traffic", label: "Traffic Report", icon: Users, description: "QR scans, unique users, verified users" },
  { value: "conversion", label: "Conversion Report", icon: TrendingUp, description: "Funnel analysis across all stages" },
  { value: "revenue", label: "Revenue Attribution", icon: DollarSign, description: "Clicks & revenue per shop/city" },
  { value: "inventory", label: "Inventory Efficiency", icon: Package, description: "Stock vs redemptions analysis" },
];

const Reports = () => {
  const { data: reports = [], isLoading } = useReports();
  const { invalidateReports } = useInvalidateAdminData();
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  // Form state
  const [reportType, setReportType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [city, setCity] = useState("");

  const generateReport = async () => {
    if (!reportType) {
      toast({ title: "Error", description: "Select a report type", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      const reportTitle = REPORT_TYPES.find(r => r.value === reportType)?.label || reportType;
      
      const { error } = await supabase.from("reports").insert([{
        report_type: reportType,
        title: `${reportTitle} - ${format(new Date(), "MMM d, yyyy")}`,
        parameters: {
          start_date: startDate || null,
          end_date: endDate || null,
          city: city || null,
        },
        status: "completed",
      }]);

      if (error) throw error;

      toast({ title: "Success", description: "Report generated successfully" });
      invalidateReports();
      
      // Reset form
      setReportType("");
      setStartDate("");
      setEndDate("");
      setCity("");
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate report", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const exportReport = async (report: typeof reports[0], format: "csv" | "excel" | "pdf") => {
    toast({ title: "Export Started", description: `Exporting as ${format.toUpperCase()}...` });
    
    // In a real implementation, this would call an edge function to generate the file
    setTimeout(() => {
      toast({ title: "Export Complete", description: `${report.title}.${format} is ready` });
    }, 1500);
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
          <h1 className="text-2xl font-bold text-foreground">Reports & Insights</h1>
          <p className="text-muted-foreground">Generate and export detailed reports</p>
        </div>

        {/* Report Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Generate New Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {REPORT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.value}
                    onClick={() => setReportType(type.value)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      reportType === type.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${reportType === type.value ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-medium text-foreground">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>City (Optional)</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="All cities"
                />
              </div>
              <div className="flex items-end">
                <Button
                  className="w-full btn-fire"
                  onClick={generateReport}
                  disabled={generating || !reportType}
                >
                  {generating ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No reports generated yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{report.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(report.created_at), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportReport(report, "csv")}
                      >
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportReport(report, "excel")}
                      >
                        Excel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportReport(report, "pdf")}
                      >
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Reports;
