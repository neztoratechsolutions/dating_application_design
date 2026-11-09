// import { createFileRoute } from "@tanstack/react-router";
// import { useState, useEffect } from "react";
// import { GlassCard, PageHeader } from "@/components/ui-kit";
// import { Gamepad2, Trophy, Users, IndianRupee, TrendingUp, Coins, Settings, Loader2, Plus } from "lucide-react";
// import { AreaChart, Area, BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
// import { toast } from "sonner";

// export const Route = createFileRoute("/admin/games")({ component: GamesPage });

// const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

// type GameSetting = {
//   id: number;
//   name: string;
//   status: boolean;
//   entry_fees: number;
//   rewards: number;
//   daily_play_limit: number;
// };

// type GameAnalytics = {
//   game_id: number;
//   game_name: string;
//   entries: number;
//   revenue: number;
//   winners: number;
//   rewards_paid: number;
//   profit: number;
//   active_players: number;
// };

// type LeaderboardRow = {
//   rank: number;
//   user_id: number;
//   user: string;
//   wins: number;
//   earnings: number;
//   state: string | null;
// };

// type DashboardData = {
//   overview: {
//     players_today: number;
//     game_entries: number;
//     revenue: number;
//     rewards_paid: number;
//     profit: number;
//     active_players: number;
//   };
//   game_settings: GameSetting[];
//   game_analytics: GameAnalytics[];
//   charts: {
//     daily_game_revenue: { date: string; revenue: number }[];
//     user_participation: { date: string; entries: number }[];
//     profit_trend: { date: string; profit: number }[];
//   };
//   leaderboard: LeaderboardRow[];
// };

// function GameAnalyticsCard({ analytics }: { analytics: GameAnalytics }) {
//   const colorClass = analytics.game_name === "Colour Connect"
//     ? "bg-gradient-to-br from-primary to-accent"
//     : "bg-gradient-to-br from-amber-500 to-orange-600";

//   return (
//     <GlassCard>
//       <div className="flex items-center gap-2 mb-3">
//         <div className={`h-9 w-9 rounded-xl ${colorClass} flex items-center justify-center`}>
//           <Gamepad2 className="h-4 w-4 text-white" />
//         </div>
//         <div>
//           <h3 className="font-bold">{analytics.game_name}</h3>
//           <p className="text-[10px] text-muted-foreground">Analytics · Last 7 days</p>
//         </div>
//       </div>
//       <div className="grid grid-cols-5 gap-2 text-center">
//         {[
//           { l: "Entries", v: analytics.entries.toLocaleString() },
//           { l: "Revenue", v: `₹${analytics.revenue.toLocaleString()}` },
//           { l: "Winners", v: analytics.winners.toLocaleString() },
//           { l: "Rewards", v: `₹${analytics.rewards_paid.toLocaleString()}` },
//           { l: "Profit", v: `₹${analytics.profit.toLocaleString()}`, tone: "text-success" },
//         ].map((s, i) => (
//           <div key={i} className="glass-strong rounded-xl p-2">
//             <p className="text-[9px] text-muted-foreground uppercase">{s.l}</p>
//             <p className={`text-sm font-bold mt-0.5 ${s.tone || ""}`}>{s.v}</p>
//           </div>
//         ))}
//       </div>
//     </GlassCard>
//   );
// }

// function GamesPage() {
//   const [dashboard, setDashboard] = useState<DashboardData | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [notFound, setNotFound] = useState(false);
//   const [isInitializing, setIsInitializing] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);

//   // Local editable settings state
//   const [editSettings, setEditSettings] = useState<GameSetting[]>([]);

//   const fetchDashboard = async () => {
//     setIsLoading(true);
//     setNotFound(false);
//     try {
//       const res = await fetch(`${API_BASE_URL}/admin/games/dashboard`);
//       const data = await res.json();

//       if (!res.ok) {
//         if (res.status === 404 || data?.detail?.includes("No game settings")) {
//           setNotFound(true);
//           return;
//         }
//         throw new Error(data?.detail || "Failed to fetch dashboard");
//       }

//       setDashboard(data);
//       // Initialize editable settings from API
//       setEditSettings(data.game_settings || []);
//     } catch (err: any) {
//       toast.error(err.message || "Unable to load games data");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDashboard();
//   }, []);

