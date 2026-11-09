// import { createFileRoute } from "@tanstack/react-router";
// import { useMemo, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { GlassCard, PageHeader } from "@/components/ui-kit";
// import { CREATORS, STATES } from "@/lib/mock-data";
// import { Video, VideoOff, Search, X, Download, Clock, Coins, IndianRupee, Activity, TrendingUp } from "lucide-react";
// import { AreaChart, Area, BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
// import { toast } from "sonner";

// const CUSTOMERS = ["Rahul Kumar","Amit Shah","Vikas Verma","Suresh Reddy","Karan Mehta","Rohan Gupta","Aditya Singh","Manish Yadav","Sandeep Roy","Nikhil Jain"];
// const STATUSES = ["Completed","Missed","Cancelled","Ongoing"] as const;
// type Status = typeof STATUSES[number];

// const CALLS = Array.from({ length: 50 }).map((_, i) => {
//   const creator = CREATORS[i % CREATORS.length];
//   const customer = CUSTOMERS[i % CUSTOMERS.length];
//   const status: Status = i % 13 === 0 ? "Ongoing" : i % 8 === 0 ? "Missed" : i % 15 === 0 ? "Cancelled" : "Completed";
//   const duration = status === "Completed" ? 120 + (i * 53) % 2400 : status === "Ongoing" ? 60 + (i * 17) % 900 : 0;
//   const coins = Math.round((duration / 60) * creator.videoPrice);
//   const start = new Date(Date.now() - i * 1000 * 60 * 23);
//   const end = new Date(start.getTime() + duration * 1000);
//   return { id: `VID-${20000 + i}`, customer, creator, status, duration, coins, revenue: Math.round(coins * 0.8), start, end };
// });

// const STATUS_TONE: Record<Status, string> = {
//   Completed: "bg-success/20 text-success",
//   Missed: "bg-destructive/20 text-destructive",
//   Cancelled: "bg-warning/20 text-warning",
//   Ongoing: "bg-primary/20 text-primary animate-pulse",
// };

// const fmtDur = (s: number) => s ? `${Math.floor(s/60)}m ${s%60}s` : "—";
// const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// const CHART = Array.from({ length: 7 }).map((_, i) => ({
//   day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],
//   calls: 60 + Math.round(Math.random() * 140),
//   revenue: 15000 + Math.round(Math.random() * 25000),
//   minutes: 800 + Math.round(Math.random() * 1500),
// }));

// const TOP_CREATORS = CREATORS.slice(0, 6).map((c, i) => ({ name: c.name.split(" ")[0], calls: 80 - i * 9, revenue: 35000 - i * 4200 }));

// function VideoCallsPage() {
//   const [stateF, setStateF] = useState("All");
//   const [creatorF, setCreatorF] = useState("All");
//   const [statusF, setStatusF] = useState<"All" | Status>("All");
//   const [q, setQ] = useState("");
//   const [open, setOpen] = useState<typeof CALLS[number] | null>(null);

//   const filtered = useMemo(() => CALLS.filter(c =>
//     (stateF === "All" || c.creator.state === stateF) &&
//     (creatorF === "All" || c.creator.name === creatorF) &&
//     (statusF === "All" || c.status === statusF) &&
//     (q === "" || c.id.toLowerCase().includes(q.toLowerCase()) || c.customer.toLowerCase().includes(q.toLowerCase()) || c.creator.name.toLowerCase().includes(q.toLowerCase()))
//   ), [stateF, creatorF, statusF, q]);

//   const stats = useMemo(() => {
//     const total = CALLS.length;
//     const active = CALLS.filter(c => c.status === "Ongoing").length;
//     const totalMin = Math.round(CALLS.reduce((s,c) => s + c.duration, 0) / 60);
//     const completed = CALLS.filter(c => c.status === "Completed");
//     const avg = completed.length ? Math.round(completed.reduce((s,c) => s + c.duration, 0) / completed.length / 60) : 0;
//     const revenue = CALLS.reduce((s,c) => s + c.revenue, 0);
//     const failed = CALLS.filter(c => c.status === "Missed" || c.status === "Cancelled").length;
//     return { total, active, totalMin, avg, revenue, failed };
//   }, []);

