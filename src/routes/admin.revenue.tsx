// import { createFileRoute } from "@tanstack/react-router";
// import { useMemo, useState } from "react";
// import { GlassCard, PageHeader } from "@/components/ui-kit";
// import {
//   TrendingUp, TrendingDown, Wallet, Coins, MessageSquare, Phone, Video, Gift,
//   Gamepad2, Sparkles, Download, Calendar, IndianRupee, ArrowUpRight, ArrowDownRight, PieChart as PieIcon,
// } from "lucide-react";
// import {
//   ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
//   PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
// } from "recharts";
// import { toast } from "sonner";

// export const Route = createFileRoute("/admin/revenue")({ component: RevenuePage });

// type Range = "today" | "7d" | "30d" | "month" | "custom";

// const SOURCES = [
//   { key: "coin", label: "Coin Purchase", icon: Coins, color: "#f59e0b" },
//   { key: "chat", label: "Chat", icon: MessageSquare, color: "#3b82f6" },
//   { key: "voice", label: "Voice Call", icon: Phone, color: "#10b981" },
//   { key: "video", label: "Video Call", icon: Video, color: "#8b5cf6" },
//   { key: "gift", label: "Gifts", icon: Gift, color: "#ec4899" },
//   { key: "color", label: "Colour Connect", icon: Gamepad2, color: "#06b6d4" },
//   { key: "scratch", label: "Scratch Game", icon: Sparkles, color: "#f43f5e" },
// ] as const;

// const TREND = Array.from({ length: 30 }, (_, i) => {
//   const day = i + 1;
//   return {
//     date: `May ${day}`,
//     revenue: 80000 + Math.round(Math.sin(i / 3) * 30000 + Math.random() * 25000 + i * 1800),
//     profit: 24000 + Math.round(Math.cos(i / 4) * 9000 + Math.random() * 7000 + i * 600),
//     payout: 50000 + Math.round(Math.sin(i / 5) * 15000 + Math.random() * 12000 + i * 1100),
//   };
// });

// const MONTHLY = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => ({
//   month: m,
//   revenue: 1800000 + i * 240000 + Math.round(Math.random() * 400000),
//   profit: 540000 + i * 80000 + Math.round(Math.random() * 120000),
// }));

// const SOURCE_REVENUE = SOURCES.map((s, i) => ({
//   ...s,
//   amount: [4820000, 2140000, 1680000, 2950000, 3180000, 740000, 520000][i],
//   tx: [18420, 56210, 12380, 9870, 24100, 8420, 14200][i],
// }));

// const TOTAL = SOURCE_REVENUE.reduce((a, b) => a + b.amount, 0);

// const TABLE_ROWS = Array.from({ length: 28 }, (_, i) => {
//   const src = SOURCES[i % SOURCES.length];
//   const amount = 18000 + Math.round(Math.random() * 180000);
//   const payout = Math.round(amount * 0.7);
//   return {
//     id: i,
//     date: `2026-05-${String(28 - (i % 28)).padStart(2, "0")}`,
//     source: src.label,
//     sourceKey: src.key,
//     amount,
//     tx: 40 + Math.round(Math.random() * 800),
//     payout,
//     profit: amount - payout,
//   };
// });

// const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
// const compact = (n: number) =>
//   n >= 1e7 ? `₹${(n / 1e7).toFixed(2)}Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)}L` : n >= 1e3 ? `₹${(n / 1e3).toFixed(1)}K` : `₹${n}`;

// function Kpi({
//   label, value, delta, icon: Icon, tone = "primary",
// }: { label: string; value: string; delta?: number; icon: any; tone?: "primary" | "success" | "warning" | "danger" | "info" }) {
//   const tones: Record<string, string> = {
//     primary: "from-primary/20 to-primary/5 text-primary",
//     success: "from-emerald-500/20 to-emerald-500/5 text-emerald-400",
//     warning: "from-amber-500/20 to-amber-500/5 text-amber-400",
//     danger: "from-rose-500/20 to-rose-500/5 text-rose-400",
//     info: "from-sky-500/20 to-sky-500/5 text-sky-400",
//   };
//   return (
//     <GlassCard className="relative overflow-hidden">
//       <div className={`absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none ${tones[tone]}`} />
//       <div className="relative flex items-start justify-between">
//         <div>
//           <p className="text-xs text-muted-foreground">{label}</p>
//           <p className="text-xl font-bold mt-1">{value}</p>
//           {delta !== undefined && (
//             <p className={`text-xs mt-1 inline-flex items-center gap-1 ${delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
//               {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
//               {Math.abs(delta)}% vs prev
//             </p>
//           )}
//         </div>
//         <div className={`rounded-xl p-2 ${tones[tone]}`}><Icon className="h-5 w-5" /></div>
//       </div>
//     </GlassCard>
//   );
// }

