import { AdminLayout } from "@/components/admin/AdminLayout";
import { useDashboardStats, useTopShops } from "@/hooks/useAdminData";
import { cn } from "@/lib/utils";
import {
  Store,
  QrCode,
  MessageCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";

interface TopShop {
  shop_id: string;
  shop_name: string;
  total_scans: number;
  verified_users: number;
  conversions: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: topShops = [], isLoading: shopsLoading } = useTopShops(5);

  const isLoading = statsLoading || shopsLoading;

  const statCards = stats
    ? [
        {
          label: "Active Shops",
          value: stats.total_shops,
          icon: Store,
          color: "text-primary",
          bgColor: "bg-primary/10",
        },
        {
          label: "Total QR Scans",
          value: stats.total_scans,
          icon: QrCode,
          color: "text-accent",
          bgColor: "bg-accent/10",
        },
        {
          label: "Verified WhatsApp",
          value: stats.verified_users,
          icon: MessageCircle,
          color: "text-secondary",
          bgColor: "bg-secondary/10",
        },
        {
          label: "Successful Redemptions",
          value: stats.success_count,
          icon: CheckCircle,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
        },
        {
          label: "Failed Attempts",
          value: stats.failure_count,
          icon: XCircle,
          color: "text-destructive",
          bgColor: "bg-destructive/10",
        },
        {
          label: "Conversion Rate",
          value:
            stats.total_scans > 0
              ? `${Math.round((stats.success_count / stats.total_scans) * 100)}%`
              : "0%",
          icon: TrendingUp,
          color: "text-gold",
          bgColor: "bg-gold/10",
        },
      ]
    : [];

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
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your DopeDeal platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-card border border-border rounded-2xl p-6 transition-all hover:border-primary/50"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      stat.bgColor
                    )}
                  >
                    <Icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top Shops */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Top Performing Shops</h2>
          {topShops.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Shop Name
                    </th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                      Scans
                    </th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                      Verified
                    </th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                      Conversions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(topShops as TopShop[]).map((shop, index) => (
                    <tr
                      key={shop.shop_id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                              index === 0
                                ? "bg-gold text-black"
                                : index === 1
                                ? "bg-muted-foreground text-background"
                                : index === 2
                                ? "bg-orange-600 text-white"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {index + 1}
                          </span>
                          <span className="font-medium text-foreground">
                            {shop.shop_name}
                          </span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-foreground">
                        {shop.total_scans}
                      </td>
                      <td className="text-right py-3 px-4 text-foreground">
                        {shop.verified_users}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="text-secondary font-bold">{shop.conversions}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No shop data yet. Create your first shop to see stats.
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