//   const exportCsv = () => {
//     const rows = [["ID","Customer","Creator","Start","End","Duration","Coins","Revenue","Status"]];
//     filtered.forEach(c => rows.push([c.id,c.customer,c.creator.name,c.start.toISOString(),c.end.toISOString(),String(c.duration),String(c.coins),String(c.revenue),c.status]));
//     const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
//     const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "video-calls.csv"; a.click();
//     toast.success("Exported CSV");
//   };

//   return (
//     <div>
//       <PageHeader title="Video Calls" subtitle="Video analytics & quality monitoring" action={
//         <button onClick={exportCsv} className="glass rounded-full px-4 py-2 text-sm flex items-center gap-2"><Download className="h-4 w-4" />Export</button>
//       } />

//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
//         {[
//           { l: "Total Video Calls", v: stats.total, icon: Video, tone: "text-primary" },
//           { l: "Active Now", v: stats.active, icon: Activity, tone: "text-success" },
//           { l: "Total Minutes", v: stats.totalMin, icon: Clock, tone: "text-accent" },
//           { l: "Revenue", v: `₹${stats.revenue.toLocaleString()}`, icon: IndianRupee, tone: "text-success" },
//           { l: "Avg Duration", v: `${stats.avg}m`, icon: TrendingUp, tone: "text-warning" },
//           { l: "Failed Calls", v: stats.failed, icon: VideoOff, tone: "text-destructive" },
//         ].map((s,i) => (
//           <GlassCard key={i}>
//             <s.icon className={`h-5 w-5 ${s.tone} mb-2`} />
//             <p className="text-xs text-muted-foreground">{s.l}</p>
//             <p className="text-xl font-bold mt-1">{s.v}</p>
//           </GlassCard>
//         ))}
//       </div>

//       <GlassCard className="mb-4">
//         <div className="flex flex-wrap items-center gap-2">
//           <div className="relative flex-1 min-w-[200px]">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//             <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search video call ID, customer, creator..." className="w-full bg-transparent rounded-full pl-9 pr-4 py-2 text-sm outline-none border border-border" />
//           </div>
//           <select value={stateF} onChange={e => setStateF(e.target.value)} className="glass rounded-full px-3 py-2 text-sm">
//             <option>All</option>{STATES.map(s => <option key={s}>{s}</option>)}
//           </select>
//           <select value={creatorF} onChange={e => setCreatorF(e.target.value)} className="glass rounded-full px-3 py-2 text-sm">
//             <option>All</option>{CREATORS.map(c => <option key={c.id}>{c.name}</option>)}
//           </select>
//           <select value={statusF} onChange={e => setStatusF(e.target.value as any)} className="glass rounded-full px-3 py-2 text-sm">
//             <option>All</option>{STATUSES.map(s => <option key={s}>{s}</option>)}
//           </select>
//         </div>
//       </GlassCard>

//       <div className="grid lg:grid-cols-3 gap-4 mb-6">
//         <GlassCard><p className="text-xs text-muted-foreground mb-2">Video Call Revenue Trend</p>
//           <ResponsiveContainer width="100%" height={180}><AreaChart data={CHART}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Area dataKey="revenue" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.2} /></AreaChart></ResponsiveContainer>
//         </GlassCard>
//         <GlassCard><p className="text-xs text-muted-foreground mb-2">Video Usage Trend</p>
//           <ResponsiveContainer width="100%" height={180}><LineChart data={CHART}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Line dataKey="minutes" stroke="hsl(var(--primary))" strokeWidth={2} /><Line dataKey="calls" stroke="hsl(var(--accent))" strokeWidth={2} /></LineChart></ResponsiveContainer>
//         </GlassCard>
//         <GlassCard><p className="text-xs text-muted-foreground mb-2">Creator Performance</p>
//           <ResponsiveContainer width="100%" height={180}><BarChart data={TOP_CREATORS}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={11} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Bar dataKey="calls" fill="hsl(var(--primary))" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer>
//         </GlassCard>
//       </div>

