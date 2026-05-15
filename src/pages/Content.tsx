import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { db_set } from "@/lib/hooks";
import { supabase, isConfigured } from "@/lib/supabase";
import { type HomeContent } from "@/lib/data";

const DEFAULT_CONTENT: HomeContent = {
  stats: { deliveriesToday: "12,400+", avgDeliveryMin: 8, rating: 4.9, happyCustomers: "50K+", citiesCovered: 14 },
  trustBadges: [
    { icon: "🧪", label: "Lab Tested" },
    { icon: "✅", label: "BIS Certified" },
    { icon: "⚡", label: "10 Min Delivery" },
    { icon: "🌿", label: "Natural Source" },
    { icon: "🔒", label: "Tamper Proof" },
  ],
  banners: [
    { id: "b1", title: "Get 20% Off on Tanker Booking",   sub: "Use code TANK20",   bg: "from-blue-600 to-cyan-500",    badge: "Limited Offer",  emoji: "🚚" },
    { id: "b2", title: "Free Dispenser with 5L Can Sub",  sub: "Use code FREEDISP", bg: "from-orange-500 to-amber-400", badge: "New User",        emoji: "🎁" },
    { id: "b3", title: "Flat ₹50 Off on 12-Pack Bundles", sub: "Use code PARTY50",  bg: "from-emerald-500 to-teal-500", badge: "Weekend Special", emoji: "🎉" },
  ],
  testimonials: [
    { id: "t1", name: "Priya M.",  location: "Bangalore", avatar: "PM", rating: 5, text: "Delivered in 7 minutes flat!", tag: "Instant Delivery" },
    { id: "t2", name: "Rahul K.", location: "Mumbai",    avatar: "RK", rating: 5, text: "Runs on autopilot!",            tag: "Subscription"     },
  ],
};

