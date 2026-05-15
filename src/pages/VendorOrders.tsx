import { useEffect, useState, useMemo } from "react";
import { ShoppingBag, Search, X, ChevronRight, Truck, XCircle, CheckCircle2, MapPin, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { db_update } from "@/lib/hooks";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { TableSkeleton } from "@/components/Skeleton";
import { useDebounce, formatINR } from "@/lib/ui";

interface Order {
  id: string; vendor_id: string | null; customer: string; phone: string;
  items: string; total: number; litres: number; payment: string; address: string;
  status: string; placed_at: string; delivered_at?: string;
}
interface Vendor { id: string; name: string; area: string; }

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  pending:    { label: "Pending",    bg: "bg-amber-100",   text: "text-amber-700"   },
  confirmed:  { label: "Confirmed",  bg: "bg-blue-100",    text: "text-blue-700"    },
  in_transit: { label: "In Transit", bg: "bg-violet-100",  text: "text-violet-700"  },
  delivered:  { label: "Delivered",  bg: "bg-emerald-100", text: "text-emerald-700" },
  cancelled:  { label: "Cancelled",  bg: "bg-red-100",     text: "text-red-600"     },
};

const NEXT: Record<string, string> = { pending: "confirmed", confirmed: "in_transit", in_transit: "delivered" };
const NEXT_LABEL: Record<string, string> = { pending: "Confirm", confirmed: "Dispatch", in_transit: "Deliver" };

const TABS = ["All", "Unassigned", "Assigned", "Delivered", "Cancelled"] as const;
type Tab = (typeof TABS)[number];

