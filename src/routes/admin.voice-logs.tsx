// import { createFileRoute } from "@tanstack/react-router";
// import { useMemo, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { GlassCard, PageHeader } from "@/components/ui-kit";
// import { CREATORS, STATES } from "@/lib/mock-data";
// import { Phone, PhoneOff, PhoneCall, PhoneMissed, Search, X, Download, TrendingUp, Clock, Coins, IndianRupee, Activity } from "lucide-react";
// import { AreaChart, Area, BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
// import { toast } from "sonner";

// const CUSTOMERS = ["Rahul Kumar","Amit Shah","Vikas Verma","Suresh Reddy","Karan Mehta","Rohan Gupta","Aditya Singh","Manish Yadav","Sandeep Roy","Nikhil Jain","Arjun Nair","Deepak Iyer"];
// const STATUSES = ["Completed","Missed","Cancelled","Ongoing"] as const;
// type Status = typeof STATUSES[number];

// const CALLS = Array.from({ length: 60 }).map((_, i) => {
//   const creator = CREATORS[i % CREATORS.length];
//   const customer = CUSTOMERS[i % CUSTOMERS.length];
//   const status: Status = i % 11 === 0 ? "Ongoing" : i % 9 === 0 ? "Missed" : i % 13 === 0 ? "Cancelled" : "Completed";
//   const duration = status === "Completed" ? 60 + (i * 37) % 1800 : status === "Ongoing" ? 30 + (i * 11) % 600 : 0;
//   const coins = Math.round((duration / 60) * creator.voicePrice);
//   const start = new Date(Date.now() - i * 1000 * 60 * 17);
//   const end = new Date(start.getTime() + duration * 1000);
//   return {
//     id: `VC-${10000 + i}`,
//     customer, creator, status, duration, coins,
//     revenue: Math.round(coins * 0.8),
//     start, end,
//   };
// });

// const STATUS_TONE: Record<Status, string> = {
//   Completed: "bg-success/20 text-success",
//   Missed: "bg-destructive/20 text-destructive",
//   Cancelled: "bg-warning/20 text-warning",
//   Ongoing: "bg-primary/20 text-primary animate-pulse",
// };

// const fmtDur = (s: number) => s ? `${Math.floor(s/60)}m ${s%60}s` : "—";
// const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// const CHART_DAILY = Array.from({ length: 7 }).map((_, i) => ({
//   day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],
//   calls: 120 + Math.round(Math.random() * 200),
//   revenue: 8000 + Math.round(Math.random() * 12000),
//   avg: 4 + Math.round(Math.random() * 8),
// }));

// function VoiceCallsPage() {
//   const [range, setRange] = useState("Today");
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
//     const ongoing = CALLS.filter(c => c.status === "Ongoing").length;
//     const totalMin = Math.round(CALLS.reduce((s,c) => s + c.duration, 0) / 60);
//     const completed = CALLS.filter(c => c.status === "Completed");
//     const avg = completed.length ? Math.round(completed.reduce((s,c) => s + c.duration, 0) / completed.length / 60) : 0;
//     const revenue = CALLS.reduce((s,c) => s + c.revenue, 0);
//     const failed = CALLS.filter(c => c.status === "Missed" || c.status === "Cancelled").length;
//     return { total, ongoing, totalMin, avg, revenue, failed };
//   }, []);

//   const exportCsv = () => {
//     const rows = [["ID","Customer","Creator","Start","End","Duration(s)","Coins","Revenue","Status"]];
//     filtered.forEach(c => rows.push([c.id,c.customer,c.creator.name,c.start.toISOString(),c.end.toISOString(),String(c.duration),String(c.coins),String(c.revenue),c.status]));
//     const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
//     const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "voice-calls.csv"; a.click();
//     toast.success("Exported CSV");
//   };

//   return (
//     <div>
//       <PageHeader title="Voice Calls" subtitle="Telecom-grade voice monitoring & analytics" action={
//         <button onClick={exportCsv} className="glass rounded-full px-4 py-2 text-sm flex items-center gap-2"><Download className="h-4 w-4" />Export</button>
//       } />

