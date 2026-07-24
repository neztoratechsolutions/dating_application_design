import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, GlassCard, CoinBadge } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth-store";
import { EARNINGS_DATA } from "@/lib/mock-data";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";
import { TrendingUp, Users, Phone, Star, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/creator/")({ component: CreatorHome });

function CreatorHome() {
  const user = useAuth((s) => s.user);
  const stats = [
    { icon: TrendingUp, label: "Today's earnings", value: "₹1,840", c: "text-success" },
    { icon: Users, label: "Followers", value: "2,341", c: "text-primary" },
    { icon: Phone, label: "Calls", value: "23", c: "text-accent" },
    { icon: Star, label: "Rating", value: "4.8", c: "text-warning" },
  ];

  return (
    <div>
      <PageHeader title={`Hi, ${user?.name.split(" ")[0]} 👋`} subtitle="Here's how you're doing today" />

      {!user?.kycVerified && (
        <Link to="/creator/kyc" className="block glass-strong rounded-2xl p-4 mb-5 border border-warning/30">
          <p className="text-sm font-semibold text-warning">⚠️ Complete your KYC</p>
          <p className="text-xs text-muted-foreground">You can't receive payouts until verified.</p>
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <GlassCard key={s.label}>
            <s.icon className={`h-5 w-5 ${s.c} mb-2`} />
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-bold text-xl">{s.value}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="mb-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Weekly earnings</p>
            <p className="text-2xl font-bold gradient-text">₹{EARNINGS_DATA.reduce((a, b) => a + b.earnings, 0).toLocaleString()}</p>
          </div>
          <CoinBadge amount={user?.earnings ?? 0} />
        </div>
        <div className="h-44">
          <ResponsiveContainer>
            <AreaChart data={EARNINGS_DATA}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.7 0.22 350)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="oklch(0.7 0.22 350)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#888" fontSize={11} />
              <Tooltip contentStyle={{ background: "rgba(20,15,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
              <Area type="monotone" dataKey="earnings" stroke="oklch(0.7 0.22 350)" fill="url(#g)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/creator/chat"><GlassCard hover><MessageCircle className="h-5 w-5 text-primary mb-2" /><p className="font-semibold text-sm">8 new messages</p></GlassCard></Link>
        <Link to="/creator/earnings"><GlassCard hover><TrendingUp className="h-5 w-5 text-success mb-2" /><p className="font-semibold text-sm">View payouts</p></GlassCard></Link>
      </div>
    </div>
  );
}
