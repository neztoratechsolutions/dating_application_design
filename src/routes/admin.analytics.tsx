// import { createFileRoute } from "@tanstack/react-router";
// import { AdminPlaceholder } from "@/components/admin-shared";
// import { GlassCard } from "@/components/ui-kit";
// import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from "recharts";
// import { EARNINGS_DATA } from "@/lib/mock-data";

// export const Route = createFileRoute("/admin/analytics")({
//   component: () => (
//     <AdminPlaceholder title="Analytics" subtitle="Platform performance">
//       <GlassCard>
//         <div className="h-72">
//           <ResponsiveContainer>
//             <LineChart data={EARNINGS_DATA}>
//               <XAxis dataKey="day" stroke="#888" fontSize={11} />
//               <Tooltip contentStyle={{ background: "rgba(20,15,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
//               <Line type="monotone" dataKey="earnings" stroke="oklch(0.7 0.22 350)" strokeWidth={3} dot={{ fill: "oklch(0.7 0.22 350)" }} />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </GlassCard>
//     </AdminPlaceholder>
//   ),
// });
// import { createFileRoute } from "@tanstack/react-router";
// import { useCallback, useEffect, useState } from "react";
// import { AdminPlaceholder } from "@/components/admin-shared";
// import { GlassCard } from "@/components/ui-kit";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   CartesianGrid,
//   Legend,
// } from "recharts";
// import {
//   Phone,
//   Video,
//   Gift,
//   Gamepad2,
//   TrendingUp,
//   RefreshCw,
//   Loader2,
//   AlertCircle,
//   Calendar,
// } from "lucide-react";
// import { toast } from "sonner";

// export const Route = createFileRoute("/admin/analytics")({
//   component: AnalyticsPage,
// });

// // The other admin pages read VITE_BASE_URL; this page originally read
// // VITE_API_BASE_URL. Accept either, then fall back to the local dev server.
// const API_BASE =
//   import.meta.env.VITE_BASE_URL ||
//   import.meta.env.VITE_API_BASE_URL ||
//   "http://127.0.0.1:8000";

// // ---------------- API types (match GET /analytics/platform-performance) ----------------
// // The response has NO `data` wrapper and signals success with `status: true`
// // (a boolean, not a numeric code). daily_data, weekly_data and message live at
// // the top level.

// interface DailyBreakdownItem {
//   date: string; // ISO date, e.g. "2026-11-09"
//   voice_call_earnings: number;
//   video_call_earnings: number;
//   gift_earnings: number;
//   game_earnings: number;
//   total_earnings: number;
// }

// interface WeeklySummary {
//   voice_call_earnings: number;
//   video_call_earnings: number;
//   gift_earnings: number;
//   game_earnings: number;
//   total_earnings: number;
// }

// interface WeeklyData {
//   week_start: string;
//   week_end: string;
//   daily_breakdown: DailyBreakdownItem[];
//   summary: WeeklySummary;
// }

// interface PlatformPerformanceResponse {
//   status: boolean;
//   message: string;
//   daily_data: DailyBreakdownItem;
//   weekly_data: WeeklyData;
// }

// // ---------------- helpers ----------------

// const inr = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

// function dayLabel(iso: string): string {
//   const d = new Date(iso);
//   if (isNaN(d.getTime())) return iso;
//   return d.toLocaleDateString(undefined, { weekday: "short" });
// }

// function fmtDate(iso: string): string {
//   const d = new Date(iso);
//   if (isNaN(d.getTime())) return iso;
//   return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
// }

// async function getJson(url: string) {
//   const res = await fetch(url, { headers: { accept: "application/json" } });
//   let body: any = null;
//   try {
//     body = await res.json();
//   } catch {
//     /* ignore */
//   }
//   if (!res.ok) {
//     throw new Error(body?.detail || body?.message || `Request failed (${res.status})`);
//   }
//   return body;
// }

