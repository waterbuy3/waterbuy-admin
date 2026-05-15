import { useEffect, useState } from "react";
import { Store, Wallet, Droplets, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { CardSkeleton } from "@/components/Skeleton";
import { formatINR } from "@/lib/ui";

interface VendorRow { id: string; name: string; area: string; is_open: boolean; active: boolean; commission_pct: number; created_at: string; }
interface OrderRow  { id: string; vendor_id: string | null; total: number; litres: number; status: string; placed_at: string; }
interface PayoutRow { id: string; vendor_id: string; amount: number; status: string; }

export function VendorDashboard() {
  const [vendors,  setVendors]  = useState<VendorRow[]>([]);
  const [orders,   setOrders]   = useState<OrderRow[]>([]);
  const [payouts,  setPayouts]  = useState<PayoutRow[]>([]);
  const [loading,  setLoading]  = useState(true);

  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    const [v, o, p] = await Promise.all([
      supabase.from("vendors").select("*"),
      supabase.from("orders").select("id,vendor_id,total,litres,status,placed_at"),
      supabase.from("payouts").select("id,vendor_id,amount,status"),
    ]);
    setVendors((v.data ?? []) as VendorRow[]);
    setOrders((o.data ?? []) as OrderRow[]);
    setPayouts((p.data ?? []) as PayoutRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!supabase) return;
    const ch = supabase
      .channel("vendor-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "vendors" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "payouts" }, () => load())
      .subscribe();
    return () => { supabase?.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeVendors   = vendors.filter((v) => v.active);
  const openVendors     = vendors.filter((v) => v.is_open && v.active);
  const vendorOrders    = orders.filter((o) => o.vendor_id);
  const deliveredOrders = vendorOrders.filter((o) => o.status === "delivered");
  const pendingOrders   = orders.filter((o) => !o.vendor_id && o.status === "pending");
  const totalRevenue    = deliveredOrders.reduce((s, o) => s + o.total, 0);
  const totalLitres     = deliveredOrders.reduce((s, o) => s + o.litres, 0);
  // Per-vendor stats — pending payout = earned revenue minus already-paid payouts
  const vendorStats = vendors.map((v) => {
    const vOrders    = deliveredOrders.filter((o) => o.vendor_id === v.id);
    const vRevenue   = vOrders.reduce((s, o) => s + o.total, 0);
    const commission = vRevenue * (v.commission_pct / 100);
    const alreadyPaid = payouts.filter((p) => p.vendor_id === v.id && p.status === "paid").reduce((s, p) => s + p.amount, 0);
    const vPending   = Math.max(0, vRevenue - alreadyPaid);
    return { ...v, ordersCount: vOrders.length, revenue: vRevenue, pendingPayout: vPending, commission };
  }).sort((a, b) => b.revenue - a.revenue);

  const pendingPayout = vendorStats.reduce((s, v) => s + v.pendingPayout, 0);

  if (loading) return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Vendor Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Platform-wide vendor performance overview</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );

  const navigate = useNavigate();
  const stats = [
    { label: "Total Vendors",     value: String(vendors.length),         sub: `${activeVendors.length} active`,      icon: Store,       bg: "bg-indigo-50",  ic: "text-indigo-600",  to: "/vendors"         },
    { label: "Open Now",          value: String(openVendors.length),     sub: "accepting orders",                    icon: CheckCircle2,bg: "bg-emerald-50", ic: "text-emerald-600", to: "/vendors"         },
    { label: "Unassigned Orders", value: String(pendingOrders.length),   sub: "awaiting vendor",                     icon: AlertCircle, bg: "bg-amber-50",   ic: "text-amber-600",   to: "/vendor-orders"   },
    { label: "Total Revenue",     value: formatINR(totalRevenue), sub: `${deliveredOrders.length} delivered`, icon: TrendingUp,  bg: "bg-blue-50",    ic: "text-blue-600",    to: "/vendor-orders"   },
    { label: "Litres Delivered",  value: `${totalLitres.toFixed(1)}L`,  sub: "via vendors",            icon: Droplets,    bg: "bg-cyan-50",    ic: "text-cyan-600",    to: "/vendor-orders"   },
    { label: "Pending Payouts",   value: formatINR(pendingPayout), sub: "across all vendors",          icon: Wallet,      bg: "bg-violet-50",  ic: "text-violet-600",  to: "/vendor-payouts"  },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Vendor Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Platform-wide vendor performance overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer block">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`h-4 w-4 ${s.ic}`} strokeWidth={1.8} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{s.label}</p>
            <p className="text-[11px] text-slate-500 mt-1">{s.sub}</p>
          </Link>
        ))}
      </div>

      {/* Unassigned orders alert */}
      {pendingOrders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">{pendingOrders.length} order{pendingOrders.length > 1 ? "s" : ""} waiting for a vendor</p>
            <p className="text-xs text-amber-700 mt-0.5">These orders have no vendor assigned. Vendors can claim them from their app, or assign manually from Vendor Orders.</p>
          </div>
        </div>
      )}

      {/* Per-vendor leaderboard */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Vendor Performance</h2>
          <span className="text-xs text-slate-400">{vendors.length} vendors</span>
        </div>
        {vendorStats.length === 0 ? (
          <div className="py-12 text-center">
            <Store className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No vendors registered yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wide font-semibold">
                <tr>
                  <th className="px-5 py-3 text-left">Vendor</th>
                  <th className="px-5 py-3 text-left">Area</th>
                  <th className="px-5 py-3 text-right">Orders</th>
                  <th className="px-5 py-3 text-right">Revenue</th>
                  <th className="px-5 py-3 text-right">Commission</th>
                  <th className="px-5 py-3 text-right">Pending Payout</th>
                  <th className="px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendorStats.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors cursor-pointer" onClick={() => navigate("/vendors")}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                          {v.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{v.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{v.area || "—"}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-700">{v.ordersCount}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900">{formatINR(v.revenue)}</td>
                    <td className="px-5 py-3.5 text-right text-blue-600 font-medium">{formatINR(Math.round(v.commission))}</td>
                    <td className="px-5 py-3.5 text-right text-violet-600 font-medium">{formatINR(Math.round(v.pendingPayout))}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        !v.active ? "bg-slate-100 text-slate-500" :
                        v.is_open ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${!v.active ? "bg-slate-400" : v.is_open ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {!v.active ? "Inactive" : v.is_open ? "Open" : "Closed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vendor order status breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pending",    color: "bg-amber-100 text-amber-700",    count: vendorOrders.filter((o) => o.status === "pending").length    },
          { label: "Confirmed",  color: "bg-blue-100 text-blue-700",      count: vendorOrders.filter((o) => o.status === "confirmed").length  },
          { label: "In Transit", color: "bg-violet-100 text-violet-700",  count: vendorOrders.filter((o) => o.status === "in_transit").length },
          { label: "Delivered",  color: "bg-emerald-100 text-emerald-700",count: deliveredOrders.length                                      },
        ].map((s) => (
          <Link key={s.label} to="/vendor-orders" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center hover:shadow-md transition-shadow block">
            <p className="text-3xl font-bold text-slate-900">{s.count}</p>
            <span className={`inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
