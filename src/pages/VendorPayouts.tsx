import { useEffect, useState, useMemo } from "react";
import { Wallet, Search, CheckCircle2, Clock, Plus, X, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface Payout {
  id: string; vendor_id: string; amount: number; period: string;
  status: string; created_at: string; paid_at?: string;
}
interface Vendor { id: string; name: string; area: string; }

export function VendorPayouts() {
  const [payouts,  setPayouts]  = useState<Payout[]>([]);
  const [vendors,  setVendors]  = useState<Vendor[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [acting,   setActing]   = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ vendor_id: "", amount: "", period: "" });

  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    const [p, v] = await Promise.all([
      supabase.from("payouts").select("*").order("created_at", { ascending: false }),
      supabase.from("vendors").select("id,name,area"),
    ]);
    setPayouts((p.data ?? []) as Payout[]);
    setVendors((v.data ?? []) as Vendor[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = payouts;
    if (vendorFilter !== "all") list = list.filter((p) => p.vendor_id === vendorFilter);
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      const matchVendor = vendors.find((v) => v.name.toLowerCase().includes(q))?.id;
      list = list.filter((p) => p.period?.toLowerCase().includes(q) || p.vendor_id === matchVendor);
    }
    return list;
  }, [payouts, vendorFilter, statusFilter, query, vendors]);

  const totalPaid    = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  const vendorName = (id: string) => vendors.find((v) => v.id === id)?.name ?? "Unknown";

  const markPaid = async (payout: Payout) => {
    if (!supabase) return;
    setActing(payout.id);
    const { error } = await supabase.from("payouts").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", payout.id);
    if (error) { toast.error("Failed to mark as paid"); }
    else { toast.success("Payout marked as paid"); load(); }
    setActing(null);
  };

  const createPayout = async () => {
    if (!supabase || !form.vendor_id || !form.amount || !form.period) {
      toast.error("Fill all fields"); return;
    }
    const { error } = await supabase.from("payouts").insert({
      vendor_id: form.vendor_id,
      amount: parseFloat(form.amount),
      period: form.period,
      status: "pending",
    });
    if (error) { toast.error("Failed to create payout"); }
    else {
      toast.success("Payout created");
      setShowCreate(false);
      setForm({ vendor_id: "", amount: "", period: "" });
      load();
    }
  };

  const fmtDate = (s?: string) => {
    if (!s) return "—";
    try { return format(parseISO(s), "d MMM yyyy"); } catch { return "—"; }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Vendor Payouts</h1>
          <p className="text-xs text-slate-400 mt-0.5">{payouts.length} payouts · {payouts.filter((p) => p.status === "pending").length} pending</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus className="h-4 w-4" /> New Payout
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Total Paid Out",    value: `₹${totalPaid.toLocaleString()}`,    bg: "bg-emerald-50", ic: "text-emerald-600", icon: CheckCircle2 },
          { label: "Pending Payouts",   value: `₹${totalPending.toLocaleString()}`, bg: "bg-amber-50",   ic: "text-amber-600",   icon: Clock       },
          { label: "Total Payouts",     value: String(payouts.length),              bg: "bg-indigo-50",  ic: "text-indigo-600",  icon: Wallet      },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`h-4.5 w-4.5 ${s.ic}`} strokeWidth={1.8} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by vendor or period…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none bg-slate-50">
          <option value="all">All Vendors</option>
          {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <div className="flex gap-1">
          {(["all", "pending", "paid"] as const).map((f) => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${statusFilter === f ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Wallet className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No payouts found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                {filtered.map((p) => (
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
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900">₹{p.amount.toLocaleString()}</td>
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

      {/* Create payout modal */}
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
