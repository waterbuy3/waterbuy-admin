import { useState } from "react";
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, X, Check } from "lucide-react";
import { useCollection, db_add, db_update, db_delete } from "@/lib/hooks";
import { type Category } from "@/lib/data";
import { isConfigured } from "@/lib/supabase";

const GRADIENT_OPTIONS = [
  "from-blue-400 to-blue-600",
  "from-cyan-400 to-cyan-600",
  "from-teal-400 to-teal-600",
  "from-sky-400 to-indigo-500",
  "from-blue-500 to-blue-700",
  "from-indigo-400 to-indigo-600",
  "from-blue-300 to-cyan-500",
  "from-orange-400 to-red-500",
  "from-green-400 to-emerald-600",
  "from-purple-400 to-purple-600",
  "from-pink-400 to-rose-500",
  "from-amber-400 to-orange-500",
];

function Modal({ cat, onSave, onClose }: {
  cat: Partial<Category> | null;
  onSave: (c: Omit<Category, "id">) => void;
  onClose: () => void;
}) {
  const blank = { name: "", description: "", icon: "💧", color: GRADIENT_OPTIONS[0], order: 99, active: true };
  const [form, setForm] = useState<Omit<Category, "id">>(cat ? { name: cat.name ?? "", description: cat.description ?? "", icon: cat.icon ?? "💧", color: cat.color ?? GRADIENT_OPTIONS[0], order: cat.order ?? 99, active: cat.active ?? true } : blank);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900">{cat?.name ? "Edit Category" : "New Category"}</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Preview */}
          <div className={`w-full h-16 rounded-2xl bg-gradient-to-br ${form.color} flex items-center gap-4 px-5`}>
            <span className="text-3xl">{form.icon}</span>
            <div>
              <p className="text-sm font-extrabold text-white">{form.name || "Category Name"}</p>
              <p className="text-xs text-white/70">{form.description || "Description"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Name</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Icon (emoji)</label>
              <input value={form.icon} onChange={(e) => set("icon", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
              <input value={form.description} onChange={(e) => set("description", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Sort Order</label>
              <input type="number" value={form.order} onChange={(e) => set("order", +e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="rounded" />
                <span className="text-xs font-semibold text-slate-600">Active</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Color Gradient</label>
            <div className="grid grid-cols-6 gap-2">
              {GRADIENT_OPTIONS.map((g) => (
                <button
                  key={g}
                  onClick={() => set("color", g)}
                  className={`h-8 rounded-lg bg-gradient-to-br ${g} flex items-center justify-center transition-all ${form.color === g ? "ring-2 ring-offset-1 ring-blue-600" : ""}`}
                >
                  {form.color === g && <Check className="h-3 w-3 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
          <button onClick={() => onSave(form)} className="px-5 py-2 text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">Save</button>
        </div>
      </div>
    </div>
  );
}

export function Categories() {
  const { data: categories, loading } = useCollection<Category>("categories");
  const [editing, setEditing] = useState<Partial<Category> | null | false>(false);

  const sorted = [...categories].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

  const saveCategory = async (form: Omit<Category, "id">) => {
    const current = editing && "id" in editing ? editing as Category : null;
    if (current?.id) {
      await db_update("categories", current.id, form as Record<string, unknown>);
    } else {
      await db_add("categories", form as Record<string, unknown>);
    }
    setEditing(false);
  };

  const toggleActive = (c: Category) => db_update("categories", c.id, { active: !c.active });
  const deleteCategory = async (c: Category) => {
    if (confirm(`Delete category "${c.name}"?`)) await db_delete("categories", c.id);
  };

  if (!isConfigured) {
    return (
      <div className="p-6 text-center text-slate-400 text-sm">
        Firebase not configured — copy your <code>.env</code> from the customer app.
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      {editing !== false && (
        <Modal
          cat={editing}
          onSave={saveCategory}
          onClose={() => setEditing(false)}
        />
      )}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Categories</h2>
          <p className="text-xs text-slate-400 mt-0.5">Changes reflect instantly in the customer app</p>
        </div>
        <button
          onClick={() => setEditing({})}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-extrabold rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((c) => (
            <div key={c.id} className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${!c.active ? "opacity-50" : ""}`}>
              <div className={`h-20 bg-gradient-to-br ${c.color} flex items-center gap-4 px-5`}>
                <span className="text-4xl">{c.icon}</span>
                <div>
                  <p className="text-sm font-extrabold text-white">{c.name}</p>
                  <p className="text-xs text-white/70">{c.description}</p>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-slate-300" />
                  <span className="text-xs text-slate-400">Order: {c.order}</span>
                  {c.active
                    ? <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                    : <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Hidden</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(c)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                    {c.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => setEditing(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteCategory(c)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
