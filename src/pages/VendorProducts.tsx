import { useEffect, useState, useMemo } from "react";
import { Package, Search, ToggleLeft, ToggleRight, Droplets, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { db_update } from "@/lib/hooks";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeleton } from "@/components/Skeleton";
import { useDebounce, formatINR } from "@/lib/ui";

interface Product {
  id: string; vendor_id: string | null; name: string; size: string; unit: string;
  price: number; mrp?: number; category: string; description: string; badge?: string;
  active: boolean; stock: number; imageUrl?: string; image_url?: string;
}
interface Vendor { id: string; name: string; }

export function VendorProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors,  setVendors]  = useState<Vendor[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState("");
  const [filter,   setFilter]   = useState<"all" | "active" | "inactive">("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    const [p, v] = await Promise.all([
      supabase.from("products").select("*").not("vendor_id", "is", null).order("created_at", { ascending: false }),
      supabase.from("vendors").select("id,name"),
    ]);
    setProducts((p.data ?? []) as Product[]);
    setVendors((v.data ?? []) as Vendor[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!supabase) return;
    const ch = supabase
      .channel("vendor-products-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => load())
      .subscribe();
    return () => { supabase?.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debouncedQuery = useDebounce(query, 300);

  const filtered = useMemo(() => {
    let list = products;
    if (vendorFilter !== "all") list = list.filter((p) => p.vendor_id === vendorFilter);
    if (filter === "active")   list = list.filter((p) => p.active);
    if (filter === "inactive") list = list.filter((p) => !p.active);
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q));
    }
    return list;
  }, [products, vendorFilter, filter, debouncedQuery]);

  const toggleActive = async (p: Product) => {
    await db_update("products", p.id, { active: !p.active });
    toast.success(p.active ? "Product hidden" : "Product visible");
    load();
  };

  const adjustStock = async (p: Product, delta: number) => {
    const newStock = Math.max(0, p.stock + delta);
    try {
      await db_update("products", p.id, { stock: newStock });
      load();
    } catch { toast.error("Failed to update stock"); }
  };

  const vendorName = (id: string | null) => vendors.find((v) => v.id === id)?.name ?? "Unknown";

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Vendor Products</h1>
          <p className="text-xs text-slate-400 mt-0.5">{products.length} products from {vendors.length} vendors · {products.filter((p) => p.active).length} active</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" inputMode="search"
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none bg-slate-50">
          <option value="all">All Vendors</option>
          {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <div className="flex gap-1">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${filter === f ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Product list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <EmptyState
            icon={Package}
            title={products.length === 0 ? "No vendor products yet" : "No matching products"}
            message={products.length === 0
              ? "Products added by vendors will appear here."
              : "Try a different search or filter."}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const isExpanded = expanded === p.id;
            const img = p.imageUrl || p.image_url;
            return (
              <div key={p.id} className={`bg-white rounded-xl border shadow-sm transition-all ${p.active ? "border-slate-200" : "border-slate-200 opacity-70"}`}>
                <button className="w-full flex items-center gap-4 p-4 text-left" onClick={() => setExpanded(isExpanded ? null : p.id)}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${p.active ? "bg-indigo-50" : "bg-slate-100"}`}>
                    {img ? (
                      <img src={img} alt={p.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    ) : (
                      <Droplets className={`h-5 w-5 ${p.active ? "text-indigo-400" : "text-slate-300"}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-slate-900 truncate">{p.name}</p>
                      {p.badge && <span className="text-[9px] font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full shrink-0">{p.badge}</span>}
                      {!p.active && <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full shrink-0">Hidden</span>}
                    </div>
                    <p className="text-[11px] text-slate-400">{p.size} {p.unit} · {p.category}</p>
                    <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">by {vendorName(p.vendor_id)}</p>
                  </div>
                  <div className="text-right shrink-0 mr-2">
                    <p className="text-sm font-bold text-slate-900">{formatINR(p.price)}</p>
                    {p.mrp && p.mrp > p.price ? <p className="text-[10px] text-slate-400 line-through">{formatINR(p.mrp)}</p> : null}
                    <p className="text-[11px] text-slate-500 mt-0.5">Stock: <span className={`font-bold ${p.stock === 0 ? "text-red-500" : "text-slate-700"}`}>{p.stock}</span></p>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3 flex flex-wrap gap-3 items-center">
                    {/* Stock adjust */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Stock:</span>
                      <button onClick={() => adjustStock(p, -1)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center"><Minus className="h-3 w-3 text-slate-600" /></button>
                      <span className="text-sm font-bold text-slate-900 w-8 text-center">{p.stock}</span>
                      <button onClick={() => adjustStock(p, 1)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center"><Plus className="h-3 w-3 text-slate-600" /></button>
                    </div>
                    {/* Active toggle */}
                    <button onClick={() => toggleActive(p)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        p.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {p.active ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4 text-slate-400" />}
                      {p.active ? "Visible" : "Hidden"}
                    </button>
                    {p.description && <p className="text-xs text-slate-500 flex-1 min-w-[140px]">{p.description}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
