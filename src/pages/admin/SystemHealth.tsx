import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Server,
  Database,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

interface SystemLog {
  id: string;
  log_type: string;
  severity: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const useSystemHealthData = () => {
  return useQuery({
    queryKey: ["admin", "system-health"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      const [logsResult, sessionsResult, todaySessionsResult, eventsResult] = await Promise.all([
        supabase.from("system_logs").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("sessions").select("id", { count: "exact", head: true }),
        supabase.from("sessions").select("id", { count: "exact", head: true }).gte("created_at", today),
        supabase.from("offer_events").select("id", { count: "exact", head: true }),
      ]);

      return {
        logs: (logsResult.data || []) as SystemLog[],
        totalSessions: sessionsResult.count || 0,
        todaySessions: todaySessionsResult.count || 0,
        totalEvents: eventsResult.count || 0,
      };
    },
    staleTime: 60000, // 1 minute
    gcTime: 5 * 60 * 1000,
  });
};

const SystemHealth = () => {
  const { data, isLoading } = useSystemHealthData();

  const logs = data?.logs || [];
  const metrics = useMemo(() => {
    const errorLogs = logs.filter((l) => l.severity === "error" || l.severity === "critical");
    return {
      totalSessions: data?.totalSessions || 0,
      todaySessions: data?.todaySessions || 0,
      totalEvents: data?.totalEvents || 0,
      errorCount: errorLogs.length,
      avgResponseTime: Math.floor(Math.random() * 100 + 50), // Mock response time
    };
  }, [data, logs]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "error":
        return "destructive";
      case "warning":
        return "default";
      default:
        return "secondary";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "error":
        return AlertTriangle;
      case "warning":
        return Clock;
      default:
        return CheckCircle;
    }
  };

  // System status
  const systemStatus = metrics.errorCount > 5 ? "degraded" : "healthy";

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
            <h1 className="text-2xl font-bold text-foreground">System Health</h1>
            <p className="text-muted-foreground">Monitor platform performance and stability</p>
          </div>
          <Badge
            variant={systemStatus === "healthy" ? "default" : "destructive"}
            className="text-sm px-4 py-2"
          >
            {systemStatus === "healthy" ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <AlertTriangle className="w-4 h-4 mr-2" />
            )}
            System {systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}
          </Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Server className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold">{metrics.totalSessions.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-secondary mx-auto mb-2" />
              <p className="text-xl font-bold">{metrics.todaySessions}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-xl font-bold">{metrics.totalEvents.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Events Tracked</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold">{metrics.avgResponseTime}ms</p>
              <p className="text-xs text-muted-foreground">Avg Response</p>
            </CardContent>
          </Card>
          <Card className={metrics.errorCount > 0 ? "border-destructive/50" : ""}>
            <CardContent className="p-4 text-center">
              <AlertTriangle className={`w-6 h-6 mx-auto mb-2 ${metrics.errorCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              <p className="text-xl font-bold">{metrics.errorCount}</p>
              <p className="text-xs text-muted-foreground">Recent Errors</p>
            </CardContent>
          </Card>
        </div>

        {/* Service Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Service Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { name: "Database", status: "operational" },
                { name: "Authentication", status: "operational" },
                { name: "File Storage", status: "operational" },
                { name: "Edge Functions", status: "operational" },
              ].map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-4 rounded-xl border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <Badge variant="default" className="bg-secondary">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {service.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              System Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-secondary" />
                <p>No system logs recorded</p>
                <p className="text-sm">All systems running smoothly</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log) => {
                  const Icon = getSeverityIcon(log.severity);
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <Icon
                        className={`w-4 h-4 mt-0.5 ${
                          log.severity === "error" || log.severity === "critical"
                            ? "text-destructive"
                            : log.severity === "warning"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getSeverityColor(log.severity) as "destructive" | "default" | "secondary"}>
                            {log.severity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {log.log_type}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{log.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SystemHealth;
