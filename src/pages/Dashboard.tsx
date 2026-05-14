import {
  ShoppingBag, Users, Wallet, Truck, TrendingUp,
  TrendingDown, Clock, CheckCircle2, AlertCircle, Package,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ORDERS, REVENUE_DATA, CATEGORY_DATA, DRIVERS } from "@/lib/data";

const PIE_COLORS = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6"];

function StatCard({
  title, value, sub, icon: Icon, trend, color,
}: {
  title: string; value: string; sub: string;
  icon: React.ElementType; trend?: number; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{title}</p>
        <p className="text-2xl font-extrabold text-slate-900 leading-none mb-1">{value}</p>
        <p className="text-xs text-slate-400">{sub}</p>
        {trend !== undefined && (
          <div className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}% vs yesterday
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  );
}

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

export function Dashboard() {
  const pendingCount    = ORDERS.filter((o) => o.status === "pending").length;
  const inTransitCount  = ORDERS.filter((o) => o.status === "in_transit").length;
  const deliveredCount  = ORDERS.filter((o) => o.status === "delivered").length;
  const revenueToday    = ORDERS.filter((o) => o.placedAt.startsWith("Today"))
    .reduce((s, o) => s + o.total, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Orders Today"         value="47"       sub="12 pending right now"  icon={ShoppingBag}  trend={12}  color="bg-blue-500"    />
        <StatCard title="Revenue Today"        value="₹24,800"  sub="Avg ₹528/order"        icon={Wallet}       trend={8}   color="bg-emerald-500" />
        <StatCard title="Active Subscriptions" value="128"      sub="6 paused this week"    icon={Package}      trend={3}   color="bg-purple-500"  />
        <StatCard title="Active Drivers"       value="4 / 5"    sub="1 off duty today"      icon={Truck}        trend={0}   color="bg-amber-500"   />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Revenue (Last 7 Days)</h2>
              <p className="text-xs text-slate-400">₹1,70,800 total this week</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">+18% vs last week</span>
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

        {/* Category Pie */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Sales by Category</h2>
          <p className="text-xs text-slate-400 mb-4">Today's breakdown</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {CATEGORY_DATA.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, ""]} contentStyle={{ borderRadius: 10, border: "none" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {CATEGORY_DATA.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-slate-600 font-medium">{c.name}</span>
                </div>
                <span className="font-bold text-slate-900">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders + Drivers row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Recent Orders</h2>
            <a href="/orders" className="text-xs font-bold text-blue-600 hover:text-blue-700">View all →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Order</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ORDERS.slice(0, 6).map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900 text-xs">{o.id}</td>
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
        </div>

        {/* Drivers */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Drivers</h2>
            <a href="/drivers" className="text-xs font-bold text-blue-600 hover:text-blue-700">Manage →</a>
          </div>
          <div className="divide-y divide-slate-50">
            {DRIVERS.map((d) => (
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
        </div>

      </div>

      {/* Orders bar chart */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">Orders Per Day</h2>
        </div>
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
