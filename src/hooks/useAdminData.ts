import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// Dashboard Stats
export interface DashboardStats {
  total_shops: number;
  total_scans: number;
  verified_users: number;
  success_count: number;
  failure_count: number;
  quiz_completed: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_dashboard_stats", {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString(),
      });
      if (error) throw error;
      return data as unknown as DashboardStats;
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useTopShops = (limit = 5) => {
  return useQuery({
    queryKey: ["admin", "top-shops", limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_top_shops", { limit_count: limit });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
};

// Shops
export interface Shop {
  id: string;
  shop_code: string;
  name: string;
  owner_name?: string;
  owner_contact?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  location?: string;
  geo_lat?: number;
  geo_lng?: number;
  shop_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useShops = () => {
  return useQuery({
    queryKey: ["admin", "shops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Shop[];
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
};

// Offer Blocks
export interface OfferBlock {
  id: string;
  block_type: string;
  title: string | null;
  subtitle: string | null;
  content_json: Json;
  position: number;
  status: string;
  target_categories: string[];
  target_cities: string[];
}

export const useOfferBlocks = () => {
  return useQuery({
    queryKey: ["admin", "offer-blocks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offer_blocks")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as OfferBlock[];
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
};

// Affiliate Links
export interface AffiliateLink {
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

export const useAffiliateLinks = () => {
  return useQuery({
    queryKey: ["admin", "affiliate-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AffiliateLink[];
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
};

// Fraud Alerts
export interface FraudAlert {
  id: string;
  alert_type: string;
  session_id: string | null;
  shop_id: string | null;
  severity: string;
  details: Record<string, unknown>;
  resolved: boolean;
  created_at: string;
}

export const useFraudAlerts = () => {
  return useQuery({
    queryKey: ["admin", "fraud-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fraud_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as FraudAlert[];
    },
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
  });
};

// Analytics - Combined query
export interface AnalyticsData {
  totalPageViews: number;
  totalClicks: number;
  totalDownloads: number;
  avgTimeSpent: number;
  conversionRate: number;
  topBlocks: Array<{
    block_id: string;
    title: string;
    clicks: number;
  }>;
  eventsByType: Record<string, number>;
}

interface OfferEventRow {
  event_type: string;
  block_id: string | null;
  offer_blocks: { title: string } | null;
}

interface UserActivityRow {
  total_time_spent: number | null;
}

interface SessionRow {
  id: string;
  whatsapp_verified: boolean;
}

export const useAnalytics = (timeRange: string) => {
  return useQuery({
    queryKey: ["admin", "analytics", timeRange],
    queryFn: async () => {
      const days = timeRange === "24h" ? 1 : timeRange === "7d" ? 7 : 30;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const [eventsResult, activityResult, sessionsResult] = await Promise.all([
        supabase
          .from("offer_events")
          .select("event_type, block_id, offer_blocks(title)")
          .gte("created_at", startDate),
        supabase
          .from("user_activity")
          .select("total_time_spent")
          .gte("created_at", startDate),
        supabase
          .from("sessions")
          .select("id, whatsapp_verified")
          .gte("created_at", startDate),
      ]);

      const events = (eventsResult.data || []) as unknown as OfferEventRow[];
      const activity = (activityResult.data || []) as unknown as UserActivityRow[];
      const sessions = (sessionsResult.data || []) as unknown as SessionRow[];

      const pageViews = events.filter((e) => e.event_type === "page_view").length;
      const clicks = events.filter((e) => e.event_type.includes("click")).length;
      const downloads = events.filter((e) => e.event_type === "download").length;

      const totalTime = activity.reduce((sum, a) => sum + (a.total_time_spent || 0), 0);
      const avgTime = activity.length > 0 ? Math.round(totalTime / activity.length) : 0;

      const verifiedCount = sessions.filter((s) => s.whatsapp_verified).length;
      const conversionRate = sessions.length > 0
        ? Math.round((verifiedCount / sessions.length) * 100)
        : 0;

      const eventsByType: Record<string, number> = {};
      events.forEach((e) => {
        eventsByType[e.event_type] = (eventsByType[e.event_type] || 0) + 1;
      });

      const blockClicks: Record<string, { title: string; clicks: number }> = {};
      events
        .filter((e) => e.block_id && e.event_type.includes("click"))
        .forEach((e) => {
          if (!blockClicks[e.block_id!]) {
            blockClicks[e.block_id!] = {
              title: e.offer_blocks?.title || "Unknown",
              clicks: 0,
            };
          }
          blockClicks[e.block_id!].clicks += 1;
        });

      const topBlocks = Object.entries(blockClicks)
        .map(([block_id, data]) => ({ block_id, ...data }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5);

      return {
        totalPageViews: pageViews,
        totalClicks: clicks,
        totalDownloads: downloads,
        avgTimeSpent: avgTime,
        conversionRate,
        topBlocks,
        eventsByType,
      } as AnalyticsData;
    },
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
  });
};

// Brands
export interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  created_at: string;
}

export const useBrands = () => {
  return useQuery({
    queryKey: ["admin", "brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Brand[];
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
};

// Regions
export interface Region {
  id: string;
  name: string;
  city: string;
  state: string;
  zone: string | null;
  manager_email: string | null;
  status: string;
}

export const useRegions = () => {
  return useQuery({
    queryKey: ["admin", "regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .order("state", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Region[];
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
};

// Reports
export interface Report {
  id: string;
  title: string;
  report_type: string;
  parameters: Json;
  status: string;
  file_url: string | null;
  created_at: string;
}

export const useReports = () => {
  return useQuery({
    queryKey: ["admin", "reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as Report[];
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
};

// Invalidation helper
export const useInvalidateAdminData = () => {
  const queryClient = useQueryClient();

  return {
    invalidateShops: () => queryClient.invalidateQueries({ queryKey: ["admin", "shops"] }),
    invalidateBlocks: () => queryClient.invalidateQueries({ queryKey: ["admin", "offer-blocks"] }),
    invalidateAffiliates: () => queryClient.invalidateQueries({ queryKey: ["admin", "affiliate-links"] }),
    invalidateAlerts: () => queryClient.invalidateQueries({ queryKey: ["admin", "fraud-alerts"] }),
    invalidateBrands: () => queryClient.invalidateQueries({ queryKey: ["admin", "brands"] }),
    invalidateRegions: () => queryClient.invalidateQueries({ queryKey: ["admin", "regions"] }),
    invalidateReports: () => queryClient.invalidateQueries({ queryKey: ["admin", "reports"] }),
    invalidateDashboard: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "top-shops"] });
    },
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  };
};
