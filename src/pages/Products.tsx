import { useMemo, useState } from "react";
import { Search, Plus, Pencil, Trash2, Eye, EyeOff, Flame, X, ImageIcon, Package } from "lucide-react";
import { toast } from "sonner";
import { useCollection, db_add, db_update, db_delete } from "@/lib/hooks";
import { uploadProductImage } from "@/lib/storage";
import { isConfigured } from "@/lib/supabase";
import { type Product } from "@/lib/data";
import { TableSkeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useDebounce, formatINR } from "@/lib/ui";

const CATEGORIES = ["individual", "apartment", "bundles", "events", "wedding", "corporate", "machines"];
const DELIVERY_TYPES = ["All", "Instant", "Scheduled", "Subscription"];

function EditModal({ product, onSave, onClose }: {
  product: Partial<Product> | null;
  onSave: (p: Omit<Product, "id">) => Promise<void>;
  onClose: () => void;
}) {
  const blank: Omit<Product, "id"> = {
    name: "", size: "", unit: "Bottle", price: 0, category: "individual",
    description: "", badge: undefined, popular: false, active: true,
    stock: 100, sold: 0, deliveryType: "All", imageUrl: "/water-bottle.png",
    rating: undefined, reviewCount: undefined, mrp: undefined, orderLimit: undefined,
  };
  const [form, setForm]       = useState<Omit<Product, "id">>(product ? { ...blank, ...product } : blank);
  const [saving,   setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof typeof form, string>> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!(form.price > 0)) e.price = "Price must be greater than 0";
    if (form.mrp !== undefined && form.mrp < form.price) e.mrp = "MRP should be ≥ Price";
    if (form.stock < 0) e.stock = "Stock cannot be negative";
    if (form.rating !== undefined && (form.rating < 0 || form.rating > 5)) e.rating = "Rating must be 0–5";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const id  = (product as Product | null)?.id ?? `p${Date.now()}`;
      const url = await uploadProductImage(id, file);
      update("imageUrl", url);
    } catch {
      toast.error("Image upload failed. Check Supabase Storage bucket permissions.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Please fix the errors before saving");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-900">{product?.name ? "Edit Product" : "Add Product"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="px-6 py-4 grid grid-cols-2 gap-4">
          {/* Image field */}
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Image</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.imageUrl ?? ""}
                onChange={(e) => update("imageUrl", e.target.value)}
                placeholder="https://... or upload file"
                className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <label className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer transition-colors ${uploading ? "opacity-50" : "hover:bg-slate-50"}`}>
                <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                {uploading ? "Uploading…" : "Upload"}
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
              </label>
            </div>
            {form.imageUrl && (
              <img src={form.imageUrl} alt="" className="mt-2 h-14 w-14 rounded-xl object-cover bg-slate-100" />
            )}
          </div>

          {/* Text / number fields */}
          {([
            { label: "Product Name",   key: "name",         type: "text",   full: true  },
            { label: "Description",    key: "description",  type: "text",   full: true  },
            { label: "Size",           key: "size",         type: "text",   full: false },
            { label: "Unit",           key: "unit",         type: "text",   full: false },
            { label: "Price (₹)",      key: "price",        type: "number", full: false },
            { label: "MRP (₹)",        key: "mrp",          type: "number", full: false },
            { label: "Stock",          key: "stock",        type: "number", full: false },
            { label: "Badge",          key: "badge",        type: "text",   full: false },
            { label: "Rating",         key: "rating",       type: "number", full: false },
            { label: "Review Count",   key: "reviewCount",  type: "number", full: false },
            { label: "Order Limit",    key: "orderLimit",   type: "number", full: false },
          ] as const).map((f) => (
            <div key={f.key} className={f.full ? "col-span-2" : ""}>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                {f.label}
                {(f.key === "name" || f.key === "price") && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                type={f.type}
                inputMode={f.type === "number" ? "decimal" : undefined}
                min={f.type === "number" ? 0 : undefined}
                value={(form[f.key] as string | number | undefined) ?? ""}
                onChange={(e) => update(f.key, f.type === "number" ? (e.target.value === "" ? undefined : +e.target.value) : e.target.value)}
                className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all ${errors[f.key] ? "border-red-300 focus:ring-red-500/20" : "border-slate-200 focus:ring-blue-500/20"}`}
              />
              {errors[f.key] && <p className="text-[10px] font-semibold text-red-500 mt-1">{errors[f.key]}</p>}
            </div>
          ))}

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category</label>
            <select value={form.category} onChange={(e) => update("category", e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 capitalize">
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>

          {/* Delivery type */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Delivery Type</label>
            <select value={form.deliveryType ?? "All"} onChange={(e) => update("deliveryType", e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {DELIVERY_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Checkboxes */}
          <div className="col-span-2 flex gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.popular ?? false} onChange={(e) => update("popular", e.target.checked)} className="rounded" />
              <span className="text-xs font-semibold text-slate-600">Popular / Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => update("active", e.target.checked)} className="rounded" />
              <span className="text-xs font-semibold text-slate-600">Active (visible to customers)</span>
            </label>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50">
            {saving ? "Saving…" : product?.name ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Products() {
  const { data: products, loading } = useCollection<Product>("products", { orderBy: "created_at", ascending: true });
  const [search,    setSearch]    = useState("");
  const [editing,   setEditing]   = useState<Partial<Product> | null | false>(false);
  const [catFilter, setCatFilter] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (catFilter !== "all" && p.category !== catFilter) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q);
    });
  }, [products, catFilter, debouncedSearch]);

  const toggleActive = async (p: Product) => {
    try {
      await db_update("products", p.id, { active: !p.active });
      toast.success(p.active ? `"${p.name}" hidden from customers` : `"${p.name}" is now active`);
    } catch {
      toast.error("Failed to update product");
    }
  };

  const performDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await db_delete("products", confirmDelete.id);
      toast.success(`"${confirmDelete.name}" deleted`);
      setConfirmDelete(null);
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  const saveProduct = async (form: Omit<Product, "id">) => {
    const current = editing && "id" in editing ? (editing as Product) : null;
    const clean: Record<string, unknown> = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== undefined && v !== ""),
    );
    // Map camelCase fields to snake_case DB columns
    if ("orderLimit" in clean) { clean.order_limit = clean.orderLimit; delete clean.orderLimit; }
    if ("imageUrl" in clean)   { clean.image_url   = clean.imageUrl;   delete clean.imageUrl;   }
    if ("reviewCount" in clean){ clean.review_count = clean.reviewCount; delete clean.reviewCount; }
    if ("deliveryType" in clean){ clean.delivery_type = clean.deliveryType; delete clean.deliveryType; }
    try {
      if (current?.id) {
        await db_update("products", current.id, clean);
        toast.success(`"${form.name}" updated`);
      } else {
        await db_add("products", clean);
        toast.success(`"${form.name}" added`);
      }
      setEditing(false);
    } catch {
      toast.error("Failed to save product. Try again.");
    }
  };

  const totalRevenue = products.reduce((s, p) => s + (p.price ?? 0) * (p.sold ?? 0), 0);

  if (!isConfigured) {
    return (
      <div className="p-6 text-center text-slate-400 text-sm">
        Supabase not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      {editing !== false && (
        <EditModal product={editing} onSave={saveProduct} onClose={() => setEditing(false)} />
      )}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this product?"
        message={confirmDelete ? `"${confirmDelete.name}" will be permanently removed. This cannot be undone.` : ""}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={performDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <h2 className="text-lg font-extrabold text-slate-900">Products</h2>
        <div className="flex gap-2 flex-wrap">
          {(["all", ...CATEGORIES] as const).map((c) => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all capitalize ${catFilter === c ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" inputMode="search"
              className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48" />
          </div>
          <button onClick={() => setEditing({})}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-extrabold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Products", value: products.length },
          { label: "Active",         value: products.filter((p) => p.active).length },
          { label: "Popular",        value: products.filter((p) => p.popular).length },
          { label: "Total Revenue",  value: `₹${(totalRevenue / 100000).toFixed(1)}L` },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 font-medium">{s.label}</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {(
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em]">Product</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em] hidden sm:table-cell">Category</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em]">Price</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em] hidden md:table-cell">Stock</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em] hidden md:table-cell">Sold</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em]">Status</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.07em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading && <TableSkeleton rows={6} cols={7} />}
                {!loading && filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {p.imageUrl && (
                          <img src={p.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover bg-slate-100 shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{p.name}</span>
                            {p.popular && <Flame className="h-3 w-3 text-amber-500 fill-amber-400/30" />}
                            {p.badge && <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-1.5 rounded-full">{p.badge}</span>}
                          </div>
                          <p className="text-[10px] text-slate-400">{p.size} · {p.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 capitalize hidden sm:table-cell">{p.category}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-bold text-slate-900">{formatINR(p.price)}</span>
                      {p.mrp ? <span className="text-[10px] text-slate-400 line-through ml-1">{formatINR(p.mrp)}</span> : null}
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className={`text-xs font-bold ${(p.stock ?? 0) < 20 ? "text-red-500" : "text-slate-700"}`}>{p.stock ?? "—"}</span>
                      {(p.stock ?? 0) < 20 && <span className="ml-1 text-[9px] font-extrabold text-red-500 bg-red-50 px-1 rounded">Low</span>}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-slate-700 hidden md:table-cell">{(p.sold ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3.5">
                      {p.active
                        ? <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Active</span>
                        : <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Hidden</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => toggleActive(p)} title={p.active ? "Hide" : "Show"}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                          {p.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => setEditing(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setConfirmDelete(p)} title="Delete"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={7} className="p-0">
                    <EmptyState
                      icon={Package}
                      title={products.length === 0 ? "No products yet" : "No matching products"}
                      message={products.length === 0
                        ? "Add your first product, or seed the database from Settings."
                        : "Try adjusting your search or category filter."}
                      action={products.length === 0 ? (
                        <button onClick={() => setEditing({})} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-extrabold rounded-xl hover:bg-blue-700 transition-colors">
                          <Plus className="h-3.5 w-3.5" /> Add Product
                        </button>
                      ) : undefined}
                    />
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
