// import { createFileRoute } from "@tanstack/react-router";
// import { NOTIFICATIONS } from "@/lib/mock-data";
// import { PageHeader } from "@/components/ui-kit";
// import { Bell } from "lucide-react";

// export const Route = createFileRoute("/app/notifications")({ component: Notifs });

// function Notifs() {
//   return (
//     <div>
//       <PageHeader title="Notifications" />
//       <div className="space-y-2">
//         {NOTIFICATIONS.map((n) => (
//           <div key={n.id} className="glass rounded-2xl p-4 flex gap-3">
//             <div className="rounded-full bg-gradient-primary p-2 h-fit shadow-glow"><Bell className="h-4 w-4" /></div>
//             <div className="flex-1">
//               <p className="font-medium text-sm">{n.title}</p>
//               <p className="text-xs text-muted-foreground">{n.body}</p>
//             </div>
//             <p className="text-[10px] text-muted-foreground">{n.time}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { toast } from "sonner";
import {
  Bell, RefreshCw, Loader2, AlertCircle,
  UserCheck, Wallet, Gift, Users, Coins, IndianRupee,
  CheckCircle2, Circle, CreditCard, Gamepad2,
} from "lucide-react";

export const Route = createFileRoute("/app/notifications")({ component: Notifs });

const API_BASE = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

// ---- API types (matching GET /notifications/customer/{customer_id}) ----

interface OnlineCreator {
  creator_id: number;
  creator_name: string;
  status: string;
  date_time: string | null;
}

interface WalletTransactionItem {
  transaction_id: string | null;
  coins_added: number;
  amount: number;
  method: string | null;
  message: string | null;
  date_time: string | null;
}

interface WalletCredits {
  available: boolean;
  total_coins_added: number;
  total_amount_added: number;
  transaction_count: number;
  transactions: WalletTransactionItem[];
}

interface DailyBonusItem {
  game_id: number;
  game_name: string;
  coins_earned: number;
  message: string | null;
  date_time: string | null;
}

interface DailyBonus {
  total_coins_earned: number;
  total_games_won: number;
  data: DailyBonusItem[];
}

interface NewFollowerItem {
  creator_id: number;
  creator_name: string;
  message: string | null;
  date_time: string | null;
}

interface NewFollowers {
  count: number;
  data: NewFollowerItem[];
}

type NotificationType = "creator_online" | "daily_bonus" | "new_follower" | string;

interface NotificationItem {
  type: NotificationType;
  title: string;
  message: string;
  date_time: string | null;
  is_read: boolean;
}

interface CustomerNotifications {
  customer_id: number;
  customer_name: string;
  date: string;
  total_notifications: number;
  online_creators: { count: number; data: OnlineCreator[] };
  today_wallet_credits: WalletCredits;
  daily_bonus: DailyBonus;
  new_followers: NewFollowers;
  notifications: NotificationItem[];
}

// ---- helpers ----

async function getJson(url: string) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  let body: any = null;
  try { body = await res.json(); } catch { /* ignore */ }
  if (!res.ok) throw new Error(body?.detail || body?.message || `Request failed (${res.status})`);
  return body;
}

function avatarFor(seed: string | number): string {
  return `https://i.pravatar.cc/200?u=${encodeURIComponent(String(seed))}`;
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN");
}

