import {
  ShoppingBag, Truck, Package,
  TrendingUp, AlertTriangle, CheckCircle2, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useCollection, db_update } from "@/lib/hooks";
import { type Order, type Driver, type Subscription, type Product, REVENUE_DATA } from "@/lib/data";

const statusColor: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-700",
  confirmed:  "bg-blue-100 text-blue-700",
  in_transit: "bg-purple-100 text-purple-700",
  delivered:  "bg-emerald-100 text-emerald-700",
  cancelled:  "bg-red-100 text-red-500",
};

const driverStatusColor: Record<string, string> = {
  available: "bg-emerald-500",
  on_route:  "bg-blue-500",
  off_duty:  "bg-slate-400",
};

const nextStatus: Record<string, { label: string; value: string; color: string }> = {
  pending:    { label: "Accept",      value: "confirmed",  color: "bg-blue-600 hover:bg-blue-700" },
  confirmed:  { label: "Dispatch",    value: "in_transit", color: "bg-purple-600 hover:bg-purple-700" },
  in_transit: { label: "Mark Delivered", value: "delivered", color: "bg-emerald-600 hover:bg-emerald-700" },
};

function StatCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string | number; sub: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{title}</p>
        <p className="text-2xl font-extrabold text-slate-900 leading-none mb-1">{value}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data: orders }    = useCollection<Order>("orders", { orderBy: "placed_at", ascending: false });
  const { data: drivers }   = useCollection<Driver>("drivers");
  const { data: schedules } = useCollection<Subscription>("schedules");
  const { data: products }  = useCollection<Product>("products");

  const pendingCount    = orders.filter((o) => o.status === "pending").length;
  const deliveredCount  = orders.filter((o) => o.status === "delivered").length;
  const totalRevenue    = orders.reduce((s, o) => s + Number(o.total), 0);
  const activeSchedules = schedules.filter((s) => s.status === "active").length;
  const activeDrivers   = drivers.filter((d) => d.status !== "off_duty").length;
  const lowStockCount   = products.filter((p) => p.stock <= 10).length;

  const actionableOrders = orders.filter((o) => ["pending", "confirmed", "in_transit"].includes(o.status));
  const recentOrders     = orders.slice(0, 6);

  const advanceOrder = async (order: Order) => {
    const next = nextStatus[order.status];
    if (!next) return;
    const patch: Record<string, unknown> = { status: next.value };
    if (next.value === "delivered") patch.delivered_at = new Date().toISOString();
    await db_update("orders", order.id, patch);
    toast.success(`${order.customer}'s order → ${next.value.replace("_", " ")}`);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders"     value={orders.length}       sub={`${pendingCount} pending`}          icon={ShoppingBag}   color="bg-blue-500"    />
        <StatCard title="Total Revenue"    value={`₹${totalRevenue.toLocaleString()}`} sub={`${deliveredCount} delivered`} icon={TrendingUp} color="bg-emerald-500" />
        <StatCard title="Active Schedules" value={activeSchedules}     sub={`${schedules.length} total`}        icon={Package}       color="bg-purple-500"  />
        <StatCard title="Active Drivers"   value={`${activeDrivers}/${drivers.length}`} sub="on route / available" icon={Truck}     color="bg-amber-500"   />
      </div>

      {/* Low stock alert + quick order actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Low stock alert */}
        {lowStockCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-red-700 mb-0.5">Low Stock Alert</p>
              <p className="text-xs text-red-600">
                {lowStockCount} product{lowStockCount > 1 ? "s" : ""} {lowStockCount > 1 ? "are" : "is"} running low (≤10 units).
              </p>
              <a href="/products" className="inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:underline mt-1.5">
                View Products <ChevronRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
        {lowStockCount === 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-emerald-700 mb-0.5">Stock OK</p>
              <p className="text-xs text-emerald-600">All products have sufficient stock (&gt;10 units).</p>
            </div>
          </div>
        )}

        {/* Quick order actions */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Active Orders
              {actionableOrders.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-extrabold">
                  {actionableOrders.length}
                </span>
              )}
            </h2>
            <a href="/orders" className="text-xs font-bold text-blue-600 hover:text-blue-700">View all →</a>
          </div>
          {actionableOrders.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No active orders right now.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {actionableOrders.slice(0, 5).map((o) => {
                const action = nextStatus[o.status];
                return (
                  <div key={o.id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-bold text-slate-900 truncate">{o.customer}</p>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full capitalize shrink-0 ${statusColor[o.status]}`}>
                          {o.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{o.items} · ₹{o.total}</p>
                    </div>
                    {action && (
                      <button
                        onClick={() => advanceOrder(o)}
                        className={`shrink-0 text-[10px] font-extrabold text-white px-3 py-1.5 rounded-xl transition-colors ${action.color}`}
                      >
                        {action.label}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Revenue Trend</h2>
              <p className="text-xs text-slate-400">Sample weekly data</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order status breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Order Status</h2>
          {[
            { label: "Pending",    count: orders.filter(o => o.status === "pending").length,    color: "bg-amber-400" },
            { label: "Confirmed",  count: orders.filter(o => o.status === "confirmed").length,  color: "bg-blue-400" },
            { label: "In Transit", count: orders.filter(o => o.status === "in_transit").length, color: "bg-purple-400" },
            { label: "Delivered",  count: orders.filter(o => o.status === "delivered").length,  color: "bg-emerald-400" },
            { label: "Cancelled",  count: orders.filter(o => o.status === "cancelled").length,  color: "bg-red-400" },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                <span className="text-xs text-slate-600 font-medium">{s.label}</span>
              </div>
              <span className="text-xs font-extrabold text-slate-900">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders + Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Recent Orders</h2>
            <a href="/orders" className="text-xs font-bold text-blue-600 hover:text-blue-700">View all →</a>
          </div>
          {recentOrders.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 text-xs truncate max-w-[80px]">{o.id.slice(0, 8)}…</td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-800 text-xs">{o.customer}</p>
                        <p className="text-[10px] text-slate-400">{o.items}</p>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 text-xs">₹{o.total}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full capitalize ${statusColor[o.status]}`}>
                          {o.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Drivers</h2>
            <a href="/drivers" className="text-xs font-bold text-blue-600 hover:text-blue-700">Manage →</a>
          </div>
          {drivers.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No drivers added.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {drivers.map((d) => (
                <div key={d.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                      <span className="text-[10px] font-extrabold text-white">{d.name.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${driverStatusColor[d.status]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{d.name.split(" ")[0]}</p>
                    <p className="text-[10px] text-slate-400 truncate">{d.zone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-extrabold text-slate-900">{d.deliveriesToday}</p>
                    <p className="text-[10px] text-slate-400">today</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Orders bar chart */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Weekly Orders (Sample)</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={REVENUE_DATA} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }} />
            <Bar dataKey="orders" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
