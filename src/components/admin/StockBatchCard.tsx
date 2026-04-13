import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Download,
  QrCode,
  Eye,
  MousePointer,
  Users,
  Smartphone,
  Clock,
  TrendingUp,
  Package,
  ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface StockBatch {
  id: string;
  product_type: string;
  product_id?: string;
  quantity_assigned: number;
  quantity_redeemed: number;
  batch_name?: string;
  status?: string;
  created_at?: string;
  products?: {
    name: string;
    emoji: string | null;
  };
}

interface QRCode {
  id: string;
  qr_url: string;
  status: string;
  version: number;
  qr_type?: string;
  batch_id?: string;
}

interface TrafficEvent {
  id: string;
  event_type: string;
  device_type: string | null;
  approx_location: string | null;
  created_at: string;
  card_id: string | null;
  session: {
    id: string;
    anonymous_id: string;
    batch_id: string | null;
  } | null;
  card: {
    title: string;
  } | null;
}

interface StockBatchCardProps {
  batch: StockBatch;
  qrCode?: QRCode;
  shopCode?: string;
}

export const StockBatchCard = ({ batch, qrCode, shopCode }: StockBatchCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const [stats, setStats] = useState({
    qrScans: 0,
    totalViews: 0,
    totalClicks: 0,
    uniqueVisitors: 0,
    mobilePercent: 0,
    conversionRate: 0,
  });

  const remaining = batch.quantity_assigned - batch.quantity_redeemed;

  const fetchBatchTraffic = async () => {
    if (!batch.id) return;
    setLoading(true);

    try {
      // Fetch sessions that came STRICTLY from this batch (batch_id = batch.id)
      const { data: sessions, error: sessionError } = await supabase
        .from("sessions")
        .select("id, anonymous_id, device_type, whatsapp_verified, result_type, batch_id")
        .eq("batch_id", batch.id);

      if (sessionError) {
        console.error("Error fetching batch sessions:", sessionError);
        setLoading(false);
        return;
      }

      const sessionIds = sessions?.map((s) => s.id) || [];

      if (sessionIds.length > 0) {
        // Fetch events for these sessions
        const { data: eventData, error: eventError } = await supabase
          .from("offer_events")
          .select(`
            id,
            event_type,
            device_type,
            approx_location,
            created_at,
            card_id,
            session:sessions!offer_events_session_id_fkey (
              id,
              anonymous_id,
              batch_id
            ),
            card:offer_cards!offer_events_card_id_fkey (
              title
            )
          `)
          .in("session_id", sessionIds)
          .order("created_at", { ascending: false })
          .limit(50);

        if (!eventError && eventData) {
          // Additional filter: ensure events are from sessions with matching batch_id
          const filteredEvents = eventData.filter((e) => {
            const session = e.session as { batch_id: string | null } | null;
            return session?.batch_id === batch.id;
          });

          setEvents(filteredEvents as unknown as TrafficEvent[]);

          // Calculate stats from events
          const qrScans = filteredEvents.filter((e) => e.event_type === "qr_scan").length;
          const pageViews = filteredEvents.filter((e) => e.event_type === "page_view").length;
          const clicks = filteredEvents.filter((e) => e.event_type === "card_click").length;
          const uniqueDevices = new Set(filteredEvents.map((e) => (e.session as { anonymous_id: string } | null)?.anonymous_id)).size;
          const mobileEvents = filteredEvents.filter((e) => e.device_type === "mobile").length;
          const mobilePercent = filteredEvents.length ? Math.round((mobileEvents / filteredEvents.length) * 100) : 0;

          // Calculate conversion from sessions
          const verifiedSessions = sessions?.filter((s) => s.whatsapp_verified).length || 0;
          const conversionRate = sessions?.length ? Math.round((verifiedSessions / sessions.length) * 100) : 0;

          setStats({
            qrScans,
            totalViews: pageViews,
            totalClicks: clicks,
            uniqueVisitors: uniqueDevices,
            mobilePercent,
            conversionRate,
          });
        } else {
          setEvents([]);
        }
      } else {
        setEvents([]);
        setStats({
          qrScans: 0,
          totalViews: 0,
          totalClicks: 0,
          uniqueVisitors: 0,
          mobilePercent: 0,
          conversionRate: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching batch traffic:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && events.length === 0) {
      fetchBatchTraffic();
    }
  }, [isOpen]);

  const downloadQR = () => {
    if (!qrCode) return;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrCode.qr_url)}`;
    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = `QR_${shopCode || "batch"}_${batch.batch_name || batch.id}.png`;
    link.click();
  };

  // Group events by date
  const groupedEvents: Record<string, TrafficEvent[]> = {};
  events.forEach((event) => {
    const date = format(new Date(event.created_at), "yyyy-MM-dd");
    if (!groupedEvents[date]) {
      groupedEvents[date] = [];
    }
    groupedEvents[date].push(event);
  });

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "qr_scan":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "page_view":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "card_click":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "card_impression":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        {/* Stock Info Header */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {batch.products?.emoji || ""} {batch.products?.name || batch.product_type.replace("_", " ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {batch.batch_name || `Batch ${batch.id.slice(0, 8)}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Quick Stats */}
              <div className="hidden sm:flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">
                  Assigned: <span className="text-foreground font-medium">{batch.quantity_assigned}</span>
                </span>
                <span className="text-muted-foreground">
                  Redeemed: <span className="text-foreground font-medium">{batch.quantity_redeemed}</span>
                </span>
                <span
                  className={cn(
                    "font-bold",
                    remaining < 5 ? "text-destructive" : "text-secondary"
                  )}
                >
                  Remaining: {remaining}
                </span>
              </div>

              {/* QR Badge */}
              {qrCode && (
                <Badge variant="outline" className="gap-1">
                  <QrCode className="w-3 h-3" />
                  QR
                </Badge>
              )}

              {/* Expand Icon */}
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Expanded Content */}
        <CollapsibleContent>
          <div className="border-t border-border p-4 space-y-4">
            {/* QR Code & Actions */}
            {qrCode && (
              <div className="flex flex-col sm:flex-row gap-4">
                {/* QR Preview */}
                <div className="bg-white rounded-xl p-3 flex-shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCode.qr_url)}`}
                    alt="Stock Batch QR"
                    className="w-[150px] h-[150px]"
                  />
                </div>

                <div className="flex-1 space-y-3">
                  {/* QR URL */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tracking URL:</p>
                    <p className="text-xs font-mono bg-muted/30 p-2 rounded break-all">
                      {qrCode.qr_url}
                    </p>
                  </div>

                  {/* Download Button */}
                  <Button onClick={downloadQR} variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download QR Code
                  </Button>
                </div>
              </div>
            )}

            {/* Traffic Stats */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                    <ScanLine className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <p className="text-xl font-bold text-amber-400">{stats.qrScans}</p>
                    <p className="text-xs text-muted-foreground">QR Scans</p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                    <Eye className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <p className="text-xl font-bold text-blue-400">{stats.totalViews}</p>
                    <p className="text-xs text-muted-foreground">Page Views</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                    <MousePointer className="w-4 h-4 text-green-400 mx-auto mb-1" />
                    <p className="text-xl font-bold text-green-400">{stats.totalClicks}</p>
                    <p className="text-xs text-muted-foreground">Clicks</p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
                    <Users className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                    <p className="text-xl font-bold text-purple-400">{stats.uniqueVisitors}</p>
                    <p className="text-xs text-muted-foreground">Visitors</p>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
                    <Smartphone className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                    <p className="text-xl font-bold text-orange-400">{stats.mobilePercent}%</p>
                    <p className="text-xs text-muted-foreground">Mobile</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                    <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <p className="text-xl font-bold text-emerald-400">{stats.conversionRate}%</p>
                    <p className="text-xs text-muted-foreground">Conversion</p>
                  </div>
                </div>

                {/* Traffic Timeline */}
                {events.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Recent Traffic
                    </h4>
                    <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2">
                      {Object.entries(groupedEvents).map(([date, dayEvents]) => (
                        <div key={date}>
                          <p className="text-xs text-muted-foreground sticky top-0 bg-card py-1">
                            {format(new Date(date), "EEEE, MMM d")}
                          </p>
                          <div className="space-y-2 pl-3 border-l-2 border-border">
                            {dayEvents.map((event) => (
                              <div
                                key={event.id}
                                className="flex items-center justify-between bg-muted/20 rounded-lg p-2 text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge className={cn("text-xs", getEventColor(event.event_type))}>
                                    {event.event_type.replace("_", " ")}
                                  </Badge>
                                  {event.card && (
                                    <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                      {event.card.title}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{event.device_type || "Unknown"}</span>
                                  <span>{format(new Date(event.created_at), "HH:mm")}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No traffic recorded yet for this batch</p>
                    <p className="text-xs mt-1">Events will appear when users scan this QR code</p>
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
