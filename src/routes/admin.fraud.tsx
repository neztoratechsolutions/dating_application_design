import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import { CREATORS, STATES } from "@/lib/mock-data";
import { ShieldAlert, AlertTriangle, Users2, FileWarning, Wallet, UserX, Search, X, ShieldCheck, Ban, Eye } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { toast } from "sonner";

const RISK_TYPES = ["Multiple Accounts","Fake KYC","Duplicate PAN","Duplicate Aadhaar","Withdrawal Abuse","Wallet Abuse","Spam Activity","Suspicious Device"] as const;
const LEVELS = ["Low","Medium","High","Critical"] as const;
const STATUSES = ["Open","Investigating","Resolved","Banned"] as const;
type Level = typeof LEVELS[number];

const LEVEL_TONE: Record<Level, string> = {
  Low: "bg-muted/40 text-foreground",
  Medium: "bg-warning/20 text-warning",
  High: "bg-orange-500/20 text-orange-400",
  Critical: "bg-destructive/20 text-destructive animate-pulse",
};

const ALERTS = Array.from({ length: 35 }).map((_, i) => {
  const c = CREATORS[i % CREATORS.length];
  const score = 30 + (i * 17) % 70;
  const level: Level = score > 85 ? "Critical" : score > 70 ? "High" : score > 50 ? "Medium" : "Low";
  return {
    id: `FR-${5000 + i}`,
    user: c.name, avatar: c.avatar, state: c.state,
    score, level,
    type: RISK_TYPES[i % RISK_TYPES.length],
    status: STATUSES[i % STATUSES.length],
    date: new Date(Date.now() - i * 1000 * 60 * 60 * 6),
    device: ["iPhone 15","Android 14","Desktop","Android 13"][i % 4],
    ip: `103.${i % 255}.${(i * 7) % 255}.${(i * 13) % 255}`,
  };
});

const TREND = Array.from({ length: 7 }).map((_, i) => ({
  day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],
  alerts: 20 + Math.round(Math.random() * 40),
  blocked: 5 + Math.round(Math.random() * 15),
}));

const BY_STATE = STATES.slice(0, 8).map((s, i) => ({ state: s.slice(0, 6), count: 8 + (i * 13) % 30 }));
const BY_DEVICE = [
  { name: "iOS", value: 32, color: "hsl(var(--primary))" },
  { name: "Android", value: 48, color: "hsl(var(--accent))" },
  { name: "Desktop", value: 12, color: "hsl(var(--warning))" },
  { name: "Other", value: 8, color: "hsl(var(--muted-foreground))" },
];

