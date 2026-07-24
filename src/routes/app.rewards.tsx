import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth-store";
import { Gift, Trophy, Flame, Users, Coins, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/rewards")({ component: Rewards });

const DAYS = [10, 20, 30, 50, 75, 100, 200];
const BADGES = [
  { icon: Flame, name: "First Spark", desc: "Sent your 1st gift", earned: true },
  { icon: Trophy, name: "Top Supporter", desc: "Sent 10 gifts", earned: true },
  { icon: Gift, name: "Diamond Heart", desc: "Sent a Diamond Ring", earned: false },
  { icon: Users, name: "Social Star", desc: "Refer 5 friends", earned: false },
];

function Rewards() {
  const addCoins = useAuth((s) => s.addCoins);
  const [day, setDay] = useState(2);
  const [claimedToday, setClaimedToday] = useState(false);

  const claim = () => {
    if (claimedToday) return toast.error("Come back tomorrow!");
    addCoins(DAYS[day]);
    toast.success(`+${DAYS[day]} coins!`);
    setClaimedToday(true);
    setDay((d) => Math.min(d + 1, DAYS.length - 1));
  };

  const refer = () => {
    navigator.clipboard?.writeText("https://velora.live/ref/AARAV500");
    toast.success("Referral link copied!");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Rewards" subtitle="Earn coins every day" />

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

      <GlassCard>
        <h3 className="font-bold mb-2 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Referral Program</h3>
        <p className="text-xs text-muted-foreground mb-3">Get 500 coins for each friend who joins.</p>
        <div className="flex gap-2">
          <input readOnly value="velora.live/ref/AARAV500" className="flex-1 glass rounded-xl px-3 py-2 text-xs" />
          <button onClick={refer} className="rounded-xl bg-gradient-primary px-4 text-xs font-semibold shadow-glow">Copy</button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1"><Coins className="h-3 w-3" /> 3 friends joined · 1500 coins earned</p>
      </GlassCard>

      <div>
        <h3 className="font-bold mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" /> Achievement Badges</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {BADGES.map((b) => (
            <GlassCard key={b.name} className={`text-center ${!b.earned && "opacity-50"}`}>
              <div className={`rounded-full p-3 mx-auto mb-2 w-fit ${b.earned ? "bg-gradient-primary shadow-glow" : "bg-glass"}`}>
                <b.icon className="h-5 w-5" />
              </div>
              <p className="font-semibold text-xs">{b.name}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{b.desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
