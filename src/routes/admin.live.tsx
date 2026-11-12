// import { createFileRoute } from "@tanstack/react-router";
// import { useEffect, useMemo, useState } from "react";
// import { GlassCard, PageHeader, OnlineDot } from "@/components/ui-kit";
// import { CREATORS, STATES } from "@/lib/mock-data";
// import { Users, Radio, MessageCircle, Phone, Video, Gamepad2, Smartphone, Monitor, Search, Circle } from "lucide-react";

// const CUSTOMERS = ["Rahul K","Amit S","Vikas V","Suresh R","Karan M","Rohan G","Aditya S","Manish Y","Sandeep R","Nikhil J","Arjun N","Deepak I","Saurabh P","Yash T","Ravi M"];
// const DEVICES = ["iPhone 15","Android","iPad","Desktop","Android"];
// const DEVICE_ICON: Record<string,any> = { "iPhone 15": Smartphone, Android: Smartphone, iPad: Smartphone, Desktop: Monitor };
// const ACTIVITIES = ["Browsing","Chatting","Voice Call","Video Call","Playing Game"] as const;
// const ACT_TONE: Record<string,string> = {
//   Browsing: "bg-muted/40 text-foreground",
//   Chatting: "bg-primary/20 text-primary",
//   "Voice Call": "bg-accent/20 text-accent",
//   "Video Call": "bg-success/20 text-success",
//   "Playing Game": "bg-warning/20 text-warning",
// };

// const seed = (i: number) => {
//   const isCreator = i % 3 === 0;
//   const user = isCreator ? CREATORS[i % CREATORS.length].name : CUSTOMERS[i % CUSTOMERS.length];
//   const state = STATES[i % STATES.length];
//   const activity = ACTIVITIES[i % ACTIVITIES.length];
//   const device = DEVICES[i % DEVICES.length];
//   const login = new Date(Date.now() - (i * 7 + 5) * 60 * 1000);
//   return { id: i, user, role: isCreator ? "Creator" : "Customer", state, activity, device, login };
// };

// const SESSIONS = Array.from({ length: 28 }).map((_, i) => seed(i));

// const FEED_EVENTS = [
//   "User Login","Started Chat","Started Voice Call","Started Video Call","Joined Game","User Logout",
// ];

// function LivePage() {
//   const [q, setQ] = useState("");
//   const [stateF, setStateF] = useState("All");
//   const [actF, setActF] = useState("All");
//   const [tick, setTick] = useState(0);
//   const [feed, setFeed] = useState<{ id: number; user: string; event: string; time: Date }[]>(
//     Array.from({ length: 8 }).map((_, i) => ({ id: i, user: CUSTOMERS[i % CUSTOMERS.length], event: FEED_EVENTS[i % FEED_EVENTS.length], time: new Date(Date.now() - i * 30000) }))
//   );

//   useEffect(() => {
//     const t = setInterval(() => {
//       setTick(t => t + 1);
//       setFeed(f => [{ id: Date.now(), user: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)], event: FEED_EVENTS[Math.floor(Math.random() * FEED_EVENTS.length)], time: new Date() }, ...f].slice(0, 20));
//     }, 5000);
//     return () => clearInterval(t);
//   }, []);

//   const filtered = useMemo(() => SESSIONS.filter(s =>
//     (stateF === "All" || s.state === stateF) &&
//     (actF === "All" || s.activity === actF) &&
//     (q === "" || s.user.toLowerCase().includes(q.toLowerCase()))
//   ), [stateF, actF, q]);

//   const stats = useMemo(() => ({
//     customers: SESSIONS.filter(s => s.role === "Customer").length,
//     creators: SESSIONS.filter(s => s.role === "Creator").length,
//     chats: SESSIONS.filter(s => s.activity === "Chatting").length,
//     voice: SESSIONS.filter(s => s.activity === "Voice Call").length,
//     video: SESSIONS.filter(s => s.activity === "Video Call").length,
//     games: SESSIONS.filter(s => s.activity === "Playing Game").length,
//   }), []);

//   const byState = useMemo(() => {
//     const map: Record<string, number> = {};
//     SESSIONS.forEach(s => { map[s.state] = (map[s.state] || 0) + 1; });
//     return Object.entries(map).sort((a,b) => b[1] - a[1]);
//   }, []);

