// import { createFileRoute } from "@tanstack/react-router";
// import { PageHeader, GlassCard } from "@/components/ui-kit";
// import { ADMIN_STATS, EARNINGS_DATA, CREATORS } from "@/lib/mock-data";
// import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";
// import { Users, UserCog, Activity, DollarSign, ShieldCheck, ArrowDownToLine } from "lucide-react";

// export const Route = createFileRoute("/admin/")({ component: AdminHome });

// function AdminHome() {
//   const stats = [
//     { icon: Users, label: "Total users", value: ADMIN_STATS.totalUsers.toLocaleString() },
//     { icon: UserCog, label: "Creators", value: ADMIN_STATS.totalCreators.toLocaleString() },
//     { icon: Activity, label: "Live now", value: ADMIN_STATS.liveNow.toString(), c: "text-success" },
//     { icon: DollarSign, label: "Revenue today", value: `₹${(ADMIN_STATS.revenueToday / 1000).toFixed(0)}K`, c: "text-warning" },
//     { icon: ShieldCheck, label: "Pending KYC", value: ADMIN_STATS.pendingKyc.toString() },
//     { icon: ArrowDownToLine, label: "Withdrawals", value: ADMIN_STATS.pendingWithdrawals.toString() },
//   ];
//   return (
//     <div>
//       <PageHeader title="Admin Dashboard" subtitle="Platform overview" />
//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
//         {stats.map((s) => (
//           <GlassCard key={s.label}>
//             <s.icon className={`h-5 w-5 mb-2 ${s.c || "text-primary"}`} />
//             <p className="text-xs text-muted-foreground">{s.label}</p>
//             <p className="font-bold text-xl">{s.value}</p>
//           </GlassCard>
//         ))}
//       </div>
//       <GlassCard className="mb-6">
//         <p className="text-xs text-muted-foreground">Revenue trend</p>
//         <p className="text-2xl font-bold gradient-text mb-2">₹2,48,400</p>
//         <div className="h-56">
//           <ResponsiveContainer>
//             <AreaChart data={EARNINGS_DATA.map((d) => ({ ...d, earnings: d.earnings * 30 }))}>
//               <defs>
//                 <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="0%" stopColor="oklch(0.7 0.22 350)" stopOpacity={0.5} />
//                   <stop offset="100%" stopColor="oklch(0.7 0.22 350)" stopOpacity={0} />
//                 </linearGradient>
//               </defs>
//               <XAxis dataKey="day" stroke="#888" fontSize={11} />
//               <Tooltip contentStyle={{ background: "rgba(20,15,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
//               <Area type="monotone" dataKey="earnings" stroke="oklch(0.7 0.22 350)" fill="url(#ag)" strokeWidth={2} />
//             </AreaChart>
//           </ResponsiveContainer>
//         </div>
//       </GlassCard>
//       <div>
//         <p className="font-semibold mb-3">Top creators today</p>
//         <div className="space-y-2">
//           {CREATORS.slice(0, 5).map((c, i) => (
//             <GlassCard key={c.id} className="flex items-center gap-3">
//               <span className="text-muted-foreground text-sm w-4">#{i + 1}</span>
//               <img src={c.avatar} className="h-9 w-9 rounded-full" alt="" />
//               <div className="flex-1"><p className="font-semibold text-sm">{c.name}</p><p className="text-xs text-muted-foreground">{c.state}</p></div>
//               <p className="font-bold text-sm gradient-text">₹{(8000 - i * 1200).toLocaleString()}</p>
//             </GlassCard>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
} from "recharts";
import {
  Users, UserCog, Activity, DollarSign, ShieldCheck, ArrowDownToLine,
  RefreshCw, Loader2, AlertCircle, Trophy,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({ component: AdminHome });

const API_BASE = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

// ---- API types (matching GET /admin/dashboard response) ----

interface TopCreator {
  rank: number;
  user_id: number;
  name: string;
  total_earned: number;
}

interface RevenuePoint { date: string; day: string; earnings: number; }

interface DashboardData {
  total_users: number;
  total_creators: number;
  live_now: number;
  total_revenue: number;
  pending_kyc: number;
  withdrawals: number;
  top_creators: TopCreator[];
  revenue_trend: RevenuePoint[];
}

// ₹ formatter for whole-rupee amounts (Indian grouping).
const inr = (n: number) => `₹${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// Compact ₹ for axis ticks: ₹0, ₹100, ₹1.5K, ₹2K…
const inrCompact = (n: number) => {
  const v = n || 0;
  if (Math.abs(v) >= 1000) {
    const k = v / 1000;
    return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `₹${v.toFixed(0)}`;
};

function avatarFor(id: number, name: string): string {
  return `https://i.pravatar.cc/200?u=${encodeURIComponent(String(id ?? name))}`;
}

