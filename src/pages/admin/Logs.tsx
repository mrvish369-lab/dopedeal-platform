import { useEffect, useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { getAdminLogs } from "@/lib/admin";
import { usePagination } from "@/hooks/usePagination";
import { Activity, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface AdminLog {
  id: string;
  admin_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await getAdminLogs(500);
      setLogs(data as AdminLog[]);
      setIsLoading(false);
    };
    fetchLogs();
  }, []);

  // Filter logs based on search
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const query = searchQuery.toLowerCase();
    return logs.filter(
      (log) =>
        log.action.toLowerCase().includes(query) ||
        log.entity_type.toLowerCase().includes(query) ||
        log.entity_id?.toLowerCase().includes(query)
    );
  }, [logs, searchQuery]);

  // Pagination
  const pagination = usePagination(filteredLogs, { pageSize });

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    pagination.resetPage();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "text-secondary bg-secondary/10";
      case "update":
        return "text-primary bg-primary/10";
      case "delete":
        return "text-destructive bg-destructive/10";
      case "regenerate_qr":
        return "text-accent bg-accent/10";
      default:
        return "text-muted-foreground bg-muted";
    }
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
            <h1 className="text-3xl font-bold text-foreground">Activity Logs</h1>
            <p className="text-muted-foreground">Track all admin actions</p>
          </div>
          {logs.length > 0 && (
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  pagination.resetPage();
                }}
                className="pl-10"
              />
            </div>
          )}
        </div>

        {/* Logs List */}
        {logs.length > 0 ? (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="divide-y divide-border">
              {pagination.paginatedItems.map((log) => (
                <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Activity className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getActionColor(
                              log.action
                            )}`}
                          >
                            {log.action.replace("_", " ")}
                          </span>
                          <span className="text-foreground font-medium">
                            {log.entity_type}
                          </span>
                        </div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {Object.entries(log.metadata)
                              .slice(0, 3)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(" • ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(log.created_at), "MMM d, HH:mm")}
                      </div>
                      {log.entity_id && (
                        <p className="text-xs truncate max-w-[150px]">{log.entity_id}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <PaginationControls
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
              onNextPage={pagination.nextPage}
              onPrevPage={pagination.prevPage}
              onFirstPage={pagination.firstPage}
              onLastPage={pagination.lastPage}
              onPageSizeChange={handlePageSizeChange}
              pageSize={pageSize}
            />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No Activity Yet</h3>
            <p className="text-muted-foreground">
              Admin actions will appear here once you start managing shops and quizzes
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
