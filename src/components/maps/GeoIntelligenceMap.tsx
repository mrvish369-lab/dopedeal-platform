import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";

// Fix for default marker icons (Leaflet + Vite)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom colored markers using CSS tokens (HSL)
const createColoredMarker = (color: "green" | "yellow" | "red", dimmed: boolean = false) => {
  const cssVar =
    color === "green" ? "--map-high" : color === "yellow" ? "--map-medium" : "--map-low";

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: hsl(var(${cssVar}));
        border: 3px solid hsl(var(--background));
        border-radius: 50%;
        box-shadow: 0 2px 8px hsl(var(--foreground) / 0.25);
        opacity: ${dimmed ? 0.35 : 1};
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

interface ShopWithStats {
  id: string;
  name: string;
  shop_code: string;
  city: string | null;
  state: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
  status: string;
  total_scans: number;
  quiz_scans: number;
  lighter_scans: number;
}

interface FilterState {
  qrType: "all" | "quiz" | "lighter";
  city: string;
  dateRange: "7d" | "30d" | "90d" | "all";
  showActiveOnly: boolean;
}

export const GeoIntelligenceMap = () => {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [shops, setShops] = useState<ShopWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    qrType: "all",
    city: "",
    dateRange: "30d",
    showActiveOnly: false,
  });
  const [cities, setCities] = useState<string[]>([]);

  const getMarkerColor = (totalScans: number): "green" | "yellow" | "red" => {
    if (totalScans >= 50) return "green";
    if (totalScans >= 10) return "yellow";
    return "red";
  };

  const hasCoords = (s: ShopWithStats) =>
    typeof s.geo_lat === "number" &&
    typeof s.geo_lng === "number" &&
    Number.isFinite(s.geo_lat) &&
    Number.isFinite(s.geo_lng);

  // Default to India center
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const map = L.map(mapDivRef.current, {
      center: defaultCenter,
      zoom: 5,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Create a simple layer group for markers (no clustering)
    const markersLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerRef.current = markersLayer;

    // Ensure correct sizing when the page first mounts
    setTimeout(() => map.invalidateSize(), 50);

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchShopsWithStats = async () => {
    setIsLoading(true);

    const dateMap: Record<FilterState["dateRange"], number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "all": 9999,
    };

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - dateMap[filters.dateRange]);

    // Fetch ALL shops, even those without coordinates.
    const { data: shopsDataRaw, error: shopsError } = await supabase
      .from("shops")
      .select("id, name, shop_code, city, state, geo_lat, geo_lng, status");

    if (shopsError || !shopsDataRaw) {
      console.error("Error fetching shops:", shopsError);
      setIsLoading(false);
      return;
    }

    // Cast to expected shape
    const shopsData = shopsDataRaw as unknown as Array<{
      id: string;
      name: string;
      shop_code: string;
      city: string | null;
      state: string | null;
      geo_lat: number | null;
      geo_lng: number | null;
      status: string;
    }>;

    const uniqueCities = [...new Set(shopsData.map((s) => s.city).filter(Boolean))] as string[];
    setCities(uniqueCities);

    const sessionsQueryBase = supabase
      .from("sessions")
      .select("shop_id, qr_type, created_at")
      .gte("created_at", daysAgo.toISOString());

    const sessionsQuery = filters.qrType !== "all"
      ? sessionsQueryBase.eq("qr_type", filters.qrType)
      : sessionsQueryBase;

    const { data: sessionsRaw, error: sessionsError } = await sessionsQuery;
    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
    }

    // Cast to expected shape
    const sessions = (sessionsRaw || []) as unknown as Array<{
      shop_id: string | null;
      qr_type: string | null;
      created_at: string;
    }>;

    const shopStats: Record<string, { total: number; quiz: number; lighter: number }> = {};
    sessions.forEach((s) => {
      if (!s.shop_id) return;
      if (!shopStats[s.shop_id]) shopStats[s.shop_id] = { total: 0, quiz: 0, lighter: 0 };
      shopStats[s.shop_id].total++;
      if (s.qr_type === "quiz") shopStats[s.shop_id].quiz++;
      if (s.qr_type === "lighter") shopStats[s.shop_id].lighter++;
    });

    let enriched = shopsData.map((shop) => ({
      ...shop,
      geo_lat: shop.geo_lat === null ? null : Number(shop.geo_lat),
      geo_lng: shop.geo_lng === null ? null : Number(shop.geo_lng),
      total_scans: shopStats[shop.id]?.total || 0,
      quiz_scans: shopStats[shop.id]?.quiz || 0,
      lighter_scans: shopStats[shop.id]?.lighter || 0,
    })) as ShopWithStats[];

    if (filters.city) {
      enriched = enriched.filter((s) => s.city === filters.city);
    }

    setShops(enriched);
    setIsLoading(false);
  };

  // Only re-fetch when filters that affect queries change
  useEffect(() => {
    fetchShopsWithStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.qrType, filters.city, filters.dateRange]);

  // Update markers whenever shops OR active toggle changes
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const mapped = shops.filter(hasCoords);
    const visibleMapped = filters.showActiveOnly 
      ? mapped.filter((s) => s.status === "active")
      : mapped;

    visibleMapped.forEach((shop) => {
      const isActive = shop.status === "active";
      const isDimmed = !filters.showActiveOnly && !isActive;
      
      const marker = L.marker([shop.geo_lat as number, shop.geo_lng as number], {
        icon: createColoredMarker(getMarkerColor(shop.total_scans), isDimmed),
      });

      const popupHtml = `
        <div style="min-width: 220px;">
          <div style="font-weight: 700; margin-bottom: 2px;">${shop.name}</div>
          <div style="opacity: 0.8; font-size: 12px; margin-bottom: 2px;">${shop.shop_code}</div>
          <div style="opacity: 0.85; font-size: 12px; margin-bottom: 8px;">Status: <strong>${shop.status}</strong></div>
          <div style="font-size: 13px; margin-bottom: 8px;">${shop.city ?? ""}${shop.city && shop.state ? ", " : ""}${shop.state ?? ""}</div>
          <hr style="opacity: 0.2; margin: 8px 0;" />
          <div style="font-size: 13px; line-height: 1.5;">
            <div>📊 Total Scans: <strong>${shop.total_scans}</strong></div>
            <div>🎯 Quiz Scans: <strong>${shop.quiz_scans}</strong></div>
            <div>🔥 Lighter Scans: <strong>${shop.lighter_scans}</strong></div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markersLayer.addLayer(marker);
    });

    if (visibleMapped.length > 0) {
      const bounds = L.latLngBounds(
        visibleMapped.map((s) => [s.geo_lat as number, s.geo_lng as number] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView(defaultCenter, 5);
    }
  }, [shops, filters.showActiveOnly]);

  const mappedShops = shops.filter(hasCoords);
  const missingLocationShops = shops.filter((s) => !hasCoords(s));
  const visibleMappedShops = mappedShops.filter((s) => !filters.showActiveOnly || s.status === "active");

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 bg-card border border-border rounded-xl p-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">QR Type</label>
          <select
            value={filters.qrType}
            onChange={(e) =>
              setFilters({ ...filters, qrType: e.target.value as FilterState["qrType"] })
            }
            className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          >
            <option value="all">All Types</option>
            <option value="quiz">Quiz QR</option>
            <option value="lighter">Lighter QR</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">City</label>
          <select
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          >
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) =>
              setFilters({
                ...filters,
                dateRange: e.target.value as FilterState["dateRange"],
              })
            }
            className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2">
            <Switch
              checked={filters.showActiveOnly}
              onCheckedChange={(checked) => setFilters({ ...filters, showActiveOnly: checked })}
            />
            <span className="text-sm text-foreground">Only active shops</span>
          </div>
          {!filters.showActiveOnly && (
            <span className="text-xs text-muted-foreground">Inactive pins are dimmed</span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-background shadow"
                style={{ backgroundColor: "hsl(var(--map-high))" }}
              />
              <span>High Activity (50+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-background shadow"
                style={{ backgroundColor: "hsl(var(--map-medium))" }}
              />
              <span>Medium (10-49)</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-background shadow"
                style={{ backgroundColor: "hsl(var(--map-low))" }}
              />
              <span>Low (&lt;10)</span>
            </div>
          </div>

          <div className="text-xs">
            Showing <span className="font-medium text-foreground">{visibleMappedShops.length}</span> pins /{" "}
            <span className="font-medium text-foreground">{shops.length}</span> shops
            {missingLocationShops.length > 0 && (
              <>
                {" "}• Missing locations: <span className="font-medium text-foreground">{missingLocationShops.length}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-[500px] rounded-xl overflow-hidden border border-border relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 z-[1000] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div ref={mapDivRef} className="h-full w-full" />
      </div>

      {/* Shops missing locations */}
      {missingLocationShops.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-medium text-foreground">
                Shops missing pinned location ({missingLocationShops.length})
              </p>
              <p className="text-sm text-muted-foreground">
                These shops won't appear on the map until you set their latitude/longitude.
              </p>
            </div>
            <Link to="/admin/shops" className="text-sm text-primary hover:underline">
              Open Shops
            </Link>
          </div>

          <div className="mt-3 max-h-48 overflow-auto space-y-2">
            {missingLocationShops.slice(0, 12).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 bg-muted/30 rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {s.name} <span className="text-xs text-muted-foreground">({s.shop_code})</span>
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[s.city, s.state].filter(Boolean).join(", ") || "Location not set"}
                  </p>
                </div>
                <Link to={`/admin/shops/${s.id}`} className="text-sm text-primary hover:underline shrink-0">
                  Fix
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-foreground">{visibleMappedShops.length}</p>
          <p className="text-xs text-muted-foreground">Visible Pins</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-foreground">{shops.length}</p>
          <p className="text-xs text-muted-foreground">Total Shops</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-foreground">{missingLocationShops.length}</p>
          <p className="text-xs text-muted-foreground">Missing Location</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-foreground">
            {visibleMappedShops.reduce((sum, s) => sum + s.total_scans, 0)}
          </p>
          <p className="text-xs text-muted-foreground">Total Scans</p>
        </div>
      </div>
    </div>
  );
};