async function getJson(url: string) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  let body: any = null;
  try { body = await res.json(); } catch { /* ignore */ }
  if (!res.ok) {
    throw new Error(body?.detail || body?.message || `Request failed (${res.status})`);
  }
  return body;
}

function AdminHome() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const j = await getJson(`${API_BASE}/admin/dashboard`);
      setData(j.data);
    } catch (e: any) {
      const msg = e?.message || "Failed to load dashboard";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div>
        <PageHeader title="Admin Dashboard" subtitle="Platform overview" />
        <GlassCard className="text-center py-20 flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="font-bold text-lg">Failed to Load Dashboard</h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <button onClick={load} className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </GlassCard>
      </div>
    );
  }

  const stats = [
    { icon: Users, label: "Total users", value: (data?.total_users ?? 0).toLocaleString(), c: "text-primary" },
    { icon: UserCog, label: "Creators", value: (data?.total_creators ?? 0).toLocaleString(), c: "text-accent" },
    { icon: Activity, label: "Live now", value: String(data?.live_now ?? 0), c: "text-success" },
    { icon: DollarSign, label: "Total revenue", value: inr(data?.total_revenue ?? 0), c: "text-warning" },
    { icon: ShieldCheck, label: "Pending KYC", value: String(data?.pending_kyc ?? 0), c: "text-destructive" },
    { icon: ArrowDownToLine, label: "Withdrawals", value: String(data?.withdrawals ?? 0), c: "text-primary" },
  ];

  const trend = data?.revenue_trend ?? [];
  const trendTotal = trend.reduce((s, d) => s + (d.earnings || 0), 0);
  const topCreators = data?.top_creators ?? [];

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Platform overview"
        action={
          <button onClick={load} disabled={loading} className="glass rounded-full px-3 py-2 text-sm flex items-center gap-2 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        }
      />

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {stats.map((s) => (
          <GlassCard key={s.label}>
            <s.icon className={`h-5 w-5 mb-2 ${s.c}`} />
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-bold text-xl">{s.value}</p>
          </GlassCard>
        ))}
      </div>

      {/* Revenue trend */}
      <GlassCard className="mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <p className="text-xs text-muted-foreground">Revenue trend · last 7 days</p>
            <p className="text-2xl font-bold gradient-text">{inr(trendTotal)}</p>
          </div>
          <p className="text-[10px] text-muted-foreground">{trend.length} days</p>
        </div>
        <div className="h-56">
          {trend.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No revenue data</div>
          ) : (
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.7 0.22 350)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.7 0.22 350)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} tickFormatter={inrCompact} width={48} />
                <Tooltip
                  formatter={(v: number) => [inr(v), "Revenue"]}
                  labelFormatter={(l) => `Day: ${l}`}
                  contentStyle={{ background: "rgba(20,15,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                />
                <Area type="monotone" dataKey="earnings" stroke="oklch(0.7 0.22 350)" fill="url(#ag)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>

      {/* Top creators */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-warning" />
          <p className="font-semibold">Top creators</p>
        </div>
        <div className="space-y-2">
          {topCreators.length === 0 ? (
            <GlassCard className="text-center py-8 text-sm text-muted-foreground">No top creators yet</GlassCard>
          ) : topCreators.map((c) => (
            <GlassCard key={c.user_id} className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm w-6">#{c.rank}</span>
              <img src={avatarFor(c.user_id, c.name)} className="h-9 w-9 rounded-full" alt="" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground">User #{c.user_id}</p>
              </div>
              <p className="font-bold text-sm gradient-text">{inr(c.total_earned)}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
