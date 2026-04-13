import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRegions, useShops, useInvalidateAdminData, type Region } from "@/hooks/useAdminData";
import { Plus, MapPin, Edit, Trash2, Building, Users } from "lucide-react";

const Regions = () => {
  const { data: regions = [], isLoading } = useRegions();
  const { data: shops = [] } = useShops();
  const { invalidateRegions } = useInvalidateAdminData();
  const [showEditor, setShowEditor] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zone, setZone] = useState("");
  const [managerEmail, setManagerEmail] = useState("");

  // Calculate stats from shops data
  const stats = useMemo(() => {
    const statsMap: Record<string, { shops: number }> = {};
    shops.forEach((shop) => {
      const cityName = shop.city || "Unknown";
      if (!statsMap[cityName]) statsMap[cityName] = { shops: 0 };
      statsMap[cityName].shops += 1;
    });
    return statsMap;
  }, [shops]);

  const resetForm = () => {
    setName("");
    setCity("");
    setState("");
    setZone("");
    setManagerEmail("");
    setEditingRegion(null);
  };

  const openEditor = (region?: Region) => {
    if (region) {
      setEditingRegion(region);
      setName(region.name);
      setCity(region.city);
      setState(region.state);
      setZone(region.zone || "");
      setManagerEmail(region.manager_email || "");
    } else {
      resetForm();
    }
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!name || !city || !state) {
      toast({ title: "Error", description: "Name, city, and state are required", variant: "destructive" });
      return;
    }

    try {
      const data = {
        name,
        city,
        state,
        zone: zone || null,
        manager_email: managerEmail || null,
      };

      if (editingRegion) {
        const { error } = await supabase.from("regions").update(data).eq("id", editingRegion.id);
        if (error) throw error;
        toast({ title: "Success", description: "Region updated" });
      } else {
        const { error } = await supabase.from("regions").insert([data]);
        if (error) throw error;
        toast({ title: "Success", description: "Region created" });
      }

      setShowEditor(false);
      resetForm();
      invalidateRegions();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save region", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this region?")) return;

    try {
      const { error } = await supabase.from("regions").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Region deleted" });
      invalidateRegions();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete region", variant: "destructive" });
    }
  };

  const toggleStatus = async (region: Region) => {
    try {
      const newStatus = region.status === "active" ? "inactive" : "active";
      const { error } = await supabase.from("regions").update({ status: newStatus }).eq("id", region.id);
      if (error) throw error;
      invalidateRegions();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  // Group regions by state
  const regionsByState = useMemo(() => {
    return regions.reduce((acc, region) => {
      if (!acc[region.state]) acc[region.state] = [];
      acc[region.state].push(region);
      return acc;
    }, {} as Record<string, Region[]>);
  }, [regions]);

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
            <h1 className="text-2xl font-bold text-foreground">Regional Control</h1>
            <p className="text-muted-foreground">Manage cities, zones, and regional managers</p>
          </div>
          <Button className="btn-fire gap-2" onClick={() => openEditor()}>
            <Plus className="w-4 h-4" />
            Add Region
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{regions.length}</p>
              <p className="text-sm text-muted-foreground">Total Regions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Building className="w-8 h-8 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold">{Object.keys(regionsByState).length}</p>
              <p className="text-sm text-muted-foreground">States Covered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold">{regions.filter(r => r.manager_email).length}</p>
              <p className="text-sm text-muted-foreground">Managers Assigned</p>
            </CardContent>
          </Card>
        </div>

        {/* Regions by State */}
        {Object.entries(regionsByState).map(([stateName, stateRegions]) => (
          <Card key={stateName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {stateName}
                <Badge variant="outline">{stateRegions.length} regions</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stateRegions.map((region) => (
                  <div
                    key={region.id}
                    className={`p-4 rounded-xl border ${
                      region.status === "active" ? "border-border" : "border-border/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-foreground">{region.name}</p>
                        <p className="text-sm text-muted-foreground">{region.city}</p>
                      </div>
                      <Badge
                        variant={region.status === "active" ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => toggleStatus(region)}
                      >
                        {region.status}
                      </Badge>
                    </div>
                    {region.zone && (
                      <p className="text-xs text-muted-foreground mb-2">Zone: {region.zone}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="p-2 bg-muted rounded">
                        <p className="text-muted-foreground">Shops</p>
                        <p className="font-bold">{stats[region.city]?.shops || 0}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="flex-1" onClick={() => openEditor(region)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(region.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {regions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No regions defined yet</p>
              <p className="text-sm">Add regions to organize your shops by city and state</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Region Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRegion ? "Edit" : "Add"} Region</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Region Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Mumbai Central" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" />
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Maharashtra" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Zone (Optional)</Label>
              <Input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="North, South, East, West..." />
            </div>
            <div className="space-y-2">
              <Label>Manager Email (Optional)</Label>
              <Input type="email" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} placeholder="manager@dopedeal.in" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowEditor(false); resetForm(); }}>
                Cancel
              </Button>
              <Button className="flex-1 btn-fire" onClick={handleSave}>
                Save Region
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Regions;