function relative(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// Map a notification type string to an icon + tone.
function notifVisual(type: string): { icon: any; tone: string } {
  const v = (type || "").toLowerCase();
  if (v.includes("online")) return { icon: UserCheck, tone: "bg-emerald-500/15 text-emerald-300" };
  if (v.includes("bonus") || v.includes("game") || v.includes("win")) return { icon: Gift, tone: "bg-pink-500/15 text-pink-300" };
  if (v.includes("follow")) return { icon: Users, tone: "bg-sky-500/15 text-sky-300" };
  if (v.includes("wallet") || v.includes("credit") || v.includes("recharge")) return { icon: Wallet, tone: "bg-amber-500/15 text-amber-300" };
  if (v.includes("kyc")) return { icon: CheckCircle2, tone: "bg-violet-500/15 text-violet-300" };
  return { icon: Bell, tone: "bg-gradient-primary text-primary-foreground shadow-glow" };
}

function Kpi({ icon: Icon, label, value, tone }: any) {
  return (
    <GlassCard>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold mt-1">{value}</p>
        </div>
        <div className={`rounded-xl p-2 ${tone}`}><Icon className="h-5 w-5" /></div>
      </div>
    </GlassCard>
  );
}

function Notifs() {
  const user = useAuth((s) => s.user);
  const [data, setData] = useState<CustomerNotifications | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = useCallback(async () => {
    if (!user?.id) {
      setError("Sign in to view your notifications");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const j = await getJson(`${API_BASE}/notifications/customer/${user.id}`);
      setData(j);
    } catch (e: any) {
      const msg = e?.message || "Failed to load notifications";
      setError(msg);
      setData(null);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const notifications = data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filteredNotifs = filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  const kpis = [
    { icon: Bell, label: "Notifications", value: data?.total_notifications ?? 0, tone: "bg-primary/15 text-primary" },
    { icon: UserCheck, label: "Creators Online", value: data?.online_creators?.count ?? 0, tone: "bg-emerald-500/15 text-emerald-300" },
    { icon: Coins, label: "Coins Today", value: (data?.today_wallet_credits?.total_coins_added ?? 0).toLocaleString(), tone: "bg-amber-500/15 text-amber-300" },
    { icon: Gift, label: "Games Won", value: data?.daily_bonus?.total_games_won ?? 0, tone: "bg-pink-500/15 text-pink-300" },
    { icon: Users, label: "New Followers", value: data?.new_followers?.count ?? 0, tone: "bg-sky-500/15 text-sky-300" },
  ];

  // ---- loading ----
  if (loading && !data) {
    return (
      <div>
        <PageHeader title="Notifications" />
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // ---- error (first load) ----
  if (error && !data) {
    return (
      <div>
        <PageHeader title="Notifications" />
        <GlassCard className="text-center py-20 flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="font-bold text-lg">Failed to Load</h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <button onClick={load} className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={data ? `Hi ${data.customer_name} · ${data.date}` : ""}
        action={
          <button onClick={load} disabled={loading} className="glass rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Notifications feed */}
        <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
          <div className="p-3 flex items-center justify-between border-b border-border/40">
            <h3 className="font-semibold flex items-center gap-2"><Bell className="h-4 w-4" /> Activity Feed</h3>
            <div className="flex rounded-full glass p-1 text-xs">
              {(["all", "unread"] as const).map((k) => (
                <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1 rounded-full capitalize ${filter === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {k}{k === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-border/20 max-h-[600px] overflow-y-auto">
            {filteredNotifs.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">No notifications yet</p>
            ) : filteredNotifs.map((n, i) => {
              const v = notifVisual(n.type);
              const Icon = v.icon;
              return (
                <div key={i} className={`p-3 flex gap-3 ${!n.is_read ? "bg-primary/5" : ""}`}>
                  <div className={`rounded-full p-2 h-fit ${v.tone}`}><Icon className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{n.title}</p>
                      {!n.is_read
                        ? <Circle className="h-3 w-3 text-primary flex-shrink-0 mt-1" />
                        : <CheckCircle2 className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span className="rounded-full bg-muted/30 px-2 py-0.5">{n.type}</span>
                      <span>{relative(n.date_time)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Side panels */}
        <div className="space-y-4">
          {/* Online creators */}
          <GlassCard>
            <h3 className="font-semibold mb-3 flex items-center gap-2"><UserCheck className="h-4 w-4 text-emerald-300" /> Online Creators</h3>
            {(data?.online_creators?.data ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No creators online</p>
            ) : (
              <div className="space-y-2">
                {(data?.online_creators?.data ?? []).map((c) => (
                  <div key={c.creator_id} className="flex items-center gap-2">
                    <img src={avatarFor(c.creator_id)} className="h-8 w-8 rounded-full object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.creator_name}</p>
                      <p className="text-[10px] text-muted-foreground">{relative(c.date_time)}</p>
                    </div>
                    <span className="text-[10px] rounded-full px-2 py-0.5 bg-emerald-500/15 text-emerald-300 inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {c.status || "online"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Today's wallet credits */}
          <GlassCard>
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Wallet className="h-4 w-4 text-amber-300" /> Wallet Credits Today</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="glass rounded-xl p-2">
                <p className="text-[10px] text-muted-foreground">Coins Added</p>
                <p className="font-bold text-sm flex items-center gap-1"><Coins className="h-3 w-3 text-amber-400" />{(data?.today_wallet_credits?.total_coins_added ?? 0).toLocaleString()}</p>
              </div>
              <div className="glass rounded-xl p-2">
                <p className="text-[10px] text-muted-foreground">Amount Added</p>
                <p className="font-bold text-sm flex items-center gap-1"><IndianRupee className="h-3 w-3 text-emerald-400" />{(data?.today_wallet_credits?.total_amount_added ?? 0).toLocaleString()}</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">
              {data?.today_wallet_credits?.transaction_count ?? 0} transaction{(data?.today_wallet_credits?.transaction_count ?? 0) === 1 ? "" : "s"}
              {!data?.today_wallet_credits?.available ? " · data unavailable" : ""}
            </p>
            {(data?.today_wallet_credits?.transactions ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">No transactions today</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {(data?.today_wallet_credits?.transactions ?? []).map((t) => (
                  <div key={t.transaction_id ?? `${t.date_time}`} className="glass rounded-xl p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium truncate flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-muted-foreground" />
                        {t.method || "—"}
                      </p>
                      <p className="text-xs font-bold text-amber-300 flex items-center gap-0.5">
                        <Coins className="h-3 w-3" />+{t.coins_added.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span className="truncate">{t.transaction_id || "—"}</span>
                      <span className="flex items-center gap-0.5"><IndianRupee className="h-2.5 w-2.5" />{t.amount.toLocaleString()}</span>
                    </div>
                    {t.message && <p className="text-[10px] text-muted-foreground mt-1">{t.message}</p>}
                    <p className="text-[10px] text-muted-foreground mt-0.5">{fmtDateTime(t.date_time)} · {relative(t.date_time)}</p>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Daily bonus */}
          <GlassCard>
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Gift className="h-4 w-4 text-pink-300" /> Daily Bonus</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="glass rounded-xl p-2">
                <p className="text-[10px] text-muted-foreground">Coins Earned</p>
                <p className="font-bold text-sm flex items-center gap-1"><Coins className="h-3 w-3 text-amber-400" />{(data?.daily_bonus?.total_coins_earned ?? 0).toLocaleString()}</p>
              </div>
              <div className="glass rounded-xl p-2">
                <p className="text-[10px] text-muted-foreground">Games Won</p>
                <p className="font-bold text-sm">{data?.daily_bonus?.total_games_won ?? 0}</p>
              </div>
            </div>
            {(data?.daily_bonus?.data ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">No bonus games today</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {(data?.daily_bonus?.data ?? []).map((d) => (
                  <div key={d.game_id} className="glass rounded-xl p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium truncate flex items-center gap-1">
                        <Gamepad2 className="h-3 w-3 text-pink-300" />
                        {d.game_name || `Game #${d.game_id}`}
                      </p>
                      <p className="text-xs font-bold text-pink-300 flex items-center gap-0.5">
                        <Coins className="h-3 w-3" />+{d.coins_earned.toLocaleString()}
                      </p>
                    </div>
                    {d.message && <p className="text-[10px] text-muted-foreground mt-1">{d.message}</p>}
                    <p className="text-[10px] text-muted-foreground mt-0.5">{fmtDateTime(d.date_time)} · {relative(d.date_time)}</p>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* New followers */}
          <GlassCard>
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-sky-300" /> New Followers</h3>
            {(data?.new_followers?.data ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No new followers</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {(data?.new_followers?.data ?? []).map((f) => (
                  <div key={f.creator_id} className="flex items-center gap-2">
                    <img src={avatarFor(f.creator_id)} className="h-8 w-8 rounded-full object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.creator_name}</p>
                      <p className="text-[10px] text-muted-foreground">{relative(f.date_time)}</p>
                    </div>
                    <span className="text-[10px] rounded-full px-2 py-0.5 bg-sky-500/15 text-sky-300">followed</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