// function downloadFile(name: string, content: string, mime: string) {
//   const blob = new Blob([content], { type: mime });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url; a.download = name; a.click();
//   URL.revokeObjectURL(url);
// }

// function RevenuePage() {
//   const [range, setRange] = useState<Range>("30d");
//   const [source, setSource] = useState<string>("all");

//   const filtered = useMemo(
//     () => TABLE_ROWS.filter((r) => source === "all" || r.sourceKey === source),
//     [source],
//   );

//   const today = 248_400, yesterday = 231_900, week = 1_640_500, month = 6_842_300;
//   const totalRev = 32_180_000, profit = Math.round(totalRev * 0.3), payouts = totalRev - profit, pending = 184_500;

//   const exportCSV = () => {
//     const rows = [
//       ["Date", "Source", "Amount", "Transactions", "Creator Payout", "Platform Profit"],
//       ...filtered.map((r) => [r.date, r.source, r.amount, r.tx, r.payout, r.profit]),
//     ];
//     downloadFile("revenue.csv", rows.map((r) => r.join(",")).join("\n"), "text/csv");
//     toast.success("CSV exported");
//   };
//   const exportExcel = () => {
//     const rows = [
//       ["Date", "Source", "Amount", "Transactions", "Creator Payout", "Platform Profit"],
//       ...filtered.map((r) => [r.date, r.source, r.amount, r.tx, r.payout, r.profit]),
//     ];
//     downloadFile("revenue.xls", rows.map((r) => r.join("\t")).join("\n"), "application/vnd.ms-excel");
//     toast.success("Excel exported");
//   };
//   const exportPDF = () => { toast.message("Opening print dialog…"); setTimeout(() => window.print(), 200); };

//   return (
//     <div className="space-y-6">
//       <PageHeader
//         title="Revenue"
//         subtitle="Platform financial analytics & profitability"
//         action={
//           <div className="flex flex-wrap gap-2">
//             <button onClick={exportCSV} className="glass rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5"><Download className="h-3.5 w-3.5" />CSV</button>
//             <button onClick={exportExcel} className="glass rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5"><Download className="h-3.5 w-3.5" />Excel</button>
//             <button onClick={exportPDF} className="glass rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5"><Download className="h-3.5 w-3.5" />PDF</button>
//           </div>
//         }
//       />

//       {/* Range filters */}
//       <div className="flex flex-wrap gap-2">
//         {([
//           ["today", "Today"], ["7d", "Last 7 Days"], ["30d", "Last 30 Days"], ["month", "This Month"], ["custom", "Custom Range"],
//         ] as [Range, string][]).map(([k, l]) => (
//           <button
//             key={k}
//             onClick={() => setRange(k)}
//             className={`rounded-full px-4 py-1.5 text-xs font-medium border transition ${
//               range === k ? "bg-primary text-primary-foreground border-primary" : "glass border-transparent hover:border-border"
//             }`}
//           >
//             <Calendar className="inline h-3 w-3 mr-1" />{l}
//           </button>
//         ))}
//       </div>

