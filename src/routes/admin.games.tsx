import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import { CREATORS, STATES } from "@/lib/mock-data";
import { Gamepad2, Trophy, Users, IndianRupee, TrendingUp, Coins, Settings } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";

const CHART = Array.from({ length: 7 }).map((_, i) => ({
  day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],
  revenue: 12000 + Math.round(Math.random() * 18000),
  players: 800 + Math.round(Math.random() * 1200),
  profit: 4000 + Math.round(Math.random() * 8000),
}));

const LB = CREATORS.slice(0, 10).map((c, i) => ({
  rank: i + 1, user: c.name, state: c.state,
  wins: 240 - i * 18, earnings: 32000 - i * 2400,
}));

function GameAnalyticsCard({ title, color, entries, revenue, winners, rewards }: any) {
  const profit = revenue - rewards;
  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-3">
        <div className={`h-9 w-9 rounded-xl ${color} flex items-center justify-center`}><Gamepad2 className="h-4 w-4 text-white" /></div>
        <div><h3 className="font-bold">{title}</h3><p className="text-[10px] text-muted-foreground">Analytics · Today</p></div>
      </div>
      <div className="grid grid-cols-5 gap-2 text-center">
        {[
          { l: "Entries", v: entries },
          { l: "Revenue", v: `₹${revenue.toLocaleString()}` },
          { l: "Winners", v: winners },
          { l: "Rewards", v: `₹${rewards.toLocaleString()}` },
          { l: "Profit", v: `₹${profit.toLocaleString()}`, tone: "text-success" },
        ].map((s,i) => (
          <div key={i} className="glass-strong rounded-xl p-2">
            <p className="text-[9px] text-muted-foreground uppercase">{s.l}</p>
            <p className={`text-sm font-bold mt-0.5 ${s.tone || ""}`}>{s.v}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function GamesPage() {
  const [enabled, setEnabled] = useState({ color: true, scratch: true });
  const [entryFee, setEntryFee] = useState(10);
  const [reward, setReward] = useState(50);
  const [limit, setLimit] = useState(20);

  return (
    <div>
      <PageHeader title="Games" subtitle="Games analytics & operator console" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { l: "Players Today", v: "3,284", icon: Users, tone: "text-primary" },
          { l: "Game Entries", v: "12,891", icon: Gamepad2, tone: "text-accent" },
          { l: "Revenue", v: "₹2.4L", icon: IndianRupee, tone: "text-success" },
          { l: "Rewards Paid", v: "₹84K", icon: Trophy, tone: "text-warning" },
          { l: "Profit", v: "₹1.56L", icon: TrendingUp, tone: "text-success" },
          { l: "Active Players", v: "428", icon: Coins, tone: "text-destructive" },
        ].map((s,i) => (
          <GlassCard key={i}>
            <s.icon className={`h-5 w-5 ${s.tone} mb-2`} />
            <p className="text-xs text-muted-foreground">{s.l}</p>
            <p className="text-xl font-bold mt-1">{s.v}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <GameAnalyticsCard title="Colour Connect" color="bg-gradient-to-br from-primary to-accent" entries={6420} revenue={128400} winners={842} rewards={42000} />
        <GameAnalyticsCard title="Scratch Game" color="bg-gradient-to-br from-amber-500 to-orange-600" entries={6471} revenue={129420} winners={1284} rewards={42000} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <GlassCard><p className="text-xs text-muted-foreground mb-2">Daily Game Revenue</p>
          <ResponsiveContainer width="100%" height={180}><AreaChart data={CHART}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Area dataKey="revenue" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.2} /></AreaChart></ResponsiveContainer>
        </GlassCard>
        <GlassCard><p className="text-xs text-muted-foreground mb-2">User Participation</p>
          <ResponsiveContainer width="100%" height={180}><BarChart data={CHART}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Bar dataKey="players" fill="hsl(var(--primary))" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer>
        </GlassCard>
        <GlassCard><p className="text-xs text-muted-foreground mb-2">Profit Trend</p>
          <ResponsiveContainer width="100%" height={180}><LineChart data={CHART}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Line dataKey="profit" stroke="hsl(var(--accent))" strokeWidth={2} /></LineChart></ResponsiveContainer>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2"><Trophy className="h-4 w-4 text-warning" /><h3 className="font-bold text-sm">Leaderboard</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-xs text-muted-foreground"><tr>{["Rank","User","Wins","Earnings","State"].map(h => <th key={h} className="text-left p-3 font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {LB.map(r => (
                    <tr key={r.rank} className="border-t border-border hover:bg-muted/20">
                      <td className="p-3 font-bold">#{r.rank}</td>
                      <td className="p-3">{r.user}</td>
                      <td className="p-3">{r.wins}</td>
                      <td className="p-3 text-success font-semibold">₹{r.earnings.toLocaleString()}</td>
                      <td className="p-3 text-xs text-muted-foreground">{r.state}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        <GlassCard>
          <div className="flex items-center gap-2 mb-3"><Settings className="h-4 w-4 text-primary" /><h3 className="font-bold text-sm">Admin Controls</h3></div>
          <div className="space-y-3">
            {(["color","scratch"] as const).map(k => (
              <div key={k} className="glass-strong rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm capitalize">{k === "color" ? "Colour Connect" : "Scratch Game"}</span>
                <button onClick={() => { setEnabled(e => ({ ...e, [k]: !e[k] })); toast.success(`${k} ${!enabled[k] ? "enabled" : "disabled"}`); }}
                  className={`text-[10px] rounded-full px-3 py-1 ${enabled[k] ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                  {enabled[k] ? "ENABLED" : "DISABLED"}
                </button>
              </div>
            ))}
            <div className="glass-strong rounded-xl p-3">
              <label className="text-[10px] text-muted-foreground">Entry Fee (₹)</label>
              <input type="number" value={entryFee} onChange={e => setEntryFee(+e.target.value)} className="w-full bg-transparent border-b border-border outline-none text-sm py-1" />
            </div>
            <div className="glass-strong rounded-xl p-3">
              <label className="text-[10px] text-muted-foreground">Reward Amount (₹)</label>
              <input type="number" value={reward} onChange={e => setReward(+e.target.value)} className="w-full bg-transparent border-b border-border outline-none text-sm py-1" />
            </div>
            <div className="glass-strong rounded-xl p-3">
              <label className="text-[10px] text-muted-foreground">Daily Play Limit</label>
              <input type="number" value={limit} onChange={e => setLimit(+e.target.value)} className="w-full bg-transparent border-b border-border outline-none text-sm py-1" />
            </div>
            <button onClick={() => toast.success("Settings saved")} className="w-full rounded-full bg-primary text-primary-foreground py-2 text-sm font-semibold">Save Changes</button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin/games")({ component: GamesPage });
