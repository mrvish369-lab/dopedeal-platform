import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAnalytics } from "@/hooks/useAdminData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MousePointer,
  Download,
  Clock,
  TrendingUp,
  Users,
  Eye,
  Activity,
} from "lucide-react";

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const { data: analytics, isLoading } = useAnalytics(timeRange);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (isLoading || !analytics) {
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
              User Analytics
            </h1>
            <p className="text-muted-foreground">
              Track user behavior and engagement
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {analytics.totalPageViews}
                  </p>
                  <p className="text-sm text-muted-foreground">Page Views</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <MousePointer className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {analytics.totalClicks}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Clicks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Download className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {analytics.totalDownloads}
                  </p>
                  <p className="text-sm text-muted-foreground">Downloads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatTime(analytics.avgTimeSpent)}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg. Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Performing Blocks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Performing Blocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.topBlocks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No data yet
                </p>
              ) : (
                <div className="space-y-3">
                  {analytics.topBlocks.map((block, index) => (
                    <div
                      key={block.block_id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {block.title}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-primary">
                        {block.clicks} clicks
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Events Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Events Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(analytics.eventsByType).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No events recorded
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(analytics.eventsByType)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <span className="text-foreground capitalize">
                          {type.replace(/_/g, " ")}
                        </span>
                        <span className="font-medium text-primary">{count}</span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Conversion Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Conversion Rate</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {analytics.conversionRate}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  WhatsApp verified users / Total sessions
                </p>
              </div>
              <div className="w-24 h-24 rounded-full border-8 border-primary/20 flex items-center justify-center">
                <div
                  className="w-16 h-16 rounded-full bg-primary flex items-center justify-center"
                  style={{
                    background: `conic-gradient(hsl(var(--primary)) ${analytics.conversionRate}%, transparent 0)`,
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Analytics;
