import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import { CREATORS, STATES } from "@/lib/mock-data";
import { Video, VideoOff, Search, X, Download, Clock, Coins, IndianRupee, Activity, TrendingUp } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";

const CUSTOMERS = ["Rahul Kumar","Amit Shah","Vikas Verma","Suresh Reddy","Karan Mehta","Rohan Gupta","Aditya Singh","Manish Yadav","Sandeep Roy","Nikhil Jain"];
const STATUSES = ["Completed","Missed","Cancelled","Ongoing"] as const;
type Status = typeof STATUSES[number];

const CALLS = Array.from({ length: 50 }).map((_, i) => {
  const creator = CREATORS[i % CREATORS.length];
  const customer = CUSTOMERS[i % CUSTOMERS.length];
  const status: Status = i % 13 === 0 ? "Ongoing" : i % 8 === 0 ? "Missed" : i % 15 === 0 ? "Cancelled" : "Completed";
  const duration = status === "Completed" ? 120 + (i * 53) % 2400 : status === "Ongoing" ? 60 + (i * 17) % 900 : 0;
  const coins = Math.round((duration / 60) * creator.videoPrice);
  const start = new Date(Date.now() - i * 1000 * 60 * 23);
  const end = new Date(start.getTime() + duration * 1000);
  return { id: `VID-${20000 + i}`, customer, creator, status, duration, coins, revenue: Math.round(coins * 0.8), start, end };
});

const STATUS_TONE: Record<Status, string> = {
  Completed: "bg-success/20 text-success",
  Missed: "bg-destructive/20 text-destructive",
  Cancelled: "bg-warning/20 text-warning",
  Ongoing: "bg-primary/20 text-primary animate-pulse",
};

const fmtDur = (s: number) => s ? `${Math.floor(s/60)}m ${s%60}s` : "—";
const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const CHART = Array.from({ length: 7 }).map((_, i) => ({
  day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],
  calls: 60 + Math.round(Math.random() * 140),
  revenue: 15000 + Math.round(Math.random() * 25000),
  minutes: 800 + Math.round(Math.random() * 1500),
}));

const TOP_CREATORS = CREATORS.slice(0, 6).map((c, i) => ({ name: c.name.split(" ")[0], calls: 80 - i * 9, revenue: 35000 - i * 4200 }));

