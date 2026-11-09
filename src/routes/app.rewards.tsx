// import { createFileRoute } from "@tanstack/react-router";
// import { PageHeader, GlassCard } from "@/components/ui-kit";
// import { useAuth } from "@/lib/auth-store";
// import { Gift, Trophy, Flame, Users, Coins, Check } from "lucide-react";
// import { useState } from "react";
// import { toast } from "sonner";

// export const Route = createFileRoute("/app/rewards")({ component: Rewards });

// const DAYS = [10, 20, 30, 50, 75, 100, 200];
// const BADGES = [
//   { icon: Flame, name: "First Spark", desc: "Sent your 1st gift", earned: true },
//   { icon: Trophy, name: "Top Supporter", desc: "Sent 10 gifts", earned: true },
//   { icon: Gift, name: "Diamond Heart", desc: "Sent a Diamond Ring", earned: false },
//   { icon: Users, name: "Social Star", desc: "Refer 5 friends", earned: false },
// ];

// function Rewards() {
//   const addCoins = useAuth((s) => s.addCoins);
//   const [day, setDay] = useState(2);
//   const [claimedToday, setClaimedToday] = useState(false);

//   const claim = () => {
//     if (claimedToday) return toast.error("Come back tomorrow!");
//     addCoins(DAYS[day]);
//     toast.success(`+${DAYS[day]} coins!`);
//     setClaimedToday(true);
//     setDay((d) => Math.min(d + 1, DAYS.length - 1));
//   };

//   const refer = () => {
//     navigator.clipboard?.writeText("https://velora.live/ref/AARAV500");
//     toast.success("Referral link copied!");
//   };

//   return (
//     <div className="space-y-6">
//       <PageHeader title="Rewards" subtitle="Earn coins every day" />

//       <GlassCard>
//         <h3 className="font-bold mb-3 flex items-center gap-2"><Flame className="h-4 w-4 text-primary" /> Daily Check-In</h3>
//         <div className="grid grid-cols-7 gap-1.5 mb-3">
//           {DAYS.map((c, i) => (
//             <div key={i} className={`rounded-xl p-2 text-center text-xs ${i < day ? "bg-success/20 text-success" : i === day ? "bg-gradient-primary shadow-glow" : "glass"}`}>
//               <p className="text-[9px] opacity-70">Day {i + 1}</p>
//               <p className="font-bold">{c}</p>
//               {i < day && <Check className="h-3 w-3 mx-auto mt-0.5" />}
//             </div>
//           ))}
//         </div>
//         <button onClick={claim} className="w-full rounded-xl bg-gradient-primary py-2.5 font-semibold shadow-glow text-sm">
//           {claimedToday ? "Claimed ✓" : `Claim ${DAYS[day]} coins`}
//         </button>
//       </GlassCard>

//       <GlassCard>
//         <h3 className="font-bold mb-2 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Referral Program</h3>
//         <p className="text-xs text-muted-foreground mb-3">Get 500 coins for each friend who joins.</p>
//         <div className="flex gap-2">
//           <input readOnly value="velora.live/ref/AARAV500" className="flex-1 glass rounded-xl px-3 py-2 text-xs" />
//           <button onClick={refer} className="rounded-xl bg-gradient-primary px-4 text-xs font-semibold shadow-glow">Copy</button>
//         </div>
//         <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1"><Coins className="h-3 w-3" /> 3 friends joined · 1500 coins earned</p>
//       </GlassCard>

//       <div>
//         <h3 className="font-bold mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" /> Achievement Badges</h3>
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
//           {BADGES.map((b) => (
//             <GlassCard key={b.name} className={`text-center ${!b.earned && "opacity-50"}`}>
//               <div className={`rounded-full p-3 mx-auto mb-2 w-fit ${b.earned ? "bg-gradient-primary shadow-glow" : "bg-glass"}`}>
//                 <b.icon className="h-5 w-5" />
//               </div>
//               <p className="font-semibold text-xs">{b.name}</p>
//               <p className="text-[10px] text-muted-foreground mt-1">{b.desc}</p>
//             </GlassCard>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth-store";
import {
  Gift, Trophy, Flame, Users, Coins, Check, RefreshCw, Loader2,
  AlertCircle, Sparkles, Diamond, Crown,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/rewards")({ component: Rewards });

const API_BASE = import.meta.env.VITE_BASE_URL;

// ---- API types (matching GET /rewards/{user_id}) ----

interface Referral {
  referral_code: string;
  referral_link: string;
  friends_joined: number;
  coins_earned: number;
}

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;     // "spark" | "trophy" | "diamond" | "users" | …
  unlocked: boolean;
}

interface RewardsData {
  referral: Referral;
  badges: Badge[];
}

// ---- daily check-in config (no backend endpoint; stays client-side) ----

const DAYS = [10, 20, 30, 50, 75, 100, 200];

// ---- helpers ----

// Map the icon string from the API to a lucide icon component.
const ICON_MAP: Record<string, any> = {
  spark: Sparkles,
  flame: Flame,
  trophy: Trophy,
  gift: Gift,
  diamond: Diamond,
  crown: Crown,
  users: Users,
  coins: Coins,
};

