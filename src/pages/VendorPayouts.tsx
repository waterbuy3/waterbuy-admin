import { useEffect, useState, useMemo } from "react";
import {
  Wallet, CheckCircle2, Clock, Plus, X, Zap, Search,
  TrendingUp, ArrowDownToLine, AlertCircle, BarChart3,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { TableSkeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { formatINR } from "@/lib/ui";
import { MultiFilter, type FilterMap, matchesFilters, type ColDef } from "@/components/MultiFilter";

interface Payout {
  id: string; vendor_id: string; amount: number; period: string;
  status: string; created_at: string; paid_at?: string;
}
interface Vendor {
  id: string; name: string; area: string;
  commission_pct: number; active: boolean;
}
interface OrderRow { vendor_id: string | null; total: number; status: string; }

interface VendorSummary {
  vendor: Vendor;
  totalOrders: number;
  activeOrders: number;
  deliveredOrders: number;
  grossRevenue: number;
  commissionAmt: number;
  vendorEarnings: number;
  paidOut: number;
  inQueue: number;
  pendingRelease: number;
}

export function VendorPayouts() {
  const [payouts,     setPayouts]     = useState<Payout[]>([]);
  const [vendors,     setVendors]     = useState<Vendor[]>([]);
  const [orders,      setOrders]      = useState<OrderRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState<"summary" | "records">("summary");
  const [filters,     setFilters]     = useState<FilterMap>({});
  const [summaryQ,    setSummaryQ]    = useState("");
  const [acting,      setActing]      = useState<string | null>(null);
  const [quickPaying, setQuickPaying] = useState<string | null>(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [generating,  setGenerating]  = useState(false);
  const [form, setForm] = useState({ vendor_id: "", amount: "", period: "" });

  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    const [p, v, o] = await Promise.all([
      supabase.from("payouts").select("*").order("created_at", { ascending: false }),
      supabase.from("vendors").select("id,name,area,commission_pct,active"),
      supabase.from("orders").select("vendor_id,total,status"),
    ]);
    setPayouts((p.data ?? []) as Payout[]);
    setVendors((v.data ?? []) as Vendor[]);
    setOrders((o.data ?? []) as OrderRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!supabase) return;
    const ch = supabase
      .channel("payouts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "payouts" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => { supabase?.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Per-vendor financial summary ─── */
  const vendorSummary = useMemo<VendorSummary[]>(() => {
    const q = summaryQ.trim().toLowerCase();
    return vendors
      .map((v) => {
        const vOrders      = orders.filter((o) => o.vendor_id === v.id);
        const delivered    = vOrders.filter((o) => o.status === "delivered");
        const activeOrders = vOrders.filter((o) => ["pending", "confirmed", "in_transit"].includes(o.status));

        const grossRevenue   = delivered.reduce((s, o) => s + o.total, 0);
        const commissionRate = (v.commission_pct ?? 10) / 100;
        const commissionAmt  = +(grossRevenue * commissionRate).toFixed(2);
        const vendorEarnings = +(grossRevenue - commissionAmt).toFixed(2);

        const vPayouts  = payouts.filter((p) => p.vendor_id === v.id);
        const paidOut   = +vPayouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0).toFixed(2);
        const inQueue   = +vPayouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0).toFixed(2);
        const pendingRelease = Math.max(0, +(vendorEarnings - paidOut - inQueue).toFixed(2));

        return {
          vendor: v,
          totalOrders: vOrders.length,
          activeOrders: activeOrders.length,
          deliveredOrders: delivered.length,
          grossRevenue,
          commissionAmt,
          vendorEarnings,
          paidOut,
          inQueue,
          pendingRelease,
        };
      })
      .filter((s) => !q || s.vendor.name.toLowerCase().includes(q) || (s.vendor.area ?? "").toLowerCase().includes(q))
      .sort((a, b) => b.pendingRelease - a.pendingRelease);
  }, [vendors, orders, payouts, summaryQ]);

  /* ─── Global stats ─── */
  const totalGrossRevenue   = vendorSummary.reduce((s, v) => s + v.grossRevenue, 0);
  const totalCommission     = vendorSummary.reduce((s, v) => s + v.commissionAmt, 0);
  const totalPaid           = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPendingRelease = vendorSummary.reduce((s, v) => s + v.pendingRelease, 0);

  /* ─── Records tab filter ─── */
  const recordColumns = useMemo<ColDef[]>(() => [
    { key: "vendor_id", label: "Vendor", type: "select",
      options: vendors.map((v) => ({ value: v.id, label: v.name })) },
    { key: "status",     label: "Status",       type: "select",
      options: [{ value: "pending", label: "Pending" }, { value: "paid", label: "Paid" }] },
    { key: "amount",     label: "Amount",        type: "number-range", prefix: "₹" },
    { key: "period",     label: "Period",         type: "text", placeholder: "e.g. May 2026" },
    { key: "created_at", label: "Created Date",   type: "date-range" },
    { key: "paid_at",    label: "Paid Date",       type: "date-range" },
  ], [vendors]);

  const filteredRecords = useMemo(
    () => payouts.filter((p) => matchesFilters(p as unknown as Record<string, unknown>, filters)),
    [payouts, filters],
  );

  const vendorName = (id: string) => vendors.find((v) => v.id === id)?.name ?? "Unknown";

  /* ─── Actions ─── */
  const markPaid = async (payout: Payout) => {
    if (!supabase) return;
    setActing(payout.id);
    const { error } = await supabase.from("payouts")
      .update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", payout.id);
    if (error) toast.error("Failed to mark as paid");
    else { toast.success("Payout marked as paid"); load(); }
    setActing(null);
  };

  const quickPay = async (vendorId: string, amount: number, name: string) => {
    if (!supabase) return;
    setQuickPaying(vendorId);
    const period = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    const { error } = await supabase.from("payouts")
      .insert({ vendor_id: vendorId, amount, period, status: "pending" });
    if (error) toast.error("Failed to create payout");
    else { toast.success(`Pending payout of ${formatINR(amount)} created for ${name}`); load(); }
    setQuickPaying(null);
  };

  const createPayout = async () => {
    if (!supabase) return;
    if (!form.vendor_id) { toast.error("Select a vendor"); return; }
    const amt = parseFloat(form.amount);
    if (!isFinite(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (!form.period.trim()) { toast.error("Enter a period (e.g. May 2026)"); return; }
    const { error } = await supabase.from("payouts").insert({
      vendor_id: form.vendor_id, amount: amt, period: form.period.trim(), status: "pending",
    });
    if (error) { toast.error("Failed to create payout"); }
    else {
      toast.success("Payout created");
      setShowCreate(false);
      setForm({ vendor_id: "", amount: "", period: "" });
      load();
    }
  };

  const generatePayouts = async () => {
    if (!supabase) return;
    setGenerating(true);
    try {
      const accounted: Record<string, number> = {};
      for (const p of payouts) accounted[p.vendor_id] = (accounted[p.vendor_id] ?? 0) + p.amount;

      const inserts: { vendor_id: string; amount: number; period: string; status: string }[] = [];
      const period = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      for (const v of vendorSummary) {
        if (v.pendingRelease > 0)
          inserts.push({ vendor_id: v.vendor.id, amount: v.pendingRelease, period, status: "pending" });
      }
      if (inserts.length === 0) { toast.info("All vendors are up to date — no new payouts needed"); return; }
      const { error } = await supabase.from("payouts").insert(inserts);
      if (error) { toast.error("Failed to generate payouts"); return; }
      toast.success(`Generated ${inserts.length} pending payout${inserts.length > 1 ? "s" : ""}`);
      load();
    } catch { toast.error("Generation failed"); }
    finally { setGenerating(false); }
  };

  const fmtDate = (s?: string) => {
    if (!s) return "—";
    try { return format(parseISO(s), "d MMM yyyy"); } catch { return "—"; }
  };

  return (
    <div className="p-6 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Vendor Payments</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {vendors.length} vendors · {payouts.filter((p) => p.status === "pending").length} pending payouts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={generatePayouts} disabled={generating}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60">
            <Zap className="h-4 w-4" /> {generating ? "Generating…" : "Auto-Generate"}
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus className="h-4 w-4" /> New Payout
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Gross Revenue",     value: formatINR(totalGrossRevenue), bg: "bg-blue-50",    ic: "text-blue-600",    icon: TrendingUp       },
          { label: "Our Commission",    value: formatINR(totalCommission),   bg: "bg-violet-50",  ic: "text-violet-600",  icon: BarChart3        },
          { label: "Total Paid Out",    value: formatINR(totalPaid),         bg: "bg-emerald-50", ic: "text-emerald-600", icon: CheckCircle2     },
          { label: "Pending Release",   value: formatINR(totalPendingRelease), bg: totalPendingRelease > 0 ? "bg-amber-50" : "bg-slate-50",
            ic: totalPendingRelease > 0 ? "text-amber-600" : "text-slate-400", icon: totalPendingRelease > 0 ? AlertCircle : ArrowDownToLine },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`h-4 w-4 ${s.ic}`} strokeWidth={1.8} />
            </div>
            <p className={`text-2xl font-bold ${s.label === "Pending Release" && totalPendingRelease > 0 ? "text-amber-700" : "text-slate-900"}`}>{s.value}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {(["summary", "records"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
              activeTab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            {t === "summary" ? "Vendor Summary" : "Payout Records"}
          </button>
        ))}
      </div>

      {/* ══════════════ TAB: Vendor Summary ══════════════ */}
      {activeTab === "summary" && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={summaryQ} onChange={(e) => setSummaryQ(e.target.value)}
              placeholder="Search vendor or area…" inputMode="search"
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1100px]">
                <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wide font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 text-left sticky left-0 bg-slate-50 z-10">Vendor</th>
                    <th className="px-5 py-3 text-center">Orders</th>
                    <th className="px-5 py-3 text-right">Gross Revenue</th>
                    <th className="px-5 py-3 text-right">Commission</th>
                    <th className="px-5 py-3 text-right">Vendor Earnings</th>
                    <th className="px-5 py-3 text-right">Paid Out</th>
                    <th className="px-5 py-3 text-right">In Queue</th>
                    <th className="px-5 py-3 text-right">Pending Release</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && <TableSkeleton rows={5} cols={9} />}
                  {!loading && vendorSummary.length === 0 && (
                    <tr><td colSpan={9} className="py-16 text-center">
                      <Wallet className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No vendors found</p>
                    </td></tr>
                  )}
                  {!loading && vendorSummary.map((s) => (
                    <tr key={s.vendor.id}
                      className={`hover:bg-slate-50/60 transition-colors ${s.pendingRelease > 0 ? "bg-amber-50/30" : ""}`}>
                      {/* Vendor */}
                      <td className="px-5 py-4 sticky left-0 bg-white hover:bg-slate-50/60">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                            {s.vendor.name.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{s.vendor.name}</p>
                            <p className="text-[11px] text-slate-400">{s.vendor.area || "—"} · {s.vendor.commission_pct}% comm.</p>
                          </div>
                        </div>
                      </td>

                      {/* Orders */}
                      <td className="px-5 py-4 text-center">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-slate-900">{s.deliveredOrders} <span className="text-[10px] font-semibold text-emerald-600">delivered</span></p>
                          {s.activeOrders > 0 && (
                            <p className="text-[11px] font-semibold text-amber-600">{s.activeOrders} active</p>
                          )}
                          <p className="text-[10px] text-slate-400">{s.totalOrders} total</p>
                        </div>
                      </td>

                      {/* Gross Revenue */}
                      <td className="px-5 py-4 text-right">
                        <p className="font-semibold text-slate-900">{formatINR(s.grossRevenue)}</p>
                        <p className="text-[10px] text-slate-400">from delivered</p>
                      </td>

                      {/* Commission */}
                      <td className="px-5 py-4 text-right">
                        <p className="font-semibold text-violet-700">{formatINR(s.commissionAmt)}</p>
                        <p className="text-[10px] text-slate-400">{s.vendor.commission_pct}% of revenue</p>
                      </td>

                      {/* Vendor Earnings */}
                      <td className="px-5 py-4 text-right">
                        <p className="font-bold text-slate-900">{formatINR(s.vendorEarnings)}</p>
                        <p className="text-[10px] text-slate-400">their share</p>
                      </td>

                      {/* Paid Out */}
                      <td className="px-5 py-4 text-right">
                        <p className="font-semibold text-emerald-700">{s.paidOut > 0 ? formatINR(s.paidOut) : "—"}</p>
                      </td>

                      {/* In Queue */}
                      <td className="px-5 py-4 text-right">
                        {s.inQueue > 0 ? (
                          <span className="inline-block text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            {formatINR(s.inQueue)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Pending Release */}
                      <td className="px-5 py-4 text-right">
                        {s.pendingRelease > 0 ? (
                          <div>
                            <p className="text-base font-extrabold text-amber-700">{formatINR(s.pendingRelease)}</p>
                            <p className="text-[10px] text-amber-500 font-semibold">needs payout</p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Settled
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        {s.pendingRelease > 0 && (
                          <button
                            onClick={() => quickPay(s.vendor.id, s.pendingRelease, s.vendor.name)}
                            disabled={quickPaying === s.vendor.id}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50 ml-auto whitespace-nowrap">
                            <ArrowDownToLine className="h-3.5 w-3.5" />
                            {quickPaying === s.vendor.id ? "Creating…" : "Create Payout"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Totals row */}
                {!loading && vendorSummary.length > 0 && (
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                    <tr>
                      <td className="px-5 py-3 text-xs font-extrabold text-slate-600 sticky left-0 bg-slate-50">
                        TOTAL ({vendorSummary.length} vendors)
                      </td>
                      <td className="px-5 py-3 text-center text-xs font-bold text-slate-700">
                        {vendorSummary.reduce((s, v) => s + v.deliveredOrders, 0)} delivered
                      </td>
                      <td className="px-5 py-3 text-right text-xs font-bold text-slate-900">
                        {formatINR(totalGrossRevenue)}
                      </td>
                      <td className="px-5 py-3 text-right text-xs font-bold text-violet-700">
                        {formatINR(totalCommission)}
                      </td>
                      <td className="px-5 py-3 text-right text-xs font-bold text-slate-900">
                        {formatINR(vendorSummary.reduce((s, v) => s + v.vendorEarnings, 0))}
                      </td>
                      <td className="px-5 py-3 text-right text-xs font-bold text-emerald-700">
                        {formatINR(totalPaid)}
                      </td>
                      <td className="px-5 py-3 text-right text-xs font-bold text-blue-700">
                        {formatINR(vendorSummary.reduce((s, v) => s + v.inQueue, 0))}
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-extrabold text-amber-700">
                        {formatINR(totalPendingRelease)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TAB: Payout Records ══════════════ */}
      {activeTab === "records" && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <MultiFilter columns={recordColumns} value={filters} onChange={setFilters} />
          </div>

          {!loading && filteredRecords.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200">
              <EmptyState
                icon={Wallet}
                title={payouts.length === 0 ? "No payout records yet" : "No matching records"}
                message={payouts.length === 0
                  ? "Use Auto-Generate or create manual payouts from the Vendor Summary tab."
                  : "Try a different filter."}
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wide font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3 text-left">Vendor</th>
                      <th className="px-5 py-3 text-left">Period</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-center">Created</th>
                      <th className="px-5 py-3 text-center">Paid On</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading && <TableSkeleton rows={6} cols={7} />}
                    {!loading && filteredRecords.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                              {vendorName(p.vendor_id).split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-900">{vendorName(p.vendor_id)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{p.period || "—"}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-900">{formatINR(p.amount)}</td>
                        <td className="px-5 py-3.5 text-center">
                          {p.status === "paid"
                            ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Paid</span>
                            : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pending</span>
                          }
                        </td>
                        <td className="px-5 py-3.5 text-center text-[11px] text-slate-400">{fmtDate(p.created_at)}</td>
                        <td className="px-5 py-3.5 text-center text-[11px] text-slate-400">{fmtDate(p.paid_at)}</td>
                        <td className="px-5 py-3.5 text-right">
                          {p.status === "pending" && (
                            <button onClick={() => markPaid(p)} disabled={acting === p.id}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-60 ml-auto">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {acting === p.id ? "Saving…" : "Mark Paid"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Create payout modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">New Payout</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Vendor</label>
                <select value={form.vendor_id} onChange={(e) => setForm((f) => ({ ...f, vendor_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="">Select vendor…</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}{v.area ? ` (${v.area})` : ""}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Amount (₹)</label>
                <input type="number" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="e.g. 2500"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Period</label>
                <input type="text" value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                  placeholder="e.g. May 2026"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={createPayout}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