function VideoCallsPage() {
  const [stateF, setStateF] = useState("All");
  const [creatorF, setCreatorF] = useState("All");
  const [statusF, setStatusF] = useState<"All" | Status>("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<typeof CALLS[number] | null>(null);

  const filtered = useMemo(() => CALLS.filter(c =>
    (stateF === "All" || c.creator.state === stateF) &&
    (creatorF === "All" || c.creator.name === creatorF) &&
    (statusF === "All" || c.status === statusF) &&
    (q === "" || c.id.toLowerCase().includes(q.toLowerCase()) || c.customer.toLowerCase().includes(q.toLowerCase()) || c.creator.name.toLowerCase().includes(q.toLowerCase()))
  ), [stateF, creatorF, statusF, q]);

  const stats = useMemo(() => {
    const total = CALLS.length;
    const active = CALLS.filter(c => c.status === "Ongoing").length;
    const totalMin = Math.round(CALLS.reduce((s,c) => s + c.duration, 0) / 60);
    const completed = CALLS.filter(c => c.status === "Completed");
    const avg = completed.length ? Math.round(completed.reduce((s,c) => s + c.duration, 0) / completed.length / 60) : 0;
    const revenue = CALLS.reduce((s,c) => s + c.revenue, 0);
    const failed = CALLS.filter(c => c.status === "Missed" || c.status === "Cancelled").length;
    return { total, active, totalMin, avg, revenue, failed };
  }, []);

  const exportCsv = () => {
    const rows = [["ID","Customer","Creator","Start","End","Duration","Coins","Revenue","Status"]];
    filtered.forEach(c => rows.push([c.id,c.customer,c.creator.name,c.start.toISOString(),c.end.toISOString(),String(c.duration),String(c.coins),String(c.revenue),c.status]));
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "video-calls.csv"; a.click();
    toast.success("Exported CSV");
  };

  return (
    <div>
      <PageHeader title="Video Calls" subtitle="Video analytics & quality monitoring" action={
        <button onClick={exportCsv} className="glass rounded-full px-4 py-2 text-sm flex items-center gap-2"><Download className="h-4 w-4" />Export</button>
      } />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { l: "Total Video Calls", v: stats.total, icon: Video, tone: "text-primary" },
          { l: "Active Now", v: stats.active, icon: Activity, tone: "text-success" },
          { l: "Total Minutes", v: stats.totalMin, icon: Clock, tone: "text-accent" },
          { l: "Revenue", v: `₹${stats.revenue.toLocaleString()}`, icon: IndianRupee, tone: "text-success" },
          { l: "Avg Duration", v: `${stats.avg}m`, icon: TrendingUp, tone: "text-warning" },
          { l: "Failed Calls", v: stats.failed, icon: VideoOff, tone: "text-destructive" },
        ].map((s,i) => (
          <GlassCard key={i}>
            <s.icon className={`h-5 w-5 ${s.tone} mb-2`} />
            <p className="text-xs text-muted-foreground">{s.l}</p>
            <p className="text-xl font-bold mt-1">{s.v}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search video call ID, customer, creator..." className="w-full bg-transparent rounded-full pl-9 pr-4 py-2 text-sm outline-none border border-border" />
          </div>
          <select value={stateF} onChange={e => setStateF(e.target.value)} className="glass rounded-full px-3 py-2 text-sm">
            <option>All</option>{STATES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={creatorF} onChange={e => setCreatorF(e.target.value)} className="glass rounded-full px-3 py-2 text-sm">
            <option>All</option>{CREATORS.map(c => <option key={c.id}>{c.name}</option>)}
          </select>
          <select value={statusF} onChange={e => setStatusF(e.target.value as any)} className="glass rounded-full px-3 py-2 text-sm">
            <option>All</option>{STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <GlassCard><p className="text-xs text-muted-foreground mb-2">Video Call Revenue Trend</p>
          <ResponsiveContainer width="100%" height={180}><AreaChart data={CHART}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Area dataKey="revenue" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.2} /></AreaChart></ResponsiveContainer>
        </GlassCard>
        <GlassCard><p className="text-xs text-muted-foreground mb-2">Video Usage Trend</p>
          <ResponsiveContainer width="100%" height={180}><LineChart data={CHART}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Line dataKey="minutes" stroke="hsl(var(--primary))" strokeWidth={2} /><Line dataKey="calls" stroke="hsl(var(--accent))" strokeWidth={2} /></LineChart></ResponsiveContainer>
        </GlassCard>
        <GlassCard><p className="text-xs text-muted-foreground mb-2">Creator Performance</p>
          <ResponsiveContainer width="100%" height={180}><BarChart data={TOP_CREATORS}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={11} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Bar dataKey="calls" fill="hsl(var(--primary))" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer>
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs text-muted-foreground">
              <tr>{["Video Call ID","Customer","Creator","Start","End","Duration","Coins","Revenue","Status"].map(h => <th key={h} className="text-left p-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.slice(0, 30).map(c => (
                <tr key={c.id} onClick={() => setOpen(c)} className="border-t border-border hover:bg-muted/20 cursor-pointer">
                  <td className="p-3 font-mono text-xs">{c.id}</td>
                  <td className="p-3">{c.customer}</td>
                  <td className="p-3 flex items-center gap-2"><img src={c.creator.avatar} className="h-6 w-6 rounded-full" alt="" />{c.creator.name}</td>
                  <td className="p-3 text-xs text-muted-foreground">{fmtTime(c.start)}</td>
                  <td className="p-3 text-xs text-muted-foreground">{c.status === "Ongoing" ? "—" : fmtTime(c.end)}</td>
                  <td className="p-3">{fmtDur(c.duration)}</td>
                  <td className="p-3"><span className="inline-flex items-center gap-1"><Coins className="h-3 w-3 text-amber-500" />{c.coins}</span></td>
                  <td className="p-3 text-success font-semibold">₹{c.revenue}</td>
                  <td className="p-3"><span className={`text-[10px] rounded-full px-2 py-0.5 ${STATUS_TONE[c.status]}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(null)}>
            <motion.div initial={{ y: 20, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.96 }} className="glass rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div><p className="text-xs text-muted-foreground">Video Call Detail</p><h3 className="text-lg font-bold font-mono">{open.id}</h3></div>
                <button onClick={() => setOpen(null)} className="rounded-full p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
              </div>
              <div className="glass-strong rounded-xl p-3 mb-3">
                <p className="text-xs font-semibold mb-2">Call Information</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><p className="text-muted-foreground">Started</p><p>{open.start.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Ended</p><p>{open.status === "Ongoing" ? "Live" : open.end.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Duration</p><p>{fmtDur(open.duration)}</p></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="glass-strong rounded-xl p-3">
                  <p className="text-xs font-semibold mb-1">Customer</p>
                  <p className="font-semibold text-sm">{open.customer}</p>
                </div>
                <div className="glass-strong rounded-xl p-3">
                  <p className="text-xs font-semibold mb-1">Creator</p>
                  <div className="flex items-center gap-2"><img src={open.creator.avatar} className="h-7 w-7 rounded-full" alt="" /><div><p className="font-semibold text-sm">{open.creator.name}</p><p className="text-[10px] text-muted-foreground">{open.creator.state}</p></div></div>
                </div>
              </div>
              <div className="glass-strong rounded-xl p-4 mb-3">
                <p className="text-xs font-semibold mb-2">Revenue Split</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Coins Used</span><span>{open.coins}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Creator (60%)</span><span>₹{Math.round(open.revenue * 0.6)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Platform (40%)</span><span>₹{Math.round(open.revenue * 0.4)}</span></div>
                  <div className="flex justify-between font-bold pt-1 border-t border-border"><span>Total</span><span className="text-success">₹{open.revenue}</span></div>
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
