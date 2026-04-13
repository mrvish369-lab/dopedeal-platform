import { useState, useCallback, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { supabase } from "@/integrations/supabase/client";
import { useFraudAlerts, useInvalidateAdminData } from "@/hooks/useAdminData";
import { usePagination } from "@/hooks/usePagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Shield,
  Check,
  MousePointer,
  Bot,
  TrendingUp,
  Clock,
  RefreshCw,
  Search,
} from "lucide-react";
import { format } from "date-fns";

const FraudAlerts = () => {
  const { data: alerts = [], isLoading } = useFraudAlerts();
  const { invalidateAlerts } = useInvalidateAdminData();
  const [isRunning, setIsRunning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const { toast } = useToast();

  // Calculate stats from cached data
  const stats = {
    total: alerts.length,
    unresolved: alerts.filter((a) => !a.resolved).length,
    high: alerts.filter((a) => a.severity === "high" && !a.resolved).length,
    medium: alerts.filter((a) => a.severity === "medium" && !a.resolved).length,
    low: alerts.filter((a) => a.severity === "low" && !a.resolved).length,
  };

  // Filter alerts based on search
  const filteredAlerts = useMemo(() => {
    if (!searchQuery.trim()) return alerts;
    const query = searchQuery.toLowerCase();
    return alerts.filter(
      (alert) =>
        alert.alert_type.toLowerCase().includes(query) ||
        alert.severity.toLowerCase().includes(query)
    );
  }, [alerts, searchQuery]);

  // Pagination
  const pagination = usePagination(filteredAlerts, { pageSize });

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    pagination.resetPage();
  };

  const runFraudDetection = useCallback(async () => {
    setIsRunning(true);
    try {
      // Detect rapid clicks (more than 10 clicks from same session in 1 minute)
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
      const { data: recentEvents } = await supabase
        .from("offer_events")
        .select("session_id, event_type")
        .gte("created_at", oneMinuteAgo)
        .in("event_type", ["banner_click", "button_click"]);

      // Count clicks per session
      const clickCounts: Record<string, number> = {};
      (recentEvents || []).forEach((event) => {
        if (event.session_id) {
          clickCounts[event.session_id] = (clickCounts[event.session_id] || 0) + 1;
        }
      });

      let alertsCreated = 0;
      // Create alerts for suspicious sessions
      for (const [sessionId, count] of Object.entries(clickCounts)) {
        if (count > 10) {
          // Check if alert already exists
          const { data: existing } = await supabase
            .from("fraud_alerts")
            .select("id")
            .eq("session_id", sessionId)
            .eq("alert_type", "rapid_clicks")
            .eq("resolved", false)
            .maybeSingle();

          if (!existing) {
            await supabase.from("fraud_alerts").insert({
              alert_type: "rapid_clicks",
              session_id: sessionId,
              severity: count > 20 ? "high" : "medium",
              details: { click_count: count, window: "1 minute" },
            });
            alertsCreated++;
          }
        }
      }

      invalidateAlerts();
      toast({
        title: "Detection Complete",
        description: alertsCreated > 0 
          ? `Found ${alertsCreated} new suspicious activity` 
          : "No new suspicious activity detected",
      });
    } catch (error) {
      console.error("Error running fraud detection:", error);
      toast({
        title: "Error",
        description: "Failed to run fraud detection",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  }, [invalidateAlerts, toast]);

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("fraud_alerts")
        .update({ resolved: true })
        .eq("id", alertId);

      if (error) throw error;

      invalidateAlerts();
      toast({ title: "Success", description: "Alert resolved" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive",
      });
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "rapid_clicks":
        return MousePointer;
      case "bot_behavior":
        return Bot;
      case "traffic_spike":
        return TrendingUp;
      default:
        return AlertTriangle;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Fraud Detection
            </h1>
            <p className="text-muted-foreground">
              Monitor suspicious activity and quality control
            </p>
          </div>
          <Button
            variant="outline"
            onClick={runFraudDetection}
            disabled={isRunning}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? "Running..." : "Run Detection"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Alerts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">
                {stats.unresolved}
              </p>
              <p className="text-xs text-muted-foreground">Unresolved</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{stats.high}</p>
              <p className="text-xs text-muted-foreground">High Severity</p>
            </CardContent>
          </Card>
          <Card className="border-primary/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.medium}</p>
              <p className="text-xs text-muted-foreground">Medium</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.low}</p>
              <p className="text-xs text-muted-foreground">Low</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Recent Alerts
              </CardTitle>
              {alerts.length > 0 && (
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search alerts..."
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
            {alerts.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-secondary mx-auto mb-4" />
                <p className="text-foreground font-medium">All Clear!</p>
                <p className="text-sm text-muted-foreground">
                  No suspicious activity detected
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {pagination.paginatedItems.map((alert) => {
                    const Icon = getAlertIcon(alert.alert_type);
                    return (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-xl border ${
                          alert.resolved
                            ? "border-border/50 bg-muted/20 opacity-60"
                            : "border-border bg-card"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              alert.severity === "high"
                                ? "bg-destructive/20"
                                : alert.severity === "medium"
                                ? "bg-primary/20"
                                : "bg-muted"
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 ${
                                alert.severity === "high"
                                  ? "text-destructive"
                                  : alert.severity === "medium"
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-foreground capitalize">
                                {alert.alert_type.replace(/_/g, " ")}
                              </p>
                              <Badge variant={getSeverityColor(alert.severity) as "destructive" | "default" | "secondary" | "outline"}>
                                {alert.severity}
                              </Badge>
                              {alert.resolved && (
                                <Badge variant="outline" className="gap-1">
                                  <Check className="w-3 h-3" />
                                  Resolved
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {JSON.stringify(alert.details)}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {format(new Date(alert.created_at), "MMM d, h:mm a")}
                              {alert.session_id && (
                                <span>
                                  • Session: {alert.session_id.slice(0, 8)}...
                                </span>
                              )}
                            </div>
                          </div>
                          {!alert.resolved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resolveAlert(alert.id)}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
    </AdminLayout>
  );
};

export default FraudAlerts;
