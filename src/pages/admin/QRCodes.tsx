import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { QrCode, Download, ExternalLink, Store } from "lucide-react";
import { cn } from "@/lib/utils";

interface QRCodeWithShop {
  id: string;
  shop_id: string;
  qr_url: string;
  status: string;
  version: number;
  created_at: string;
  shop: {
    name: string;
    shop_code: string;
    status: string;
  };
}

export default function AdminQRCodes() {
  const [qrCodes, setQrCodes] = useState<QRCodeWithShop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQRCodes = async () => {
      const { data, error } = await supabase
        .from("qr_codes")
        .select(`
          *,
          shop:shops (name, shop_code, status)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setQrCodes(data as unknown as QRCodeWithShop[]);
      }
      setIsLoading(false);
    };
    fetchQRCodes();
  }, []);

  const downloadQR = (qr: QRCodeWithShop) => {
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qr.qr_url)}`;
    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = `QR_${qr.shop.shop_code}.png`;
    link.click();
  };

  const downloadAll = () => {
    qrCodes.forEach((qr, index) => {
      setTimeout(() => downloadQR(qr), index * 500);
    });
  };

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">QR Codes</h1>
            <p className="text-muted-foreground">All active QR codes for your shops</p>
          </div>

          {qrCodes.length > 0 && (
            <Button onClick={downloadAll} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download All
            </Button>
          )}
        </div>

        {/* QR Grid */}
        {qrCodes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {qrCodes.map((qr) => (
              <div
                key={qr.id}
                className="bg-card border border-border rounded-2xl p-4 transition-all hover:border-primary/50"
              >
                {/* QR Image */}
                <div className="bg-white rounded-xl p-3 mb-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr.qr_url)}`}
                    alt={`QR for ${qr.shop.name}`}
                    className="w-full"
                  />
                </div>

                {/* Shop Info */}
                <div className="flex items-center gap-2 mb-3">
                  <Store className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground truncate">{qr.shop.name}</span>
                </div>

                <p className="text-xs text-muted-foreground mb-4">{qr.shop.shop_code}</p>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => downloadQR(qr)}
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </Button>
                  <Link to={`/admin/shops/${qr.shop_id}`}>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No QR Codes Yet</h3>
            <p className="text-muted-foreground mb-6">
              QR codes are automatically generated when you create shops
            </p>
            <Link to="/admin/shops">
              <Button className="btn-fire">Create Your First Shop</Button>
            </Link>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
