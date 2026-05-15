import { useMemo, useState } from "react";
import { PauseCircle, PlayCircle, XCircle, Calendar, Repeat } from "lucide-react";
import { toast } from "sonner";
import { useCollection, db_update } from "@/lib/hooks";
import { isConfigured } from "@/lib/supabase";
import { type Subscription } from "@/lib/data";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeleton } from "@/components/Skeleton";
import { formatINR, formatDate, statusLabel } from "@/lib/ui";
import { MultiFilter, type FilterMap, matchesFilters, type ColDef } from "@/components/MultiFilter";

const statusStyle = {
  active:    "bg-emerald-100 text-emerald-700 border-emerald-200",
  paused:    "bg-amber-100 text-amber-700 border-amber-200",
  cancelled: "bg-red-100 text-red-500 border-red-200",
};

const SUB_COLS: ColDef[] = [
  { key: "customer",     label: "Customer",    type: "text" },
  { key: "phone",        label: "Phone",       type: "text" },
  { key: "product_name", label: "Product",     type: "text" },
  { key: "frequency",    label: "Frequency",   type: "text" },
  { key: "total",        label: "Amount/mo",   type: "number-range", prefix: "₹" },
  { key: "start_date",   label: "Start Date",  type: "date-range" },
  { key: "created_at",   label: "Created",     type: "date-range" },
];

export function Subscriptions() {
  const { data: subs, loading } = useCollection<Subscription>("schedules", { orderBy: "created_at", ascending: false });
  const [filters, setFilters] = useState<FilterMap>({});
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "cancelled">("all");
  const [confirmCancel, setConfirmCancel] = useState<Subscription | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const filtered = useMemo(() => {
    return subs.filter((s) => {
      if (filter !== "all" && s.status !== filter) return false;
      return matchesFilters(s as unknown as Record<string, unknown>, filters);
    });
  }, [subs, filter, filters]);

  const updateStatus = async (id: string, status: Subscription["status"]) => {
    try {
      await db_update("schedules", id, { status });
      toast.success(`Schedule ${statusLabel(status)}`);
    } catch { toast.error("Failed to update schedule"); }
  };

  const performCancel = async () => {
    if (!confirmCancel) return;
    setCancelling(true);
    try {
      await db_update("schedules", confirmCancel.id, { status: "cancelled" });
      toast.success("Schedule cancelled");
      setConfirmCancel(null);
    } catch { toast.error("Failed to cancel"); }
    finally { setCancelling(false); }
  };

  const counts = {
    all:       subs.length,
    active:    subs.filter((s) => s.status === "active").length,
    paused:    subs.filter((s) => s.status === "paused").length,
    cancelled: subs.filter((s) => s.status === "cancelled").length,
  };

  const monthlyRevenue = subs.filter((s) => s.status === "active").reduce((sum, s) => sum + s.total, 0);

  if (!isConfigured) {
    return <div className="p-6 text-center text-slate-400 text-sm">Supabase not configured.</div>;
  }

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      <ConfirmDialog
        open={!!confirmCancel}
        title="Cancel this schedule?"
        message={confirmCancel ? `${confirmCancel.customer}'s ${confirmCancel.product_name} schedule will be permanently cancelled.` : ""}
        confirmLabel="Cancel Schedule"
        cancelLabel="Keep Schedule"
        loading={cancelling}
        onConfirm={performCancel}
        onCancel={() => setConfirmCancel(null)}
      />

      <div className="mb-5">
        <h2 className="text-lg font-extrabold text-slate-900 mb-3">Scheduled Deliveries</h2>
        <MultiFilter columns={SUB_COLS} value={filters} onChange={setFilters} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Active",      value: counts.active,           color: "text-emerald-600" },
          { label: "Paused",      value: counts.paused,           color: "text-amber-600"   },
          { label: "Cancelled",   value: counts.cancelled,        color: "text-red-500"     },
          { label: "Monthly Rev", value: formatINR(monthlyRevenue), color: "text-blue-600"  },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 font-medium">{s.label}</p>
            <p className={`text-xl font-extrabold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "active", "paused", "cancelled"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all capitalize ${filter === f ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} height={100} />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-extrabold text-white">
                      {s.customer.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{s.customer}</p>
                    <p className="text-[11px] text-slate-400">{s.phone}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs flex-1">
                  {[
                    { lbl: "Product", val: s.product_name },
                    { lbl: "Qty",     val: `×${s.quantity}` },
                    { lbl: "Amount",  val: `${formatINR(s.total)}/mo`, cls: "font-extrabold text-blue-600" },
                  ].map(({ lbl, val, cls }) => (
                    <div key={lbl}>
                      <p className="text-slate-400 text-[10px] font-medium">{lbl}</p>
                      <p className={`font-bold text-slate-800 ${cls ?? ""}`}>{val}</p>
                    </div>
                  ))}
                  <div>
                    <p className="text-slate-400 text-[10px] font-medium">Start Date</p>
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />{s.start_date} {s.time_slot}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border capitalize ${statusStyle[s.status]}`}>
                    {s.status}
                  </span>
                  {s.status === "active" && (
                    <button onClick={() => updateStatus(s.id, "paused")} title="Pause"
                      className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors">
                      <PauseCircle style={{ height: 18, width: 18 }} />
                    </button>
                  )}
                  {s.status === "paused" && (
                    <button onClick={() => updateStatus(s.id, "active")} title="Resume"
                      className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors">
                      <PlayCircle style={{ height: 18, width: 18 }} />
                    </button>
                  )}
                  {s.status !== "cancelled" && (
                    <button onClick={() => setConfirmCancel(s)} title="Cancel"
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                      <XCircle style={{ height: 18, width: 18 }} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2.5 ml-[52px]">
                Started {formatDate(s.created_at)} · {s.frequency} · {s.address}
              </p>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <EmptyState
              icon={Repeat}
              title={subs.length === 0 ? "No schedules yet" : "No matching schedules"}
              message={subs.length === 0
                ? "Schedules created by customers will appear here in real time."
                : "Try changing your filters."}
            />
          )}
        </div>
      )}
    </div>
  );
}