// // The four earning streams the API reports. Single source of truth for the
// // KPI cards, chart, today strip and table so labels/colors stay in sync.
// const STREAMS = [
//   { key: "voice_call_earnings", label: "Voice", color: "#a78bfa", text: "text-violet-400", icon: Phone, tone: "from-violet-500/20 to-violet-500/5" },
//   { key: "video_call_earnings", label: "Video", color: "#38bdf8", text: "text-sky-400", icon: Video, tone: "from-sky-500/20 to-sky-500/5" },
//   { key: "gift_earnings", label: "Gift", color: "#fbbf24", text: "text-amber-400", icon: Gift, tone: "from-amber-500/20 to-amber-500/5" },
//   { key: "game_earnings", label: "Game", color: "#34d399", text: "text-emerald-400", icon: Gamepad2, tone: "from-emerald-500/20 to-emerald-500/5" },
// ] as const;

// // ---------------- KPI card ----------------

// function Kpi({
//   label,
//   value,
//   icon: Icon,
//   tone,
// }: {
//   label: string;
//   value: number;
//   icon: any;
//   tone: string;
// }) {
//   return (
//     <GlassCard className="relative overflow-hidden">
//       <div className={`absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none ${tone}`} />
//       <div className="relative p-5 flex items-start justify-between">
//         <div>
//           <p className="text-xs text-muted-foreground">{label}</p>
//           <h2 className="mt-2 text-2xl font-bold">{inr(value)}</h2>
//         </div>
//         <Icon className="h-5 w-5 opacity-80" />
//       </div>
//     </GlassCard>
//   );
// }

// // ---------------- page ----------------

// function AnalyticsPage() {
//   const [data, setData] = useState<PlatformPerformanceResponse | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const load = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const body = await getJson(`${API_BASE}/analytics/platform-performance`);
//       // Success is `status: true` (a boolean), not a numeric status code.
//       if (body?.status !== true) {
//         throw new Error(body?.message || "Failed to fetch platform performance");
//       }
//       setData(body as PlatformPerformanceResponse);
//     } catch (e: any) {
//       const msg = e?.message || "Something went wrong";
//       setError(msg);
//       toast.error(msg);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     load();
//   }, [load]);

//   // ---- loading ----
//   if (loading && !data) {
//     return (
//       <AdminPlaceholder title="Analytics" subtitle="Platform performance">
//         <GlassCard>
//           <div className="p-10 flex flex-col items-center gap-3">
//             <Loader2 className="h-6 w-6 animate-spin text-primary" />
//             <p className="text-sm text-muted-foreground">Loading platform analytics…</p>
//           </div>
//         </GlassCard>
//       </AdminPlaceholder>
//     );
//   }

//   // ---- error ----
//   if (error && !data) {
//     return (
//       <AdminPlaceholder title="Analytics" subtitle="Platform performance">
//         <GlassCard className="text-center py-16 flex flex-col items-center gap-4">
//           <AlertCircle className="h-10 w-10 text-destructive" />
//           <div>
//             <h3 className="font-bold">Failed to load analytics</h3>
//             <p className="text-sm text-muted-foreground mt-1">{error}</p>
//           </div>
//           <button
//             onClick={load}
//             className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold inline-flex items-center gap-2"
//           >
//             <RefreshCw className="h-4 w-4" /> Retry
//           </button>
//         </GlassCard>
//       </AdminPlaceholder>
//     );
//   }

//   if (!data) return null;

//   const { daily_data, weekly_data } = data;
//   const summary = weekly_data.summary;

//   // Flatten the 7-day breakdown for recharts. The API returns date (ISO) only;
//   // derive a short weekday label for the X axis and one series per stream.
//   const chartData = weekly_data.daily_breakdown.map((d) => {
//     const row: Record<string, number | string> = { day: dayLabel(d.date), date: d.date };
//     for (const s of STREAMS) row[s.label] = d[s.key];
//     row.Total = d.total_earnings;
//     return row;
//   });

//   // today strip = the four streams + total
//   const todayStrip = [
//     ...STREAMS.map((s) => ({ label: s.label, value: daily_data[s.key], text: s.text })),
//     { label: "Total", value: daily_data.total_earnings, text: "text-primary" },
//   ];

