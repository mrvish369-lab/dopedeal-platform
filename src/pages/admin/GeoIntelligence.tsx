import { lazy, Suspense } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Map, TrendingUp } from "lucide-react";

// Lazy load map component to avoid SSR issues
const GeoIntelligenceMap = lazy(() => 
  import("@/components/maps/GeoIntelligenceMap").then(m => ({ default: m.GeoIntelligenceMap }))
);

export default function GeoIntelligence() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Map className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Geo Intelligence</h1>
            <p className="text-muted-foreground">
              Visualize shop distribution and activity across locations
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Business Intelligence View</p>
            <p className="text-sm text-muted-foreground">
              See executed business visually. Identify high-ROI areas and plan future expansion based on real scan data.
            </p>
          </div>
        </div>

        {/* Map Component */}
        <Suspense fallback={
          <div className="h-[500px] bg-muted rounded-xl flex items-center justify-center border border-border">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <GeoIntelligenceMap />
        </Suspense>
      </div>
    </AdminLayout>
  );
}
