import { useState } from "react";
import { Truck, Phone, Star, MapPin, Package, Plus, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useCollection, db_add, db_update, db_delete } from "@/lib/hooks";
import { isConfigured } from "@/lib/supabase";
import { type Driver } from "@/lib/data";

const statusStyle = {
  available: { dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  on_route:  { dot: "bg-blue-500",    badge: "bg-blue-100 text-blue-700 border-blue-200"          },
  off_duty:  { dot: "bg-slate-400",   badge: "bg-slate-100 text-slate-500 border-slate-200"        },
};

function AddDriverModal({ onSave, onClose }: { onSave: (d: Omit<Driver, "id">) => void; onClose: () => void }) {
  const [form, setForm] = useState<Omit<Driver, "id">>({
    name: "", phone: "", vehicle: "", zone: "", status: "available", rating: 5, deliveriesToday: 0,
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900">Add Driver</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>
        <div className="px-6 py-4 grid grid-cols-2 gap-3">
          {[
            { label: "Full Name", key: "name",    type: "text", full: true  },
            { label: "Phone",     key: "phone",   type: "text", full: false },
            { label: "Vehicle",   key: "vehicle", type: "text", full: false },
            { label: "Zone",      key: "zone",    type: "text", full: false },
            { label: "Rating",    key: "rating",  type: "number", full: false },
          ].map(({ label, key, type, full }) => (
            <div key={key} className={full ? "col-span-2" : ""}>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
              <input type={type} value={(form[key as keyof typeof form] as string | number) ?? ""}
                onChange={(e) => set(key as keyof typeof form, (type === "number" ? +e.target.value : e.target.value) as never)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
          <button onClick={() => onSave(form)} className="px-5 py-2 text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">Save Driver</button>
        </div>
      </div>
    </div>
  );
}

export function Drivers() {
  const { data: drivers, loading } = useCollection<Driver>("drivers", { orderBy: "created_at", ascending: true });
  const [addOpen, setAddOpen] = useState(false);

  const toggleDuty = async (d: Driver) => {
    const next = d.status === "off_duty" ? "available" : d.status === "available" ? "off_duty" : d.status;
    await db_update("drivers", d.id, { status: next });
    toast.success(`${d.name.split(" ")[0]} marked ${next.replace("_", " ")}`);
  };

  const saveDriver = async (form: Omit<Driver, "id">) => {
    try {
      await db_add("drivers", form as Record<string, unknown>);
      toast.success(`${form.name} added as driver`);
      setAddOpen(false);
    } catch {
      toast.error("Failed to add driver.");
    }
  };

  const deleteDriver = async (d: Driver) => {
    if (!confirm(`Remove driver "${d.name}"?`)) return;
    await db_delete("drivers", d.id);
    toast.success(`${d.name} removed`);
  };

  if (!isConfigured) {
    return <div className="p-6 text-center text-slate-400 text-sm">Supabase not configured.</div>;
  }

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      {addOpen && <AddDriverModal onSave={saveDriver} onClose={() => setAddOpen(false)} />}

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-extrabold text-slate-900">Delivery Drivers</h2>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-extrabold rounded-xl hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" /> Add Driver
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "On Route",  value: drivers.filter((d) => d.status === "on_route").length,  color: "text-blue-600"    },
          { label: "Available", value: drivers.filter((d) => d.status === "available").length, color: "text-emerald-600" },
          { label: "Off Duty",  value: drivers.filter((d) => d.status === "off_duty").length,  color: "text-slate-400"   },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {drivers.map((d) => {
            const s = statusStyle[d.status as keyof typeof statusStyle] ?? statusStyle.off_duty;
            return (
              <div key={d.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                        <span className="text-sm font-extrabold text-white">
                          {d.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${s.dot}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{d.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-[11px] font-bold text-amber-600">{d.rating}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border capitalize ${s.badge}`}>
                    {d.status.replace("_", " ")}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {[
                    { Icon: Phone,   val: d.phone    },
                    { Icon: Truck,   val: d.vehicle  },
                    { Icon: MapPin,  val: d.zone     },
                    { Icon: Package, val: `${d.deliveriesToday} deliveries today` },
                  ].map(({ Icon, val }) => (
                    <div key={val} className="flex items-center gap-2 text-slate-600">
                      <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {val}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => toggleDuty(d)}
                    className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-colors ${
                      d.status === "off_duty"
                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {d.status === "off_duty" ? "Mark Available" : "Mark Off Duty"}
                  </button>
                  <button onClick={() => deleteDriver(d)}
                    className="px-3 py-2 text-xs font-extrabold rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