//   return (
//     <AdminPlaceholder title="Analytics" subtitle="Platform performance">
//       <div className="space-y-6">
//         {/* toolbar: week range + refresh */}
//         <div className="flex items-center justify-between gap-3 flex-wrap">
//           <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
//             <Calendar className="h-4 w-4" />
//             Week of {fmtDate(weekly_data.week_start)} – {fmtDate(weekly_data.week_end)}
//           </div>
//           <button
//             onClick={load}
//             disabled={loading}
//             className="glass rounded-full px-3 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
//           >
//             <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
//           </button>
//         </div>

//         {/* weekly summary KPIs: 4 streams + total */}
//         <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
//           {STREAMS.map((s) => (
//             <Kpi key={s.key} label={`${s.label} Earnings`} value={summary[s.key]} icon={s.icon} tone={s.tone} />
//           ))}
//           <Kpi label="Total Earnings (Week)" value={summary.total_earnings} icon={TrendingUp} tone="from-primary/20 to-primary/5" />
//         </div>

//         {/* today snapshot */}
//         <GlassCard>
//           <div className="p-5">
//             <div className="flex items-center justify-between mb-3">
//               <h2 className="text-lg font-semibold">Today</h2>
//               <span className="text-xs text-muted-foreground">{fmtDate(daily_data.date)}</span>
//             </div>
//             <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
//               {todayStrip.map((s) => (
//                 <div key={s.label} className="glass rounded-xl p-3">
//                   <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
//                   <p className={`text-lg font-bold mt-1 ${s.text}`}>{inr(s.value)}</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </GlassCard>

//         {/* platform performance chart */}
//         <GlassCard>
//           <div className="p-5">
//             <h2 className="mb-5 text-lg font-semibold">Platform Performance — Last 7 Days</h2>
//             <div className="h-72">
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
//                   <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
//                   <XAxis dataKey="day" stroke="#888" fontSize={11} />
//                   <YAxis stroke="#888" fontSize={11} tickFormatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
//                   <Tooltip
//                     formatter={(value: any, name: any) => [inr(Number(value)), name]}
//                     labelFormatter={(label) => `Day: ${label}`}
//                     contentStyle={{
//                       background: "rgba(20,15,30,0.9)",
//                       border: "1px solid rgba(255,255,255,0.1)",
//                       borderRadius: 12,
//                     }}
//                   />
//                   <Legend />
//                   {STREAMS.map((s) => (
//                     <Line key={s.key} type="monotone" dataKey={s.label} stroke={s.color} strokeWidth={2} dot={{ r: 3 }} />
//                   ))}
//                   <Line type="monotone" dataKey="Total" stroke="#f472b6" strokeWidth={3} dot={{ r: 4 }} />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         </GlassCard>

//         {/* weekly breakdown table */}
//         <GlassCard>
//           <div className="p-5">
//             <h2 className="mb-4 text-lg font-semibold">Weekly Breakdown</h2>
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="border-b border-border/40 text-left text-muted-foreground">
//                     <th className="p-3">Date</th>
//                     {STREAMS.map((s) => (
//                       <th key={s.key} className="p-3">{s.label}</th>
//                     ))}
//                     <th className="p-3">Total</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {weekly_data.daily_breakdown.map((item) => (
//                     <tr key={item.date} className="border-b border-border/20">
//                       <td className="p-3 whitespace-nowrap">
//                         <span className="font-medium">{dayLabel(item.date)}</span>
//                         <span className="text-muted-foreground ml-2">{fmtDate(item.date)}</span>
//                       </td>
//                       {STREAMS.map((s) => (
//                         <td key={s.key} className={`p-3 ${s.text}`}>{inr(item[s.key])}</td>
//                       ))}
//                       <td className="p-3 font-semibold text-primary">{inr(item.total_earnings)}</td>
//                     </tr>
//                   ))}
//                   {/* summary row */}
//                   <tr className="border-t-2 border-border/60 font-semibold">
//                     <td className="p-3">Week Total</td>
//                     {STREAMS.map((s) => (
//                       <td key={s.key} className={`p-3 ${s.text}`}>{inr(summary[s.key])}</td>
//                     ))}
//                     <td className="p-3 text-primary">{inr(summary.total_earnings)}</td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </GlassCard>
//       </div>
//     </AdminPlaceholder>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AdminPlaceholder } from "@/components/admin-shared";
import { GlassCard } from "@/components/ui-kit";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Phone,
  Video,
  Gift,
  Gamepad2,
  MessageCircle,
  TrendingUp,
  RefreshCw,
  Loader2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