//       <GlassCard className="p-0 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead className="bg-muted/30 text-xs text-muted-foreground">
//               <tr>{["Video Call ID","Customer","Creator","Start","End","Duration","Coins","Revenue","Status"].map(h => <th key={h} className="text-left p-3 font-medium">{h}</th>)}</tr>
//             </thead>
//             <tbody>
//               {filtered.slice(0, 30).map(c => (
//                 <tr key={c.id} onClick={() => setOpen(c)} className="border-t border-border hover:bg-muted/20 cursor-pointer">
//                   <td className="p-3 font-mono text-xs">{c.id}</td>
//                   <td className="p-3">{c.customer}</td>
//                   <td className="p-3 flex items-center gap-2"><img src={c.creator.avatar} className="h-6 w-6 rounded-full" alt="" />{c.creator.name}</td>
//                   <td className="p-3 text-xs text-muted-foreground">{fmtTime(c.start)}</td>
//                   <td className="p-3 text-xs text-muted-foreground">{c.status === "Ongoing" ? "—" : fmtTime(c.end)}</td>
//                   <td className="p-3">{fmtDur(c.duration)}</td>
//                   <td className="p-3"><span className="inline-flex items-center gap-1"><Coins className="h-3 w-3 text-amber-500" />{c.coins}</span></td>
//                   <td className="p-3 text-success font-semibold">₹{c.revenue}</td>
//                   <td className="p-3"><span className={`text-[10px] rounded-full px-2 py-0.5 ${STATUS_TONE[c.status]}`}>{c.status}</span></td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </GlassCard>