//       {/* KPI cards */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//         <Kpi label="Today's Revenue" value={inr(today)} delta={7.1} icon={IndianRupee} tone="success" />
//         <Kpi label="Yesterday's Revenue" value={inr(yesterday)} delta={-2.4} icon={TrendingDown} tone="info" />
//         <Kpi label="Weekly Revenue" value={inr(week)} delta={12.8} icon={TrendingUp} tone="primary" />
//         <Kpi label="Monthly Revenue" value={inr(month)} delta={9.2} icon={Wallet} tone="success" />
//         <Kpi label="Total Revenue" value={compact(totalRev)} delta={18.4} icon={Coins} tone="primary" />
//         <Kpi label="Platform Profit" value={compact(profit)} delta={14.6} icon={TrendingUp} tone="success" />
//         <Kpi label="Creator Payouts" value={compact(payouts)} delta={11.2} icon={ArrowUpRight} tone="info" />
//         <Kpi label="Pending Withdrawals" value={inr(pending)} icon={ArrowDownRight} tone="warning" />
//       </div>

//       {/* Revenue sources */}
//       <GlassCard>
//         <div className="flex items-center justify-between mb-4">
//           <div>
//             <h2 className="font-semibold">Revenue by Source</h2>
//             <p className="text-xs text-muted-foreground">Lifetime breakdown across products</p>
//           </div>
//           <PieIcon className="h-4 w-4 text-muted-foreground" />
//         </div>
//         <div className="grid lg:grid-cols-7 gap-3">
//           {SOURCE_REVENUE.map((s) => {
//             const Icon = s.icon;
//             const pct = ((s.amount / TOTAL) * 100).toFixed(1);
//             return (
//               <button
//                 key={s.key}
//                 onClick={() => setSource(s.key)}
//                 className={`text-left rounded-xl p-3 border transition ${source === s.key ? "border-primary bg-primary/10" : "border-border/40 hover:border-border bg-card/40"}`}
//               >
//                 <div className="flex items-center gap-2 mb-2">
//                   <span className="rounded-lg p-1.5" style={{ background: `${s.color}22`, color: s.color }}><Icon className="h-3.5 w-3.5" /></span>
//                   <p className="text-xs text-muted-foreground truncate">{s.label}</p>
//                 </div>
//                 <p className="text-base font-bold">{compact(s.amount)}</p>
//                 <p className="text-[10px] text-muted-foreground mt-0.5">{s.tx.toLocaleString()} tx · {pct}%</p>
//               </button>
//             );
//           })}
//         </div>
//       </GlassCard>

//       {/* Charts row */}
//       <div className="grid lg:grid-cols-2 gap-4">
//         <GlassCard>
//           <h3 className="font-semibold mb-1">Revenue Trend</h3>
//           <p className="text-xs text-muted-foreground mb-3">Last 30 days · revenue vs profit</p>
//           <div className="h-64">
//             <ResponsiveContainer>
//               <AreaChart data={TREND}>
//                 <defs>
//                   <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
//                   <linearGradient id="prof" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.5} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
//                 </defs>
//                 <CartesianGrid stroke="#ffffff10" />
//                 <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={4} />
//                 <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
//                 <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} formatter={(v: any) => inr(v as number)} />
//                 <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="url(#rev)" strokeWidth={2} />
//                 <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#prof)" strokeWidth={2} />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </GlassCard>

//         <GlassCard>
//           <h3 className="font-semibold mb-1">Daily Revenue</h3>
//           <p className="text-xs text-muted-foreground mb-3">Bar view · last 30 days</p>
//           <div className="h-64">
//             <ResponsiveContainer>
//               <BarChart data={TREND}>
//                 <CartesianGrid stroke="#ffffff10" />
//                 <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={4} />
//                 <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
//                 <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} formatter={(v: any) => inr(v as number)} />
//                 <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </GlassCard>

//         <GlassCard>
//           <h3 className="font-semibold mb-1">Monthly Revenue & Profit</h3>
//           <p className="text-xs text-muted-foreground mb-3">Year-to-date comparison</p>
//           <div className="h-64">
//             <ResponsiveContainer>
//               <LineChart data={MONTHLY}>
//                 <CartesianGrid stroke="#ffffff10" />
//                 <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} />
//                 <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v/100000).toFixed(0)}L`} />
//                 <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} formatter={(v: any) => inr(v as number)} />
//                 <Legend wrapperStyle={{ fontSize: 11 }} />
//                 <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
//                 <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </GlassCard>