//   // --- Initialize Games (POST) ---
//   const handleInitialize = async () => {
//     setIsInitializing(true);
//     try {
//       const res = await fetch(`${API_BASE_URL}/admin/games/settings`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           games: [
//             {
//               name: "Colour Connect",
//               status: true,
//               entry_fees: 10,
//               rewards: 50,
//               daily_play_limit: 20,
//             },
//             {
//               name: "Scratch Game",
//               status: true,
//               entry_fees: 10,
//               rewards: 50,
//               daily_play_limit: 20,
//             },
//           ],
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data?.detail || "Failed to initialize games");
//       }

//       toast.success("Games initialized successfully!");
//       // Refresh dashboard
//       fetchDashboard();
//     } catch (err: any) {
//       toast.error(err.message || "Unable to initialize games");
//     } finally {
//       setIsInitializing(false);
//     }
//   };

//   // --- Save Settings (PUT) ---
//   const handleSaveSettings = async () => {
//     setIsSaving(true);
//     try {
//       const res = await fetch(`${API_BASE_URL}/admin/games/settings`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           games: editSettings.map((g) => ({
//             id: g.id,
//             status: g.status,
//             entry_fees: g.entry_fees,
//             rewards: g.rewards,
//             daily_play_limit: g.daily_play_limit,
//           })),
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data?.detail || "Failed to save settings");
//       }

//       toast.success("Settings saved successfully!");
//       fetchDashboard();
//     } catch (err: any) {
//       toast.error(err.message || "Unable to save settings");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   // --- Update a single setting field locally ---
//   const updateSetting = (id: number, field: keyof GameSetting, value: any) => {
//     setEditSettings(prev =>
//       prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
//     );
//   };

//   // Format chart dates
//   const formatChartDate = (dateStr: string) => {
//     const d = new Date(dateStr);
//     return d.toLocaleDateString("en-US", { weekday: "short" });
//   };

//   const chartRevenue = (dashboard?.charts.daily_game_revenue || []).map(d => ({
//     day: formatChartDate(d.date),
//     revenue: d.revenue,
//   }));

//   const chartParticipation = (dashboard?.charts.user_participation || []).map(d => ({
//     day: formatChartDate(d.date),
//     players: d.entries,
//   }));

//   const chartProfit = (dashboard?.charts.profit_trend || []).map(d => ({
//     day: formatChartDate(d.date),
//     profit: d.profit,
//   }));

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center py-20">
//         <Loader2 className="h-8 w-8 animate-spin text-primary" />
//       </div>
//     );
//   }

//   // --- Not Found State: Show Initialize Button ---
//   if (notFound) {
//     return (
//       <div>
//         <PageHeader title="Games" subtitle="Games analytics & operator console" />
//         <GlassCard className="text-center py-20 flex flex-col items-center gap-4">
//           <Gamepad2 className="h-12 w-12 text-muted-foreground" />
//           <div>
//             <h3 className="font-bold text-lg">No Game Settings Found</h3>
//             <p className="text-sm text-muted-foreground mt-1">
//               You need to initialize the game settings before the games can be played.
//             </p>
//           </div>
//           <button
//             onClick={handleInitialize}
//             disabled={isInitializing}
//             className="rounded-xl bg-gradient-primary px-6 py-3 text-sm font-semibold shadow-glow flex items-center gap-2 disabled:opacity-70"
//           >
//             {isInitializing ? (
//               <><Loader2 className="h-4 w-4 animate-spin" /> Initializing...</>
//             ) : (
//               <><Plus className="h-4 w-4" /> Initialize Games</>
//             )}
//           </button>
//         </GlassCard>
//       </div>
//     );
//   }

//   const overview = dashboard?.overview;

//   return (
//     <div>
//       <PageHeader title="Games" subtitle="Games analytics & operator console" />

//       {/* Overview Stats */}
//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
//         {[
//           { l: "Players Today", v: overview?.players_today?.toLocaleString() || "0", icon: Users, tone: "text-primary" },
//           { l: "Game Entries", v: overview?.game_entries?.toLocaleString() || "0", icon: Gamepad2, tone: "text-accent" },
//           { l: "Revenue", v: `₹${overview?.revenue?.toLocaleString() || "0"}`, icon: IndianRupee, tone: "text-success" },
//           { l: "Rewards Paid", v: `₹${overview?.rewards_paid?.toLocaleString() || "0"}`, icon: Trophy, tone: "text-warning" },
//           { l: "Profit", v: `₹${overview?.profit?.toLocaleString() || "0"}`, icon: TrendingUp, tone: "text-success" },
//           { l: "Active Players", v: overview?.active_players?.toLocaleString() || "0", icon: Coins, tone: "text-destructive" },
//         ].map((s, i) => (
//           <GlassCard key={i}>
//             <s.icon className={`h-5 w-5 ${s.tone} mb-2`} />
//             <p className="text-xs text-muted-foreground">{s.l}</p>
//             <p className="text-xl font-bold mt-1">{s.v}</p>
//           </GlassCard>
//         ))}
//       </div>