function FraudPage() {
  const [q, setQ] = useState("");
  const [typeF, setTypeF] = useState("All");
  const [levelF, setLevelF] = useState<"All" | Level>("All");
  const [statusF, setStatusF] = useState("All");
  const [open, setOpen] = useState<typeof ALERTS[number] | null>(null);

  const filtered = useMemo(() => ALERTS.filter(a =>
    (typeF === "All" || a.type === typeF) &&
    (levelF === "All" || a.level === levelF) &&
    (statusF === "All" || a.status === statusF) &&
    (q === "" || a.user.toLowerCase().includes(q.toLowerCase()) || a.id.toLowerCase().includes(q.toLowerCase()))
  ), [q, typeF, levelF, statusF]);

  const stats = {
    alerts: ALERTS.length,
    suspicious: ALERTS.filter(a => a.score > 60).length,
    duplicateKyc: ALERTS.filter(a => a.type === "Duplicate PAN" || a.type === "Duplicate Aadhaar").length,
    suspWith: ALERTS.filter(a => a.type === "Withdrawal Abuse").length,
    highRisk: ALERTS.filter(a => a.level === "High" || a.level === "Critical").length,
    blocked: ALERTS.filter(a => a.status === "Banned").length,
  };

  const act = (label: string) => { toast.success(`${label} — action recorded`); setOpen(null); };

  return (
    <div>
      <PageHeader title="Fraud Detection" subtitle="AI risk monitoring · banking-grade anti-fraud" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { l: "Fraud Alerts", v: stats.alerts, icon: AlertTriangle, tone: "text-destructive" },
          { l: "Suspicious Accounts", v: stats.suspicious, icon: ShieldAlert, tone: "text-warning" },
          { l: "Duplicate KYC", v: stats.duplicateKyc, icon: FileWarning, tone: "text-orange-400" },
          { l: "Suspicious Withdrawals", v: stats.suspWith, icon: Wallet, tone: "text-warning" },
          { l: "High Risk Users", v: stats.highRisk, icon: Users2, tone: "text-destructive" },
          { l: "Blocked Accounts", v: stats.blocked, icon: UserX, tone: "text-muted-foreground" },
        ].map((s,i) => (
          <GlassCard key={i}>
            <s.icon className={`h-5 w-5 ${s.tone} mb-2`} />
            <p className="text-xs text-muted-foreground">{s.l}</p>
            <p className="text-xl font-bold mt-1">{s.v}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <GlassCard><p className="text-xs text-muted-foreground mb-2">Fraud Trends</p>
          <ResponsiveContainer width="100%" height={180}><AreaChart data={TREND}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Area dataKey="alerts" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.2} /><Area dataKey="blocked" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.2} /></AreaChart></ResponsiveContainer>
        </GlassCard>
        <GlassCard><p className="text-xs text-muted-foreground mb-2">State-wise Fraud</p>
          <ResponsiveContainer width="100%" height={180}><BarChart data={BY_STATE}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="state" fontSize={10} /><YAxis fontSize={11} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Bar dataKey="count" fill="hsl(var(--accent))" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer>
        </GlassCard>
        <GlassCard><p className="text-xs text-muted-foreground mb-2">Device Fraud Analytics</p>
          <ResponsiveContainer width="100%" height={180}><PieChart><Pie data={BY_DEVICE} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>{BY_DEVICE.map((e,i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Legend wrapperStyle={{ fontSize: 10 }} /></PieChart></ResponsiveContainer>
        </GlassCard>
      </div>

      <GlassCard className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search user, alert ID..." className="w-full bg-transparent rounded-full pl-9 pr-4 py-2 text-sm outline-none border border-border" />
          </div>
          <select value={typeF} onChange={e => setTypeF(e.target.value)} className="glass rounded-full px-3 py-2 text-sm">
            <option>All</option>{RISK_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={levelF} onChange={e => setLevelF(e.target.value as any)} className="glass rounded-full px-3 py-2 text-sm">
            <option>All</option>{LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
          <select value={statusF} onChange={e => setStatusF(e.target.value)} className="glass rounded-full px-3 py-2 text-sm">
            <option>All</option>{STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs text-muted-foreground">
              <tr>{["Alert","User","Risk Score","Risk Type","State","Date","Status",""].map(h => <th key={h} className="text-left p-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.slice(0, 30).map(a => (
                <tr key={a.id} className="border-t border-border hover:bg-muted/20">
                  <td className="p-3 font-mono text-xs">{a.id}</td>
                  <td className="p-3 flex items-center gap-2"><img src={a.avatar} className="h-6 w-6 rounded-full" alt="" />{a.user}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden"><div className={`h-full ${a.score > 85 ? "bg-destructive" : a.score > 70 ? "bg-orange-500" : a.score > 50 ? "bg-warning" : "bg-success"}`} style={{ width: `${a.score}%` }} /></div>
                      <span className="text-xs font-bold">{a.score}</span>
                      <span className={`text-[9px] rounded-full px-2 py-0.5 ${LEVEL_TONE[a.level]}`}>{a.level}</span>
                    </div>
                  </td>
                  <td className="p-3 text-xs">{a.type}</td>
                  <td className="p-3 text-xs text-muted-foreground">{a.state}</td>
                  <td className="p-3 text-xs text-muted-foreground">{a.date.toLocaleDateString()}</td>
                  <td className="p-3"><span className="text-[10px] rounded-full px-2 py-0.5 bg-muted/40">{a.status}</span></td>
                  <td className="p-3"><button onClick={() => setOpen(a)} className="rounded-full bg-primary/20 text-primary px-3 py-1 text-xs flex items-center gap-1"><Eye className="h-3 w-3" />View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(null)}>
            <motion.div initial={{ y: 20, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.96 }} className="glass rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={open.avatar} className="h-12 w-12 rounded-full" alt="" />
                  <div>
                    <h3 className="font-bold">{open.user}</h3>
                    <p className="text-xs text-muted-foreground">{open.id} · {open.state}</p>
                  </div>
                </div>
                <button onClick={() => setOpen(null)} className="rounded-full p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="glass-strong rounded-xl p-3"><p className="text-[10px] text-muted-foreground">Risk Score</p><p className="text-xl font-bold">{open.score}</p><span className={`text-[10px] rounded-full px-2 py-0.5 ${LEVEL_TONE[open.level]}`}>{open.level}</span></div>
                <div className="glass-strong rounded-xl p-3"><p className="text-[10px] text-muted-foreground">Risk Type</p><p className="text-sm font-semibold mt-1">{open.type}</p></div>
                <div className="glass-strong rounded-xl p-3"><p className="text-[10px] text-muted-foreground">Status</p><p className="text-sm font-semibold mt-1">{open.status}</p></div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="glass-strong rounded-xl p-3">
                  <p className="text-xs font-semibold mb-2">Device Information</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Device:</span> {open.device}</div>
                    <div><span className="text-muted-foreground">IP:</span> {open.ip}</div>
                    <div><span className="text-muted-foreground">Location:</span> {open.state}</div>
                    <div><span className="text-muted-foreground">VPN:</span> No</div>
                  </div>
                </div>

                <div className="glass-strong rounded-xl p-3">
                  <p className="text-xs font-semibold mb-2">Login History</p>
                  <div className="space-y-1 text-xs">
                    {[0,1,2].map(i => <div key={i} className="flex justify-between"><span className="text-muted-foreground">{new Date(Date.now() - i * 86400000).toLocaleDateString()}</span><span>{open.device} · {open.ip}</span></div>)}
                  </div>
                </div>

                <div className="glass-strong rounded-xl p-3">
                  <p className="text-xs font-semibold mb-2">Wallet Activity</p>
                  <div className="grid grid-cols-3 gap-2 text-xs text-center">
                    <div><p className="text-muted-foreground">Deposits</p><p className="font-semibold">₹12,400</p></div>
                    <div><p className="text-muted-foreground">Withdrawals</p><p className="font-semibold">₹9,800</p></div>
                    <div><p className="text-muted-foreground">Pending</p><p className="font-semibold text-warning">₹2,200</p></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-strong rounded-xl p-3">
                    <p className="text-xs font-semibold mb-2">KYC Documents</p>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between"><span className="text-muted-foreground">Aadhaar</span><span className="text-success">Verified</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">PAN</span><span className="text-warning">Duplicate Flag</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Selfie</span><span className="text-success">OK</span></div>
                    </div>
                  </div>
                  <div className="glass-strong rounded-xl p-3">
                    <p className="text-xs font-semibold mb-2">Withdrawal History</p>
                    <div className="text-xs space-y-1">
                      {[0,1,2].map(i => <div key={i} className="flex justify-between"><span className="text-muted-foreground">{new Date(Date.now() - i * 172800000).toLocaleDateString()}</span><span>₹{(2000 + i * 1500).toLocaleString()}</span></div>)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => act("Marked Safe")} className="rounded-xl bg-success/20 text-success py-2 text-xs font-semibold flex items-center justify-center gap-1"><ShieldCheck className="h-3 w-3" />Mark Safe</button>
                <button onClick={() => act("Investigating")} className="rounded-xl bg-primary/20 text-primary py-2 text-xs font-semibold flex items-center justify-center gap-1"><Eye className="h-3 w-3" />Investigate</button>
                <button onClick={() => act("Suspended")} className="rounded-xl bg-warning/20 text-warning py-2 text-xs font-semibold flex items-center justify-center gap-1"><UserX className="h-3 w-3" />Suspend</button>
                <button onClick={() => act("Banned")} className="rounded-xl bg-destructive/20 text-destructive py-2 text-xs font-semibold flex items-center justify-center gap-1"><Ban className="h-3 w-3" />Ban</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const Route = createFileRoute("/admin/fraud")({ component: FraudPage });