//         <GlassCard>
//           <h3 className="font-semibold mb-1">Creator Payouts</h3>
//           <p className="text-xs text-muted-foreground mb-3">Payout vs platform profit · last 30 days</p>
//           <div className="h-64">
//             <ResponsiveContainer>
//               <BarChart data={TREND}>
//                 <CartesianGrid stroke="#ffffff10" />
//                 <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={4} />
//                 <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
//                 <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} formatter={(v: any) => inr(v as number)} />
//                 <Legend wrapperStyle={{ fontSize: 11 }} />
//                 <Bar dataKey="payout" stackId="a" fill="#0ea5e9" radius={[0, 0, 0, 0]} />
//                 <Bar dataKey="profit" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </GlassCard>

//         <GlassCard className="lg:col-span-2">
//           <h3 className="font-semibold mb-1">Revenue Split</h3>
//           <p className="text-xs text-muted-foreground mb-3">Share of revenue by product</p>
//           <div className="h-64">
//             <ResponsiveContainer>
//               <PieChart>
//                 <Pie data={SOURCE_REVENUE} dataKey="amount" nameKey="label" outerRadius={90} innerRadius={50} paddingAngle={2}>
//                   {SOURCE_REVENUE.map((s) => <Cell key={s.key} fill={s.color} />)}
//                 </Pie>
//                 <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} formatter={(v: any) => inr(v as number)} />
//                 <Legend wrapperStyle={{ fontSize: 11 }} />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </GlassCard>
//       </div>

//       {/* Table */}
//       <GlassCard>
//         <div className="flex items-center justify-between mb-3">
//           <div>
//             <h3 className="font-semibold">Revenue Ledger</h3>
//             <p className="text-xs text-muted-foreground">{filtered.length} entries{source !== "all" ? ` · ${source}` : ""}</p>
//           </div>
//           <button onClick={() => setSource("all")} className="text-xs text-primary hover:underline">Clear filter</button>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead>
//               <tr className="text-left text-xs text-muted-foreground border-b border-border/40">
//                 <th className="py-2 px-2">Date</th>
//                 <th className="py-2 px-2">Source</th>
//                 <th className="py-2 px-2 text-right">Amount</th>
//                 <th className="py-2 px-2 text-right">Transactions</th>
//                 <th className="py-2 px-2 text-right">Creator Payout</th>
//                 <th className="py-2 px-2 text-right">Platform Profit</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filtered.map((r) => {
//                 const src = SOURCES.find((s) => s.key === r.sourceKey)!;
//                 return (
//                   <tr key={r.id} className="border-b border-border/20 hover:bg-card/40">
//                     <td className="py-2 px-2 text-xs">{r.date}</td>
//                     <td className="py-2 px-2">
//                       <span className="inline-flex items-center gap-1.5 text-xs">
//                         <span className="h-2 w-2 rounded-full" style={{ background: src.color }} />
//                         {r.source}
//                       </span>
//                     </td>
//                     <td className="py-2 px-2 text-right font-semibold">{inr(r.amount)}</td>
//                     <td className="py-2 px-2 text-right text-xs text-muted-foreground">{r.tx.toLocaleString()}</td>
//                     <td className="py-2 px-2 text-right text-sky-400">{inr(r.payout)}</td>
//                     <td className="py-2 px-2 text-right text-emerald-400 font-medium">{inr(r.profit)}</td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </GlassCard>
//     </div>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import {
  TrendingUp, TrendingDown, Wallet, Coins, MessageSquare, Phone, Video, Gift,
  Gamepad2, Sparkles, Download, Calendar, IndianRupee, ArrowUpRight,
  ArrowDownRight, PieChart as PieIcon, Loader2, PhoneCall, RefreshCw, AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/revenue")({ component: RevenuePage });

/* ------------------------------------------------------------------ */
/* API configuration                                                   */
/* ------------------------------------------------------------------ */

// Set VITE_API_BASE_URL to your backend origin (e.g. https://api.example.com),
// or hardcode it here. Empty string means same-origin + a dev proxy.
const API_BASE_URL = String(import.meta.env.VITE_BASE_URL ?? "").replace(/\/+$/, "");
const REVENUE_ENDPOINT = `${API_BASE_URL}/revenue/`;

// Adapt this to wherever your app stores the auth token.
function getAuthToken(): string | null {
  try {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      null
    );
  } catch {
    return null;
  }
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Range = "today" | "7d" | "30d" | "month" | "custom";

