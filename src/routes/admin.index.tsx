import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { ADMIN_STATS, EARNINGS_DATA, CREATORS } from "@/lib/mock-data";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";
import { Users, UserCog, Activity, DollarSign, ShieldCheck, ArrowDownToLine } from "lucide-react";

export const Route = createFileRoute("/admin/")({ component: AdminHome });

function AdminHome() {
  const stats = [
    { icon: Users, label: "Total users", value: ADMIN_STATS.totalUsers.toLocaleString() },
    { icon: UserCog, label: "Creators", value: ADMIN_STATS.totalCreators.toLocaleString() },
    { icon: Activity, label: "Live now", value: ADMIN_STATS.liveNow.toString(), c: "text-success" },
    { icon: DollarSign, label: "Revenue today", value: `₹${(ADMIN_STATS.revenueToday / 1000).toFixed(0)}K`, c: "text-warning" },
    { icon: ShieldCheck, label: "Pending KYC", value: ADMIN_STATS.pendingKyc.toString() },
    { icon: ArrowDownToLine, label: "Withdrawals", value: ADMIN_STATS.pendingWithdrawals.toString() },
  ];
  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {stats.map((s) => (
          <GlassCard key={s.label}>
            <s.icon className={`h-5 w-5 mb-2 ${s.c || "text-primary"}`} />
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-bold text-xl">{s.value}</p>
          </GlassCard>
        ))}
      </div>
      <GlassCard className="mb-6">
        <p className="text-xs text-muted-foreground">Revenue trend</p>
        <p className="text-2xl font-bold gradient-text mb-2">₹2,48,400</p>
        <div className="h-56">
          <ResponsiveContainer>
            <AreaChart data={EARNINGS_DATA.map((d) => ({ ...d, earnings: d.earnings * 30 }))}>
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.7 0.22 350)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="oklch(0.7 0.22 350)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#888" fontSize={11} />
              <Tooltip contentStyle={{ background: "rgba(20,15,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
              <Area type="monotone" dataKey="earnings" stroke="oklch(0.7 0.22 350)" fill="url(#ag)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
      <div>
        <p className="font-semibold mb-3">Top creators today</p>
        <div className="space-y-2">
          {CREATORS.slice(0, 5).map((c, i) => (
            <GlassCard key={c.id} className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm w-4">#{i + 1}</span>
              <img src={c.avatar} className="h-9 w-9 rounded-full" alt="" />
              <div className="flex-1"><p className="font-semibold text-sm">{c.name}</p><p className="text-xs text-muted-foreground">{c.state}</p></div>
              <p className="font-bold text-sm gradient-text">₹{(8000 - i * 1200).toLocaleString()}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