//   return (
//     <div>
//       <PageHeader title="Live Users" subtitle="Real-time monitoring center · auto-refresh 5s" action={
//         <span className="inline-flex items-center gap-2 text-xs text-success"><Circle className="h-2 w-2 fill-success" />LIVE · t{tick}</span>
//       } />

//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
//         {[
//           { l: "Live Customers", v: stats.customers, icon: Users, tone: "text-primary" },
//           { l: "Live Creators", v: stats.creators, icon: Radio, tone: "text-accent" },
//           { l: "Active Chats", v: stats.chats, icon: MessageCircle, tone: "text-primary" },
//           { l: "Active Voice", v: stats.voice, icon: Phone, tone: "text-warning" },
//           { l: "Active Video", v: stats.video, icon: Video, tone: "text-success" },
//           { l: "Active Games", v: stats.games, icon: Gamepad2, tone: "text-destructive" },
//         ].map((s,i) => (
//           <GlassCard key={i}>
//             <s.icon className={`h-5 w-5 ${s.tone} mb-2`} />
//             <p className="text-xs text-muted-foreground">{s.l}</p>
//             <p className="text-xl font-bold mt-1">{s.v}</p>
//           </GlassCard>
//         ))}
//       </div>

//       <div className="grid lg:grid-cols-3 gap-4">
//         <div className="lg:col-span-2">
//           <GlassCard className="mb-4">
//             <div className="flex flex-wrap items-center gap-2">
//               <div className="relative flex-1 min-w-[200px]">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search user..." className="w-full bg-transparent rounded-full pl-9 pr-4 py-2 text-sm outline-none border border-border" />
//               </div>
//               <select value={stateF} onChange={e => setStateF(e.target.value)} className="glass rounded-full px-3 py-2 text-sm">
//                 <option>All</option>{STATES.map(s => <option key={s}>{s}</option>)}
//               </select>
//               <select value={actF} onChange={e => setActF(e.target.value)} className="glass rounded-full px-3 py-2 text-sm">
//                 <option>All</option>{ACTIVITIES.map(a => <option key={a}>{a}</option>)}
//               </select>
//             </div>
//           </GlassCard>

//           <GlassCard className="p-0 overflow-hidden mb-4">
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead className="bg-muted/30 text-xs text-muted-foreground">
//                   <tr>{["User","Role","State","Activity","Device","Login","Session"].map(h => <th key={h} className="text-left p-3 font-medium">{h}</th>)}</tr>
//                 </thead>
//                 <tbody>
//                   {filtered.map(s => {
//                     const Icon = DEVICE_ICON[s.device] || Smartphone;
//                     const dur = Math.round((Date.now() - s.login.getTime()) / 60000);
//                     return (
//                       <tr key={s.id} className="border-t border-border hover:bg-muted/20">
//                         <td className="p-3 flex items-center gap-2"><OnlineDot online />{s.user}</td>
//                         <td className="p-3"><span className={`text-[10px] rounded-full px-2 py-0.5 ${s.role === "Creator" ? "bg-accent/20 text-accent" : "bg-muted/40"}`}>{s.role}</span></td>
//                         <td className="p-3 text-xs text-muted-foreground">{s.state}</td>
//                         <td className="p-3"><span className={`text-[10px] rounded-full px-2 py-0.5 ${ACT_TONE[s.activity]}`}>{s.activity}</span></td>
//                         <td className="p-3 text-xs flex items-center gap-1"><Icon className="h-3 w-3" />{s.device}</td>
//                         <td className="p-3 text-xs text-muted-foreground">{s.login.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
//                         <td className="p-3 text-xs">{dur}m</td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </GlassCard>

//           <GlassCard>
//             <p className="text-xs font-semibold mb-3">Active Users by State (India)</p>
//             <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
//               {byState.map(([state, count]) => (
//                 <div key={state} className="glass-strong rounded-xl p-3 flex items-center justify-between">
//                   <span className="text-xs">{state}</span>
//                   <span className="text-sm font-bold text-primary">{count}</span>
//                 </div>
//               ))}
//             </div>
//           </GlassCard>
//         </div>

