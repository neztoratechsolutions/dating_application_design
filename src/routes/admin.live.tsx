import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { GlassCard, PageHeader, OnlineDot } from "@/components/ui-kit";
import { CREATORS, STATES } from "@/lib/mock-data";
import { Users, Radio, MessageCircle, Phone, Video, Gamepad2, Smartphone, Monitor, Search, Circle } from "lucide-react";

const CUSTOMERS = ["Rahul K","Amit S","Vikas V","Suresh R","Karan M","Rohan G","Aditya S","Manish Y","Sandeep R","Nikhil J","Arjun N","Deepak I","Saurabh P","Yash T","Ravi M"];
const DEVICES = ["iPhone 15","Android","iPad","Desktop","Android"];
const DEVICE_ICON: Record<string,any> = { "iPhone 15": Smartphone, Android: Smartphone, iPad: Smartphone, Desktop: Monitor };
const ACTIVITIES = ["Browsing","Chatting","Voice Call","Video Call","Playing Game"] as const;
const ACT_TONE: Record<string,string> = {
  Browsing: "bg-muted/40 text-foreground",
  Chatting: "bg-primary/20 text-primary",
  "Voice Call": "bg-accent/20 text-accent",
  "Video Call": "bg-success/20 text-success",
  "Playing Game": "bg-warning/20 text-warning",
};

const seed = (i: number) => {
  const isCreator = i % 3 === 0;
  const user = isCreator ? CREATORS[i % CREATORS.length].name : CUSTOMERS[i % CUSTOMERS.length];
  const state = STATES[i % STATES.length];
  const activity = ACTIVITIES[i % ACTIVITIES.length];
  const device = DEVICES[i % DEVICES.length];
  const login = new Date(Date.now() - (i * 7 + 5) * 60 * 1000);
  return { id: i, user, role: isCreator ? "Creator" : "Customer", state, activity, device, login };
};

const SESSIONS = Array.from({ length: 28 }).map((_, i) => seed(i));

const FEED_EVENTS = [
  "User Login","Started Chat","Started Voice Call","Started Video Call","Joined Game","User Logout",
];

function LivePage() {
  const [q, setQ] = useState("");
  const [stateF, setStateF] = useState("All");
  const [actF, setActF] = useState("All");
  const [tick, setTick] = useState(0);
  const [feed, setFeed] = useState<{ id: number; user: string; event: string; time: Date }[]>(
    Array.from({ length: 8 }).map((_, i) => ({ id: i, user: CUSTOMERS[i % CUSTOMERS.length], event: FEED_EVENTS[i % FEED_EVENTS.length], time: new Date(Date.now() - i * 30000) }))
  );

  useEffect(() => {
    const t = setInterval(() => {
      setTick(t => t + 1);
      setFeed(f => [{ id: Date.now(), user: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)], event: FEED_EVENTS[Math.floor(Math.random() * FEED_EVENTS.length)], time: new Date() }, ...f].slice(0, 20));
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => SESSIONS.filter(s =>
    (stateF === "All" || s.state === stateF) &&
    (actF === "All" || s.activity === actF) &&
    (q === "" || s.user.toLowerCase().includes(q.toLowerCase()))
  ), [stateF, actF, q]);

  const stats = useMemo(() => ({
    customers: SESSIONS.filter(s => s.role === "Customer").length,
    creators: SESSIONS.filter(s => s.role === "Creator").length,
    chats: SESSIONS.filter(s => s.activity === "Chatting").length,
    voice: SESSIONS.filter(s => s.activity === "Voice Call").length,
    video: SESSIONS.filter(s => s.activity === "Video Call").length,
    games: SESSIONS.filter(s => s.activity === "Playing Game").length,
  }), []);

  const byState = useMemo(() => {
    const map: Record<string, number> = {};
    SESSIONS.forEach(s => { map[s.state] = (map[s.state] || 0) + 1; });
    return Object.entries(map).sort((a,b) => b[1] - a[1]);
  }, []);

  return (
    <div>
      <PageHeader title="Live Users" subtitle="Real-time monitoring center · auto-refresh 5s" action={
        <span className="inline-flex items-center gap-2 text-xs text-success"><Circle className="h-2 w-2 fill-success" />LIVE · t{tick}</span>
      } />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { l: "Live Customers", v: stats.customers, icon: Users, tone: "text-primary" },
          { l: "Live Creators", v: stats.creators, icon: Radio, tone: "text-accent" },
          { l: "Active Chats", v: stats.chats, icon: MessageCircle, tone: "text-primary" },
          { l: "Active Voice", v: stats.voice, icon: Phone, tone: "text-warning" },
          { l: "Active Video", v: stats.video, icon: Video, tone: "text-success" },
          { l: "Active Games", v: stats.games, icon: Gamepad2, tone: "text-destructive" },
        ].map((s,i) => (
          <GlassCard key={i}>
            <s.icon className={`h-5 w-5 ${s.tone} mb-2`} />
            <p className="text-xs text-muted-foreground">{s.l}</p>
            <p className="text-xl font-bold mt-1">{s.v}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <GlassCard className="mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search user..." className="w-full bg-transparent rounded-full pl-9 pr-4 py-2 text-sm outline-none border border-border" />
              </div>
              <select value={stateF} onChange={e => setStateF(e.target.value)} className="glass rounded-full px-3 py-2 text-sm">
                <option>All</option>{STATES.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={actF} onChange={e => setActF(e.target.value)} className="glass rounded-full px-3 py-2 text-sm">
                <option>All</option>{ACTIVITIES.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </GlassCard>

          <GlassCard className="p-0 overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-xs text-muted-foreground">
                  <tr>{["User","Role","State","Activity","Device","Login","Session"].map(h => <th key={h} className="text-left p-3 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const Icon = DEVICE_ICON[s.device] || Smartphone;
                    const dur = Math.round((Date.now() - s.login.getTime()) / 60000);
                    return (
                      <tr key={s.id} className="border-t border-border hover:bg-muted/20">
                        <td className="p-3 flex items-center gap-2"><OnlineDot online />{s.user}</td>
                        <td className="p-3"><span className={`text-[10px] rounded-full px-2 py-0.5 ${s.role === "Creator" ? "bg-accent/20 text-accent" : "bg-muted/40"}`}>{s.role}</span></td>
                        <td className="p-3 text-xs text-muted-foreground">{s.state}</td>
                        <td className="p-3"><span className={`text-[10px] rounded-full px-2 py-0.5 ${ACT_TONE[s.activity]}`}>{s.activity}</span></td>
                        <td className="p-3 text-xs flex items-center gap-1"><Icon className="h-3 w-3" />{s.device}</td>
                        <td className="p-3 text-xs text-muted-foreground">{s.login.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="p-3 text-xs">{dur}m</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-xs font-semibold mb-3">Active Users by State (India)</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {byState.map(([state, count]) => (
                <div key={state} className="glass-strong rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs">{state}</span>
                  <span className="text-sm font-bold text-primary">{count}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <GlassCard>
          <p className="text-xs font-semibold mb-3 flex items-center gap-2"><Circle className="h-2 w-2 fill-success animate-pulse" />Real-Time Feed</p>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {feed.map(e => (
              <div key={e.id} className="glass-strong rounded-xl p-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold">{e.user}</p>
                  <p className="text-muted-foreground text-[10px]">{e.event}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">{e.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin/live")({ component: LivePage });