function badgeIcon(name: string) {
  return ICON_MAP[(name || "").toLowerCase()] || Trophy;
}

async function getJson(url: string) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  let body: any = null;
  try { body = await res.json(); } catch { /* ignore */ }
  if (!res.ok) throw new Error(body?.detail || body?.message || `Request failed (${res.status})`);
  return body;
}

function Rewards() {
  const user = useAuth((s) => s.user);
  const addCoins = useAuth((s) => s.addCoins);

  // daily check-in (client-side only)
  const [day, setDay] = useState(2);
  const [claimedToday, setClaimedToday] = useState(false);

  // rewards data from the API
  const [data, setData] = useState<RewardsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setError("Sign in to view your rewards");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const j = await getJson(`${API_BASE}/rewards/${user.id}`);
      setData(j);
    } catch (e: any) {
      const msg = e?.message || "Failed to load rewards";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const claim = () => {
    if (claimedToday) {
      toast.error("Come back tomorrow!");
      return;
    }
    addCoins(DAYS[day]);
    toast.success(`+${DAYS[day]} coins!`);
    setClaimedToday(true);
    setDay((d) => Math.min(d + 1, DAYS.length - 1));
  };

  const refer = () => {
    const link = data?.referral?.referral_link;
    if (!link) {
      toast.error("Referral link not available");
      return;
    }
    navigator.clipboard?.writeText(link.startsWith("http") ? link : `${API_BASE.replace(/^http(s)?:\/\/[^/]+/, "")}/${link}`);
    toast.success("Referral link copied!");
  };

  // ---- loading / error states ----

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rewards" subtitle="Earn coins every day" />
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rewards" subtitle="Earn coins every day" />
        <GlassCard className="text-center py-20 flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="font-bold text-lg">Failed to Load Rewards</h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <button onClick={load} className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </GlassCard>
      </div>
    );
  }

  const referral = data?.referral;
  const badges = data?.badges ?? [];
  const referralCode = referral?.referral_code || "—";
  const referralLink = referral?.referral_link || "";
  const friendsJoined = referral?.friends_joined ?? 0;
  const coinsEarned = referral?.coins_earned ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rewards"
        subtitle="Earn coins every day"
        action={
          <button onClick={load} disabled={loading} className="glass rounded-full px-3 py-2 text-sm flex items-center gap-2 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        }
      />

      {/* Daily check-in — no backend endpoint, kept client-side */}
      <GlassCard>
        <h3 className="font-bold mb-3 flex items-center gap-2"><Flame className="h-4 w-4 text-primary" /> Daily Check-In</h3>
        <div className="grid grid-cols-7 gap-1.5 mb-3">
          {DAYS.map((c, i) => (
            <div key={i} className={`rounded-xl p-2 text-center text-xs ${i < day ? "bg-success/20 text-success" : i === day ? "bg-gradient-primary shadow-glow" : "glass"}`}>
              <p className="text-[9px] opacity-70">Day {i + 1}</p>
              <p className="font-bold">{c}</p>
              {i < day && <Check className="h-3 w-3 mx-auto mt-0.5" />}
            </div>
          ))}
        </div>
        <button onClick={claim} className="w-full rounded-xl bg-gradient-primary py-2.5 font-semibold shadow-glow text-sm">
          {claimedToday ? "Claimed ✓" : `Claim ${DAYS[day]} coins`}
        </button>
      </GlassCard>

      {/* Referral program — from GET /rewards/{user_id} */}
      <GlassCard>
        <h3 className="font-bold mb-2 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Referral Program</h3>
        <p className="text-xs text-muted-foreground mb-3">Get 500 coins for each friend who joins.</p>
        <div className="flex gap-2">
          <input readOnly value={referralLink || referralCode} className="flex-1 glass rounded-xl px-3 py-2 text-xs" />
          <button onClick={refer} className="rounded-xl bg-gradient-primary px-4 text-xs font-semibold shadow-glow">Copy</button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
          <Users className="h-3 w-3" /> {friendsJoined} friend{friendsJoined === 1 ? "" : "s"} joined
          <span className="mx-1">·</span>
          <Coins className="h-3 w-3" /> {coinsEarned.toLocaleString("en-IN")} coins earned
        </p>
      </GlassCard>

      {/* Achievement badges — from GET /rewards/{user_id} */}
      <div>
        <h3 className="font-bold mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" /> Achievement Badges</h3>
        {loading ? (
          <GlassCard className="text-center py-10 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" /> Loading badges…
          </GlassCard>
        ) : badges.length === 0 ? (
          <GlassCard className="text-center py-10 text-sm text-muted-foreground">No badges available</GlassCard>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {badges.map((b) => {
              const Icon = badgeIcon(b.icon);
              return (
                <GlassCard key={b.id} className={`text-center ${!b.unlocked && "opacity-50"}`}>
                  <div className={`rounded-full p-3 mx-auto mb-2 w-fit ${b.unlocked ? "bg-gradient-primary shadow-glow" : "bg-glass"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-xs">{b.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{b.description}</p>
                  {b.unlocked && (
                    <p className="text-[10px] text-success mt-1 inline-flex items-center gap-1">
                      <Check className="h-3 w-3" /> Unlocked
                    </p>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
