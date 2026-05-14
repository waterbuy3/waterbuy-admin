import { useState } from "react";
import { Bell, Shield, Globe, Palette, Database, Key, ChevronRight, Save, ToggleLeft, ToggleRight, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { seedDatabase, isSeeded } from "@/lib/seed";
import { isConfigured } from "@/lib/supabase";

type Toggle = { label: string; description: string; value: boolean };

const NOTIFICATION_TOGGLES: Toggle[] = [
  { label: "New order alerts",         description: "Notify when a new order is placed",            value: true  },
  { label: "Low stock warnings",        description: "Alert when product stock falls below 20",       value: true  },
  { label: "Driver status changes",     description: "Notify on driver duty status changes",          value: false },
  { label: "Subscription events",       description: "Alerts for pauses, cancellations, renewals",    value: true  },
  { label: "Daily summary email",       description: "Send daily revenue & order digest",             value: false },
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
  const [theme,    setTheme]    = useState<"light" | "dark">("light");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [saved,    setSaved]    = useState(false);
  const [seedLogs,  setSeedLogs]  = useState<string[]>([]);
  const [seeding,   setSeeding]   = useState(false);
  const [seedDone,  setSeedDone]  = useState(false);

  const toggleNotif = (i: number) =>
    setNotifications((prev) => prev.map((n, idx) => idx === i ? { ...n, value: !n.value } : n));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSeed = async () => {
    if (!isConfigured) { setSeedLogs(["Firebase not configured — add .env first."]); return; }
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

  return (
    <div className="p-4 lg:p-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-extrabold text-slate-900">Settings</h2>
        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-extrabold rounded-xl transition-all ${
            saved ? "bg-emerald-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          <Save className="h-4 w-4" />
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Notifications */}
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

      {/* Appearance */}
      <Section title="Appearance" icon={Palette}>
        <SettingRow label="Theme" description="Interface color mode">
          <div className="flex gap-2">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border capitalize transition-all ${
                  theme === t ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </SettingRow>
      </Section>

      {/* Localisation */}
      <Section title="Localisation" icon={Globe}>
        <SettingRow label="Language">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
          </select>
        </SettingRow>
        <SettingRow label="Timezone">
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="Asia/Kolkata">India (IST +5:30)</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">US Eastern</option>
            <option value="Europe/London">London (GMT)</option>
          </select>
        </SettingRow>
      </Section>

      {/* Security */}
      <Section title="Security" icon={Shield}>
        <SettingRow label="Change Password" description="Update admin account password">
          <button className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
            Update <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </SettingRow>
        <SettingRow label="Two-Factor Authentication" description="Currently disabled">
          <button className="text-[10px] font-extrabold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg transition-colors">
            Enable 2FA
          </button>
        </SettingRow>
        <SettingRow label="API Key" description="Used for webhook integrations">
          <button className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors">
            <Key className="h-3 w-3" /> Reveal
          </button>
        </SettingRow>
      </Section>

      {/* Seed Database */}
      <Section title="Seed Database" icon={Database}>
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-slate-500">
            Populates Firestore with initial products, categories, plans, drivers, and home content.
            Run this once when you first connect Firebase. Both apps sync instantly after seeding.
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
                : <><Database className="h-4 w-4" /> Seed Database</>
            }
          </button>
          {seedLogs.length > 0 && (
            <div className="bg-slate-900 rounded-xl p-3 space-y-1 max-h-40 overflow-y-auto">
              {seedLogs.map((log, i) => (
                <p key={i} className={`text-xs font-mono ${log.startsWith("Error") ? "text-red-400" : log.startsWith("✅") ? "text-emerald-400" : "text-slate-300"}`}>
                  {log.startsWith("Error") && <AlertCircle className="h-3 w-3 inline mr-1" />}
                  {log}
                </p>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Data */}
      <Section title="Export & Backup" icon={Database}>
        <SettingRow label="Export Orders (CSV)" description="Download all orders as a spreadsheet">
          <button className="text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
            Export
          </button>
        </SettingRow>
        <SettingRow label="Export Customers (CSV)" description="Download customer list">
          <button className="text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
            Export
          </button>
        </SettingRow>
        <SettingRow label="Backup Database" description="Trigger a full Firestore backup">
          <button className="text-xs font-bold text-slate-600 border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">
            Run Backup
          </button>
        </SettingRow>
      </Section>
    </div>
  );
}