// The other admin pages read VITE_BASE_URL; this page originally read
// VITE_API_BASE_URL. Accept either, then fall back to the local dev server.
const API_BASE =
  import.meta.env.VITE_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

// ---------------- API types (match GET /analytics/platform-performance) ----------------
// The response has NO `data` wrapper and signals success with `status: true`
// (a boolean, not a numeric code). daily_data, weekly_data and message live at
// the top level.

interface DailyBreakdownItem {
  date: string; // ISO date, e.g. "2026-11-09"
  voice_call_earnings: number;
  video_call_earnings: number;
  gift_earnings: number;
  game_earnings: number;
  chat_earnings: number;
  total_earnings: number;
}

interface WeeklySummary {
  voice_call_earnings: number;
  video_call_earnings: number;
  gift_earnings: number;
  game_earnings: number;
  chat_earnings: number;
  total_earnings: number;
}

interface WeeklyData {
  week_start: string;
  week_end: string;
  daily_breakdown: DailyBreakdownItem[];
  summary: WeeklySummary;
}

interface PlatformPerformanceResponse {
  status: boolean;
  message: string;
  daily_data: DailyBreakdownItem;
  weekly_data: WeeklyData;
}

// ---------------- helpers ----------------

const inr = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

async function getJson(url: string) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    throw new Error(body?.detail || body?.message || `Request failed (${res.status})`);
  }
  return body;
}

// The five earning streams the API reports. Single source of truth for the
// KPI cards, chart, today strip and table so labels/colors stay in sync.
const STREAMS = [
  { key: "voice_call_earnings", label: "Voice", color: "#a78bfa", text: "text-violet-400", icon: Phone, tone: "from-violet-500/20 to-violet-500/5" },
  { key: "video_call_earnings", label: "Video", color: "#38bdf8", text: "text-sky-400", icon: Video, tone: "from-sky-500/20 to-sky-500/5" },
  { key: "gift_earnings", label: "Gift", color: "#fbbf24", text: "text-amber-400", icon: Gift, tone: "from-amber-500/20 to-amber-500/5" },
  { key: "game_earnings", label: "Game", color: "#34d399", text: "text-emerald-400", icon: Gamepad2, tone: "from-emerald-500/20 to-emerald-500/5" },
  { key: "chat_earnings", label: "Chat", color: "#f97316", text: "text-orange-400", icon: MessageCircle, tone: "from-orange-500/20 to-orange-500/5" },
] as const;