//       {/* Per-Game Analytics */}
//       <div className="grid md:grid-cols-2 gap-4 mb-6">
//         {dashboard?.game_analytics?.length > 0 ? (
//           dashboard.game_analytics.map((a) => (
//             <GameAnalyticsCard key={a.game_id} analytics={a} />
//           ))
//         ) : (
//           <>
//             <GlassCard className="text-center py-10 text-sm text-muted-foreground">No analytics available</GlassCard>
//             <GlassCard className="text-center py-10 text-sm text-muted-foreground">No analytics available</GlassCard>
//           </>
//         )}
//       </div>

//       {/* Charts */}
//       <div className="grid lg:grid-cols-3 gap-4 mb-6">
//         <GlassCard>
//           <p className="text-xs text-muted-foreground mb-2">Daily Game Revenue</p>
//           <ResponsiveContainer width="100%" height={180}>
//             <AreaChart data={chartRevenue}>
//               <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
//               <XAxis dataKey="day" fontSize={11} />
//               <YAxis fontSize={11} />
//               <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
//               <Area dataKey="revenue" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.2} />
//             </AreaChart>
//           </ResponsiveContainer>
//         </GlassCard>
//         <GlassCard>
//           <p className="text-xs text-muted-foreground mb-2">User Participation</p>
//           <ResponsiveContainer width="100%" height={180}>
//             <BarChart data={chartParticipation}>
//               <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
//               <XAxis dataKey="day" fontSize={11} />
//               <YAxis fontSize={11} />
//               <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
//               <Bar dataKey="players" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </GlassCard>
//         <GlassCard>
//           <p className="text-xs text-muted-foreground mb-2">Profit Trend</p>
//           <ResponsiveContainer width="100%" height={180}>
//             <LineChart data={chartProfit}>
//               <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
//               <XAxis dataKey="day" fontSize={11} />
//               <YAxis fontSize={11} />
//               <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
//               <Line dataKey="profit" stroke="hsl(var(--accent))" strokeWidth={2} />
//             </LineChart>
//           </ResponsiveContainer>
//         </GlassCard>
//       </div>

//       {/* Leaderboard + Admin Controls */}
//       <div className="grid lg:grid-cols-3 gap-4">
//         {/* Leaderboard */}
//         <div className="lg:col-span-2">
//           <GlassCard className="p-0 overflow-hidden">
//             <div className="p-4 border-b border-border flex items-center gap-2">
//               <Trophy className="h-4 w-4 text-warning" />
//               <h3 className="font-bold text-sm">Leaderboard</h3>
//             </div>
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead className="bg-muted/30 text-xs text-muted-foreground">
//                   <tr>
//                     {["Rank", "User", "Wins", "Earnings", "State"].map(h => (
//                       <th key={h} className="text-left p-3 font-medium">{h}</th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {dashboard?.leaderboard?.length > 0 ? (
//                     dashboard.leaderboard.map(r => (
//                       <tr key={r.rank} className="border-t border-border hover:bg-muted/20">
//                         <td className="p-3 font-bold">#{r.rank}</td>
//                         <td className="p-3">{r.user}</td>
//                         <td className="p-3">{r.wins}</td>
//                         <td className="p-3 text-success font-semibold">₹{r.earnings.toLocaleString()}</td>
//                         <td className="p-3 text-xs text-muted-foreground">{r.state || "—"}</td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan={5} className="p-6 text-center text-muted-foreground text-sm">
//                         No leaderboard data yet. Play some games to see winners here!
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </GlassCard>
//         </div>

