import { useState, useEffect } from "react";
import { Search, Crown, Phone, Mail, ShoppingBag, Droplets } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { type Customer } from "@/lib/data";

export function Customers() {
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
    <div className="p-4 lg:p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <h2 className="text-lg font-extrabold text-slate-900">Customers</h2>
        <div className="flex gap-2">
          {([
            { key: "all",      label: "All",           count: customers.length },
            { key: "prime",    label: "ðŸ‘‘ Prime",      count: primeCount       },
            { key: "standard", label: "Standard",      count: standardCount    },
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
            placeholder="Name, phone, emailâ€¦"
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
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">Loadingâ€¦</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">
                    {customers.length === 0 ? "No customers yet â€” they'll appear when users sign up." : "No customers match your search."}
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
                          <p className="text-xs font-bold text-slate-900">{c.name || "â€”"}</p>
                          <p className="text-[10px] text-slate-400">
                            {c.created_at ? new Date(c.created_at).toLocaleDateString() : "â€”"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <p className="text-xs text-slate-700">{c.phone || "â€”"}</p>
                      <p className="text-[10px] text-slate-400">{c.email || "â€”"}</p>
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
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">Ã—</button>
            </div>
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                <span className="text-lg font-extrabold text-white">
                  {(selected.name ?? "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">{selected.name || "â€”"}</p>
                {selected.membership_tier === "prime" && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                    <Crown className="h-2.5 w-2.5" /> Aqua Prime
                  </span>
                )}
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Joined {selected.created_at ? new Date(selected.created_at).toLocaleDateString() : "â€”"}
                </p>
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
                { icon: Phone, label: selected.phone || "â€”" },
                { icon: Mail,  label: selected.email || "â€”" },
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