//         <GlassCard>
//           <p className="text-xs font-semibold mb-3 flex items-center gap-2"><Circle className="h-2 w-2 fill-success animate-pulse" />Real-Time Feed</p>
//           <div className="space-y-2 max-h-[600px] overflow-y-auto">
//             {feed.map(e => (
//               <div key={e.id} className="glass-strong rounded-xl p-2.5 flex items-center justify-between text-xs">
//                 <div>
//                   <p className="font-semibold">{e.user}</p>
//                   <p className="text-muted-foreground text-[10px]">{e.event}</p>
//                 </div>
//                 <span className="text-[10px] text-muted-foreground">{e.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
//               </div>
//             ))}
//           </div>
//         </GlassCard>
//       </div>
//     </div>
//   );
// }

// export const Route = createFileRoute("/admin/live")({ component: LivePage });
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GlassCard, PageHeader, OnlineDot } from "@/components/ui-kit";
import { STATES } from "@/lib/mock-data";
import {
  Users, Radio, MessageCircle, Phone, Video, Gamepad2,
  Smartphone, Monitor, Search, Circle,
  Loader2, AlertCircle, ChevronLeft, ChevronRight,
} from "lucide-react";

// =========================================================
// API CONFIG
// =========================================================
const API_BASE_URL = String(import.meta.env.VITE_BASE_URL ?? "").replace(/\/+$/, "");

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return (await res.json()) as T;
}

// =========================================================
// TYPES (mirror FastAPI response shapes)
// =========================================================
interface LiveUser {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  creator_id: string | null;
  role: string;
  state: string | null;
  activity: string;
  device: string;
  login_time: string | null;
  session_duration: string;
  is_online: boolean;
  last_activity_at: string;
}

interface LiveUsersResponse {
  status_code: number;
  message: string;
  summary: {
    live_customers: number;
    live_creators: number;
    active_chats: number;
    active_voice: number;
    active_video: number;
    active_games: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  data: LiveUser[];
}

interface ByStateItem { state: string; active_users: number; }
interface ByStateResponse {
  status_code: number;
  message: string;
  data: ByStateItem[];
}

interface FeedEvent {
  event: string;
  user_id: number;
  user_name: string;
  role: string;
  activity: string;
  game?: string;
  timestamp: string;
}
interface FeedResponse {
  status_code: number;
  message: string;
  data: FeedEvent[];
}

// =========================================================
// CONSTANTS
// =========================================================
const ACTIVITIES = ["Browsing","Chatting","Voice Call","Video Call","Playing Game"] as const;
const ACT_TONE: Record<string,string> = {
  Browsing:        "bg-muted/40 text-foreground",
  Chatting:        "bg-primary/20 text-primary",
  "Voice Call":    "bg-accent/20 text-accent",
  "Video Call":    "bg-success/20 text-success",
  "Playing Game":  "bg-warning/20 text-warning",
};
const DEVICE_KEYWORDS: Array<[string, any]> = [
  ["iphone", Smartphone],
  ["ipad",   Smartphone],
  ["android",Smartphone],
  ["desktop",Monitor],
  ["web",    Monitor],
  ["pc",     Monitor],
];
function getDeviceIcon(device: string) {
  const d = (device || "").toLowerCase();
  for (const [kw, Icon] of DEVICE_KEYWORDS) if (d.includes(kw)) return Icon;
  return Smartphone;
}
const REFRESH_MS = 5000;
const PAGE_SIZE  = 20;

// =========================================================
// HELPERS
// =========================================================
function formatClock(iso: string | null): string {
  if (!iso) return "--";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "--";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatFeedTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "--";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "--";
  const diff = Math.max(0, Date.now() - then);
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

// =========================================================
// PAGE
// =========================================================
function LivePage() {
  // ---- filters ----
  const [q,       setQ]       = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [stateF,  setStateF]  = useState("All");
  const [actF,    setActF]    = useState("All");
  const [page,    setPage]    = useState(1);

  // ---- data ----
  const [liveData, setLiveData] = useState<LiveUsersResponse | null>(null);
  const [byState,  setByState]  = useState<ByStateItem[]>([]);
  const [feed,     setFeed]     = useState<FeedEvent[]>([]);

  // ---- status ----
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingFeed,  setLoadingFeed]  = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [tick,         setTick]         = useState(0);
  const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);

