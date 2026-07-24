import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { EARNINGS_DATA } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-store";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/creator/earnings")({ component: E });

function E() {
  const user = useAuth((s) => s.user);
  return (
    <div>
      <PageHeader title="Earnings" />
      <div className="grid grid-cols-2 gap-3 mb-5">
        <GlassCard><p className="text-xs text-muted-foreground">Total earned</p><p className="text-2xl font-bold gradient-text">₹{(user?.earnings ?? 0).toLocaleString()}</p></GlassCard>
        <GlassCard><p className="text-xs text-muted-foreground">Available payout</p><p className="text-2xl font-bold">₹4,820</p></GlassCard>
      </div>
      <GlassCard className="mb-5">
        <p className="text-xs text-muted-foreground mb-2">Last 7 days</p>
        <div className="h-48">
          <ResponsiveContainer>
            <BarChart data={EARNINGS_DATA}>
              <XAxis dataKey="day" stroke="#888" fontSize={11} />
              <Tooltip contentStyle={{ background: "rgba(20,15,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
              <Bar dataKey="earnings" fill="oklch(0.7 0.22 350)" radius={8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
      <button onClick={() => toast.success("Withdrawal request sent")} className="w-full rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow">
        Withdraw ₹4,820
      </button>
      <p className="text-xs text-muted-foreground mt-2 text-center">Default commission: 20% · Calls under 1 min not charged</p>
    </div>
  );
}