//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
//         {[
//           { l: "Total Calls Today", v: stats.total, icon: Phone, tone: "text-primary" },
//           { l: "Active Now", v: stats.ongoing, icon: PhoneCall, tone: "text-success" },
//           { l: "Total Minutes", v: stats.totalMin, icon: Clock, tone: "text-accent" },
//           { l: "Avg Duration", v: `${stats.avg}m`, icon: Activity, tone: "text-warning" },
//           { l: "Revenue", v: `₹${stats.revenue.toLocaleString()}`, icon: IndianRupee, tone: "text-success" },
//           { l: "Failed Calls", v: stats.failed, icon: PhoneMissed, tone: "text-destructive" },
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
//             <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search call ID, customer, creator..." className="w-full bg-transparent rounded-full pl-9 pr-4 py-2 text-sm outline-none border border-border" />
//           </div>
//           <select value={range} onChange={e => setRange(e.target.value)} className="glass rounded-full px-3 py-2 text-sm">
//             {["Today","Last 7 Days","Last 30 Days"].map(o => <option key={o}>{o}</option>)}
//           </select>
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
//         <GlassCard><p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><TrendingUp className="h-3 w-3" />Daily Call Volume</p>
//           <ResponsiveContainer width="100%" height={180}><AreaChart data={CHART_DAILY}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Area dataKey="calls" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} /></AreaChart></ResponsiveContainer>
//         </GlassCard>
//         <GlassCard><p className="text-xs text-muted-foreground mb-2">Revenue by Calls</p>
//           <ResponsiveContainer width="100%" height={180}><BarChart data={CHART_DAILY}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Bar dataKey="revenue" fill="hsl(var(--success))" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer>
//         </GlassCard>
//         <GlassCard><p className="text-xs text-muted-foreground mb-2">Avg Duration Trend</p>
//           <ResponsiveContainer width="100%" height={180}><LineChart data={CHART_DAILY}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Line dataKey="avg" stroke="hsl(var(--accent))" strokeWidth={2} /></LineChart></ResponsiveContainer>
//         </GlassCard>
//       </div>

//       <GlassCard className="p-0 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead className="bg-muted/30 text-xs text-muted-foreground">
//               <tr>{["Call ID","Customer","Creator","Start","End","Duration","Coins","Revenue","Status"].map(h => <th key={h} className="text-left p-3 font-medium">{h}</th>)}</tr>
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
//                 <div><p className="text-xs text-muted-foreground">Call Detail</p><h3 className="text-lg font-bold font-mono">{open.id}</h3></div>
//                 <button onClick={() => setOpen(null)} className="rounded-full p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
//               </div>
//               <div className="grid grid-cols-2 gap-3 mb-4">
//                 <div className="glass-strong rounded-xl p-3">
//                   <p className="text-[10px] text-muted-foreground mb-1">Customer</p>
//                   <p className="font-semibold">{open.customer}</p>
//                 </div>
//                 <div className="glass-strong rounded-xl p-3">
//                   <p className="text-[10px] text-muted-foreground mb-1">Creator</p>
//                   <div className="flex items-center gap-2"><img src={open.creator.avatar} className="h-7 w-7 rounded-full" alt="" /><div><p className="font-semibold text-sm">{open.creator.name}</p><p className="text-[10px] text-muted-foreground">{open.creator.state}</p></div></div>
//                 </div>
//               </div>
//               <div className="grid grid-cols-3 gap-2 mb-4">
//                 <div className="glass-strong rounded-xl p-3"><p className="text-[10px] text-muted-foreground">Duration</p><p className="font-bold">{fmtDur(open.duration)}</p></div>
//                 <div className="glass-strong rounded-xl p-3"><p className="text-[10px] text-muted-foreground">Coins</p><p className="font-bold">{open.coins}</p></div>
//                 <div className="glass-strong rounded-xl p-3"><p className="text-[10px] text-muted-foreground">Revenue</p><p className="font-bold text-success">₹{open.revenue}</p></div>
//               </div>
//               <div className="glass-strong rounded-xl p-4 mb-4">
//                 <p className="text-xs font-semibold mb-2">Revenue Split</p>
//                 <div className="space-y-1 text-xs">
//                   <div className="flex justify-between"><span className="text-muted-foreground">Creator (60%)</span><span>₹{Math.round(open.revenue * 0.6)}</span></div>
//                   <div className="flex justify-between"><span className="text-muted-foreground">Platform (40%)</span><span>₹{Math.round(open.revenue * 0.4)}</span></div>
//                 </div>
//               </div>
//               <div className="glass-strong rounded-xl p-4">
//                 <p className="text-xs font-semibold mb-2">User Reports</p>
//                 <p className="text-xs text-muted-foreground">No reports filed for this call.</p>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// export const Route = createFileRoute("/admin/voice-logs")({ component: VoiceCallsPage });
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import {
  Phone, PhoneCall, PhoneMissed, Search, X, Download,
  TrendingUp, Clock, Coins, IndianRupee, Activity,
  RefreshCw, Loader2, AlertCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/voice-logs")({ component: VoiceCallsPage });

const API_BASE = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";
const PAGE_LIMIT = 20;

// ---- API types (matching the /voice-calls/admin/* endpoints) ----

interface DashboardData {
  total_calls_today: number;
  active_now: number;
  total_minutes: number;
  average_duration_minutes: number;
  revenue: number;
  failed_calls: number;
  total_calls: number;
  total_revenue: number;
  total_minutes_all_time: number;
  average_duration_all_time: number;
  // Month-to-date (1st of current month → today). Added in API v2.
  total_calls_this_month: number;
  revenue_this_month: number;
  total_minutes_this_month: number;
  failed_calls_this_month: number;
}

interface RevenueTrendPoint { date: string; day: string; revenue: number; }
interface UsageTrendPoint { date: string; day: string; minutes: number; }
interface AvgDurationTrendPoint { date: string; day: string; average_minutes: number; }

interface CreatorPerf {
  creator_id: number;
  creator: string;
  total_calls: number;
  total_minutes: number;
  total_revenue: number;
  total_coins: number;
}

interface VoiceCallItem {
  id: number;
  call_id: string;
  customer_id: number | null;
  customer: string;
  creator_id: number | null;
  creator: string;
  caller_id: any;
  receiver_id: any;
  start_time: string | null;
  end_time: string | null;
  duration: number;            // minutes
  duration_seconds: number;
  duration_formatted: string;
  coins: number;
  revenue: number;
  status: string;
  is_free_call: boolean;
  created_at: string | null;
  updated_at: string | null;
}

// ---- helpers ----

async function getJson(url: string) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  let body: any = null;
  try { body = await res.json(); } catch { /* ignore */ }
  if (!res.ok) throw new Error(body?.detail || body?.message || `Request failed (${res.status})`);
  return body;
}