// Frontend range keys → backend `period` query values.
const RANGE_TO_PERIOD: Record<Range, string> = {
  today: "today",
  "7d": "last_7_days",
  "30d": "last_30_days",
  month: "this_month",
  custom: "custom",
};

const RANGE_OPTIONS: [Range, string][] = [
  ["today", "Today"],
  ["7d", "Last 7 Days"],
  ["30d", "Last 30 Days"],
  ["month", "This Month"],
  ["custom", "Custom Range"],
];

interface SourceSummary {
  source: string;
  amount: number;
  transactions: number;
  percentage: number;
  creator_payout: number;
  platform_profit: number;
}

interface TrendItem {
  date: string;
  revenue: number;
  transactions: number;
  creator_payout: number;
  platform_profit: number;
}

interface MonthlyItem {
  month: string;
  revenue: number;
  creator_payout: number;
  platform_profit: number;
  transactions: number;
}

interface LedgerEntry {
  date: string;
  source: string;
  amount: number;
  transactions: number;
  creator_payout: number;
  platform_profit: number;
}

interface DashboardResponse {
  status: boolean;
  message: string;
  filters: { period: string; start_date: string; end_date: string };
  revenue_split_percentage: {
    creator_percentage: number;
    platform_percentage: number;
  };
  summary: {
    todays_revenue: { amount: number; change_percentage: number | null };
    yesterdays_revenue: { amount: number; change_percentage: number | null };
    weekly_revenue: { amount: number; change_percentage: number | null };
    monthly_revenue: { amount: number; change_percentage: number | null };
    total_revenue: { amount: number; change_percentage: number | null };
    platform_profit: { amount: number };
    creator_payouts: { amount: number };
    pending_withdrawals: { amount: number; transactions: number };
  };
  selected_period: {
    revenue: number;
    creator_payout: number;
    platform_profit: number;
  };
  revenue_by_source: SourceSummary[];
  selected_period_source_breakdown: SourceSummary[];
  revenue_trend: TrendItem[];
  daily_revenue: { date: string; revenue: number; transactions: number }[];
  monthly_revenue_profit: MonthlyItem[];
  creator_payout_trend: {
    date: string;
    creator_payout: number;
    platform_profit: number;
  }[];
  revenue_split: {
    creator_payout: number;
    platform_profit: number;
    creator_percentage: number;
    platform_percentage: number;
  };
  revenue_ledger: { total_entries: number; data: LedgerEntry[] };
}

/* ------------------------------------------------------------------ */
/* Source metadata (icon + color) keyed by API source label            */
/* The current backend returns: Calls, Chat, Gifts,                   */
/* Colour Connect, Scratch Game. Voice/Video/Coin kept for forward-compat. */
/* ------------------------------------------------------------------ */

const SOURCE_META: Record<string, { icon: any; color: string }> = {
  "Coin Purchase": { icon: Coins, color: "#f59e0b" },
  Chat: { icon: MessageSquare, color: "#3b82f6" },
  "Voice Call": { icon: Phone, color: "#10b981" },
  "Video Call": { icon: Video, color: "#8b5cf6" },
  Calls: { icon: PhoneCall, color: "#10b981" },
  Gifts: { icon: Gift, color: "#ec4899" },
  "Colour Connect": { icon: Gamepad2, color: "#06b6d4" },
  "Color Connect": { icon: Gamepad2, color: "#06b6d4" },
  "Scratch Game": { icon: Sparkles, color: "#f43f5e" },
};

function getSourceMeta(label: string) {
  return SOURCE_META[label] ?? { icon: Coins, color: "#64748b" };
}

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

const inr = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN")}`;

const compact = (n: number) =>
  n >= 1e7
    ? `₹${(n / 1e7).toFixed(2)}Cr`
    : n >= 1e5
    ? `₹${(n / 1e5).toFixed(2)}L`
    : n >= 1e3
    ? `₹${(n / 1e3).toFixed(1)}K`
    : `₹${n ?? 0}`;

const formatAxisDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

/* ------------------------------------------------------------------ */
/* KPI card                                                            */
/* ------------------------------------------------------------------ */

