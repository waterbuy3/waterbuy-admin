import { useEffect, useState, useMemo } from "react";
import {
  Store, Phone, MapPin, Wallet, Percent, ToggleLeft, ToggleRight,
  Search, ChevronRight, X, Save, Loader2, Copy, Check,
  Landmark, TrendingUp, ShoppingBag, Pencil,
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

type EditMode = "profile" | "bank" | "commission" | null;

const inp = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 focus:bg-white transition-all";

export function Vendors() {
  const [vendors,  setVendors]  = useState<Vendor[]>([]);
  const [orders,   setOrders]   = useState<OrderRow[]>([]);
  const [payouts,  setPayouts]  = useState<PayoutRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState("");
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [newPayout, setNewPayout] = useState("");
  const [editMode, setEditMode] = useState<EditMode>(null);

  // Edit form state
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", area: "" });
  const [bankForm, setBankForm] = useState({ bank_name: "", bank_account: "", bank_ifsc: "" });
  const [commForm, setCommForm] = useState(10);

  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    const [v, o, p] = await Promise.all([
      supabase.from("vendors").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("vendor_id,total,status"),
      supabase.from("payouts").select("vendor_id,amount,status"),
    ]);
    const vList = (v.data ?? []) as Vendor[];
    setVendors(vList);
    setOrders((o.data ?? []) as OrderRow[]);
    setPayouts((p.data ?? []) as PayoutRow[]);
    // keep selected in sync
    if (selected) {
      const fresh = vList.find((x) => x.id === selected.id);
      if (fresh) setSelected(fresh);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (mode: EditMode, v: Vendor) => {
    setEditMode(mode);
    if (mode === "profile") setProfileForm({ name: v.name, phone: v.phone, area: v.area });
    if (mode === "bank") setBankForm({ bank_name: v.bank_name, bank_account: v.bank_account, bank_ifsc: v.bank_ifsc });
    if (mode === "commission") setCommForm(v.commission_pct);
  };

  const saveProfile = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await db_update("vendors", selected.id, profileForm);
      toast.success("Profile updated");
      setEditMode(null);
      load();
    } catch { toast.error("Failed to update"); }
    finally { setSaving(false); }
  };

  const saveBank = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await db_update("vendors", selected.id, bankForm);
      toast.success("Bank details updated");
      setEditMode(null);
      load();
    } catch { toast.error("Failed to update"); }
    finally { setSaving(false); }
  };

  const saveCommission = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await db_update("vendors", selected.id, { commission_pct: commForm });
      toast.success("Commission updated");
      setEditMode(null);
      load();
    } catch { toast.error("Failed to update commission"); }
    finally { setSaving(false); }
  };

  const toggleActive = async (v: Vendor) => {
    await db_update("vendors", v.id, { active: !v.active });
    toast.success(v.active ? "Vendor deactivated" : "Vendor activated");
    load();
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

  const vendorStats = (v: Vendor) => {
    const delivered = orders.filter((o) => o.vendor_id === v.id && o.status === "delivered");
    const revenue   = delivered.reduce((s, o) => s + o.total, 0);
    const paid      = payouts.filter((p) => p.vendor_id === v.id && p.status === "paid").reduce((s, p) => s + p.amount, 0);
    const pending   = Math.max(0, revenue - paid);
    return { ordersCount: delivered.length, revenue, pending };
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return vendors;
    const q = query.toLowerCase();
    return vendors.filter((v) =>
      v.name.toLowerCase().includes(q) ||
      v.area?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q)
    );
  }, [vendors, query]);

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
        <div className="px-6 pt-6 pb-4 border-b border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Vendors</h1>
              <p className="text-xs text-slate-400 mt-0.5">{activeCount} active · {openCount} open now</p>
            </div>
            <button onClick={copyInviteLink}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Invite Link"}
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, area, email…"
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 px-6 py-4">
          {[
            { label: "Total",    value: vendors.length, color: "text-slate-900" },
            { label: "Active",   value: activeCount,    color: "text-emerald-600" },
            { label: "Open Now", value: openCount,      color: "text-blue-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-slate-200 p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-slate-400 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

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
                    {filtered.map((v) => (
                      <tr key={v.id}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${selected?.id === v.id ? "bg-indigo-50/50" : ""}`}
                        onClick={() => { setSelected(v); setEditMode(null); }}
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
                          <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.area || "—"}</div>
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
                          <button onClick={(e) => { e.stopPropagation(); toggleActive(v); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                            {v.active ? <ToggleRight className="h-6 w-6 text-emerald-500" /> : <ToggleLeft className="h-6 w-6 text-slate-400" />}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right"><ChevronRight className="h-4 w-4 text-slate-300 ml-auto" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail / Settings panel */}
      {selected && (() => {
        const stats = vendorStats(selected);
        return (
          <div className="w-full lg:w-[380px] border-l border-slate-200 bg-white flex flex-col overflow-hidden shrink-0">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 truncate max-w-[260px]">{selected.name}</h2>
              <button onClick={() => { setSelected(null); setEditMode(null); }} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Orders",  value: String(stats.ordersCount),              icon: ShoppingBag, bg: "bg-blue-50",   ic: "text-blue-600"   },
                  { label: "Revenue", value: `₹${stats.revenue.toLocaleString()}`,   icon: TrendingUp,  bg: "bg-emerald-50",ic: "text-emerald-600"},
                  { label: "Pending", value: `₹${stats.pending.toLocaleString()}`,   icon: Wallet,      bg: "bg-amber-50",  ic: "text-amber-600"  },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-3">
                    <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                      <s.icon className={`h-3.5 w-3.5 ${s.ic}`} strokeWidth={1.8} />
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                    <p className="text-sm font-bold text-slate-900">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* ── Business Profile ── */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Business Profile</p>
                  {editMode !== "profile" && (
                    <button onClick={() => openEdit("profile", selected)}
                      className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline">
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  )}
                </div>
                {editMode === "profile" ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Name</label>
                      <input value={profileForm.name} onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} className={inp} placeholder="Business name" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Phone</label>
                      <input value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} className={inp} placeholder="+91 98765 43210" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Service Area</label>
                      <input value={profileForm.area} onChange={(e) => setProfileForm((f) => ({ ...f, area: e.target.value }))} className={inp} placeholder="e.g. Koramangala, Bangalore" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setEditMode(null)} className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg">Cancel</button>
                      <button onClick={saveProfile} disabled={saving} className="flex-1 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg disabled:opacity-60 flex items-center justify-center gap-1">
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-sm text-slate-700">
                    <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />{selected.phone || <span className="text-slate-400 text-xs">Not set</span>}</div>
                    <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />{selected.area || <span className="text-slate-400 text-xs">Not set</span>}</div>
                  </div>
                )}
              </div>

              {/* ── Bank Details ── */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bank Details</p>
                  {editMode !== "bank" && (
                    <button onClick={() => openEdit("bank", selected)}
                      className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline">
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  )}
                </div>
                {editMode === "bank" ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Bank Name</label>
                      <input value={bankForm.bank_name} onChange={(e) => setBankForm((f) => ({ ...f, bank_name: e.target.value }))} className={inp} placeholder="e.g. State Bank of India" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Account Number</label>
                      <input value={bankForm.bank_account} onChange={(e) => setBankForm((f) => ({ ...f, bank_account: e.target.value }))} className={inp} placeholder="Account number" inputMode="numeric" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 mb-1 block">IFSC Code</label>
                      <input value={bankForm.bank_ifsc} onChange={(e) => setBankForm((f) => ({ ...f, bank_ifsc: e.target.value.toUpperCase() }))} className={inp} placeholder="e.g. SBIN0001234" style={{ textTransform: "uppercase" }} />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setEditMode(null)} className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg">Cancel</button>
                      <button onClick={saveBank} disabled={saving} className="flex-1 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg disabled:opacity-60 flex items-center justify-center gap-1">
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-sm text-slate-700">
                    {selected.bank_name ? (
                      <>
                        <div className="flex items-center gap-2"><Landmark className="h-3.5 w-3.5 text-slate-400 shrink-0" />{selected.bank_name}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>Acct: ****{selected.bank_account?.slice(-4) || "—"}</span>
                          <span>·</span>
                          <span>IFSC: {selected.bank_ifsc || "—"}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400">No bank details set</p>
                    )}
                  </div>
                )}
              </div>

              {/* ── Commission ── */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Commission Rate</p>
                  {editMode !== "commission" && (
                    <button onClick={() => openEdit("commission", selected)}
                      className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline">
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  )}
                </div>
                {editMode === "commission" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input type="number" min={0} max={100} step={0.5} value={commForm}
                          onChange={(e) => setCommForm(+e.target.value)}
                          className={`${inp} pl-8`} />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400">Platform keeps this % of each delivered order</p>
                    <div className="flex gap-2">
                      <button onClick={() => setEditMode(null)} className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg">Cancel</button>
                      <button onClick={saveCommission} disabled={saving} className="flex-1 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg disabled:opacity-60 flex items-center justify-center gap-1">
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-slate-900">{selected.commission_pct}%</span>
                    <span className="text-xs text-slate-400">per delivered order</span>
                  </div>
                )}
              </div>

              {/* ── Vendor Access ── */}
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

              {/* ── Create Payout ── */}
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Create Payout</p>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                    <input type="number" min={1} value={newPayout} onChange={(e) => setNewPayout(e.target.value)}
                      placeholder="Amount" className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-slate-50" />
                  </div>
                  <button onClick={createPayout} disabled={saving || !newPayout}
                    className="px-3 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg disabled:opacity-60 hover:bg-violet-700 transition-colors">
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