  // ---------------------------------------------------------
  // Debounce search box
  // ---------------------------------------------------------
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  // ---------------------------------------------------------
  // Reset to page 1 whenever any filter changes
  // ---------------------------------------------------------
  useEffect(() => { setPage(1); }, [debouncedQ, stateF, actF]);

  // ---------------------------------------------------------
  // Build query string (server-side filters only)
  // ---------------------------------------------------------
  // NOTE: API expects `state_id: int`, but the UI dropdown uses state
  // names. Without a states-list endpoint to map name→id, the state
  // filter is applied client-side on the current page. Replace with
  // `params.set("state_id", stateId)` once that mapping exists.
  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (debouncedQ.trim()) p.set("search", debouncedQ.trim());
    if (actF !== "All")    p.set("activity", actF);
    p.set("page",  String(page));
    p.set("limit", String(PAGE_SIZE));
    return p.toString();
  }, [debouncedQ, actF, page]);

  // ---------------------------------------------------------
  // Fetchers
  // ---------------------------------------------------------
  const fetchLiveUsers = useCallback(async () => {
    setLoadingUsers(true);
    setError(null);
    try {
      const res = await apiFetch<LiveUsersResponse>(`/admin/live-users/?${queryString}`);
      setLiveData(res);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message || "Failed to load live users");
    } finally {
      setLoadingUsers(false);
    }
  }, [queryString]);

  const fetchByState = useCallback(async () => {
    try {
      const res = await apiFetch<ByStateResponse>(`/admin/live-users/by-state`);
      setByState(res.data || []);
    } catch { /* silent */ }
  }, []);

  const fetchFeed = useCallback(async () => {
    setLoadingFeed(true);
    try {
      const res = await apiFetch<FeedResponse>(`/admin/live-users/feed?limit=20`);
      setFeed(res.data || []);
    } catch { /* silent */ }
    finally { setLoadingFeed(false); }
  }, []);

  // ---------------------------------------------------------
  // Initial + filter-driven fetch
  // ---------------------------------------------------------
  useEffect(() => {
    fetchLiveUsers();
    fetchByState();
  }, [fetchLiveUsers, fetchByState]);

  // Initial feed fetch
  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  // ---------------------------------------------------------
  // Auto-refresh every 5s (live feel)
  // ---------------------------------------------------------
  useEffect(() => {
    const t = setInterval(() => {
      setTick(v => v + 1);
      fetchLiveUsers();
      fetchByState();
      fetchFeed();
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, [fetchLiveUsers, fetchByState, fetchFeed]);

  // ---------------------------------------------------------
  // Derived
  // ---------------------------------------------------------
  const summary    = liveData?.summary;
  const pagination  = liveData?.pagination;
  const users       = liveData?.data ?? [];

  // State filter applied client-side (see NOTE above)
  const filteredUsers = useMemo(() => {
    if (stateF === "All") return users;
    return users.filter(u => u.state === stateF);
  }, [users, stateF]);

  const stats = {
    customers: summary?.live_customers ?? 0,
    creators:  summary?.live_creators  ?? 0,
    chats:     summary?.active_chats   ?? 0,
    voice:     summary?.active_voice   ?? 0,
    video:     summary?.active_video   ?? 0,
    games:     summary?.active_games   ?? 0,
  };

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div>
      <PageHeader
        title="Live Users"
        subtitle="Real-time monitoring center · auto-refresh 5s"
        action={
          <span className="inline-flex items-center gap-2 text-xs text-success">
            <Circle className="h-2 w-2 fill-success" />LIVE · t{tick}
            {lastUpdated && (
              <span className="text-muted-foreground ml-2">
                · {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </span>
        }
      />

      {/* -------- Stat cards -------- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { l: "Live Customers", v: stats.customers, icon: Users,        tone: "text-primary"    },
          { l: "Live Creators",  v: stats.creators,  icon: Radio,        tone: "text-accent"     },
          { l: "Active Chats",   v: stats.chats,     icon: MessageCircle,tone: "text-primary"    },
          { l: "Active Voice",   v: stats.voice,     icon: Phone,        tone: "text-warning"    },
          { l: "Active Video",   v: stats.video,     icon: Video,        tone: "text-success"    },
          { l: "Active Games",   v: stats.games,     icon: Gamepad2,     tone: "text-destructive"},
        ].map((s,i) => (
          <GlassCard key={i}>
            <s.icon className={`h-5 w-5 ${s.tone} mb-2`} />
            <p className="text-xs text-muted-foreground">{s.l}</p>
            <p className="text-xl font-bold mt-1">{s.v}</p>
          </GlassCard>
        ))}
      </div>

      {/* -------- Error banner -------- */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {/* -------- Left: filters + table + by-state -------- */}
        <div className="lg:col-span-2">
          <GlassCard className="mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Search name, email, phone, creator ID..."
                  className="w-full bg-transparent rounded-full pl-9 pr-4 py-2 text-sm outline-none border border-border"
                />
              </div>
              <select
                value={stateF}
                onChange={e => setStateF(e.target.value)}
                className="glass rounded-full px-3 py-2 text-sm"
              >
                <option>All</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={actF}
                onChange={e => setActF(e.target.value)}
                className="glass rounded-full px-3 py-2 text-sm"
              >
                <option>All</option>
                {ACTIVITIES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </GlassCard>

          <GlassCard className="p-0 overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-xs text-muted-foreground">
                  <tr>
                    {["User","Role","State","Activity","Device","Login","Session","Last Active"].map(h =>
                      <th key={h} className="text-left p-3 font-medium">{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers && filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                        Loading live users…
                      </td>
                    </tr>
                  )}

                  {!loadingUsers && filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        No live users match the current filters.
                      </td>
                    </tr>
                  )}

                  {filteredUsers.map(u => {
                    const Icon = getDeviceIcon(u.device);
                    return (
                      <tr key={u.user_id} className="border-t border-border hover:bg-muted/20">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <OnlineDot online={u.is_online} />
                            <div>
                              <p className="font-medium">{u.name}</p>
                              {u.creator_id && (
                                <p className="text-[10px] text-muted-foreground">{u.creator_id}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] rounded-full px-2 py-0.5 ${
                            u.role === "creator"
                              ? "bg-accent/20 text-accent"
                              : "bg-muted/40"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">{u.state ?? "—"}</td>
                        <td className="p-3">
                          <span className={`text-[10px] rounded-full px-2 py-0.5 ${ACT_TONE[u.activity] ?? ACT_TONE.Browsing}`}>
                            {u.activity}
                          </span>
                        </td>
                        <td className="p-3 text-xs">
                          <span className="flex items-center gap-1">
                            <Icon className="h-3 w-3" />{u.device}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">{u.login_time ?? "--"}</td>
                        <td className="p-3 text-xs">{u.session_duration}</td>
                        <td className="p-3 text-xs text-muted-foreground">{timeAgo(u.last_activity_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center justify-between px-3 py-2 border-t border-border text-xs text-muted-foreground">
                <span>
                  Page {pagination.page} / {pagination.total_pages} · {pagination.total} users
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="glass rounded-full p-1.5 disabled:opacity-40 hover:bg-muted/40"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  <button
                    disabled={pagination.page >= pagination.total_pages}
                    onClick={() => setPage(p => p + 1)}
                    className="glass rounded-full p-1.5 disabled:opacity-40 hover:bg-muted/40"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Active users by state */}
          <GlassCard>
            <p className="text-xs font-semibold mb-3">Active Users by State (India)</p>
            {byState.length === 0 ? (
              <p className="text-xs text-muted-foreground">No active users right now.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {byState.map(({ state, active_users }) => (
                  <div key={state} className="glass-strong rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs">{state}</span>
                    <span className="text-sm font-bold text-primary">{active_users}</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* -------- Right: real-time feed -------- */}
        <GlassCard>
          <p className="text-xs font-semibold mb-3 flex items-center gap-2">
            <Circle className="h-2 w-2 fill-success animate-pulse" />
            Real-Time Feed
            {loadingFeed && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
          </p>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {feed.length === 0 && (
              <p className="text-xs text-muted-foreground">No recent activity.</p>
            )}
            {feed.map((e, i) => (
              <div
                key={`${e.user_id}-${e.timestamp}-${i}`}
                className="glass-strong rounded-xl p-2.5 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold">{e.user_name}</p>
                  <p className="text-muted-foreground text-[10px]">
                    {e.event}
                    {e.game ? ` · ${e.game}` : ""}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {formatFeedTime(e.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin/live")({ component: LivePage });