export function Content() {
  const [content, setContent] = useState<HomeContent>(DEFAULT_CONTENT);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [tab, setTab] = useState<"stats" | "banners" | "badges" | "testimonials">("stats");

  useEffect(() => {
    if (!supabase) return;
    supabase.from("content").select("data").eq("id", "home").single().then(({ data }) => {
      if (data?.data) setContent(data.data as HomeContent);
    });
    const channel = supabase
      .channel("content-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "content", filter: "id=eq.home" }, async () => {
        const { data } = await supabase!.from("content").select("data").eq("id", "home").single();
        if (data?.data) setContent(data.data as HomeContent);
      })
      .subscribe();
    return () => { supabase?.removeChannel(channel); };
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await db_set("content", "home", { data: content });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error("Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const updateStat = (k: keyof HomeContent["stats"], v: string | number) =>
    setContent((c) => ({ ...c, stats: { ...c.stats, [k]: v } }));

  const updateBadge = (i: number, k: "icon" | "label", v: string) =>
    setContent((c) => ({ ...c, trustBadges: c.trustBadges.map((b, idx) => idx === i ? { ...b, [k]: v } : b) }));
  const addBadge    = () => setContent((c) => ({ ...c, trustBadges: [...c.trustBadges, { icon: "⭐", label: "New Badge" }] }));
  const deleteBadge = (i: number) =>
    setContent((c) => ({ ...c, trustBadges: c.trustBadges.filter((_, idx) => idx !== i) }));

  const updateBanner = (i: number, k: keyof HomeContent["banners"][0], v: string) =>
    setContent((c) => ({ ...c, banners: c.banners.map((b, idx) => idx === i ? { ...b, [k]: v } : b) }));
  const addBanner    = () =>
    setContent((c) => ({ ...c, banners: [...c.banners, { id: `b${Date.now()}`, title: "New Offer", sub: "Subtitle", bg: "from-blue-600 to-cyan-500", badge: "New", emoji: "🎉" }] }));
  const deleteBanner = (i: number) =>
    setContent((c) => ({ ...c, banners: c.banners.filter((_, idx) => idx !== i) }));

  const updateTestimonial = (i: number, k: keyof HomeContent["testimonials"][0], v: string | number) =>
    setContent((c) => ({ ...c, testimonials: c.testimonials.map((t, idx) => idx === i ? { ...t, [k]: v } : t) }));
  const addTestimonial    = () =>
    setContent((c) => ({ ...c, testimonials: [...c.testimonials, { id: `t${Date.now()}`, name: "New User", location: "City", avatar: "NU", rating: 5, text: "Great service!", tag: "General" }] }));
  const deleteTestimonial = (i: number) =>
    setContent((c) => ({ ...c, testimonials: c.testimonials.filter((_, idx) => idx !== i) }));

  if (!isConfigured) {
    return (
      <div className="p-6 text-center text-slate-400 text-sm">
        Supabase not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Home Page Content</h2>
          <p className="text-xs text-slate-400 mt-0.5">Banners, stats, badges, testimonials — all live</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-extrabold rounded-xl transition-all ${saved ? "bg-emerald-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"} disabled:opacity-50`}
        >
          <Save className="h-4 w-4" /> {saving ? "Saving…" : saved ? "Saved!" : "Save All"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(["stats", "banners", "badges", "testimonials"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all capitalize ${tab === t ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Stats */}
      {tab === "stats" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          {[
            { label: "Deliveries Today",  key: "deliveriesToday",  type: "text"   },
            { label: "Avg Delivery (min)",key: "avgDeliveryMin",   type: "number" },
            { label: "Rating",            key: "rating",           type: "number" },
            { label: "Happy Customers",   key: "happyCustomers",   type: "text"   },
            { label: "Cities Covered",    key: "citiesCovered",    type: "number" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
              <input
                type={type}
                value={(content.stats[key as keyof typeof content.stats] as string | number) ?? ""}
                onChange={(e) => updateStat(key as keyof HomeContent["stats"], type === "number" ? +e.target.value : e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          ))}
        </div>
      )}

      {/* Banners */}
      {tab === "banners" && (
        <div className="space-y-3">
          {content.banners.map((b, i) => (
            <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              {/* Preview */}
              <div className={`h-16 rounded-xl bg-gradient-to-r ${b.bg} flex items-center gap-3 px-4 mb-4`}>
                <span className="text-2xl">{b.emoji}</span>
                <div>
                  <p className="text-sm font-extrabold text-white leading-none">{b.title}</p>
                  <p className="text-xs text-white/70 mt-0.5">{b.sub}</p>
                </div>
                <span className="ml-auto text-[10px] font-extrabold text-white bg-white/20 px-2 py-0.5 rounded-full">{b.badge}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {([["title", "Title"], ["sub", "Subtitle"], ["bg", "Gradient class"], ["badge", "Badge text"], ["emoji", "Emoji"]] as const).map(([k, lbl]) => (
                  <div key={k} className={k === "title" || k === "bg" ? "col-span-2" : ""}>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">{lbl}</label>
                    <input value={b[k]} onChange={(e) => updateBanner(i, k, e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500/20" />
                  </div>
                ))}
              </div>
              <button onClick={() => deleteBanner(i)} className="mt-3 flex items-center gap-1 text-xs font-bold text-red-500 hover:underline">
                <Trash2 className="h-3 w-3" /> Remove banner
              </button>
            </div>
          ))}
          <button onClick={addBanner} className="w-full py-3 border-2 border-dashed border-blue-200 rounded-2xl text-blue-600 text-sm font-bold hover:border-blue-400 transition-colors flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" /> Add Banner
          </button>
        </div>
      )}

      {/* Trust Badges */}
      {tab === "badges" && (
        <div className="space-y-3">
          {content.trustBadges.map((b, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3">
              <input value={b.icon} onChange={(e) => updateBadge(i, "icon", e.target.value)}
                className="w-12 text-center px-2 py-1.5 text-lg bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
              <input value={b.label} onChange={(e) => updateBadge(i, "label", e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <button onClick={() => deleteBadge(i)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button onClick={addBadge} className="w-full py-3 border-2 border-dashed border-blue-200 rounded-2xl text-blue-600 text-sm font-bold hover:border-blue-400 transition-colors flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" /> Add Badge
          </button>
        </div>
      )}

      {/* Testimonials */}
      {tab === "testimonials" && (
        <div className="space-y-3">
          {content.testimonials.map((t, i) => (
            <div key={t.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <div className="grid grid-cols-2 gap-2 mb-2">
                {([["name", "Name"], ["location", "Location"], ["avatar", "Avatar (initials)"], ["tag", "Tag"]] as const).map(([k, lbl]) => (
                  <div key={k}>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">{lbl}</label>
                    <input value={t[k] as string} onChange={(e) => updateTestimonial(i, k, e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none" />
                  </div>
                ))}
              </div>
              <div className="mb-2">
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Review text</label>
                <textarea value={t.text} onChange={(e) => updateTestimonial(i, "text", e.target.value)} rows={2}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none resize-none" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <label className="text-[10px] font-semibold text-slate-400">Rating</label>
                  <input type="number" min={1} max={5} value={t.rating} onChange={(e) => updateTestimonial(i, "rating", +e.target.value)}
                    className="w-14 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none ml-1" />
                </div>
                <button onClick={() => deleteTestimonial(i)} className="flex items-center gap-1 text-xs font-bold text-red-500 hover:underline">
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
            </div>
          ))}
          <button onClick={addTestimonial} className="w-full py-3 border-2 border-dashed border-blue-200 rounded-2xl text-blue-600 text-sm font-bold hover:border-blue-400 transition-colors flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" /> Add Testimonial
          </button>
        </div>
      )}

      {/* Floating save reminder */}
      <div className="mt-6 p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center gap-2">
        <Edit3 className="h-4 w-4 text-blue-500 shrink-0" />
        <p className="text-xs text-blue-700 font-medium">Click <strong>Save All</strong> at the top after making changes — all content goes live instantly.</p>
      </div>
    </div>
  );
}