// ---------------- KPI card ----------------

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: any;
  tone: string;
}) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none ${tone}`} />
      <div className="relative p-5 flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <h2 className="mt-2 text-2xl font-bold">{inr(value)}</h2>
        </div>
        <Icon className="h-5 w-5 opacity-80" />
      </div>
    </GlassCard>
  );
}

// ---------------- page ----------------

function AnalyticsPage() {
  const [data, setData] = useState<PlatformPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await getJson(`${API_BASE}/analytics/platform-performance`);
      // Success is `status: true` (a boolean), not a numeric status code.
      if (body?.status !== true) {
        throw new Error(body?.message || "Failed to fetch platform performance");
      }
      setData(body as PlatformPerformanceResponse);
    } catch (e: any) {
      const msg = e?.message || "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---- loading ----
  if (loading && !data) {
    return (
      <AdminPlaceholder title="Analytics" subtitle="Platform performance">
        <GlassCard>
          <div className="p-10 flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading platform analytics…</p>
          </div>
        </GlassCard>
      </AdminPlaceholder>
    );
  }

  // ---- error ----
  if (error && !data) {
    return (
      <AdminPlaceholder title="Analytics" subtitle="Platform performance">
        <GlassCard className="text-center py-16 flex flex-col items-center gap-4">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <div>
            <h3 className="font-bold">Failed to load analytics</h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <button
            onClick={load}
            className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </GlassCard>
      </AdminPlaceholder>
    );
  }

  if (!data) return null;

  const { daily_data, weekly_data } = data;
  const summary = weekly_data.summary;

  // Flatten the 7-day breakdown for recharts. The API returns date (ISO) only;
  // derive a short weekday label for the X axis and one series per stream.
  const chartData = weekly_data.daily_breakdown.map((d) => {
    const row: Record<string, number | string> = { day: dayLabel(d.date), date: d.date };
    for (const s of STREAMS) row[s.label] = d[s.key];
    row.Total = d.total_earnings;
    return row;
  });

  // today strip = the four streams + total
  const todayStrip = [
    ...STREAMS.map((s) => ({ label: s.label, value: daily_data[s.key], text: s.text })),
    { label: "Total", value: daily_data.total_earnings, text: "text-primary" },
  ];

  return (
    <AdminPlaceholder title="Analytics" subtitle="Platform performance">
      <div className="space-y-6">
        {/* toolbar: week range + refresh */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Week of {fmtDate(weekly_data.week_start)} – {fmtDate(weekly_data.week_end)}
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="glass rounded-full px-3 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {/* weekly summary KPIs: 5 streams + total */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {STREAMS.map((s) => (
            <Kpi key={s.key} label={`${s.label} Earnings`} value={summary[s.key]} icon={s.icon} tone={s.tone} />
          ))}
          <Kpi label="Total Earnings (Week)" value={summary.total_earnings} icon={TrendingUp} tone="from-primary/20 to-primary/5" />
        </div>

        {/* today snapshot */}
        <GlassCard>
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Today</h2>
              <span className="text-xs text-muted-foreground">{fmtDate(daily_data.date)}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {todayStrip.map((s) => (
                <div key={s.label} className="glass rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
                  <p className={`text-lg font-bold mt-1 ${s.text}`}>{inr(s.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* platform performance chart */}
        <GlassCard>
          <div className="p-5">
            <h2 className="mb-5 text-lg font-semibold">Platform Performance — Last 7 Days</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="day" stroke="#888" fontSize={11} />
                  <YAxis stroke="#888" fontSize={11} tickFormatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
                  <Tooltip
                    formatter={(value: any, name: any) => [inr(Number(value)), name]}
                    labelFormatter={(label) => `Day: ${label}`}
                    contentStyle={{
                      background: "rgba(20,15,30,0.9)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                    }}
                  />
                  <Legend />
                  {STREAMS.map((s) => (
                    <Line key={s.key} type="monotone" dataKey={s.label} stroke={s.color} strokeWidth={2} dot={{ r: 3 }} />
                  ))}
                  <Line type="monotone" dataKey="Total" stroke="#f472b6" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        {/* weekly breakdown table */}
        <GlassCard>
          <div className="p-5">
            <h2 className="mb-4 text-lg font-semibold">Weekly Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left text-muted-foreground">
                    <th className="p-3">Date</th>
                    {STREAMS.map((s) => (
                      <th key={s.key} className="p-3">{s.label}</th>
                    ))}
                    <th className="p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {weekly_data.daily_breakdown.map((item) => (
                    <tr key={item.date} className="border-b border-border/20">
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-medium">{dayLabel(item.date)}</span>
                        <span className="text-muted-foreground ml-2">{fmtDate(item.date)}</span>
                      </td>
                      {STREAMS.map((s) => (
                        <td key={s.key} className={`p-3 ${s.text}`}>{inr(item[s.key])}</td>
                      ))}
                      <td className="p-3 font-semibold text-primary">{inr(item.total_earnings)}</td>
                    </tr>
                  ))}
                  {/* summary row */}
                  <tr className="border-t-2 border-border/60 font-semibold">
                    <td className="p-3">Week Total</td>
                    {STREAMS.map((s) => (
                      <td key={s.key} className={`p-3 ${s.text}`}>{inr(summary[s.key])}</td>
                    ))}
                    <td className="p-3 text-primary">{inr(summary.total_earnings)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </GlassCard>
      </div>
    </AdminPlaceholder>
  );
}