//         {/* Admin Controls */}
//         <GlassCard>
//           <div className="flex items-center gap-2 mb-3">
//             <Settings className="h-4 w-4 text-primary" />
//             <h3 className="font-bold text-sm">Admin Controls</h3>
//           </div>
//           <div className="space-y-3">
//             {editSettings.map((g) => (
//               <div key={g.id} className="space-y-2">
//                 {/* Enable/Disable Toggle */}
//                 <div className="glass-strong rounded-xl p-3 flex items-center justify-between">
//                   <span className="text-sm">{g.name}</span>
//                   <button
//                     onClick={() => updateSetting(g.id, "status", !g.status)}
//                     className={`text-[10px] rounded-full px-3 py-1 ${g.status ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}
//                   >
//                     {g.status ? "ENABLED" : "DISABLED"}
//                   </button>
//                 </div>
//                 {/* Settings Inputs */}
//                 <div className="glass-strong rounded-xl p-3 grid grid-cols-3 gap-2">
//                   <div>
//                     <label className="text-[10px] text-muted-foreground">Entry Fee</label>
//                     <input
//                       type="number"
//                       value={g.entry_fees}
//                       onChange={e => updateSetting(g.id, "entry_fees", +e.target.value)}
//                       min="0"
//                       className="w-full bg-transparent border-b border-border outline-none text-sm py-1"
//                     />
//                   </div>
//                   <div>
//                     <label className="text-[10px] text-muted-foreground">Reward</label>
//                     <input
//                       type="number"
//                       value={g.rewards}
//                       onChange={e => updateSetting(g.id, "rewards", +e.target.value)}
//                       min="0"
//                       className="w-full bg-transparent border-b border-border outline-none text-sm py-1"
//                     />
//                   </div>
//                   <div>
//                     <label className="text-[10px] text-muted-foreground">Daily Limit</label>
//                     <input
//                       type="number"
//                       value={g.daily_play_limit}
//                       onChange={e => updateSetting(g.id, "daily_play_limit", +e.target.value)}
//                       min="1"
//                       className="w-full bg-transparent border-b border-border outline-none text-sm py-1"
//                     />
//                   </div>
//                 </div>
//               </div>
//             ))}

//             <button
//               onClick={handleSaveSettings}
//               disabled={isSaving}
//               className="w-full rounded-full bg-gradient-primary py-2 text-sm font-semibold shadow-glow flex items-center justify-center gap-2 disabled:opacity-70"
//             >
//               {isSaving ? (
//                 <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
//               ) : (
//                 "Save Changes"
//               )}
//             </button>
//           </div>
//         </GlassCard>
//       </div>
//     </div>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import {
  Gamepad2, Trophy, Users, IndianRupee, TrendingUp, TrendingDown, Coins,
  Settings, Loader2, Plus, RefreshCw, AlertCircle,
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/games")({ component: GamesPage });

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

type GameSetting = {
  id: number;
  name: string;
  status: boolean;
  entry_fees: number;
  rewards: number;
  daily_play_limit: number;
  created_at?: string;
  updated_at?: string;
};

type GameAnalytics = {
  game_id: number;
  game_name: string;
  entries: number;
  revenue: number;
  winners: number;
  rewards_paid: number;
  profit: number;
  active_players: number;
};

type LeaderboardRow = {
  rank: number;
  user_id: number;
  user: string;
  wins: number;
  earnings: number;
  state: string | null;
};

type DashboardData = {
  overview: {
    players_today: number;
    game_entries: number;
    revenue: number;
    rewards_paid: number;
    profit: number;
    active_players: number;
  };
  game_settings: GameSetting[];
  game_analytics: GameAnalytics[];
  charts: {
    daily_game_revenue: { date: string; revenue: number }[];
    user_participation: { date: string; entries: number }[];
    profit_trend: { date: string; profit: number }[];
  };
  leaderboard: LeaderboardRow[];
};

// ₹ formatter that renders losses as -₹420 instead of ₹-420.
const inr = (n: number | undefined | null) => {
  const v = n ?? 0;
  return v < 0 ? `-₹${Math.abs(v).toLocaleString("en-IN")}` : `₹${v.toLocaleString("en-IN")}`;
};