function Kpi({
  label, value, delta, icon: Icon, tone = "primary",
}: {
  label: string;
  value: string;
  delta?: number | null;
  icon: any;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
}) {
  const tones: Record<string, string> = {
    primary: "from-primary/20 to-primary/5 text-primary",
    success: "from-emerald-500/20 to-emerald-500/5 text-emerald-400",
    warning: "from-amber-500/20 to-amber-500/5 text-amber-400",
    danger: "from-rose-500/20 to-rose-500/5 text-rose-400",
    info: "from-sky-500/20 to-sky-500/5 text-sky-400",
  };
  const showDelta = typeof delta === "number";
  return (
    <GlassCard className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none ${tones[tone]}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold mt-1">{value}</p>
          {showDelta && (
            <p className={`text-xs mt-1 inline-flex items-center gap-1 ${delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta)}% vs prev
            </p>
          )}
        </div>
        <div className={`rounded-xl p-2 ${tones[tone]}`}><Icon className="h-5 w-5" /></div>
      </div>
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function RevenuePage() {
  const [range, setRange] = useState<Range>("30d");
  const [source, setSource] = useState<string>("all");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  // Build the request URL for the given range (and optional export format).
  const buildUrl = useCallback(
    (opts: { exportFormat?: "csv" | "excel" | "pdf" } = {}) => {
      const url = new URL(REVENUE_ENDPOINT, window.location.origin);
      url.searchParams.set("period", RANGE_TO_PERIOD[range]);
      if (range === "custom") {
        url.searchParams.set("start_date", customStart);
        url.searchParams.set("end_date", customEnd);
      }
      if (opts.exportFormat) {
        url.searchParams.set("export_format", opts.exportFormat);
      }
      return url;
    },
    [range, customStart, customEnd],
  );

  const fetchDashboard = useCallback(async () => {
    if (range === "custom" && (!customStart || !customEnd)) {
      setError("Please select both start and end dates for the custom range.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildUrl().toString(), {
        headers: { ...authHeaders(), Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json: DashboardResponse = await res.json();
      if (!json.status) throw new Error(json.message || "Failed to load data");
      setData(json);
      setSource("all");
    } catch (e: any) {
      setError(e?.message || "Failed to load revenue data");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [buildUrl, range, customStart, customEnd]);

  // Initial load + auto-refetch on preset range change.
  // Custom range waits for an explicit "Apply" (date keystrokes shouldn't refetch).
  useEffect(() => {
    if (range === "custom") return;
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const handleExport = useCallback(
    async (format: "csv" | "excel" | "pdf") => {
      if (range === "custom" && (!customStart || !customEnd)) {
        toast.error("Select a custom date range first");
        return;
      }
      setExporting(format);
      try {
        const res = await fetch(buildUrl({ exportFormat: format }).toString(), {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error(`Export failed (${res.status})`);
        const blob = await res.blob();
        // Prefer the filename provided by the server's Content-Disposition.
        const cd = res.headers.get("content-disposition") ?? "";
        const match = cd.match(/filename="?([^"]+)"?/i);
        const filename =
          match?.[1] ?? `revenue_ledger.${format === "excel" ? "xlsx" : format}`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`${format.toUpperCase()} exported`);
      } catch (e: any) {
        toast.error(e?.message || "Export failed");
      } finally {
        setExporting(null);
      }
    },
    [buildUrl, range, customStart, customEnd],
  );

  /* ---------------- derived data ---------------- */

  const filteredLedger = useMemo(() => {
    if (!data) return [];
    return source === "all"
      ? data.revenue_ledger.data
      : data.revenue_ledger.data.filter((r) => r.source === source);
  }, [data, source]);

  const trendData = useMemo(
    () =>
      (data?.revenue_trend ?? []).map((d) => ({
        date: d.date,
        revenue: d.revenue,
        profit: d.platform_profit,
      })),
    [data],
  );

  const dailyData = data?.daily_revenue ?? [];
  const monthlyData = data?.monthly_revenue_profit ?? [];

  const payoutTrend = useMemo(
    () =>
      (data?.creator_payout_trend ?? []).map((d) => ({
        date: d.date,
        payout: d.creator_payout,
        profit: d.platform_profit,
      })),
    [data],
  );

  const sourceData = data?.revenue_by_source ?? [];
  const s = data?.summary;

  const fmtDelta = (v: number | null | undefined) =>
    typeof v === "number" ? v : undefined;

  /* ---------------- render ---------------- */

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue"
        subtitle="Platform financial analytics & profitability"
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleExport("csv")}
              disabled={!!exporting}
              className="glass rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {exporting === "csv" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              CSV
            </button>
            <button
              onClick={() => handleExport("excel")}
              disabled={!!exporting}
              className="glass rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {exporting === "excel" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Excel
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={!!exporting}
              className="glass rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {exporting === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              PDF
            </button>
            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="glass rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        }
      />

      {/* Range filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {RANGE_OPTIONS.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setRange(k)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium border transition ${
              range === k ? "bg-primary text-primary-foreground border-primary" : "glass border-transparent hover:border-border"
            }`}
          >
            <Calendar className="inline h-3 w-3 mr-1" />{l}
          </button>
        ))}

        {range === "custom" && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="glass rounded-full px-3 py-1.5 text-xs bg-transparent"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="glass rounded-full px-3 py-1.5 text-xs bg-transparent"
            />
            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="rounded-full px-4 py-1.5 text-xs font-medium bg-primary text-primary-foreground disabled:opacity-50"
            >
              {loading ? "Loading…" : "Apply"}
            </button>
          </div>
        )}

        {data && (
          <span className="text-xs text-muted-foreground ml-auto">
            {data.filters.start_date} → {data.filters.end_date}
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          <AlertCircle className="h-4 w-4" />
          <span className="flex-1">{error}</span>
          <button onClick={fetchDashboard} className="text-xs underline hover:no-underline">Retry</button>
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading revenue…
        </div>
      ) : data ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi label="Today's Revenue" value={inr(s?.todays_revenue.amount ?? 0)} delta={fmtDelta(s?.todays_revenue.change_percentage)} icon={IndianRupee} tone="success" />
            <Kpi label="Yesterday's Revenue" value={inr(s?.yesterdays_revenue.amount ?? 0)} delta={fmtDelta(s?.yesterdays_revenue.change_percentage)} icon={TrendingDown} tone="info" />
            <Kpi label="Weekly Revenue" value={inr(s?.weekly_revenue.amount ?? 0)} delta={fmtDelta(s?.weekly_revenue.change_percentage)} icon={TrendingUp} tone="primary" />
            <Kpi label="Monthly Revenue" value={inr(s?.monthly_revenue.amount ?? 0)} delta={fmtDelta(s?.monthly_revenue.change_percentage)} icon={Wallet} tone="success" />
            <Kpi label="Total Revenue" value={compact(s?.total_revenue.amount ?? 0)} delta={fmtDelta(s?.total_revenue.change_percentage)} icon={Coins} tone="primary" />
            <Kpi label="Platform Profit" value={compact(s?.platform_profit.amount ?? 0)} icon={TrendingUp} tone="success" />
            <Kpi label="Creator Payouts" value={compact(s?.creator_payouts.amount ?? 0)} icon={ArrowUpRight} tone="info" />
            <Kpi label="Pending Withdrawals" value={inr(s?.pending_withdrawals.amount ?? 0)} icon={ArrowDownRight} tone="warning" />
          </div>

          {/* Revenue sources */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">Revenue by Source</h2>
                <p className="text-xs text-muted-foreground">Lifetime breakdown across products</p>
              </div>
              <PieIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {sourceData.map((src) => {
                const meta = getSourceMeta(src.source);
                const Icon = meta.icon;
                return (
                  <button
                    key={src.source}
                    onClick={() => setSource((cur) => (cur === src.source ? "all" : src.source))}
                    className={`text-left rounded-xl p-3 border transition ${
                      source === src.source ? "border-primary bg-primary/10" : "border-border/40 hover:border-border bg-card/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-lg p-1.5" style={{ background: `${meta.color}22`, color: meta.color }}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <p className="text-xs text-muted-foreground truncate">{src.source}</p>
                    </div>
                    <p className="text-base font-bold">{compact(src.amount)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {src.transactions.toLocaleString()} tx · {src.percentage}%
                    </p>
                  </button>
                );
              })}
              {sourceData.length === 0 && (
                <p className="text-xs text-muted-foreground col-span-full">No source data for this period.</p>
              )}
            </div>
          </GlassCard>

          {/* Charts row */}
          <div className="grid lg:grid-cols-2 gap-4">
            <GlassCard>
              <h3 className="font-semibold mb-1">Revenue Trend</h3>
              <p className="text-xs text-muted-foreground mb-3">Selected period · revenue vs profit</p>
              <div className="h-64">
                <ResponsiveContainer>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                      <linearGradient id="prof" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.5} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid stroke="#ffffff10" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={4} tickFormatter={formatAxisDate} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} labelFormatter={formatAxisDate} formatter={(v: any) => inr(v as number)} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#8b5cf6" fill="url(#rev)" strokeWidth={2} />
                    <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" fill="url(#prof)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="font-semibold mb-1">Daily Revenue</h3>
              <p className="text-xs text-muted-foreground mb-3">Bar view · selected period</p>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={dailyData}>
                    <CartesianGrid stroke="#ffffff10" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={4} tickFormatter={formatAxisDate} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} labelFormatter={formatAxisDate} formatter={(v: any) => inr(v as number)} />
                    <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="font-semibold mb-1">Monthly Revenue & Profit</h3>
              <p className="text-xs text-muted-foreground mb-3">Year-to-date comparison</p>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={monthlyData}>
                    <CartesianGrid stroke="#ffffff10" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} formatter={(v: any) => inr(v as number)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="platform_profit" name="Profit" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="font-semibold mb-1">Creator Payouts</h3>
              <p className="text-xs text-muted-foreground mb-3">Payout vs platform profit · selected period</p>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={payoutTrend}>
                    <CartesianGrid stroke="#ffffff10" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={4} tickFormatter={formatAxisDate} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} labelFormatter={formatAxisDate} formatter={(v: any) => inr(v as number)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="payout" name="Creator Payout" stackId="a" fill="#0ea5e9" />
                    <Bar dataKey="profit" name="Platform Profit" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="lg:col-span-2">
              <h3 className="font-semibold mb-1">Revenue Split</h3>
              <p className="text-xs text-muted-foreground mb-3">Share of revenue by product (lifetime)</p>
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={sourceData} dataKey="amount" nameKey="source" outerRadius={90} innerRadius={50} paddingAngle={2}>
                      {sourceData.map((src) => <Cell key={src.source} fill={getSourceMeta(src.source).color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} formatter={(v: any) => inr(v as number)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          {/* Table */}
          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">Revenue Ledger</h3>
                <p className="text-xs text-muted-foreground">
                  {filteredLedger.length} of {data.revenue_ledger.total_entries} entries{source !== "all" ? ` · ${source}` : ""}
                </p>
              </div>
              <button onClick={() => setSource("all")} disabled={source === "all"} className="text-xs text-primary hover:underline disabled:opacity-40">
                Clear filter
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border/40">
                    <th className="py-2 px-2">Date</th>
                    <th className="py-2 px-2">Source</th>
                    <th className="py-2 px-2 text-right">Amount</th>
                    <th className="py-2 px-2 text-right">Transactions</th>
                    <th className="py-2 px-2 text-right">Creator Payout</th>
                    <th className="py-2 px-2 text-right">Platform Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedger.map((r, i) => {
                    const meta = getSourceMeta(r.source);
                    return (
                      <tr key={`${r.date}-${r.source}-${i}`} className="border-b border-border/20 hover:bg-card/40">
                        <td className="py-2 px-2 text-xs">{r.date}</td>
                        <td className="py-2 px-2">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                            {r.source}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right font-semibold">{inr(r.amount)}</td>
                        <td className="py-2 px-2 text-right text-xs text-muted-foreground">{r.transactions.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right text-sky-400">{inr(r.creator_payout)}</td>
                        <td className="py-2 px-2 text-right text-emerald-400 font-medium">{inr(r.platform_profit)}</td>
                      </tr>
                    );
                  })}
                  {filteredLedger.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                        No ledger entries for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      ) : null}
    </div>
  );
}
