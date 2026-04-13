import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Clock, 
  Smartphone, 
  Monitor, 
  Tablet, 
  MapPin, 
  MousePointer, 
  Eye,
  ExternalLink,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TrafficEvent {
  id: string;
  event_type: string;
  device_type: string | null;
  approx_location: string | null;
  created_at: string;
  card_id: string | null;
  metadata: Record<string, unknown> | null;
  session: {
    id: string;
    anonymous_id: string;
    user_agent: string | null;
    batch_id: string | null;
    qr_type: string | null;
  } | null;
  card: {
    title: string;
  } | null;
}

interface ShopTrafficTimelineProps {
  shopId: string;
}

const getDeviceIcon = (deviceType: string | null) => {
  switch (deviceType?.toLowerCase()) {
    case "mobile":
      return <Smartphone className="w-4 h-4" />;
    case "tablet":
      return <Tablet className="w-4 h-4" />;
    default:
      return <Monitor className="w-4 h-4" />;
  }
};

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case "page_view":
      return <Eye className="w-4 h-4" />;
    case "card_click":
      return <MousePointer className="w-4 h-4" />;
    case "card_impression":
      return <Eye className="w-4 h-4 opacity-50" />;
    case "page_exit":
      return <ExternalLink className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const getEventColor = (eventType: string) => {
  switch (eventType) {
    case "page_view":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "card_click":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "card_impression":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "page_exit":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export const ShopTrafficTimeline = ({ shopId }: ShopTrafficTimelineProps) => {
  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(50);

  const fetchEvents = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("offer_events")
      .select(`
        id,
        event_type,
        device_type,
        approx_location,
        created_at,
        card_id,
        metadata,
        session:sessions!offer_events_session_id_fkey (
          id,
          anonymous_id,
          user_agent,
          batch_id,
          qr_type
        ),
        card:offer_cards!offer_events_card_id_fkey (
          title
        )
      `)
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching events:", error);
    } else {
      setEvents(data as unknown as TrafficEvent[]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [shopId, limit]);

  const toggleExpand = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const filteredEvents = events.filter((event) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      event.event_type.toLowerCase().includes(search) ||
      event.device_type?.toLowerCase().includes(search) ||
      event.approx_location?.toLowerCase().includes(search) ||
      event.card?.title?.toLowerCase().includes(search) ||
      event.session?.anonymous_id?.toLowerCase().includes(search)
    );
  });

  // Group events by date
  const groupedEvents: Record<string, TrafficEvent[]> = {};
  filteredEvents.forEach((event) => {
    const date = format(new Date(event.created_at), "yyyy-MM-dd");
    if (!groupedEvents[date]) {
      groupedEvents[date] = [];
    }
    groupedEvents[date].push(event);
  });

  // Calculate stats
  const stats = {
    totalViews: events.filter(e => e.event_type === "page_view").length,
    totalClicks: events.filter(e => e.event_type === "card_click").length,
    uniqueDevices: new Set(events.map(e => e.session?.anonymous_id)).size,
    mobilePercent: Math.round(
      (events.filter(e => e.device_type === "mobile").length / events.length) * 100
    ) || 0,
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.totalViews}</p>
          <p className="text-xs text-muted-foreground">Page Views</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.totalClicks}</p>
          <p className="text-xs text-muted-foreground">Clicks</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-purple-400">{stats.uniqueDevices}</p>
          <p className="text-xs text-muted-foreground">Unique Visitors</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-orange-400">{stats.mobilePercent}%</p>
          <p className="text-xs text-muted-foreground">Mobile</p>
        </div>
      </div>

      {/* Search & Refresh */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events, devices, locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon" onClick={fetchEvents} disabled={loading}>
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([date, dayEvents]) => (
          <div key={date}>
            <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10">
              <h4 className="text-sm font-medium text-muted-foreground">
                {format(new Date(date), "EEEE, MMMM d, yyyy")}
              </h4>
            </div>

            <div className="space-y-2 pl-4 border-l-2 border-border">
              {dayEvents.map((event) => {
                const isExpanded = expandedEvents.has(event.id);
                const metadata = event.metadata as Record<string, unknown> | null;
                
                return (
                  <div
                    key={event.id}
                    className="relative pl-4 pb-3"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-card border-2 border-border flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>

                    <div
                      className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => toggleExpand(event.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={cn("gap-1", getEventColor(event.event_type))}>
                            {getEventIcon(event.event_type)}
                            {event.event_type.replace("_", " ")}
                          </Badge>
                          
                          {event.card && (
                            <span className="text-sm text-foreground font-medium truncate max-w-[150px]">
                              {event.card.title}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {getDeviceIcon(event.device_type)}
                            {event.device_type || "Unknown"}
                          </span>
                          <span>{format(new Date(event.created_at), "HH:mm:ss")}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="text-muted-foreground">Session ID:</span>
                              <p className="font-mono text-xs truncate">{event.session?.id}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Anonymous ID:</span>
                              <p className="font-mono text-xs truncate">{event.session?.anonymous_id}</p>
                            </div>
                            {event.approx_location && (
                              <div>
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> Location:
                                </span>
                                <p className="text-xs">{event.approx_location}</p>
                              </div>
                            )}
                            {event.session?.qr_type && (
                              <div>
                                <span className="text-muted-foreground">QR Type:</span>
                                <p className="text-xs capitalize">{event.session.qr_type}</p>
                              </div>
                            )}
                            {event.session?.batch_id && (
                              <div>
                                <span className="text-muted-foreground">Batch ID:</span>
                                <p className="font-mono text-xs truncate">{event.session.batch_id}</p>
                              </div>
                            )}
                          </div>

                          {event.session?.user_agent && (
                            <div>
                              <span className="text-muted-foreground">User Agent:</span>
                              <p className="font-mono text-xs text-muted-foreground break-all">
                                {event.session.user_agent}
                              </p>
                            </div>
                          )}

                          {metadata && Object.keys(metadata).length > 0 && (
                            <div>
                              <span className="text-muted-foreground">Metadata:</span>
                              <pre className="font-mono text-xs bg-muted/30 p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {events.length >= limit && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setLimit((prev) => prev + 50)}
        >
          Load More Events
        </Button>
      )}

      {events.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No traffic events recorded yet</p>
          <p className="text-sm mt-1">Events will appear here when users scan QR codes</p>
        </div>
      )}
    </div>
  );
};
