import { useState } from "react";
import { Search, Crown, Phone, Mail, ShoppingBag, Droplets, Wallet } from "lucide-react";
import { CUSTOMERS, type Customer } from "@/lib/data";

export function Customers() {
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [tierFilter, setTierFilter] = useState<"all" | "prime" | "standard">("all");

  const filtered = CUSTOMERS.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q);
    const matchTier   = tierFilter === "all" || c.tier === tierFilter;
    return matchSearch && matchTier;
  });

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <h2 className="text-lg font-extrabold text-slate-900">Customers</h2>
        <div className="flex gap-2">
          {(["all", "prime", "standard"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all capitalize ${
                tierFilter === t
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              {t === "prime" ? "👑 Prime" : t === "standard" ? "Standard" : "All"}
              {" "}({t === "all" ? CUSTOMERS.length : CUSTOMERS.filter(c => c.tier === t).length})
            </button>
          ))}
        </div>
        <div className="flex-1 relative sm:max-w-xs sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, phone, email…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Contact</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Orders</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Litres</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Wallet</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${selected?.id === c.id ? "bg-blue-50/60" : ""}`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-extrabold text-white">
                            {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{c.name}</p>
                          <p className="text-[10px] text-slate-400">Since {c.joinedAt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <p className="text-xs text-slate-700">{c.phone}</p>
                      <p className="text-[10px] text-slate-400">{c.email}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-bold text-slate-900">{c.orders}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-700 hidden md:table-cell">{c.litres}L</td>
                    <td className="px-4 py-3.5 text-xs font-bold text-emerald-600">₹{c.wallet}</td>
                    <td className="px-4 py-3.5">
                      {c.tier === "prime" ? (
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

        {/* Detail Panel */}
        {selected && (
          <div className="hidden lg:block w-72 shrink-0 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 self-start sticky top-20 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-900">Customer Detail</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                <span className="text-lg font-extrabold text-white">
                  {selected.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">{selected.name}</p>
                {selected.tier === "prime" && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                    <Crown className="h-2.5 w-2.5" /> Aqua Prime
                  </span>
                )}
                <p className="text-[10px] text-slate-400 mt-0.5">Member since {selected.joinedAt}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { icon: ShoppingBag, value: selected.orders, label: "Orders",  color: "text-blue-600 bg-blue-50" },
                { icon: Droplets,    value: `${selected.litres}L`, label: "Delivered", color: "text-cyan-600 bg-cyan-50" },
                { icon: Wallet,      value: `₹${selected.wallet}`, label: "Wallet",  color: "text-emerald-600 bg-emerald-50" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl p-2 text-center ${s.color}`}>
                  <s.icon className="h-4 w-4 mx-auto mb-1" />
                  <p className="text-xs font-extrabold">{s.value}</p>
                  <p className="text-[9px] font-medium opacity-70">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-xs">
              {[
                { icon: Phone, label: selected.phone  },
                { icon: Mail,  label: selected.email  },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-600">
                  <row.icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {row.label}
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100 flex justify-between">
                <span className="text-slate-400">Last order</span>
                <span className="font-semibold text-slate-800">{selected.lastOrder}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button className="w-full py-2 bg-blue-600 text-white text-xs font-extrabold rounded-xl hover:bg-blue-700 transition-colors">
                View Orders
              </button>
              <button className="w-full py-2 bg-amber-50 text-amber-700 text-xs font-extrabold rounded-xl hover:bg-amber-100 transition-colors">
                Upgrade to Prime
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