function GameAnalyticsCard({ analytics }: { analytics: GameAnalytics }) {
  const colorClass = analytics.game_name === "Colour Connect"
    ? "bg-gradient-to-br from-primary to-accent"
    : "bg-gradient-to-br from-amber-500 to-orange-600";

  const profitTone = analytics.profit >= 0 ? "text-success" : "text-destructive";

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-3">
        <div className={`h-9 w-9 rounded-xl ${colorClass} flex items-center justify-center`}>
          <Gamepad2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="font-bold">{analytics.game_name}</h3>
          <p className="text-[10px] text-muted-foreground">Analytics · Last 7 days</p>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2 text-center">
        {[
          { l: "Entries", v: analytics.entries.toLocaleString(), tone: "" },
          { l: "Revenue", v: inr(analytics.revenue), tone: "" },
          { l: "Winners", v: analytics.winners.toLocaleString(), tone: "" },
          { l: "Rewards", v: inr(analytics.rewards_paid), tone: "" },
          { l: "Profit", v: inr(analytics.profit), tone: profitTone },
        ].map((s, i) => (
          <div key={i} className="glass-strong rounded-xl p-2">
            <p className="text-[9px] text-muted-foreground uppercase">{s.l}</p>
            <p className={`text-sm font-bold mt-0.5 ${s.tone}`}>{s.v}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function GamesPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local editable settings state
  const [editSettings, setEditSettings] = useState<GameSetting[]>([]);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setNotFound(false);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/games/dashboard`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404 || data?.detail?.includes("No game settings")) {
          setNotFound(true);
          return;
        }
        throw new Error(data?.detail || `Failed to fetch dashboard (${res.status})`);
      }

      setDashboard(data);
      // Initialize editable settings from API
      setEditSettings(data.game_settings || []);
    } catch (err: any) {
      const msg = err?.message || "Unable to load games data";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // --- Initialize Games (POST) ---
  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/games/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          games: [
            {
              name: "Colour Connect",
              status: true,
              entry_fees: 10,
              rewards: 50,
              daily_play_limit: 20,
            },
            {
              name: "Scratch Game",
              status: true,
              entry_fees: 10,
              rewards: 50,
              daily_play_limit: 20,
            },
          ],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Failed to initialize games");
      }

      toast.success("Games initialized successfully!");
      // Refresh dashboard
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.message || "Unable to initialize games");
    } finally {
      setIsInitializing(false);
    }
  };

  // --- Save Settings (PUT) ---
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/games/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          games: editSettings.map((g) => ({
            id: g.id,
            status: g.status,
            entry_fees: g.entry_fees,
            rewards: g.rewards,
            daily_play_limit: g.daily_play_limit,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Failed to save settings");
      }

      toast.success("Settings saved successfully!");
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.message || "Unable to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Update a single setting field locally ---
  const updateSetting = (id: number, field: keyof GameSetting, value: any) => {
    setEditSettings(prev =>
      prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  // Format chart dates
  const formatChartDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  };

  const chartRevenue = (dashboard?.charts.daily_game_revenue || []).map(d => ({
    day: formatChartDate(d.date),
    revenue: d.revenue,
  }));

  const chartParticipation = (dashboard?.charts.user_participation || []).map(d => ({
    day: formatChartDate(d.date),
    players: d.entries,
  }));

  const chartProfit = (dashboard?.charts.profit_trend || []).map(d => ({
    day: formatChartDate(d.date),
    profit: d.profit,
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- Error State: show retry ---
  if (error && !dashboard) {
    return (
      <div>
        <PageHeader title="Games" subtitle="Games analytics & operator console" />
        <GlassCard className="text-center py-20 flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="font-bold text-lg">Failed to Load Dashboard</h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <button
            onClick={fetchDashboard}
            className="rounded-xl bg-gradient-primary px-6 py-3 text-sm font-semibold shadow-glow flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </GlassCard>
      </div>
    );
  }

  // --- Not Found State: Show Initialize Button ---
  if (notFound) {
    return (
      <div>
        <PageHeader title="Games" subtitle="Games analytics & operator console" />
        <GlassCard className="text-center py-20 flex flex-col items-center gap-4">
          <Gamepad2 className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="font-bold text-lg">No Game Settings Found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You need to initialize the game settings before the games can be played.
            </p>
          </div>
          <button
            onClick={handleInitialize}
            disabled={isInitializing}
            className="rounded-xl bg-gradient-primary px-6 py-3 text-sm font-semibold shadow-glow flex items-center gap-2 disabled:opacity-70"
          >
            {isInitializing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Initializing...</>
            ) : (
              <><Plus className="h-4 w-4" /> Initialize Games</>
            )}
          </button>
        </GlassCard>
      </div>
    );
  }

  const overview = dashboard?.overview;
  const profitVal = overview?.profit ?? 0;
  const profitTone = profitVal >= 0 ? "text-success" : "text-destructive";

  const stats = [
    { l: "Players Today", v: (overview?.players_today ?? 0).toLocaleString(), icon: Users, tone: "text-primary", valueTone: "" },
    { l: "Game Entries", v: (overview?.game_entries ?? 0).toLocaleString(), icon: Gamepad2, tone: "text-accent", valueTone: "" },
    { l: "Revenue", v: inr(overview?.revenue), icon: IndianRupee, tone: "text-success", valueTone: "" },
    { l: "Rewards Paid", v: inr(overview?.rewards_paid), icon: Trophy, tone: "text-warning", valueTone: "" },
    { l: "Profit", v: inr(profitVal), icon: profitVal >= 0 ? TrendingUp : TrendingDown, tone: profitTone, valueTone: profitTone },
    { l: "Active Players", v: (overview?.active_players ?? 0).toLocaleString(), icon: Coins, tone: "text-destructive", valueTone: "" },
  ];

  return (
    <div>
      <PageHeader
        title="Games"
        subtitle="Games analytics & operator console"
        action={
          <button
            onClick={fetchDashboard}
            disabled={isLoading}
            className="glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </button>
        }
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {stats.map((s, i) => (
          <GlassCard key={i}>
            <s.icon className={`h-5 w-5 ${s.tone} mb-2`} />
            <p className="text-xs text-muted-foreground">{s.l}</p>
            <p className={`text-xl font-bold mt-1 ${s.valueTone}`}>{s.v}</p>
          </GlassCard>
        ))}
      </div>

      {/* Per-Game Analytics */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {dashboard?.game_analytics?.length > 0 ? (
          dashboard.game_analytics.map((a) => (
            <GameAnalyticsCard key={a.game_id} analytics={a} />
          ))
        ) : (
          <>
            <GlassCard className="text-center py-10 text-sm text-muted-foreground">No analytics available</GlassCard>
            <GlassCard className="text-center py-10 text-sm text-muted-foreground">No analytics available</GlassCard>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <GlassCard>
          <p className="text-xs text-muted-foreground mb-2">Daily Game Revenue</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartRevenue}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="day" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Area dataKey="revenue" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-muted-foreground mb-2">User Participation</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartParticipation}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="day" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="players" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-muted-foreground mb-2">Profit Trend</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartProfit}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="day" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line dataKey="profit" stroke="hsl(var(--accent))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Leaderboard + Admin Controls */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Leaderboard */}
        <div className="lg:col-span-2">
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warning" />
              <h3 className="font-bold text-sm">Leaderboard</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-xs text-muted-foreground">
                  <tr>
                    {["Rank", "User", "Wins", "Earnings", "State"].map(h => (
                      <th key={h} className="text-left p-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dashboard?.leaderboard?.length > 0 ? (
                    dashboard.leaderboard.map(r => (
                      <tr key={r.rank} className="border-t border-border hover:bg-muted/20">
                        <td className="p-3 font-bold">#{r.rank}</td>
                        <td className="p-3">{r.user}</td>
                        <td className="p-3">{r.wins}</td>
                        <td className="p-3 text-success font-semibold">{inr(r.earnings)}</td>
                        <td className="p-3 text-xs text-muted-foreground">{r.state || "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-muted-foreground text-sm">
                        No leaderboard data yet. Play some games to see winners here!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Admin Controls */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm">Admin Controls</h3>
          </div>
          <div className="space-y-3">
            {editSettings.map((g) => (
              <div key={g.id} className="space-y-2">
                {/* Enable/Disable Toggle */}
                <div className="glass-strong rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm">{g.name}</span>
                  <button
                    onClick={() => updateSetting(g.id, "status", !g.status)}
                    className={`text-[10px] rounded-full px-3 py-1 ${g.status ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}
                  >
                    {g.status ? "ENABLED" : "DISABLED"}
                  </button>
                </div>
                {/* Settings Inputs */}
                <div className="glass-strong rounded-xl p-3 grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Entry Fee</label>
                    <input
                      type="number"
                      value={g.entry_fees}
                      onChange={e => updateSetting(g.id, "entry_fees", +e.target.value)}
                      min="0"
                      className="w-full bg-transparent border-b border-border outline-none text-sm py-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Reward</label>
                    <input
                      type="number"
                      value={g.rewards}
                      onChange={e => updateSetting(g.id, "rewards", +e.target.value)}
                      min="0"
                      className="w-full bg-transparent border-b border-border outline-none text-sm py-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Daily Limit</label>
                    <input
                      type="number"
                      value={g.daily_play_limit}
                      onChange={e => updateSetting(g.id, "daily_play_limit", +e.target.value)}
                      min="1"
                      className="w-full bg-transparent border-b border-border outline-none text-sm py-1"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="w-full rounded-full bg-gradient-primary py-2 text-sm font-semibold shadow-glow flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
