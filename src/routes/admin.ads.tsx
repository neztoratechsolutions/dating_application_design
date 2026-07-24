import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, MousePointerClick, Eye, IndianRupee, Search, Plus, Trash2, BarChart3, Calendar } from "lucide-react";

const PLACEMENTS = ["Home Banner", "Creator Listing", "Wallet Page", "Games Zone", "Splash Screen", "Popup Ads"];
const TYPES = ["Banner", "Video", "Interstitial", "Native"];

type Ad = {
  id: string; title: string; banner: string; type: string; placement: string;
  url: string; start: string; end: string; clicks: number; impressions: number;
  revenue: number; status: "Active" | "Scheduled" | "Expired";
};

const seed: Ad[] = Array.from({ length: 22 }).map((_, i) => {
  const status = (["Active", "Active", "Scheduled", "Expired"] as const)[i % 4];
  const impr = status === "Scheduled" ? 0 : 20000 + Math.floor(Math.random() * 180000);
  const clicks = Math.floor(impr * (0.01 + Math.random() * 0.05));
  return {
    id: `AD-${5000 + i}`,
    title: ["Diwali Recharge Bonus", "Premium Creators", "Daily Scratch ₹500", "VIP Wallet Offer", "New User 100% Bonus"][i % 5],
    banner: `https://picsum.photos/seed/ad${i}/200/100`,
    type: TYPES[i % TYPES.length],
    placement: PLACEMENTS[i % PLACEMENTS.length],
    url: "https://velora.live/promo",
    start: "2026-06-01", end: "2026-06-30",
    clicks, impressions: impr, revenue: clicks * (2 + Math.random() * 8),
    status,
  };
});