//       <AnimatePresence>
//         {open && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(null)}>
//             <motion.div initial={{ y: 20, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.96 }} className="glass rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
//               <div className="flex items-center justify-between mb-4">
//                 <div><p className="text-xs text-muted-foreground">Video Call Detail</p><h3 className="text-lg font-bold font-mono">{open.id}</h3></div>
//                 <button onClick={() => setOpen(null)} className="rounded-full p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
//               </div>
//               <div className="glass-strong rounded-xl p-3 mb-3">
//                 <p className="text-xs font-semibold mb-2">Call Information</p>
//                 <div className="grid grid-cols-3 gap-2 text-xs">
//                   <div><p className="text-muted-foreground">Started</p><p>{open.start.toLocaleString()}</p></div>
//                   <div><p className="text-muted-foreground">Ended</p><p>{open.status === "Ongoing" ? "Live" : open.end.toLocaleString()}</p></div>
//                   <div><p className="text-muted-foreground">Duration</p><p>{fmtDur(open.duration)}</p></div>
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-3 mb-3">
//                 <div className="glass-strong rounded-xl p-3">
//                   <p className="text-xs font-semibold mb-1">Customer</p>
//                   <p className="font-semibold text-sm">{open.customer}</p>
//                 </div>
//                 <div className="glass-strong rounded-xl p-3">
//                   <p className="text-xs font-semibold mb-1">Creator</p>
//                   <div className="flex items-center gap-2"><img src={open.creator.avatar} className="h-7 w-7 rounded-full" alt="" /><div><p className="font-semibold text-sm">{open.creator.name}</p><p className="text-[10px] text-muted-foreground">{open.creator.state}</p></div></div>
//                 </div>
//               </div>
//               <div className="glass-strong rounded-xl p-4 mb-3">
//                 <p className="text-xs font-semibold mb-2">Revenue Split</p>
//                 <div className="space-y-1 text-xs">
//                   <div className="flex justify-between"><span className="text-muted-foreground">Coins Used</span><span>{open.coins}</span></div>
//                   <div className="flex justify-between"><span className="text-muted-foreground">Creator (60%)</span><span>₹{Math.round(open.revenue * 0.6)}</span></div>
//                   <div className="flex justify-between"><span className="text-muted-foreground">Platform (40%)</span><span>₹{Math.round(open.revenue * 0.4)}</span></div>
//                   <div className="flex justify-between font-bold pt-1 border-t border-border"><span>Total</span><span className="text-success">₹{open.revenue}</span></div>
//                 </div>
//               </div>
//               <div className="glass-strong rounded-xl p-4">
//                 <p className="text-xs font-semibold mb-2">Complaint History</p>
//                 <p className="text-xs text-muted-foreground">No complaints on file.</p>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// export const Route = createFileRoute("/admin/video-logs")({ component: VideoCallsPage });
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import {
  Video, VideoOff, Search, X, Download, Clock, Coins, IndianRupee,
  Activity, TrendingUp, RefreshCw, Loader2, AlertCircle, ChevronLeft,
  ChevronRight, Filter,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";
const PAGE_LIMIT = 20;

// ---- API response types (matching serialize_video_call + the {status_code,message,data} wrapper) ----

interface CallItem {
  id: number;
  video_call_id: string;
  customer_id: number | null;
  customer: string;
  creator_id: number | null;
  creator: string;
  caller_id: number | null;
  receiver_id: number | null;
  start_time: string | null;
  end_time: string | null;
  duration: number;          // minutes
  duration_seconds: number;
  duration_formatted: string;
  coins: number;
  revenue: number;
  status: string;
  is_free_call: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface Overview {
  total_video_calls: number;
  active_now: number;
  total_minutes: number;
  revenue: number;
  average_duration_minutes: number;
  failed_calls: number;
}

interface RevenuePoint { date: string; day: string; revenue: number; }
interface UsagePoint { date: string; day: string; minutes: number; }
interface CreatorPerf {
  creator_id: number;
  creator: string;
  total_calls: number;
  total_minutes: number;
  total_revenue: number;
  total_coins: number;
}

const STATUS_OPTIONS = ["all", "completed", "ongoing", "missed", "cancelled", "failed"] as const;

const inr = (n: number) =>
  n < 0 ? `-₹${Math.abs(n).toLocaleString("en-IN")}` : `₹${n.toLocaleString("en-IN")}`;

function statusTone(s: string): string {
  const v = (s || "").toLowerCase();
  if (v === "completed") return "bg-success/20 text-success";
  if (v === "missed" || v === "failed") return "bg-destructive/20 text-destructive";
  if (v === "cancelled" || v === "canceled" || v === "rejected") return "bg-warning/20 text-warning";
  if (["ongoing", "ringing", "active", "connected"].includes(v))
    return "bg-primary/20 text-primary animate-pulse";
  return "bg-muted/30 text-muted-foreground";
}

function titleStatus(s: string): string {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function isActive(s: string): boolean {
  return ["ongoing", "ringing", "active", "connected"].includes((s || "").toLowerCase());
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function avatarFor(id: number | null, name: string): string {
  return `https://i.pravatar.cc/200?u=${id ?? name}`;
}

// ---- API helpers ----

async function getJson(url: string) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

async function fetchOverview(): Promise<Overview> {
  const j = await getJson(`${API_BASE}/video-calls/admin/dashboard`);
  return j.data;
}
async function fetchRevenueTrend(): Promise<RevenuePoint[]> {
  const j = await getJson(`${API_BASE}/video-calls/admin/revenue-trend`);
  return j.data || [];
}
async function fetchUsageTrend(): Promise<UsagePoint[]> {
  const j = await getJson(`${API_BASE}/video-calls/admin/usage-trend`);
  return j.data || [];
}
async function fetchCreatorPerf(): Promise<CreatorPerf[]> {
  const j = await getJson(`${API_BASE}/video-calls/admin/creator-performance?limit=6`);
  return j.data || [];
}

interface ListResult {
  data: CallItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

async function fetchCalls(params: {
  search: string; status: string; startDate: string; endDate: string; page: number; limit: number;
}): Promise<ListResult> {
  const sp = new URLSearchParams();
  if (params.search.trim()) sp.set("search", params.search.trim());
  if (params.status !== "all") sp.set("status", params.status);
  if (params.startDate) sp.set("start_date", params.startDate);
  if (params.endDate) sp.set("end_date", params.endDate);
  sp.set("page", String(params.page));
  sp.set("limit", String(params.limit));
  const j = await getJson(`${API_BASE}/video-calls/admin/admin-list?${sp.toString()}`);
  return {
    data: j.data || [],
    total: j.total ?? 0,
    page: j.page ?? params.page,
    limit: j.limit ?? params.limit,
    total_pages: j.total_pages ?? 1,
  };
}

function VideoCallsPage() {
  // Top-level dashboard + charts
  const [overview, setOverview] = useState<Overview | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<RevenuePoint[]>([]);
  const [usageTrend, setUsageTrend] = useState<UsagePoint[]>([]);
  const [creatorPerf, setCreatorPerf] = useState<CreatorPerf[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [topError, setTopError] = useState<string | null>(null);

  // List + pagination
  const [calls, setCalls] = useState<CallItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingCalls, setLoadingCalls] = useState(true);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selected, setSelected] = useState<CallItem | null>(null);

  const loadTop = useCallback(async () => {
    setLoadingTop(true);
    setTopError(null);
    try {
      const [o, r, u, c] = await Promise.all([
        fetchOverview(),
        fetchRevenueTrend(),
        fetchUsageTrend(),
        fetchCreatorPerf(),
      ]);
      setOverview(o);
      setRevenueTrend(r);
      setUsageTrend(u);
      setCreatorPerf(c);
    } catch (e: any) {
      const msg = e?.message || "Failed to load dashboard";
      setTopError(msg);
      toast.error(msg);
    } finally {
      setLoadingTop(false);
    }
  }, []);

  useEffect(() => { loadTop(); }, [loadTop]);

  // Debounce the search box; reset to page 1 when any filter changes.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const onStatus = (v: string) => { setStatusF(v); setPage(1); };
  const onStartDate = (v: string) => { setStartDate(v); setPage(1); };
  const onEndDate = (v: string) => { setEndDate(v); setPage(1); };

  const loadCalls = useCallback(async () => {
    setLoadingCalls(true);
    try {
      const r = await fetchCalls({
        search, status: statusF, startDate, endDate, page, limit: PAGE_LIMIT,
      });
      setCalls(r.data);
      setTotal(r.total);
      setTotalPages(r.total_pages);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load calls");
      setCalls([]);
    } finally {
      setLoadingCalls(false);
    }
  }, [search, statusF, startDate, endDate, page]);

  useEffect(() => { loadCalls(); }, [loadCalls]);

  const clearFilters = () => {
    setSearchInput(""); setSearch(""); setStatusF("all");
    setStartDate(""); setEndDate(""); setPage(1);
  };

  const hasFilters = search || statusF !== "all" || startDate || endDate;

  // Server-side CSV export with the current filters applied.
  const exportCsv = async () => {
    try {
      const sp = new URLSearchParams();
      if (search.trim()) sp.set("search", search.trim());
      if (statusF !== "all") sp.set("status", statusF);
      if (startDate) sp.set("start_date", startDate);
      if (endDate) sp.set("end_date", endDate);
      const res = await fetch(`${API_BASE}/video-calls/admin/admin-export?${sp.toString()}`);
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "video_calls.csv"; a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported CSV");
    } catch (e: any) {
      toast.error(e?.message || "Export failed");
    }
  };

  const chartCreator = useMemo(
    () => creatorPerf.map(c => ({ name: (c.creator || "?").split(" ")[0], calls: c.total_calls })),
    [creatorPerf],
  );

  const refreshAll = () => { loadTop(); loadCalls(); };

  if (loadingTop && !overview) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (topError && !overview) {
    return (
      <div>
        <PageHeader title="Video Calls" subtitle="Video analytics & quality monitoring" />
        <GlassCard className="text-center py-20 flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="font-bold text-lg">Failed to Load Dashboard</h3>
            <p className="text-sm text-muted-foreground mt-1">{topError}</p>
          </div>
          <button onClick={loadTop} className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </GlassCard>
      </div>
    );
  }

  const stats = [
    { l: "Total Video Calls", v: (overview?.total_video_calls ?? 0).toLocaleString(), icon: Video, tone: "text-primary" },
    { l: "Active Now", v: (overview?.active_now ?? 0).toLocaleString(), icon: Activity, tone: "text-success" },
    { l: "Total Minutes", v: (overview?.total_minutes ?? 0).toLocaleString(), icon: Clock, tone: "text-accent" },
    { l: "Revenue", v: inr(overview?.revenue ?? 0), icon: IndianRupee, tone: "text-success" },
    { l: "Avg Duration", v: `${overview?.average_duration_minutes ?? 0}m`, icon: TrendingUp, tone: "text-warning" },
    { l: "Failed Calls", v: (overview?.failed_calls ?? 0).toLocaleString(), icon: VideoOff, tone: "text-destructive" },
  ];

  return (
    <div>
      <PageHeader
        title="Video Calls"
        subtitle="Video analytics & quality monitoring"
        action={
          <div className="flex gap-2">
            <button onClick={refreshAll} disabled={loadingTop || loadingCalls} className="glass rounded-full px-3 py-2 text-sm flex items-center gap-2 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loadingTop || loadingCalls ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button onClick={exportCsv} className="glass rounded-full px-4 py-2 text-sm flex items-center gap-2">
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        }
      />

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {stats.map((s, i) => (
          <GlassCard key={i}>
            <s.icon className={`h-5 w-5 ${s.tone} mb-2`} />
            <p className="text-xs text-muted-foreground">{s.l}</p>
            <p className="text-xl font-bold mt-1">{s.v}</p>
          </GlassCard>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <GlassCard>
          <p className="text-xs text-muted-foreground mb-2">Video Call Revenue Trend</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="day" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Area dataKey="revenue" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-muted-foreground mb-2">Video Usage Trend (minutes)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={usageTrend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="day" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line dataKey="minutes" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-muted-foreground mb-2">Creator Performance</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartCreator}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search video call ID, customer, creator..."
              className="w-full bg-transparent rounded-full pl-9 pr-4 py-2 text-sm outline-none border border-border"
            />
          </div>
          <select value={statusF} onChange={e => onStatus(e.target.value)} className="glass rounded-full px-3 py-2 text-sm">
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s === "all" ? "All status" : titleStatus(s)}</option>
            ))}
          </select>
          <input type="date" value={startDate} onChange={e => onStartDate(e.target.value)} className="glass rounded-full px-3 py-2 text-sm" />
          <span className="text-xs text-muted-foreground">to</span>
          <input type="date" value={endDate} onChange={e => onEndDate(e.target.value)} className="glass rounded-full px-3 py-2 text-sm" />
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Filter className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs text-muted-foreground">
              <tr>
                {["Video Call ID", "Customer", "Creator", "Start", "End", "Duration", "Coins", "Revenue", "Status"].map(h => (
                  <th key={h} className="text-left p-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingCalls ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" /> Loading calls…
                  </td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-muted-foreground">No video calls match your filters</td>
                </tr>
              ) : calls.map(c => (
                <tr key={c.id} onClick={() => setSelected(c)} className="border-t border-border hover:bg-muted/20 cursor-pointer">
                  <td className="p-3 font-mono text-xs">{c.video_call_id}</td>
                  <td className="p-3">{c.customer}</td>
                  <td className="p-3 flex items-center gap-2">
                    <img src={avatarFor(c.creator_id, c.creator)} className="h-6 w-6 rounded-full" alt="" />
                    {c.creator}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{fmtTime(c.start_time)}</td>
                  <td className="p-3 text-xs text-muted-foreground">{c.end_time ? fmtTime(c.end_time) : (isActive(c.status) ? "Live" : "—")}</td>
                  <td className="p-3">{c.duration_formatted || "—"}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1"><Coins className="h-3 w-3 text-amber-500" />{c.coins}</span>
                  </td>
                  <td className="p-3 text-success font-semibold">{inr(c.revenue)}</td>
                  <td className="p-3"><span className={`text-[10px] rounded-full px-2 py-0.5 ${statusTone(c.status)}`}>{titleStatus(c.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-3 border-t border-border text-xs">
          <p className="text-muted-foreground">{total} records · page {page} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="glass rounded-full p-1.5 disabled:opacity-40">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="glass rounded-full p-1.5 disabled:opacity-40">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Detail modal — uses the row's full serialized data (the /admin-list/{id} endpoint returns the same shape) */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <motion.div initial={{ y: 20, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.96 }} className="glass rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Video Call Detail</p>
                  <h3 className="text-lg font-bold font-mono">{selected.video_call_id}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="rounded-full p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
              </div>

              <div className="glass-strong rounded-xl p-3 mb-3">
                <p className="text-xs font-semibold mb-2">Call Information</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><p className="text-muted-foreground">Started</p><p>{fmtDateTime(selected.start_time)}</p></div>
                  <div><p className="text-muted-foreground">Ended</p><p>{selected.end_time ? fmtDateTime(selected.end_time) : (isActive(selected.status) ? "Live" : "—")}</p></div>
                  <div><p className="text-muted-foreground">Duration</p><p>{selected.duration_formatted || "—"}</p></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="glass-strong rounded-xl p-3">
                  <p className="text-xs font-semibold mb-1">Customer</p>
                  <p className="font-semibold text-sm">{selected.customer}</p>
                </div>
                <div className="glass-strong rounded-xl p-3">
                  <p className="text-xs font-semibold mb-1">Creator</p>
                  <div className="flex items-center gap-2">
                    <img src={avatarFor(selected.creator_id, selected.creator)} className="h-7 w-7 rounded-full" alt="" />
                    <div>
                      <p className="font-semibold text-sm">{selected.creator}</p>
                      <p className="text-[10px] text-muted-foreground">ID {selected.creator_id ?? "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-strong rounded-xl p-4 mb-3">
                <p className="text-xs font-semibold mb-2">Revenue & Coins</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Coins Used</span><span>{selected.coins}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Revenue</span><span className="text-success font-semibold">{inr(selected.revenue)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Free Call</span><span>{selected.is_free_call ? "Yes" : "No"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                    <span className={`text-[10px] rounded-full px-2 py-0.5 ${statusTone(selected.status)}`}>{titleStatus(selected.status)}</span>
                  </div>
                </div>
              </div>

              <div className="glass-strong rounded-xl p-4 mb-3">
                <p className="text-xs font-semibold mb-2">Revenue Split <span className="text-[10px] text-muted-foreground font-normal">(illustrative 60/40 — not from API)</span></p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Creator (60%)</span><span>{inr(Math.round(selected.revenue * 0.6))}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Platform (40%)</span><span>{inr(Math.round(selected.revenue * 0.4))}</span></div>
                  <div className="flex justify-between font-bold pt-1 border-t border-border"><span>Total</span><span className="text-success">{inr(selected.revenue)}</span></div>
                </div>
              </div>

              <div className="glass-strong rounded-xl p-4">
                <p className="text-xs font-semibold mb-2">Complaint History</p>
                <p className="text-xs text-muted-foreground">No complaints on file.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const Route = createFileRoute("/admin/video-logs")({ component: VideoCallsPage });
