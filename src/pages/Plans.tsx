import { useState } from "react";
import { Plus, Pencil, Trash2, Star, X, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useCollection, db_add, db_update, db_delete } from "@/lib/hooks";
import { type SubscriptionPlan } from "@/lib/data";
import { isConfigured } from "@/lib/supabase";

function Modal({ plan, onSave, onClose }: {
  plan: Partial<SubscriptionPlan> | null;
  onSave: (p: Omit<SubscriptionPlan, "id">) => void;
  onClose: () => void;
}) {
  const blank: Omit<SubscriptionPlan, "id"> = {
    name: "", description: "", price_per_month: 0, features: [""],
    popular: false, delivery_frequency: "Daily", active: true,
  };
  const [form, setForm] = useState<Omit<SubscriptionPlan, "id">>(
    plan ? {
      name: plan.name ?? "",
      description: plan.description ?? "",
      price_per_month: plan.price_per_month ?? 0,
      features: plan.features?.length ? [...plan.features] : [""],
      popular: plan.popular ?? false,
      delivery_frequency: plan.delivery_frequency ?? "Daily",
      active: plan.active ?? true,
    } : blank,
  );

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const updateFeature = (i: number, v: string) =>
    setForm((f) => ({ ...f, features: f.features.map((x, idx) => idx === i ? v : x) }));
  const addFeature    = () => setForm((f) => ({ ...f, features: [...f.features, ""] }));
  const removeFeature = (i: number) =>
    setForm((f) => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900">{plan?.name ? "Edit Plan" : "New Plan"}</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Plan Name",         key: "name",              type: "text"   },
              { label: "Price / Month (₹)", key: "price_per_month",     type: "number" },
              { label: "Delivery Frequency",key: "delivery_frequency", type: "text"   },
            ].map(({ label, key, type }) => (
              <div key={key} className={key === "name" ? "col-span-2" : ""}>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
                <input
                  type={type}
                  value={(form[key as keyof typeof form] as string | number) ?? ""}
                  onChange={(e) => set(key as keyof typeof form, (type === "number" ? +e.target.value : e.target.value) as never)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
              <input value={form.description} onChange={(e) => set("description", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Features</label>
            <div className="space-y-2">
              {form.features.map((feat, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={feat}
                    onChange={(e) => updateFeature(i, e.target.value)}
                    placeholder={`Feature ${i + 1}`}
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button onClick={() => removeFeature(i)} className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={addFeature} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                <Plus className="h-3 w-3" /> Add Feature
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.popular} onChange={(e) => set("popular", e.target.checked)} className="rounded" />
              <span className="text-xs font-semibold text-slate-600">Popular</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="rounded" />
              <span className="text-xs font-semibold text-slate-600">Active</span>
            </label>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
          <button onClick={() => onSave(form)} className="px-5 py-2 text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
            <Check className="h-4 w-4 inline mr-1" />Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function Plans() {
  const { data: plans, loading } = useCollection<SubscriptionPlan>("subscription_plans");
  const [editing, setEditing] = useState<Partial<SubscriptionPlan> | null | false>(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const savePlan = async (form: Omit<SubscriptionPlan, "id">) => {
    const current = editing && "id" in editing ? editing as SubscriptionPlan : null;
    if (current?.id) {
      await db_update("subscription_plans", current.id, form as Record<string, unknown>);
    } else {
      await db_add("subscription_plans", form as Record<string, unknown>);
    }
    setEditing(false);
  };

  const deletePlan = async (p: SubscriptionPlan) => {
    if (confirm(`Delete plan "${p.name}"?`)) await db_delete("subscription_plans", p.id);
  };

  const toggleActive = (p: SubscriptionPlan) =>
    db_update("subscription_plans", p.id, { active: !p.active });

  if (!isConfigured) {
    return (
      <div className="p-6 text-center text-slate-400 text-sm">
        Firebase not configured — copy your <code>.env</code> from the customer app.
      </div>
    );
  }

  const mrr = plans.filter((p) => p.active).reduce((s, p) => s + p.price_per_month, 0);

  return (
    <div className="p-4 lg:p-6 animate-fade-in max-w-3xl">
      {editing !== false && (
        <Modal plan={editing} onSave={savePlan} onClose={() => setEditing(false)} />
      )}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Subscription Plans</h2>
          <p className="text-xs text-slate-400 mt-0.5">Changes reflect instantly in the customer app</p>
        </div>
        <button
          onClick={() => setEditing({})}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-extrabold rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Plans",   value: plans.length,                        color: "text-slate-900" },
          { label: "Active Plans",  value: plans.filter((p) => p.active).length, color: "text-emerald-600" },
          { label: "Max Plan MRR",  value: `₹${mrr.toLocaleString()}`,           color: "text-blue-600"   },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading…</div>
      ) : (
        <div className="space-y-3">
          {plans.map((p) => (
            <div key={p.id} className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${!p.active ? "opacity-60" : ""}`}>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-extrabold text-slate-900">{p.name}</h3>
                      {p.popular && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Star className="h-2.5 w-2.5 fill-amber-400" /> Popular
                        </span>
                      )}
                      {p.active
                        ? <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                        : <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Hidden</span>}
                    </div>
                    <p className="text-xs text-slate-500">{p.description} · {p.delivery_frequency}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-extrabold text-blue-600">₹{p.price_per_month.toLocaleString()}<span className="text-xs text-slate-400 font-medium">/mo</span></p>
                    <div className="flex gap-1">
                      <button onClick={() => toggleActive(p)} className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${p.active ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
                        {p.active ? "Hide" : "Show"}
                      </button>
                      <button onClick={() => setEditing(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deletePlan(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  className="mt-2 flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {expanded === p.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {p.features.length} features
                </button>

                {expanded === p.id && (
                  <ul className="mt-2 space-y-1.5 pl-1">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
