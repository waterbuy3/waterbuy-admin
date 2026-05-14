import { useState, useEffect } from "react";
import {
  Bell, Shield, Globe, Truck, Database, Key,
  ChevronRight, Save, ToggleLeft, ToggleRight,
  RefreshCw, CheckCircle2, AlertCircle, Plus, X,
} from "lucide-react";
import { db_set } from "@/lib/hooks";
import { seedDatabase, isSeeded } from "@/lib/seed";
import { isConfigured, supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface DeliveryArea {
  pincode: string;
  name: string;
  etaMins: number;
}

interface DeliveryConfig {
  fee: number;
  freeAbove: number;
  minOrder: number;
  etaMins: number;
  timeSlots: string[];
  frequencies: string[];
  servicePincodes: string;
  codEnabled: boolean;
  upiEnabled: boolean;
  upiId: string;
  areas: DeliveryArea[];
}

const DEFAULT_DELIVERY: DeliveryConfig = {
  fee: 0,
  freeAbove: 200,
  minOrder: 50,
  etaMins: 30,
  timeSlots: ["Morning (6 AM–8 AM)", "Day (10 AM–2 PM)", "Evening (5 PM–8 PM)"],
  frequencies: ["Once", "Daily", "Alternate Days", "Weekly", "Monthly"],
  servicePincodes: "",
  codEnabled: true,
  upiEnabled: true,
  upiId: "",
  areas: [],
};

type Toggle = { label: string; description: string; value: boolean };

const NOTIFICATION_TOGGLES: Toggle[] = [
  { label: "New order alerts",      description: "Notify when a new order is placed",         value: true  },
  { label: "Low stock warnings",    description: "Alert when product stock falls below 20",    value: true  },
  { label: "Subscription events",   description: "Alerts for pauses, cancellations, renewals", value: true  },
  { label: "Driver status changes", description: "Notify on driver duty status changes",        value: false },
  { label: "Daily summary email",   description: "Send daily revenue & order digest",           value: false },
];

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
        <Icon className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
      </div>
      <div className="divide-y divide-slate-50">{children}</div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Settings() {
  const [notifications, setNotifications] = useState<Toggle[]>(NOTIFICATION_TOGGLES);
  const [delivery, setDelivery] = useState<DeliveryConfig>(DEFAULT_DELIVERY);
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [newSlot, setNewSlot] = useState("");
  const [newFreq, setNewFreq] = useState("");
  const [newAreaPincode, setNewAreaPincode] = useState("");
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaEta, setNewAreaEta] = useState(30);

  const [seedLogs, setSeedLogs] = useState<string[]>([]);
  const [seeding,  setSeeding]  = useState(false);
  const [seedDone, setSeedDone] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.from("settings").select("data").eq("id", "delivery").single().then(({ data }) => {
      if (data?.data) setDelivery({ ...DEFAULT_DELIVERY, ...(data.data as Partial<DeliveryConfig>) });
    });
  }, []);

  const setD = <K extends keyof DeliveryConfig>(k: K, v: DeliveryConfig[K]) =>
    setDelivery((d) => ({ ...d, [k]: v }));

  const saveDelivery = async () => {
    setDeliverySaving(true);
    try {
      await db_set("settings", "delivery", { data: delivery });
      toast.success("Delivery settings saved — live in customer app instantly");
    } catch {
      toast.error("Failed to save delivery settings");
    } finally {
      setDeliverySaving(false);
    }
  };

  const toggleNotif = (i: number) =>
    setNotifications((prev) => prev.map((n, idx) => idx === i ? { ...n, value: !n.value } : n));

  const handleSeed = async () => {
    if (!isConfigured) { setSeedLogs(["Supabase not configured — add .env first."]); return; }
    const already = await isSeeded();
    if (already && !confirm("Database already seeded. Re-seed and overwrite all data?")) return;
    setSeeding(true);
    setSeedLogs([]);
    setSeedDone(false);
    try {
      await seedDatabase((msg) => setSeedLogs((prev) => [...prev, msg]));
      setSeedDone(true);
    } catch (e) {
      setSeedLogs((prev) => [...prev, `Error: ${e instanceof Error ? e.message : "Unknown error"}`]);
    } finally {
      setSeeding(false);
    }
  };

  const fieldCls = "w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all";

  return (
    <div className="p-4 lg:p-6 animate-fade-in max-w-2xl">
      <h2 className="text-lg font-extrabold text-slate-900 mb-5">Settings</h2>

      {/* ── Delivery Config ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Truck className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Delivery Config</h3>
          </div>
          <button
            onClick={saveDelivery}
            disabled={deliverySaving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-extrabold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            <Save className="h-3.5 w-3.5" />
            {deliverySaving ? "Saving…" : "Save"}
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Numeric fields */}
          <div className="grid grid-cols-2 gap-3">
            {([
              { label: "Delivery Fee (₹)",       key: "fee",        help: "Base fee charged below free threshold" },
              { label: "Free Delivery Above (₹)", key: "freeAbove",  help: "Orders above this get free delivery"   },
              { label: "Min Order Value (₹)",     key: "minOrder",   help: "Minimum cart value to checkout"        },
              { label: "Est. Delivery (mins)",    key: "etaMins",    help: "Shown to customer as ETA"              },
            ] as const).map(({ label, key, help }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
                <input
                  type="number" min={0}
                  value={delivery[key] as number}
                  onChange={(e) => setD(key, +e.target.value as never)}
                  className={fieldCls}
                />
                <p className="text-[10px] text-slate-400 mt-0.5">{help}</p>
              </div>
            ))}
          </div>

          {/* Payment toggles */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Accepted Payment Methods</p>
            <div className="flex gap-4">
              {([
                { key: "upiEnabled", label: "UPI / Net Banking" },
                { key: "codEnabled", label: "Cash on Delivery"  },
              ] as const).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={delivery[key]} onChange={(e) => setD(key, e.target.checked as never)} className="rounded" />
                  <span className="text-xs font-semibold text-slate-600">{label}</span>
                </label>
              ))}
            </div>
            {delivery.upiEnabled && (
              <div className="mt-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">UPI ID (optional — shown to customer)</label>
                <input
                  type="text" value={delivery.upiId}
                  onChange={(e) => setD("upiId", e.target.value)}
                  placeholder="yourname@upi"
                  className={fieldCls}
                />
              </div>
            )}
          </div>

          {/* Time Slots */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Delivery Time Slots</p>
            <div className="space-y-2">
              {delivery.timeSlots.map((slot, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={slot}
                    onChange={(e) => setD("timeSlots", delivery.timeSlots.map((s, idx) => idx === i ? e.target.value : s))}
                    className="flex-1 px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    onClick={() => setD("timeSlots", delivery.timeSlots.filter((_, idx) => idx !== i))}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value)}
                  placeholder="e.g. Night (8 PM–10 PM)"
                  onKeyDown={(e) => { if (e.key === "Enter" && newSlot.trim()) { setD("timeSlots", [...delivery.timeSlots, newSlot.trim()]); setNewSlot(""); } }}
                  className="flex-1 px-3 py-1.5 text-sm bg-slate-50 border border-dashed border-slate-300 rounded-xl focus:outline-none"
                />
                <button
                  onClick={() => { if (newSlot.trim()) { setD("timeSlots", [...delivery.timeSlots, newSlot.trim()]); setNewSlot(""); } }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Frequencies */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Delivery Frequencies</p>
            <div className="space-y-2">
              {delivery.frequencies.map((freq, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={freq}
                    onChange={(e) => setD("frequencies", delivery.frequencies.map((f, idx) => idx === i ? e.target.value : f))}
                    className="flex-1 px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    onClick={() => setD("frequencies", delivery.frequencies.filter((_, idx) => idx !== i))}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={newFreq}
                  onChange={(e) => setNewFreq(e.target.value)}
                  placeholder="e.g. Fortnightly"
                  onKeyDown={(e) => { if (e.key === "Enter" && newFreq.trim()) { setD("frequencies", [...delivery.frequencies, newFreq.trim()]); setNewFreq(""); } }}
                  className="flex-1 px-3 py-1.5 text-sm bg-slate-50 border border-dashed border-slate-300 rounded-xl focus:outline-none"
                />
                <button
                  onClick={() => { if (newFreq.trim()) { setD("frequencies", [...delivery.frequencies, newFreq.trim()]); setNewFreq(""); } }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Service Pincodes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Service Pincodes (comma-separated, blank = all areas)</label>
            <input
              type="text" value={delivery.servicePincodes}
              onChange={(e) => setD("servicePincodes", e.target.value)}
              placeholder="560001, 560002, 560003"
              className={fieldCls}
            />
          </div>

          {/* Per-Area Delivery Times */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Per-Area Delivery Times</p>
            <p className="text-[11px] text-slate-400 mb-3">Override the default ETA for specific pincodes. Customer sees the ETA for their saved address.</p>
            <div className="space-y-2 mb-3">
              {(delivery.areas ?? []).map((area, i) => (
                <div key={i} className="flex gap-2 items-center bg-slate-50 rounded-xl px-3 py-2">
                  <input
                    value={area.pincode}
                    onChange={(e) => setD("areas", delivery.areas.map((a, idx) => idx === i ? { ...a, pincode: e.target.value } : a))}
                    placeholder="560001"
                    className="w-24 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <input
                    value={area.name}
                    onChange={(e) => setD("areas", delivery.areas.map((a, idx) => idx === i ? { ...a, name: e.target.value } : a))}
                    placeholder="Area name"
                    className="flex-1 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number" min={5}
                      value={area.etaMins}
                      onChange={(e) => setD("areas", delivery.areas.map((a, idx) => idx === i ? { ...a, etaMins: +e.target.value } : a))}
                      className="w-14 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-[10px] text-slate-400">min</span>
                  </div>
                  <button
                    onClick={() => setD("areas", delivery.areas.filter((_, idx) => idx !== i))}
                    className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400">Pincode</span>
                <input
                  value={newAreaPincode}
                  onChange={(e) => setNewAreaPincode(e.target.value)}
                  placeholder="560001"
                  className="w-24 px-2 py-1.5 text-sm bg-slate-50 border border-dashed border-slate-300 rounded-xl focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[10px] text-slate-400">Area name</span>
                <input
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  placeholder="Koramangala"
                  className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-dashed border-slate-300 rounded-xl focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400">ETA (min)</span>
                <input
                  type="number" min={5}
                  value={newAreaEta}
                  onChange={(e) => setNewAreaEta(+e.target.value)}
                  className="w-16 px-2 py-1.5 text-sm bg-slate-50 border border-dashed border-slate-300 rounded-xl focus:outline-none"
                />
              </div>
              <button
                onClick={() => {
                  if (!newAreaPincode.trim() || !newAreaName.trim()) return;
                  setD("areas", [...(delivery.areas ?? []), { pincode: newAreaPincode.trim(), name: newAreaName.trim(), etaMins: newAreaEta }]);
                  setNewAreaPincode(""); setNewAreaName(""); setNewAreaEta(30);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Notifications ── */}
      <Section title="Notifications" icon={Bell}>
        {notifications.map((n, i) => (
          <SettingRow key={n.label} label={n.label} description={n.description}>
            <button onClick={() => toggleNotif(i)} className="text-blue-600">
              {n.value
                ? <ToggleRight className="h-6 w-6 fill-blue-100" />
                : <ToggleLeft  className="h-6 w-6 text-slate-300" />}
            </button>
          </SettingRow>
        ))}
      </Section>

      {/* ── Localisation ── */}
      <Section title="Localisation" icon={Globe}>
        <SettingRow label="Language">
          <select className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 focus:outline-none">
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
          </select>
        </SettingRow>
        <SettingRow label="Timezone">
          <select className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 focus:outline-none">
            <option value="Asia/Kolkata">India (IST +5:30)</option>
            <option value="UTC">UTC</option>
          </select>
        </SettingRow>
      </Section>

      {/* ── Security ── */}
      <Section title="Security" icon={Shield}>
        <SettingRow label="Change Password" description="Update admin account password">
          <button className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
            Update <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </SettingRow>
        <SettingRow label="API Key" description="Used for webhook integrations">
          <button className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors">
            <Key className="h-3 w-3" /> Reveal
          </button>
        </SettingRow>
      </Section>

      {/* ── Seed Database ── */}
      <Section title="Seed Database" icon={Database}>
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-slate-500">
            Populates Supabase with initial products, categories, plans, drivers, and home content.
            Run this once when you first connect. Both apps sync instantly.
          </p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-extrabold rounded-xl transition-all ${
              seedDone ? "bg-emerald-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
            } disabled:opacity-50`}
          >
            {seeding
              ? <><RefreshCw className="h-4 w-4 animate-spin" /> Seeding…</>
              : seedDone
                ? <><CheckCircle2 className="h-4 w-4" /> Seeded!</>
                : <><Database className="h-4 w-4" /> Seed Database</>}
          </button>
          {seedLogs.length > 0 && (
            <div className="bg-slate-900 rounded-xl p-3 space-y-1 max-h-40 overflow-y-auto">
              {seedLogs.map((log, i) => (
                <p key={i} className={`text-xs font-mono ${log.startsWith("Error") ? "text-red-400" : "text-slate-300"}`}>
                  {log.startsWith("Error") && <AlertCircle className="h-3 w-3 inline mr-1" />}
                  {log}
                </p>
              ))}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
