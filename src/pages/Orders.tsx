import { useMemo, useState } from "react";
import { Search, Truck, CheckCircle2, Clock, XCircle, Package, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCollection, db_update } from "@/lib/hooks";
import { isConfigured } from "@/lib/supabase";
import { type Order, type OrderStatus } from "@/lib/data";
import { TableSkeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useDebounce, formatINR, formatDateTime, statusLabel } from "@/lib/ui";

const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "in_transit", "delivered"];

const statusColor: Record<OrderStatus, string> = {
  pending:    "bg-amber-100 text-amber-700 border-amber-200",
  confirmed:  "bg-blue-100 text-blue-700 border-blue-200",
  in_transit: "bg-violet-100 text-violet-700 border-violet-200",
  delivered:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled:  "bg-red-100 text-red-600 border-red-200",
};

const statusIcon: Record<OrderStatus, React.ElementType> = {
  pending:    Clock,
  confirmed:  Package,
  in_transit: Truck,
  delivered:  CheckCircle2,
  cancelled:  XCircle,
};

const PAYMENT_LABEL: Record<string, string> = {
  wallet: "Wallet", upi: "UPI", cod: "COD", card: "Card",
};

const PAGE_SIZE = 25;

export function Orders() {
  const { data: orders, loading } = useCollection<Order>("orders", { orderBy: "placed_at", ascending: false });
  const [filter,   setFilter]   = useState<OrderStatus | "all">("all");
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const [confirmCancel, setConfirmCancel] = useState<Order | null>(null);
  const [acting, setActing] = useState(false);
  const [advancing, setAdvancing] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (!q) return true;
      return o.id.toLowerCase().includes(q)
        || o.customer.toLowerCase().includes(q)
        || (o.phone ?? "").includes(q);
    });
  }, [orders, filter, debouncedSearch]);

  // Reset page when filter/search changes
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  const counts = useMemo(() => ({
    all: orders.length,
    pending:    orders.filter((o) => o.status === "pending").length,
    confirmed:  orders.filter((o) => o.status === "confirmed").length,
    in_transit: orders.filter((o) => o.status === "in_transit").length,
    delivered:  orders.filter((o) => o.status === "delivered").length,
    cancelled:  orders.filter((o) => o.status === "cancelled").length,
  }), [orders]);

  const advance = async (id: string) => {
    if (advancing === id) return;
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    const idx  = STATUS_FLOW.indexOf(o.status as OrderStatus);
    const next = STATUS_FLOW[idx + 1];
    if (!next) return;
    setAdvancing(id);
    try {
      const update: Record<string, unknown> = { status: next };
      if (next === "delivered") update.delivered_at = new Date().toISOString();
      await db_update("orders", id, update);
      toast.success(`Order → ${statusLabel(next)}`);
      if (selected?.id === id) setSelected({ ...selected, status: next, ...(next === "delivered" ? { delivered_at: new Date().toISOString() } : {}) });
    } catch {
      toast.error("Failed to update order status");
    } finally {
      setAdvancing(null);
    }
  };

  const performCancel = async () => {
    if (!confirmCancel) return;
    setActing(true);
    try {
      await db_update("orders", confirmCancel.id, { status: "cancelled" });
      toast.success("Order cancelled");
      if (selected?.id === confirmCancel.id) setSelected({ ...selected, status: "cancelled" });
      setConfirmCancel(null);
    } catch {
      toast.error("Failed to cancel order");
    } finally {
      setActing(false);
    }
  };

  if (!isConfigured) {
    return <div className="p-6 text-center text-slate-400 text-sm">Supabase not configured.</div>;
  }

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      <ConfirmDialog
        open={!!confirmCancel}
        title="Cancel this order?"
        message={confirmCancel ? `Order from ${confirmCancel.customer} for ${formatINR(confirmCancel.total)} will be marked cancelled. This cannot be undone.` : ""}
        confirmLabel="Cancel Order"
        cancelLabel="Keep Order"
        loading={acting}
        onConfirm={performCancel}
        onCancel={() => setConfirmCancel(null)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <h2 className="text-lg font-extrabold text-slate-900">Orders</h2>
        <div className="flex-1 relative sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search ID, customer, phone…"
            inputMode="search"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
        {(["all", "pending", "confirmed", "in_transit", "delivered", "cancelled"] as const).map((s) => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all ${filter === s ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
            {s === "all" ? "All" : statusLabel(s)}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${filter === s ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em]">Order ID</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em]">Customer</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em] hidden md:table-cell">Items</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em]">Amount</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em]">Status</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <TableSkeleton rows={8} cols={6} />
                ) : paged.map((o) => {
                  const Icon = statusIcon[o.status as OrderStatus];
                  const canAdvance = STATUS_FLOW.includes(o.status as OrderStatus) &&
                    STATUS_FLOW.indexOf(o.status as OrderStatus) < STATUS_FLOW.length - 1;
                  return (
                    <tr key={o.id} onClick={() => setSelected(o)}
                      className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${selected?.id === o.id ? "bg-blue-50/60" : ""}`}>
                      <td className="px-4 py-3.5 font-bold text-slate-900 text-xs">{o.id.slice(0, 8)}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-800 text-xs">{o.customer}</p>
                        <p className="text-[10px] text-slate-400">{o.phone}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 hidden md:table-cell">{o.items}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 text-xs">{formatINR(o.total)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${statusColor[o.status as OrderStatus]}`}>
                          <Icon className="h-3 w-3" />{statusLabel(o.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {canAdvance && (
                            <button onClick={(e) => { e.stopPropagation(); advance(o.id); }}
                              disabled={advancing === o.id}
                              className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                              {advancing === o.id ? "…" : "Advance →"}
                            </button>
                          )}
                          {o.status !== "cancelled" && o.status !== "delivered" && (
                            <button onClick={(e) => { e.stopPropagation(); setConfirmCancel(o); }}
                              className="text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors">
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={6} className="p-0">
                    <EmptyState
                      icon={ShoppingBag}
                      title={orders.length === 0 ? "No orders yet" : "No matching orders"}
                      message={orders.length === 0
                        ? "Orders placed by customers will appear here in real time."
                        : "Try adjusting your search or filter."}
                    />
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs">
              <p className="text-slate-500">
                Showing <span className="font-bold text-slate-700">{(currentPage - 1) * PAGE_SIZE + 1}</span>–
                <span className="font-bold text-slate-700">{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span>{" "}
                of <span className="font-bold text-slate-700">{filtered.length}</span>
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                >Prev</button>
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 font-bold text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                >Next</button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="hidden lg:block w-72 shrink-0 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 self-start sticky top-20 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-900">{selected.id.slice(0, 8)}</h3>
              <button onClick={() => setSelected(null)} aria-label="Close" className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            </div>
            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border mb-4 ${statusColor[selected.status as OrderStatus]}`}>
              {statusLabel(selected.status)}
            </span>
            <div className="space-y-3 text-xs">
              {[
                { label: "Customer", value: selected.customer },
                { label: "Phone",    value: selected.phone },
                { label: "Items",    value: selected.items },
                { label: "Total",    value: formatINR(selected.total) },
                { label: "Payment",  value: PAYMENT_LABEL[selected.payment] ?? selected.payment },
                { label: "Driver",   value: selected.driver || "Unassigned" },
                { label: "Placed",   value: formatDateTime(selected.placed_at) },
                { label: "Address",  value: selected.address },
              ].map((row) => (
                <div key={row.label} className="flex justify-between gap-2">
                  <span className="text-slate-400 font-medium shrink-0">{row.label}</span>
                  <span className="font-semibold text-slate-800 text-right break-words">{row.value}</span>
                </div>
              ))}
            </div>
            {/* Progress */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1">
                {STATUS_FLOW.map((s, i) => {
                  const currentIdx = STATUS_FLOW.indexOf(selected.status as OrderStatus);
                  const done = i <= currentIdx && selected.status !== "cancelled";
                  return (
                    <div key={s} className="flex items-center gap-1 flex-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-blue-600" : "bg-slate-200"}`}>
                        {done && <span className="text-white text-[9px]">✓</span>}
                      </div>
                      {i < STATUS_FLOW.length - 1 && <div className={`h-0.5 flex-1 ${i < currentIdx ? "bg-blue-600" : "bg-slate-200"}`} />}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {STATUS_FLOW.indexOf(selected.status as OrderStatus) < STATUS_FLOW.length - 1 && selected.status !== "cancelled" && (
                <button onClick={() => advance(selected.id)}
                  disabled={advancing === selected.id}
                  className="w-full py-2 bg-blue-600 text-white text-xs font-extrabold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60">
                  {advancing === selected.id ? "Updating…" : "Advance Status →"}
                </button>
              )}
              {selected.status !== "cancelled" && selected.status !== "delivered" && (
                <button onClick={() => setConfirmCancel(selected)}
                  className="w-full py-2 bg-red-50 text-red-500 text-xs font-extrabold rounded-xl hover:bg-red-100 transition-colors">
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
