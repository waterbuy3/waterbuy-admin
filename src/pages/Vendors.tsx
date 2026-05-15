import { useEffect, useState, useMemo } from "react";
import {
  Store, Phone, MapPin, Wallet, Percent, ToggleLeft, ToggleRight,
  Search, ChevronRight, X, Save, Loader2, Copy, Check,
  Building2, Landmark, TrendingUp, ShoppingBag,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { db_update } from "@/lib/hooks";
import { toast } from "sonner";

interface Vendor {
  id: string; name: string; email: string; phone: string; area: string;
  commission_pct: number; bank_name: string; bank_account: string; bank_ifsc: string;
  is_open: boolean; active: boolean; created_at: string;
}
interface OrderRow { vendor_id: string | null; total: number; status: string; }
interface PayoutRow { vendor_id: string; amount: number; status: string; }

export function Vendors() {
  const [vendors,  setVendors]  = useState<Vendor[]>([]);
  const [orders,   setOrders]   = useState<OrderRow[]>([]);
  const [payouts,  setPayouts]  = useState<PayoutRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState("");
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [editComm, setEditComm] = useState(10);
  const [saving,   setSaving]   = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [newPayout, setNewPayout] = useState("");

  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    const [v, o, p] = await Promise.all([
      supabase.from("vendors").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("vendor_id,total,status"),
      supabase.from("payouts").select("vendor_id,amount,status"),
    ]);
    setVendors((v.data ?? []) as Vendor[]);
    setOrders((o.data ?? []) as OrderRow[]);
    setPayouts((p.data ?? []) as PayoutRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const vendorStats = (v: Vendor) => {
    const delivered = orders.filter((o) => o.vendor_id === v.id && o.status === "delivered");
    const revenue   = delivered.reduce((s, o) => s + o.total, 0);
    const paid      = payouts.filter((p) => p.vendor_id === v.id && p.status === "paid").reduce((s, p) => s + p.amount, 0);
    const pending   = payouts.filter((p) => p.vendor_id === v.id && p.status === "pending").reduce((s, p) => s + p.amount, 0);
    const vendorShare = revenue * (1 - v.commission_pct / 100);
    return { ordersCount: delivered.length, revenue, vendorShare, paid, pending };
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return vendors;
    const q = query.toLowerCase();
    return vendors.filter((v) =>
      v.name.toLowerCase().includes(q) ||
      v.area.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q)
    );
  }, [vendors, query]);

  const toggleActive = async (v: Vendor) => {
    await db_update("vendors", v.id, { active: !v.active });
    toast.success(v.active ? "Vendor deactivated" : "Vendor activated");
    load();
  };

  const saveCommission = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await db_update("vendors", selected.id, { commission_pct: editComm });
      toast.success("Commission updated");
      load();
      setSelected((prev) => prev ? { ...prev, commission_pct: editComm } : null);
    } catch { toast.error("Failed to update commission"); }
    finally { setSaving(false); }
  };

  const createPayout = async () => {
    if (!selected || !newPayout || isNaN(+newPayout)) return;
    setSaving(true);
    try {
      await supabase!.from("payouts").insert({
        id: crypto.randomUUID(),
        vendor_id: selected.id,
        amount: +newPayout,
        period: new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
        status: "pending",
        created_at: new Date().toISOString(),
      });
      toast.success("Payout created");
      setNewPayout("");
      load();
    } catch { toast.error("Failed to create payout"); }
    finally { setSaving(false); }
  };

  const copyInviteLink = () => {
    const origin = window.location.origin.replace("admin", "vendor");
    navigator.clipboard.writeText(`${origin}/register`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeCount = vendors.filter((v) => v.active).length;
  const openCount   = vendors.filter((v) => v.active && v.is_open).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex h-full gap-0">
      {/* Main list */}
      <div className={`flex flex-col flex-1 min-w-0 ${selected ? "hidden lg:flex" : "flex"}`}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Vendors</h1>
              <p className="text-xs text-slate-400 mt-0.5">{activeCount} active · {openCount} open now</p>
            </div>
            <button
              onClick={copyInviteLink}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Invite Link"}
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, area, email…"
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4">
          {[
            { label: "Total",    value: vendors.length,  color: "text-slate-900" },
            { label: "Active",   value: activeCount,     color: "text-emerald-600" },
            { label: "Open Now", value: openCount,       color: "text-blue-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-slate-200 p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-slate-400 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Store className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">{query ? "No vendors match your search" : "No vendors yet"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wide font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3 text-left">Vendor</th>
                      <th className="px-5 py-3 text-left">Area</th>
                      <th className="px-5 py-3 text-center">Commission</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-center">Active</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((v) => {
                      const stats = vendorStats(v);
                      return (
                        <tr
                          key={v.id}
                          className={`hover:bg-slate-50 cursor-pointer transition-colors ${selected?.id === v.id ? "bg-indigo-50/50" : ""}`}
                          onClick={() => { setSelected(v); setEditComm(v.commission_pct); }}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                                {v.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{v.name}</p>
                                <p className="text-[11px] text-slate-400">{v.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {v.area || "—"}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{v.commission_pct}%</span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${v.is_open ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                              {v.is_open ? "Open" : "Closed"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleActive(v); }}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {v.active
                                ? <ToggleRight className="h-6 w-6 text-emerald-500" />
                                : <ToggleLeft  className="h-6 w-6 text-slate-400" />
                              }
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <ChevronRight className="h-4 w-4 text-slate-300 ml-auto" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (() => {
        const stats = vendorStats(selected);
        return (
          <div className="w-full lg:w-[360px] border-l border-slate-200 bg-white flex flex-col overflow-hidden shrink-0">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 truncate max-w-[220px]">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Orders",    value: String(stats.ordersCount),       icon: ShoppingBag, bg: "bg-blue-50",   ic: "text-blue-600"   },
                  { label: "Revenue",   value: `₹${stats.revenue.toLocaleString()}`, icon: TrendingUp,  bg: "bg-emerald-50",ic: "text-emerald-600"},
                  { label: "Earnings",  value: `₹${stats.vendorShare.toFixed(0)}`,   icon: Wallet,      bg: "bg-violet-50", ic: "text-violet-600" },
                  { label: "Pending",   value: `₹${stats.pending.toFixed(0)}`,  icon: Wallet,      bg: "bg-amber-50",  ic: "text-amber-600"  },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-3">
                    <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                      <s.icon className={`h-3.5 w-3.5 ${s.ic}`} strokeWidth={1.8} />
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                    <p className="text-base font-bold text-slate-900">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Contact info */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contact</p>
                <div className="space-y-1.5 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" />{selected.phone || "—"}</div>
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400" />{selected.area || "—"}</div>
                  {selected.bank_name && (
                    <div className="flex items-center gap-2"><Landmark className="h-3.5 w-3.5 text-slate-400" />{selected.bank_name} · ****{selected.bank_account?.slice(-4)}</div>
                  )}
                </div>
              </div>

              {/* Commission editor */}
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Commission Rate</p>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="number" min={0} max={100} step={0.5}
                      value={editComm}
                      onChange={(e) => setEditComm(+e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <button
                    onClick={saveCommission}
                    disabled={saving}
                    className="px-3 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Platform keeps this % of each delivered order</p>
              </div>

              {/* Toggle active */}
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Vendor Access</p>
                <button
                  onClick={() => toggleActive(selected).then(() => setSelected((s) => s ? { ...s, active: !s.active } : null))}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                    selected.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  <span>{selected.active ? "Active — vendor can log in" : "Inactive — blocked"}</span>
                  {selected.active ? <ToggleRight className="h-5 w-5 text-emerald-500" /> : <ToggleLeft className="h-5 w-5 text-slate-400" />}
                </button>
              </div>

              {/* Create payout */}
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Create Payout</p>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                    <input
                      type="number" min={1}
                      value={newPayout}
                      onChange={(e) => setNewPayout(e.target.value)}
                      placeholder="Amount"
                      className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                  <button
                    onClick={createPayout}
                    disabled={saving || !newPayout}
                    className="px-3 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg disabled:opacity-60"
                  >
                    Create
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Creates a pending payout; mark as paid from Payouts page</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