function avatarFor(seed: string | number): string {
  return `https://i.pravatar.cc/200?u=${encodeURIComponent(String(seed))}`;
}

function statusTone(s: string): string {
  const v = (s || "").toLowerCase();
  if (v === "completed" || v === "ended") return "bg-success/20 text-success";
  if (["ringing", "ongoing", "active", "connected"].includes(v)) return "bg-primary/20 text-primary animate-pulse";
  if (v === "missed") return "bg-destructive/20 text-destructive";
  if (v === "cancelled" || v === "canceled") return "bg-warning/20 text-warning";
  if (v === "failed" || v === "rejected") return "bg-destructive/20 text-destructive";
  return "bg-muted/30 text-muted-foreground";
}

function titleStatus(s: string): string {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const inr = (n: number) => `₹${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// Trends are month-to-date (1st → today, up to 31 daily points), so the
// weekday abbreviation in `day` collides across weeks. Plot by ISO `date`
// and show the day-of-month on the x-axis instead.
const dayLabel = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : String(d.getDate());
};

const RANGES = ["Today", "Last 7 Days", "Last 30 Days"] as const;
type Range = typeof RANGES[number];

function rangeToDates(range: Range): { start_date?: string; end_date?: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  if (range === "Today") return { start_date: fmt(today), end_date: fmt(today) };
  if (range === "Last 7 Days") {
    const start = new Date(today); start.setDate(today.getDate() - 6);
    return { start_date: fmt(start), end_date: fmt(today) };
  }
  // Last 30 Days
  const start = new Date(today); start.setDate(today.getDate() - 29);
  return { start_date: fmt(start), end_date: fmt(today) };
}

const STATUS_OPTIONS = [
  "all", "completed", "ongoing", "ringing", "missed", "cancelled", "failed",
];

function VoiceCallsPage() {
  // dashboard
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loadingDash, setLoadingDash] = useState(true);
  const [errorDash, setErrorDash] = useState<string | null>(null);

  // trends
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendPoint[]>([]);
  const [usageTrend, setUsageTrend] = useState<UsageTrendPoint[]>([]);
  const [avgDurationTrend, setAvgDurationTrend] = useState<AvgDurationTrendPoint[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);

  // creators (for filter dropdown)
  const [creators, setCreators] = useState<CreatorPerf[]>([]);

  // list
  const [rows, setRows] = useState<VoiceCallItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingList, setLoadingList] = useState(true);
  const [errorList, setErrorList] = useState<string | null>(null);

  // filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<Range>("Today");
  const [statusF, setStatusF] = useState("all");
  const [creatorF, setCreatorF] = useState("all");

  // detail modal
  const [open, setOpen] = useState<VoiceCallItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const onRange = (v: Range) => { setRange(v); setPage(1); };
  const onStatus = (v: string) => { setStatusF(v); setPage(1); };
  const onCreator = (v: string) => { setCreatorF(v); setPage(1); };

  // ---- fetch dashboard + trends + creators (filter-independent) ----
  const fetchOverview = useCallback(async () => {
    setLoadingDash(true);
    setErrorDash(null);
    try {
      const j = await getJson(`${API_BASE}/voice-calls/admin/dashboard`);
      setDashboard(j.data ?? null);
    } catch (e: any) {
      setErrorDash(e?.message || "Failed to load dashboard");
    } finally {
      setLoadingDash(false);
    }

    setLoadingTrends(true);
    try {
      const [rev, usage, avg] = await Promise.all([
        getJson(`${API_BASE}/voice-calls/admin/revenue-trend`),
        getJson(`${API_BASE}/voice-calls/admin/usage-trend`),
        getJson(`${API_BASE}/voice-calls/admin/average-duration-trend`),
      ]);
      setRevenueTrend(rev?.data ?? []);
      setUsageTrend(usage?.data ?? []);
      setAvgDurationTrend(avg?.data ?? []);
    } catch {
      /* trends are non-critical; leave empty */
    } finally {
      setLoadingTrends(false);
    }

    try {
      const j = await getJson(`${API_BASE}/voice-calls/admin/creator-performance?limit=50`);
      setCreators(j?.data ?? []);
    } catch {
      /* creator dropdown is non-critical */
    }
  }, []);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  // ---- build list query from filters ----
  const buildListQuery = useCallback((p: number) => {
    const sp = new URLSearchParams();
    if (search.trim()) sp.set("search", search.trim());
    if (statusF !== "all") sp.set("status", statusF);
    if (creatorF !== "all") sp.set("creator_id", creatorF);
    const { start_date, end_date } = rangeToDates(range);
    if (start_date) sp.set("start_date", start_date);
    if (end_date) sp.set("end_date", end_date);
    sp.set("page", String(p));
    sp.set("limit", String(PAGE_LIMIT));
    return sp.toString();
  }, [search, statusF, creatorF, range]);

  const fetchList = useCallback(async (p: number) => {
    setLoadingList(true);
    setErrorList(null);
    try {
      const j = await getJson(`${API_BASE}/voice-calls/admin/admin-list?${buildListQuery(p)}`);
      setRows(j?.data ?? []);
      setTotal(j?.total ?? 0);
      setTotalPages(j?.total_pages ?? 1);
    } catch (e: any) {
      const msg = e?.message || "Failed to load calls";
      setErrorList(msg);
      toast.error(msg);
    } finally {
      setLoadingList(false);
    }
  }, [buildListQuery]);

  useEffect(() => { fetchList(page); }, [fetchList, page]);

  // ---- detail ----
  const fetchDetail = useCallback(async (callId: string) => {
    setLoadingDetail(true);
    try {
      const j = await getJson(`${API_BASE}/voice-calls/admin/admin-list/${encodeURIComponent(callId)}`);
      setOpen(j.data);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load call detail");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // ---- CSV export (server-side, current filters) ----
  const exportCsv = async () => {
    try {
      const sp = new URLSearchParams();
      if (search.trim()) sp.set("search", search.trim());
      if (statusF !== "all") sp.set("status", statusF);
      if (creatorF !== "all") sp.set("creator_id", creatorF);
      const { start_date, end_date } = rangeToDates(range);
      if (start_date) sp.set("start_date", start_date);
      if (end_date) sp.set("end_date", end_date);
      const res = await fetch(`${API_BASE}/voice-calls/admin/admin-export?${sp.toString()}`);
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "voice_calls.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported CSV");
    } catch (e: any) {
      toast.error(e?.message || "Export failed");
    }
  };

  const refreshAll = () => { fetchOverview(); fetchList(page); };

  const hasFilters = search || statusF !== "all" || creatorF !== "all" || range !== "Today";
  const clearFilters = () => {
    setSearchInput(""); setSearch(""); setStatusF("all");
    setCreatorF("all"); setRange("Today"); setPage(1);
  };

  // ---- KPI cards ----
  const kpis = useMemo(() => {
    const d = dashboard;
    return [
      { l: "Calls Today", v: d?.total_calls_today ?? 0, icon: Phone, tone: "text-primary" },
      { l: "Active Now", v: d?.active_now ?? 0, icon: PhoneCall, tone: "text-success" },
      { l: "Minutes Today", v: Math.round(d?.total_minutes ?? 0), icon: Clock, tone: "text-accent" },
      { l: "Avg Duration", v: `${Math.round(d?.average_duration_minutes ?? 0)}m`, icon: Activity, tone: "text-warning" },
      { l: "Revenue Today", v: inr(d?.revenue ?? 0), icon: IndianRupee, tone: "text-success" },
      { l: "Failed Today", v: d?.failed_calls ?? 0, icon: PhoneMissed, tone: "text-destructive" },
    ];
  }, [dashboard]);

  // Month-to-date KPIs (1st of current month → today).
  const kpisMonth = useMemo(() => {
    const d = dashboard;
    return [
      { l: "Calls This Month", v: d?.total_calls_this_month ?? 0, icon: Phone, tone: "text-primary" },
      { l: "Minutes This Month", v: Math.round(d?.total_minutes_this_month ?? 0), icon: Clock, tone: "text-accent" },
      { l: "Revenue This Month", v: inr(d?.revenue_this_month ?? 0), icon: IndianRupee, tone: "text-success" },
      { l: "Failed This Month", v: d?.failed_calls_this_month ?? 0, icon: PhoneMissed, tone: "text-destructive" },
    ];
  }, [dashboard]);

  // Month-to-date trends can have up to 31 daily points; thin the x-axis
  // labels so they don't crowd. ~8 visible labels, keeping first & last.
  const trendInterval = Math.max(0, Math.floor(Math.max(usageTrend.length, revenueTrend.length, avgDurationTrend.length) / 8));

  const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" };

  return (
    <div>
      <PageHeader
        title="Voice Calls"
        subtitle="Telecom-grade voice monitoring & analytics"
        action={
          <div className="flex gap-2">
            <button onClick={refreshAll} className="glass rounded-full px-4 py-2 text-sm flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${(loadingDash || loadingList) ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button onClick={exportCsv} className="glass rounded-full px-4 py-2 text-sm flex items-center gap-2">
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {kpis.map((s, i) => (
          <GlassCard key={i}>
            {loadingDash && !dashboard
              ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mb-2" />
              : <s.icon className={`h-5 w-5 ${s.tone} mb-2`} />}
            <p className="text-xs text-muted-foreground">{s.l}</p>
            <p className="text-xl font-bold mt-1">{s.v}</p>
          </GlassCard>
        ))}
      </div>

      {/* Month-to-date KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {kpisMonth.map((s, i) => (
          <GlassCard key={i}>
            {loadingDash && !dashboard
              ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mb-2" />
              : <s.icon className={`h-5 w-5 ${s.tone} mb-2`} />}
            <p className="text-xs text-muted-foreground">{s.l}</p>
            <p className="text-xl font-bold mt-1">{s.v}</p>
          </GlassCard>
        ))}
      </div>

      {errorDash && (
        <p className="text-xs text-destructive mb-4 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {errorDash}
        </p>
      )}

      {/* Filters */}
      <GlassCard className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search call ID, customer, creator..."
              className="w-full bg-transparent rounded-full pl-9 pr-4 py-2 text-sm outline-none border border-border"
            />
          </div>
          <select value={range} onChange={(e) => onRange(e.target.value as Range)} className="glass rounded-full px-3 py-2 text-sm">
            {RANGES.map((o) => <option key={o}>{o}</option>)}
          </select>
          <select value={creatorF} onChange={(e) => onCreator(e.target.value)} className="glass rounded-full px-3 py-2 text-sm">
            <option value="all">All Creators</option>
            {creators.map((c) => <option key={c.creator_id} value={String(c.creator_id)}>{c.creator}</option>)}
          </select>
          <select value={statusF} onChange={(e) => onStatus(e.target.value)} className="glass rounded-full px-3 py-2 text-sm capitalize">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s === "all" ? "All Status" : s}</option>)}
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
          )}
        </div>
      </GlassCard>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <GlassCard>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Usage (This Month)</p>
          {loadingTrends
            ? <div className="h-[180px] flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            : <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={usageTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" tickFormatter={dayLabel} interval={trendInterval} fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={dayLabel} />
                  <Area dataKey="minutes" name="Minutes" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>}
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-muted-foreground mb-2">Revenue (This Month)</p>
          {loadingTrends
            ? <div className="h-[180px] flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            : <ResponsiveContainer width="100%" height={180}>
                <BarChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" tickFormatter={dayLabel} interval={trendInterval} fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={dayLabel} />
                  <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>}
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-muted-foreground mb-2">Avg Duration (This Month)</p>
          {loadingTrends
            ? <div className="h-[180px] flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            : <ResponsiveContainer width="100%" height={180}>
                <LineChart data={avgDurationTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" tickFormatter={dayLabel} interval={trendInterval} fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={dayLabel} />
                  <Line dataKey="average_minutes" name="Avg min" stroke="hsl(var(--accent))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>}
        </GlassCard>
      </div>

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs text-muted-foreground">
              <tr>
                {["Call ID", "Customer", "Creator", "Start", "End", "Duration", "Coins", "Revenue", "Status"].map((h) => (
                  <th key={h} className="text-left p-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" /> Loading calls…
                </td></tr>
              ) : errorList ? (
                <tr><td colSpan={9} className="p-8 text-center text-destructive">
                  <AlertCircle className="h-5 w-5 inline-block mr-2" /> {errorList}
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No calls match your filters</td></tr>
              ) : rows.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => { setOpen(c); fetchDetail(c.call_id); }}
                  className="border-t border-border hover:bg-muted/20 cursor-pointer"
                >
                  <td className="p-3 font-mono text-xs">{c.call_id}</td>
                  <td className="p-3">{c.customer}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <img src={avatarFor(c.creator_id ?? c.creator)} className="h-6 w-6 rounded-full" alt="" />
                      {c.creator}
                    </div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{fmtTime(c.start_time)}</td>
                  <td className="p-3 text-xs text-muted-foreground">{c.end_time ? fmtTime(c.end_time) : "—"}</td>
                  <td className="p-3">{c.duration_formatted || "—"}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1">
                      <Coins className="h-3 w-3 text-amber-500" />{c.coins}
                      {c.is_free_call && <span className="ml-1 text-[9px] rounded bg-emerald-500/15 text-emerald-400 px-1">FREE</span>}
                    </span>
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
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="glass rounded-full p-1.5 disabled:opacity-40">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="glass rounded-full p-1.5 disabled:opacity-40">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Detail modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpen(null)}
          >
            <motion.div
              initial={{ y: 20, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.96 }}
              className="glass rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {loadingDetail ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" /> Loading…
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Call Detail</p>
                      <h3 className="text-lg font-bold font-mono">{open.call_id}</h3>
                      <span className={`inline-block mt-1 text-[10px] rounded-full px-2 py-0.5 ${statusTone(open.status)}`}>{titleStatus(open.status)}</span>
                    </div>
                    <button onClick={() => setOpen(null)} className="rounded-full p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="glass-strong rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">Customer</p>
                      <p className="font-semibold">{open.customer}</p>
                    </div>
                    <div className="glass-strong rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">Creator</p>
                      <div className="flex items-center gap-2">
                        <img src={avatarFor(open.creator_id ?? open.creator)} className="h-7 w-7 rounded-full" alt="" />
                        <p className="font-semibold text-sm">{open.creator}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="glass-strong rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground">Duration</p>
                      <p className="font-bold">{open.duration_formatted || "—"}</p>
                    </div>
                    <div className="glass-strong rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground">Coins</p>
                      <p className="font-bold">{open.coins}</p>
                    </div>
                    <div className="glass-strong rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground">Revenue</p>
                      <p className="font-bold text-success">{inr(open.revenue)}</p>
                    </div>
                  </div>

                  {/* Revenue split — derived client-side from `revenue`. */}
                  <div className="glass-strong rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold mb-2">Revenue Split</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Creator (60%)</span><span>{inr(open.revenue * 0.6)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Platform (40%)</span><span>{inr(open.revenue * 0.4)}</span></div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">Split ratio is a display assumption; the API returns total revenue only.</p>
                  </div>

                  <div className="glass-strong rounded-xl p-4">
                    <p className="text-xs font-semibold mb-2">Timing</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><p className="text-muted-foreground">Start</p><p>{fmtDateTime(open.start_time)}</p></div>
                      <div><p className="text-muted-foreground">End</p><p>{fmtDateTime(open.end_time)}</p></div>
                      <div><p className="text-muted-foreground">Created</p><p>{fmtDateTime(open.created_at)}</p></div>
                      <div><p className="text-muted-foreground">Free call</p><p>{open.is_free_call ? "Yes" : "No"}</p></div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
