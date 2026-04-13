import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AlertTriangle, Loader2 } from "lucide-react";

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// India bounding box (approximate)
const INDIA_BOUNDS = {
  minLat: 6.5546079,
  maxLat: 35.6745457,
  minLng: 68.1113787,
  maxLng: 97.395561,
} as const;

const isWithinIndia = (lat: number, lng: number): boolean => {
  return (
    lat >= INDIA_BOUNDS.minLat &&
    lat <= INDIA_BOUNDS.maxLat &&
    lng >= INDIA_BOUNDS.minLng &&
    lng <= INDIA_BOUNDS.maxLng
  );
};

interface ShopMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  onAddressData?: (data: { city?: string; state?: string; pincode?: string }) => void;
  onValidationChange?: (isValid: boolean) => void;
}

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
};

type NominatimReverseResult = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    county?: string;
    state_district?: string;
    country_code?: string;
  };
};

export const ShopMapPicker = ({
  initialLat,
  initialLng,
  onLocationSelect,
  onAddressData,
  onValidationChange,
}: ShopMapPickerProps) => {
  // Default to India center (Delhi)
  const defaultCenter: [number, number] = [28.6139, 77.209];

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);

  const validateLocation = useCallback(
    (lat: number, lng: number): boolean => {
      // If no validation is needed (optional), treat as valid.
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setValidationError("Invalid coordinates");
        onValidationChange?.(false);
        return false;
      }

      if (!isWithinIndia(lat, lng)) {
        setValidationError("Location must be within India boundaries");
        onValidationChange?.(false);
        return false;
      }

      setValidationError(null);
      onValidationChange?.(true);
      return true;
    },
    [onValidationChange]
  );

  const updateMapMarker = useCallback((pos: [number, number], animate: boolean) => {
    const map = mapRef.current;
    if (!map) return;

    const zoom = 16;
    map.setView(pos, zoom, { animate });

    if (!markerRef.current) {
      markerRef.current = L.marker(pos).addTo(map);
    } else {
      markerRef.current.setLatLng(pos);
    }
  }, []);

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      if (!onAddressData) return;

      setIsReverseGeocoding(true);
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });

        if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);
        const data = (await res.json()) as NominatimReverseResult;

        if (data.address) {
          // Additional safety check
          if (data.address.country_code && data.address.country_code.toLowerCase() !== "in") {
            setValidationError("Location must be within India. Please select a valid location.");
            onValidationChange?.(false);
            return;
          }

          const city =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.county ||
            "";
          const state = data.address.state || data.address.state_district || "";
          const pincode = data.address.postcode || "";

          onAddressData({ city, state, pincode });
          setValidationError(null);
          onValidationChange?.(true);
        }
      } catch (e) {
        console.error("Reverse geocoding error:", e);
      } finally {
        setIsReverseGeocoding(false);
      }
    },
    [onAddressData, onValidationChange]
  );

  const handlePositionChange = useCallback(
    (newPosition: [number, number], options?: { animate?: boolean }) => {
      const lat = newPosition[0];
      const lng = newPosition[1];

      // Validate bounds first; if invalid, don't change selection
      if (!validateLocation(lat, lng)) return;

      setPosition(newPosition);
      onLocationSelect(lat, lng);
      updateMapMarker(newPosition, options?.animate ?? true);
      reverseGeocode(lat, lng);
    },
    [onLocationSelect, reverseGeocode, updateMapMarker, validateLocation]
  );

  // Init map (plain Leaflet to avoid react-leaflet context crash)
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const map = L.map(mapDivRef.current, {
      center: position || defaultCenter,
      zoom: position ? 15 : 5,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      handlePositionChange([e.latlng.lat, e.latlng.lng]);
    });

    mapRef.current = map;

    // If we have an initial position, render it
    if (position) {
      const lat = position[0];
      const lng = position[1];
      if (validateLocation(lat, lng)) {
        updateMapMarker(position, false);
      }
    } else {
      // No location selected yet → valid (we only block on invalid selections)
      onValidationChange?.(true);
    }

    // Size fix for dialog/initial mount
    setTimeout(() => map.invalidateSize(), 60);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePositionChange([pos.coords.latitude, pos.coords.longitude]);
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsLocating(false);
        alert("Unable to get your location. Please click on the map to set location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const canSearch = useMemo(() => searchQuery.trim().length >= 3, [searchQuery]);

  const searchAddress = async () => {
    const q = searchQuery.trim();
    if (q.length < 3) return;

    setIsSearching(true);
    try {
      // Limit search to India using countrycodes parameter
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=5`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });

      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      const data = (await res.json()) as NominatimResult[];
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setSearchResults([]);
      alert("Address search failed. Please try again or pin on the map.");
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (r: NominatimResult) => {
    const lat = Number(r.lat);
    const lng = Number(r.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    handlePositionChange([lat, lng], { animate: true });
    setSearchResults([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Click on the map to set exact shop location</p>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLocating}
          className="text-sm text-primary hover:underline disabled:opacity-50"
        >
          {isLocating ? "Getting location..." : "📍 Use Current Location"}
        </button>
      </div>

      {/* Address Search */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                searchAddress();
              }
            }}
            placeholder="Search address in India (min 3 chars)"
            className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={searchAddress}
            disabled={!canSearch || isSearching}
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-muted disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="border border-border rounded-lg overflow-hidden bg-card max-h-48 overflow-y-auto">
            {searchResults.map((r, idx) => (
              <button
                key={`${r.lat}-${r.lon}-${idx}`}
                type="button"
                onClick={() => selectSearchResult(r)}
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted border-b border-border last:border-b-0"
              >
                <span className="block line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Map */}
      <div className="h-[300px] rounded-xl overflow-hidden border border-border">
        <div ref={mapDivRef} className="h-full w-full" />
      </div>

      {position && !validationError && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            📍 Selected: {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </p>
          {isReverseGeocoding && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <Loader2 className="w-3 h-3 animate-spin" />
              Auto-filling address...
            </span>
          )}
        </div>
      )}
    </div>
  );
};