export function VendorOrders() {
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState("");
  const [tab,     setTab]     = useState<Tab>("All");
  const [selected, setSelected] = useState<Order | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<Order | null>(null);
  const debouncedQuery = useDebounce(query, 300);

  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    const [o, v] = await Promise.all([
      supabase.from("orders").select("*").order("placed_at", { ascending: false }),
      supabase.from("vendors").select("id,name,area").eq("active", true),
    ]);
    setOrders((o.data ?? []) as Order[]);
    setVendors((v.data ?? []) as Vendor[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!supabase) return;
    const ch = supabase
      .channel("vendor-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => { supabase?.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = orders;
    if (tab === "Unassigned") list = list.filter((o) => !o.vendor_id);
    else if (tab === "Assigned") list = list.filter((o) => !!o.vendor_id && o.status !== "delivered" && o.status !== "cancelled");
    else if (tab === "Delivered") list = list.filter((o) => o.status === "delivered");
    else if (tab === "Cancelled") list = list.filter((o) => o.status === "cancelled");
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      list = list.filter((o) => o.customer.toLowerCase().includes(q) || o.id.slice(-6).toLowerCase().includes(q) || o.items.toLowerCase().includes(q));
    }
    return list;
  }, [orders, tab, debouncedQuery]);

  const counts = useMemo(() => ({
    All: orders.length,
    Unassigned: orders.filter((o) => !o.vendor_id).length,
    Assigned: orders.filter((o) => !!o.vendor_id && o.status !== "delivered" && o.status !== "cancelled").length,
    Delivered: orders.filter((o) => o.status === "delivered").length,
    Cancelled: orders.filter((o) => o.status === "cancelled").length,
  }), [orders]);

  const assignVendor = async (orderId: string, vendorId: string) => {
    setAssigning(orderId);
    try {
      await db_update("orders", orderId, { vendor_id: vendorId, status: "confirmed" });
      toast.success("Order assigned to vendor");
      load();
      setSelected((prev) => prev?.id === orderId ? { ...prev, vendor_id: vendorId, status: "confirmed" } : prev);
    } catch { toast.error("Failed to assign"); }
    finally { setAssigning(null); }
  };

  const advanceOrder = async (order: Order) => {
    const next = NEXT[order.status];
    if (!next) return;
    setActing(true);
    try {
      const update: Record<string, unknown> = { status: next };
      if (next === "delivered") update.delivered_at = new Date().toISOString();
      await db_update("orders", order.id, update);
      toast.success("Status updated");
      load();
      setSelected((prev) => prev?.id === order.id ? { ...prev, status: next } : prev);
    } catch { toast.error("Failed to update"); }
    finally { setActing(false); }
  };

  const cancelOrder = async (order: Order) => {
    setActing(true);
    try {
      await db_update("orders", order.id, { status: "cancelled" });
      toast.success("Order cancelled");
      load();
      setSelected((prev) => prev?.id === order.id ? { ...prev, status: "cancelled" } : prev);
      setConfirmCancel(null);
    } catch { toast.error("Failed to cancel"); }
    finally { setActing(false); }
  };

  const vendorName = (id: string | null) => id ? (vendors.find((v) => v.id === id)?.name ?? "Unknown") : null;

  return (
    <div className="flex h-full gap-0">
      <ConfirmDialog
        open={!!confirmCancel}
        title="Cancel this order?"
        message={confirmCancel ? `Order from ${confirmCancel.customer} for ${formatINR(confirmCancel.total)} will be cancelled.` : ""}
        confirmLabel="Cancel Order"
        cancelLabel="Keep Order"
        loading={acting}
        onConfirm={() => confirmCancel && cancelOrder(confirmCancel)}
        onCancel={() => setConfirmCancel(null)}
      />
      {/* List */}
      <div className={`flex flex-col flex-1 min-w-0 ${selected ? "hidden lg:flex" : "flex"}`}>
        <div className="px-6 pt-6 pb-4 border-b border-slate-200 bg-white space-y-3">
          <h1 className="text-xl font-bold text-slate-900">Vendor Orders</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search orders…"
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  tab === t ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {t} ({counts[t]})
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="bg-white">
              <table className="w-full text-sm"><tbody className="divide-y divide-slate-100">
                <TableSkeleton rows={6} cols={7} />
              </tbody></table>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48">
              <ShoppingBag className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No orders here</p>
            </div>
          ) : (
            <div className="bg-white overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wide font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 text-left">Order</th>
                    <th className="px-5 py-3 text-left">Customer</th>
                    <th className="px-5 py-3 text-left">Vendor</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-center">Time</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((o) => {
                    const meta = STATUS_META[o.status] ?? STATUS_META.pending;
                    const vName = vendorName(o.vendor_id);
                    return (
                      <tr key={o.id} onClick={() => setSelected(o)}
                        className={`hover:bg-slate-50 cursor-pointer ${selected?.id === o.id ? "bg-indigo-50/40" : ""}`}
                      >
                        <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-700">#{o.id.slice(-6).toUpperCase()}</td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-slate-900">{o.customer}</p>
                          <p className="text-[11px] text-slate-400">{o.items}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          {vName
                            ? <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">{vName}</span>
                            : <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">Unassigned</span>
                          }
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-900">{formatINR(o.total)}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>{meta.label}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-[11px] text-slate-400">
                          {o.placed_at ? (() => { try { return format(parseISO(o.placed_at), "d MMM, h:mm a"); } catch { return ""; } })() : ""}
                        </td>
                        <td className="px-5 py-3.5"><ChevronRight className="h-4 w-4 text-slate-300 ml-auto" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (() => {
        const meta = STATUS_META[selected.status] ?? STATUS_META.pending;
        const vName = vendorName(selected.vendor_id);
        return (
          <div className="w-full lg:w-[340px] border-l border-slate-200 bg-white flex flex-col overflow-hidden shrink-0">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-900">#{selected.id.slice(-6).toUpperCase()}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>{meta.label}</span>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Customer */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Customer</p>
                <p className="font-semibold text-slate-900">{selected.customer}</p>
                <div className="flex items-center gap-1.5 text-sm text-slate-500"><Phone className="h-3.5 w-3.5" />{selected.phone}</div>
                <div className="flex items-start gap-1.5 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />{selected.address}</div>
              </div>

              {/* Order details */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Order</p>
                <p className="text-sm text-slate-700">{selected.items}</p>
                {selected.litres > 0 && <p className="text-sm text-slate-500">{selected.litres}L water</p>}
                <p className="text-sm font-semibold text-slate-900">{formatINR(selected.total)} · {selected.payment?.toUpperCase()}</p>
              </div>

              {/* Assign vendor */}
              {selected.status !== "delivered" && selected.status !== "cancelled" && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Assign Vendor</p>
                  <select
                    value={selected.vendor_id ?? ""}
                    onChange={(e) => { if (e.target.value) assignVendor(selected.id, e.target.value); }}
                    disabled={!!assigning}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">{vName ? `Currently: ${vName}` : "Select vendor…"}</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}{v.area ? ` (${v.area})` : ""}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Actions */}
              {selected.status !== "delivered" && selected.status !== "cancelled" && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</p>
                  {NEXT[selected.status] && (
                    <button onClick={() => advanceOrder(selected)} disabled={acting}
                      className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl disabled:opacity-60 flex items-center justify-center gap-2">
                      <Truck className="h-4 w-4" /> {NEXT_LABEL[selected.status] ?? "Advance"}
                    </button>
                  )}
                  <button onClick={() => setConfirmCancel(selected)} disabled={acting}
                    className="w-full py-2.5 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-100 disabled:opacity-60 flex items-center justify-center gap-2">
                    <XCircle className="h-4 w-4" /> Cancel Order
                  </button>
                </div>
              )}

              {selected.status === "delivered" && (
                <div className="flex items-center gap-2 py-3 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-semibold">Delivered successfully</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