const STATUS_TONE: Record<string, string> = {
  Active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Scheduled: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Expired: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

function Kpi({ icon: Icon, label, value, tone }: any) {
  return (
    <GlassCard><div className="flex items-start justify-between">
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold mt-1">{value}</p></div>
      <div className={`rounded-xl p-2 ${tone}`}><Icon className="h-5 w-5" /></div>
    </div></GlassCard>
  );
}

function Page() {
  const [list, setList] = useState<Ad[]>(seed);
  const [search, setSearch] = useState("");
  const [placeF, setPlaceF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [analytics, setAnalytics] = useState<Ad | null>(null);
  const [form, setForm] = useState({ title: "", banner: "", type: TYPES[0], placement: PLACEMENTS[0], url: "", start: "", end: "" });

  const active = list.filter((a) => a.status === "Active").length;
  const scheduled = list.filter((a) => a.status === "Scheduled").length;
  const revenue = list.reduce((a, b) => a + b.revenue, 0);
  const clicks = list.reduce((a, b) => a + b.clicks, 0);
  const impr = list.reduce((a, b) => a + b.impressions, 0);

  const filtered = useMemo(() => list.filter((a) => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (placeF !== "all" && a.placement !== placeF) return false;
    if (statusF !== "all" && a.status !== statusF) return false;
    return true;
  }), [list, search, placeF, statusF]);

  function create() {
    if (!form.title) return toast.error("Title required");
    const ad: Ad = {
      id: `AD-${9000 + list.length}`, ...form,
      banner: form.banner || `https://picsum.photos/seed/new${list.length}/200/100`,
      clicks: 0, impressions: 0, revenue: 0, status: "Scheduled",
    };
    setList([ad, ...list]); setShowForm(false);
    setForm({ title: "", banner: "", type: TYPES[0], placement: PLACEMENTS[0], url: "", start: "", end: "" });
    toast.success("Ad created");
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Advertisement Management" subtitle="Campaigns, placements & performance"
        action={<button onClick={() => setShowForm(true)} className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold shadow-glow flex items-center gap-2"><Plus className="h-4 w-4" />Create Ad</button>} />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi icon={Megaphone} label="Active Ads" value={active} tone="bg-emerald-500/15 text-emerald-300" />
        <Kpi icon={Calendar} label="Scheduled" value={scheduled} tone="bg-amber-500/15 text-amber-300" />
        <Kpi icon={IndianRupee} label="Revenue" value={`₹${(revenue / 1000).toFixed(1)}K`} tone="bg-primary/15 text-primary" />
        <Kpi icon={MousePointerClick} label="Total Clicks" value={clicks.toLocaleString()} tone="bg-sky-500/15 text-sky-300" />
        <Kpi icon={Eye} label="Impressions" value={impr.toLocaleString()} tone="bg-fuchsia-500/15 text-fuchsia-300" />
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 glass rounded-xl px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input placeholder="Search ads" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <select value={placeF} onChange={(e) => setPlaceF(e.target.value)} className="glass rounded-xl px-3 py-2 text-xs outline-none">
            <option value="all">All Placements</option>{PLACEMENTS.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="glass rounded-xl px-3 py-2 text-xs outline-none">
            <option value="all">All Status</option><option>Active</option><option>Scheduled</option><option>Expired</option>
          </select>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground"><tr>
              <th className="text-left p-2">Ad</th><th className="text-left p-2">Placement</th>
              <th className="text-right p-2">Clicks</th><th className="text-right p-2">Impr.</th>
              <th className="text-right p-2">CTR</th><th className="text-right p-2">Revenue</th>
              <th className="p-2">Status</th><th className="p-2"></th>
            </tr></thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="p-2"><div className="flex items-center gap-2">
                    <img src={a.banner} alt={a.title} className="h-10 w-16 rounded-lg object-cover" />
                    <div><div className="font-medium">{a.title}</div><div className="text-[10px] text-muted-foreground">{a.type} · {a.id}</div></div>
                  </div></td>
                  <td className="p-2 text-xs">{a.placement}</td>
                  <td className="p-2 text-right">{a.clicks.toLocaleString()}</td>
                  <td className="p-2 text-right">{a.impressions.toLocaleString()}</td>
                  <td className="p-2 text-right">{a.impressions ? ((a.clicks / a.impressions) * 100).toFixed(2) : 0}%</td>
                  <td className="p-2 text-right text-emerald-300">₹{a.revenue.toFixed(0)}</td>
                  <td className="p-2 text-center"><span className={`px-2 py-0.5 rounded-full border text-[10px] ${STATUS_TONE[a.status]}`}>{a.status}</span></td>
                  <td className="p-2"><div className="flex justify-center gap-1">
                    <button onClick={() => setAnalytics(a)} className="p-1.5 rounded-lg glass hover:bg-primary/20"><BarChart3 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { setList(list.filter((x) => x.id !== a.id)); toast.success("Deleted"); }} className="p-1.5 rounded-lg glass hover:bg-rose-500/20 text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass rounded-2xl p-6 max-w-lg w-full space-y-2.5" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-lg mb-2">Create Advertisement</h3>
              <input placeholder="Ad title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full glass rounded-xl px-3 py-2 text-sm outline-none" />
              <input placeholder="Banner URL" value={form.banner} onChange={(e) => setForm({ ...form, banner: e.target.value })} className="w-full glass rounded-xl px-3 py-2 text-sm outline-none" />
              <input placeholder="Redirect URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="w-full glass rounded-xl px-3 py-2 text-sm outline-none" />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full glass rounded-xl px-3 py-2 text-sm outline-none">{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
              <select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })} className="w-full glass rounded-xl px-3 py-2 text-sm outline-none">{PLACEMENTS.map((t) => <option key={t}>{t}</option>)}</select>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="glass rounded-xl px-3 py-2 text-sm outline-none" />
                <input type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="glass rounded-xl px-3 py-2 text-sm outline-none" />
              </div>
              <div className="flex gap-2 pt-2"><button onClick={() => setShowForm(false)} className="flex-1 glass rounded-xl py-2.5 text-sm">Cancel</button><button onClick={create} className="flex-1 rounded-xl bg-gradient-primary py-2.5 text-sm font-semibold">Create</button></div>
            </motion.div>
          </motion.div>
        )}
        {analytics && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4" onClick={() => setAnalytics(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass rounded-2xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
              <img src={analytics.banner} className="w-full h-32 rounded-xl object-cover mb-3" />
              <h3 className="font-bold text-lg">{analytics.title}</h3>
              <p className="text-xs text-muted-foreground mb-4">{analytics.placement} · {analytics.start} → {analytics.end}</p>
              <div className="grid grid-cols-4 gap-2">
                <div className="glass rounded-xl p-3 text-center"><p className="text-[10px] text-muted-foreground">Clicks</p><p className="text-lg font-bold">{analytics.clicks}</p></div>
                <div className="glass rounded-xl p-3 text-center"><p className="text-[10px] text-muted-foreground">Impr.</p><p className="text-lg font-bold">{analytics.impressions}</p></div>
                <div className="glass rounded-xl p-3 text-center"><p className="text-[10px] text-muted-foreground">CTR</p><p className="text-lg font-bold">{analytics.impressions ? ((analytics.clicks / analytics.impressions) * 100).toFixed(2) : 0}%</p></div>
                <div className="glass rounded-xl p-3 text-center"><p className="text-[10px] text-muted-foreground">Revenue</p><p className="text-lg font-bold text-emerald-300">₹{analytics.revenue.toFixed(0)}</p></div>
              </div>
              <button onClick={() => setAnalytics(null)} className="mt-4 w-full rounded-xl bg-gradient-primary py-2.5 font-semibold">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const Route = createFileRoute("/admin/ads")({ component: Page });
