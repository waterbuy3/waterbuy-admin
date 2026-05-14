import { useState, useEffect } from "react";
import {
  Search, Crown, Phone, Mail, ShoppingBag, Droplets,
  Store, MapPin, Percent, Check, X, Link, Plus, ToggleLeft, ToggleRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { type Customer } from "@/lib/data";

/* ─── Vendor type ─── */
interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  area: string;
  commission_pct: number;
  is_open: boolean;
  active: boolean;
  created_at: string;
}

/* ─── Customers tab ─── */
function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState<Customer | null>(null);
  const [tierFilter, setTierFilter] = useState<"all" | "prime" | "standard">("all");

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase!
        .from("profiles")
        .select("uid, name, phone, email, membership_tier, orders_count, litres_delivered, created_at")
        .order("created_at", { ascending: false });
      setCustomers((data ?? []) as Customer[]);
      setLoading(false);
    };
    fetch();
    const channel = supabase
      .channel("profiles-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, fetch)
      .subscribe();
    return () => { supabase?.removeChannel(channel); };
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (c.name ?? "").toLowerCase().includes(q) || (c.phone ?? "").includes(q) || (c.email ?? "").toLowerCase().includes(q);
    const tier = c.membership_tier ?? "standard";
    const matchTier = tierFilter === "all" || tier === tierFilter;
    return matchSearch && matchTier;
  });

  const primeCount    = customers.filter(c => c.membership_tier === "prime").length;
  const standardCount = customers.filter(c => c.membership_tier !== "prime").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-2">
          {([
            { key: "all",      label: "All",      count: customers.length },
            { key: "prime",    label: "👑 Prime",  count: primeCount       },
            { key: "standard", label: "Standard",  count: standardCount    },
          ] as const).map(({ key, label, count }) => (
            <button key={key} onClick={() => setTierFilter(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                tierFilter === key
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}>
              {label} ({count})
            </button>
          ))}
        </div>
        <div className="flex-1 relative sm:max-w-xs sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, phone, email…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em]">Customer</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em] hidden sm:table-cell">Contact</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em]">Orders</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em] hidden md:table-cell">Litres</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em]">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">
                    {customers.length === 0 ? "No customers yet — they'll appear when users sign up." : "No customers match your search."}
                  </td></tr>
                ) : filtered.map((c) => (
                  <tr key={c.uid} onClick={() => setSelected(c)}
                    className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${selected?.uid === c.uid ? "bg-blue-50/60" : ""}`}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-extrabold text-white">
                            {(c.name ?? "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{c.name || "—"}</p>
                          <p className="text-[10px] text-slate-400">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <p className="text-xs text-slate-700">{c.phone || "—"}</p>
                      <p className="text-[10px] text-slate-400">{c.email || "—"}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-bold text-slate-900">{c.orders_count ?? 0}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-700 hidden md:table-cell">{c.litres_delivered ?? 0}L</td>
                    <td className="px-4 py-3.5">
                      {c.membership_tier === "prime" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Crown className="h-2.5 w-2.5" /> Prime
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Standard</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="hidden lg:block w-72 shrink-0 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 self-start sticky top-20 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-900">Customer Detail</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            </div>
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                <span className="text-lg font-extrabold text-white">
                  {(selected.name ?? "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">{selected.name || "—"}</p>
                {selected.membership_tier === "prime" && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                    <Crown className="h-2.5 w-2.5" /> Aqua Prime
                  </span>
                )}
                <p className="text-[10px] text-slate-400 mt-0.5">Joined {selected.created_at ? new Date(selected.created_at).toLocaleDateString() : "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {[
                { icon: ShoppingBag, value: selected.orders_count ?? 0,   label: "Orders",   color: "text-blue-600 bg-blue-50" },
                { icon: Droplets,    value: `${selected.litres_delivered ?? 0}L`, label: "Delivered", color: "text-cyan-600 bg-cyan-50" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                  <s.icon className="h-4 w-4 mx-auto mb-1" />
                  <p className="text-sm font-extrabold">{s.value}</p>
                  <p className="text-[9px] font-medium opacity-70">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3 text-xs">
              {[
                { icon: Phone, label: selected.phone || "—" },
                { icon: Mail,  label: selected.email || "—" },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-600">
                  <row.icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {row.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Vendors tab ─── */
function VendorsTab() {
  const [vendors, setVendors]     = useState<Vendor[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState<Vendor | null>(null);
  const [editComm, setEditComm]   = useState<number | null>(null);
  const [savingComm, setSavingComm] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const vendorAppUrl = typeof window !== "undefined"
    ? window.location.origin.replace("-admin", "-vendor") + "/register"
    : "https://your-vendor-app.vercel.app/register";

  const fetchVendors = async () => {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from("vendors")
      .select("*")
      .order("created_at", { ascending: false });
    setVendors((data ?? []) as Vendor[]);
    setLoading(false);
    if (selected) {
      const updated = (data ?? []).find((v: Vendor) => v.id === selected.id);
      if (updated) setSelected(updated as Vendor);
    }
  };

  useEffect(() => {
    fetchVendors();
    const channel = supabase
      ?.channel("vendors-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "vendors" }, fetchVendors)
      .subscribe();
    return () => { supabase?.removeChannel(channel!); };
  }, []);

  const filtered = vendors.filter((v) => {
    const q = search.toLowerCase();
    return !q || v.name.toLowerCase().includes(q) || v.area.toLowerCase().includes(q) || v.email.toLowerCase().includes(q);
  });

  const toggleActive = async (v: Vendor) => {
    if (!supabase) return;
    setTogglingId(v.id);
    await supabase.from("vendors").update({ active: !v.active }).eq("id", v.id);
    setTogglingId(null);
  };

  const saveCommission = async () => {
    if (!supabase || !selected || editComm === null) return;
    setSavingComm(true);
    await supabase.from("vendors").update({ commission_pct: editComm }).eq("id", selected.id);
    setSavingComm(false);
    setEditComm(null);
    fetchVendors();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(vendorAppUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeCount   = vendors.filter(v => v.active).length;
  const inactiveCount = vendors.filter(v => !v.active).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-2 text-xs font-bold">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
            {activeCount} Active
          </span>
          <span className="px-3 py-1.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl">
            {inactiveCount} Inactive
          </span>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, area, email…"
              className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-52" />
          </div>
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors">
            <Plus className="h-3.5 w-3.5" /> Invite Vendor
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em]">Vendor</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em] hidden sm:table-cell">Area</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em]">Commission</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em]">Shop</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em]">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">
                    {vendors.length === 0
                      ? "No vendors yet — share the registration link to onboard your first distributor."
                      : "No vendors match your search."}
                  </td></tr>
                ) : filtered.map((v) => (
                  <tr key={v.id} onClick={() => { setSelected(v); setEditComm(null); }}
                    className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${selected?.id === v.id ? "bg-blue-50/60" : ""}`}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-extrabold text-white">
                            {v.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{v.name}</p>
                          <p className="text-[10px] text-slate-400">{v.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="text-xs text-slate-600">{v.area || "—"}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-bold text-slate-900">{v.commission_pct ?? 10}%</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        v.is_open
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {v.is_open ? "Open" : "Closed"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleActive(v)}
                        disabled={togglingId === v.id}
                        className="transition-colors disabled:opacity-50"
                      >
                        {v.active
                          ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                          : <ToggleLeft className="h-5 w-5 text-slate-300" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="hidden lg:block w-72 shrink-0 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 self-start sticky top-20 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-900">Vendor Detail</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            </div>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
                <span className="text-lg font-extrabold text-white">
                  {selected.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">{selected.name}</p>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                  selected.active
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {selected.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs mb-4">
              {[
                { icon: Mail,    label: selected.email || "—" },
                { icon: Phone,   label: selected.phone || "—" },
                { icon: MapPin,  label: selected.area  || "—" },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-600">
                  <row.icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {row.label}
                </div>
              ))}
            </div>

            {/* Commission editor */}
            <div className="bg-slate-50 rounded-xl p-3 mb-4">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Commission Rate</p>
              {editComm === null ? (
                <div className="flex items-center justify-between">
                  <span className="text-lg font-extrabold text-slate-900">{selected.commission_pct ?? 10}%</span>
                  <button onClick={() => setEditComm(selected.commission_pct ?? 10)}
                    className="text-xs font-bold text-blue-600 hover:underline">Edit</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number" min={0} max={100} value={editComm}
                      onChange={(e) => setEditComm(Number(e.target.value))}
                      className="w-full px-3 py-1.5 pr-7 text-sm font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <button onClick={saveCommission} disabled={savingComm}
                    className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:opacity-50 transition-colors">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setEditComm(null)}
                    className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Toggle active */}
            <button
              onClick={() => toggleActive(selected)}
              disabled={togglingId === selected.id}
              className={`w-full py-2 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 ${
                selected.active
                  ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              }`}
            >
              {selected.active ? "Deactivate Vendor" : "Activate Vendor"}
            </button>
          </div>
        )}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-900">Invite a Vendor</h3>
              <button onClick={() => setShowInvite(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <Store className="h-8 w-8 text-blue-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-800">Share the vendor registration link</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Vendors self-register and you activate them from this page.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4">
              <code className="flex-1 text-[11px] text-slate-700 truncate">{vendorAppUrl}</code>
              <button onClick={copyLink}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
                  copied
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}>
                {copied ? <><Check className="h-3 w-3" /> Copied!</> : <><Link className="h-3 w-3" /> Copy</>}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              After the vendor registers, toggle their <strong>Active</strong> status here to grant access.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main page with tabs ─── */
export function Customers() {
  const [tab, setTab] = useState<"customers" | "vendors">("customers");

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <h2 className="text-lg font-extrabold text-slate-900">
          {tab === "customers" ? "Customers" : "Vendors"}
        </h2>
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          <button onClick={() => setTab("customers")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === "customers"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}>
            Customers
          </button>
          <button onClick={() => setTab("vendors")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === "vendors"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}>
            Vendors
          </button>
        </div>
      </div>

      {tab === "customers" ? <CustomersTab /> : <VendorsTab />}
    </div>
  );
}
