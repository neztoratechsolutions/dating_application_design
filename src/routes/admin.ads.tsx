import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, MousePointerClick, Eye, IndianRupee, Search, Plus, Trash2, BarChart3, Calendar, Loader2, X, ImagePlus } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const PLACEMENTS = ["Home Banner", "Creator Listing", "Wallet Page", "Games Zone", "Splash Screen", "Popup Ads"];
const TYPES = ["Banner", "Video", "Interstitial", "Native"];

type Ad = {
  id: string | number; 
  title: string; 
  banner_url: string; 
  redirect_url: string; 
  placement: string;
  start_date: string; 
  end_date: string; 
  status: string;
  created_at?: string;
  updated_at?: string;
  clicks?: number; 
  impressions?: number;
  revenue?: number; 
  type?: string;
};

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
  const [list, setList] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [placeF, setPlaceF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [analytics, setAnalytics] = useState<Ad | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", banner: "", type: TYPES[0], placement: PLACEMENTS[0], url: "", start: "", end: "" });
  
  // State for Dashboard Counts
  const [counts, setCounts] = useState({
    active_ads: 0,
    scheduled_ads: 0,
    revenue: 0,
    total_clicks: 0,
    impressions: 0
  });

  // Helper to fix relative URLs returned from backend
  const getImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  };

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ad_settings/`);
        if (!res.ok) throw new Error("Failed to fetch ads");
        const json = await res.json();
        const data = Array.isArray(json) ? json : (json?.data || []);
        setList(data);
      } catch (err: any) {
        toast.error(err.message || "Unable to load ads");
      } finally {
        setLoading(false);
      }
    };

    // Fetch Dashboard Counts
    const fetchCounts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ad_settings/dashboard/counts`);
        if (res.ok) setCounts(await res.json());
      } catch (err) {
        console.error("Failed to fetch counts");
      }
    };

    fetchAds();
    fetchCounts();
  }, []);

  const filtered = useMemo(() => list.filter((a) => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (placeF !== "all" && a.placement !== placeF) return false;
    if (statusF !== "all" && a.status !== statusF) return false;
    return true;
  }), [list, search, placeF, statusF]);

  // Uploads file to server (multipart/form-data), gets back URL path string
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/ad_settings/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Image upload failed");
      const data = await res.json();
      setForm(prev => ({ ...prev, banner: data.url }));
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Unable to upload image");
    } finally {
      setUploading(false);
    }
  };

  const createAd = async () => {
    if (!form.title) return toast.error("Title required");
    if (!form.start || !form.end) return toast.error("Start and End dates are required");
    if (!form.banner) return toast.error("Banner image is required");

    try {
      const res = await fetch(`${API_BASE_URL}/ad_settings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          banner_url: form.banner, 
          redirect_url: form.url,
          placement: form.placement,
          start_date: form.start,
          end_date: form.end,
          status: "Active",
        })
      });

      if (!res.ok) throw new Error("Failed to create ad");
      const newAd = await res.json();
      
      setList([newAd, ...list]); 
      setShowForm(false);
      setForm({ title: "", banner: "", type: TYPES[0], placement: PLACEMENTS[0], url: "", start: "", end: "" });
      toast.success("Ad created successfully");

      // Re-fetch counts after creating
      const countsRes = await fetch(`${API_BASE_URL}/ad_settings/dashboard/counts`);
      if (countsRes.ok) setCounts(await countsRes.json());

    } catch (err: any) {
      toast.error(err.message || "Unable to create ad");
    }
  };

  const handleDelete = async (id: string | number) => {
    setList(list.filter((x) => x.id !== id));
    toast.success("Ad deleted");
    
    // Re-fetch counts after deleting
    try {
      const countsRes = await fetch(`${API_BASE_URL}/ad_settings/dashboard/counts`);
      if (countsRes.ok) setCounts(await countsRes.json());
    } catch (e) {}
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Advertisement Management" subtitle="Campaigns, placements & performance"
        action={<button onClick={() => setShowForm(true)} className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold shadow-glow flex items-center gap-2"><Plus className="h-4 w-4" />Create Ad</button>} />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi icon={Megaphone} label="Active Ads" value={counts.active_ads} tone="bg-emerald-500/15 text-emerald-300" />
        <Kpi icon={Calendar} label="Scheduled" value={counts.scheduled_ads} tone="bg-amber-500/15 text-amber-300" />
        <Kpi icon={IndianRupee} label="Revenue" value={`₹${Number(counts.revenue || 0).toLocaleString()}`} tone="bg-primary/15 text-primary" />
        <Kpi icon={MousePointerClick} label="Total Clicks" value={counts.total_clicks.toLocaleString()} tone="bg-sky-500/15 text-sky-300" />
        <Kpi icon={Eye} label="Impressions" value={counts.impressions.toLocaleString()} tone="bg-fuchsia-500/15 text-fuchsia-300" />
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3 flex-wrap md:flex-nowrap">
          <div className="flex-1 w-full flex items-center gap-2 glass rounded-xl px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input placeholder="Search ads" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <select value={placeF} onChange={(e) => setPlaceF(e.target.value)} className="glass rounded-xl px-3 py-2 text-xs outline-none w-full md:w-auto">
            <option value="all">All Placements</option>{PLACEMENTS.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="glass rounded-xl px-3 py-2 text-xs outline-none w-full md:w-auto">
            <option value="all">All Status</option><option>Active</option><option>Scheduled</option><option>Expired</option>
          </select>
        </div>
        <div className="overflow-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">No advertisements found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground"><tr>
                <th className="text-left p-2">Ad</th><th className="text-left p-2">Placement</th>
                <th className="text-right p-2">Clicks</th><th className="text-right p-2">Impr.</th>
                <th className="text-right p-2">CTR</th><th className="text-right p-2">Revenue</th>
                <th className="p-2">Status</th><th className="p-2"></th>
              </tr></thead>
              <tbody>
                {filtered.map((a) => {
                  const c = a.clicks || 0;
                  const i = a.impressions || 0;
                  const r = a.revenue || 0;
                  
                  return (
                    <tr key={a.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                      <td className="p-2"><div className="flex items-center gap-2">
                        {/* FIXED: Using getImageUrl helper */}
                        <img src={getImageUrl(a.banner_url)} alt={a.title} className="h-10 w-16 rounded-lg object-cover bg-glass" />
                        <div><div className="font-medium">{a.title}</div><div className="text-[10px] text-muted-foreground">{a.type || "Banner"} · {a.id}</div></div>
                      </div></td>
                      <td className="p-2 text-xs">{a.placement}</td>
                      <td className="p-2 text-right">{c.toLocaleString()}</td>
                      <td className="p-2 text-right">{i.toLocaleString()}</td>
                      <td className="p-2 text-right">{i ? ((c / i) * 100).toFixed(2) : 0}%</td>
                      <td className="p-2 text-right text-emerald-300">₹{r.toFixed(0)}</td>
                      <td className="p-2 text-center"><span className={`px-2 py-0.5 rounded-full border text-[10px] ${STATUS_TONE[a.status] || STATUS_TONE.Expired}`}>{a.status}</span></td>
                      <td className="p-2"><div className="flex justify-center gap-1">
                        <button onClick={() => setAnalytics(a)} className="p-1.5 rounded-lg glass hover:bg-primary/20"><BarChart3 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg glass hover:bg-rose-500/20 text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass rounded-2xl p-6 max-w-lg w-full space-y-2.5" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-lg mb-2">Create Advertisement</h3>
              
              <input placeholder="Ad title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full glass rounded-xl px-3 py-2 text-sm outline-none" />
              
              {/* Image Upload Field */}
              <div className="space-y-2">
                <label className="block text-xs text-muted-foreground">Banner Image</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 glass rounded-xl px-3 py-2 text-sm cursor-pointer flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} 
                    {uploading ? "Uploading..." : "Upload Image"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                  <input 
                    placeholder="Or paste URL" 
                    value={form.banner.startsWith("uploads/") ? "" : form.banner} 
                    onChange={(e) => setForm({ ...form, banner: e.target.value })} 
                    className="flex-1 glass rounded-xl px-3 py-2 text-sm outline-none" 
                    disabled={uploading}
                  />
                </div>
                {form.banner && (
                  <div className="relative mt-2 rounded-xl overflow-hidden h-28 bg-glass border border-white/10">
                    {/* FIXED: Using getImageUrl helper */}
                    <img src={getImageUrl(form.banner)} alt="Banner Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setForm({ ...form, banner: "" })} 
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-black/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              <input placeholder="Redirect URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="w-full glass rounded-xl px-3 py-2 text-sm outline-none" />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full glass rounded-xl px-3 py-2 text-sm outline-none">{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
              <select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })} className="w-full glass rounded-xl px-3 py-2 text-sm outline-none">{PLACEMENTS.map((t) => <option key={t}>{t}</option>)}</select>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="glass rounded-xl px-3 py-2 text-sm outline-none" />
                <input type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="glass rounded-xl px-3 py-2 text-sm outline-none" />
              </div>
              <div className="flex gap-2 pt-2"><button onClick={() => setShowForm(false)} className="flex-1 glass rounded-xl py-2.5 text-sm">Cancel</button><button onClick={createAd} className="flex-1 rounded-xl bg-gradient-primary py-2.5 text-sm font-semibold">Create</button></div>
            </motion.div>
          </motion.div>
        )}
        {analytics && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4" onClick={() => setAnalytics(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass rounded-2xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
              {/* FIXED: Using getImageUrl helper */}
              <img src={getImageUrl(analytics.banner_url)} className="w-full h-32 rounded-xl object-cover mb-3 bg-glass" />
              <h3 className="font-bold text-lg">{analytics.title}</h3>
              <p className="text-xs text-muted-foreground mb-4">{analytics.placement} · {analytics.start_date} → {analytics.end_date}</p>
              <div className="grid grid-cols-4 gap-2">
                <div className="glass rounded-xl p-3 text-center"><p className="text-[10px] text-muted-foreground">Clicks</p><p className="text-lg font-bold">{analytics.clicks || 0}</p></div>
                <div className="glass rounded-xl p-3 text-center"><p className="text-[10px] text-muted-foreground">Impr.</p><p className="text-lg font-bold">{analytics.impressions || 0}</p></div>
                <div className="glass rounded-xl p-3 text-center"><p className="text-[10px] text-muted-foreground">CTR</p><p className="text-lg font-bold">{(analytics.impressions && analytics.clicks) ? ((analytics.clicks / analytics.impressions) * 100).toFixed(2) : 0}%</p></div>
                <div className="glass rounded-xl p-3 text-center"><p className="text-[10px] text-muted-foreground">Revenue</p><p className="text-lg font-bold text-emerald-300">₹{(analytics.revenue || 0).toFixed(0)}</p></div>
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