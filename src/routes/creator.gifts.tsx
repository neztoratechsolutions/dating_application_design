import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { GIFTS, useGifts } from "@/lib/gift-store";
import { CREATORS } from "@/lib/mock-data";
import { Gift, Trophy, Coins, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/creator/gifts")({ component: CreatorGifts });

const SEED = [
  { customer: "Aarav", giftId: "rose", count: 12 },
  { customer: "Rohan", giftId: "cake", count: 4 },
  { customer: "Vikram", giftId: "ring", count: 2 },
  { customer: "Karan", giftId: "heart", count: 18 },
  { customer: "Dev", giftId: "bouquet", count: 3 },
];

function CreatorGifts() {
  const share = useGifts((s) => s.creatorShare);
  const mine = useGifts((s) => s.history);

  const totalCoins = SEED.reduce((a, s) => a + (GIFTS.find((g) => g.id === s.giftId)?.price ?? 0) * s.count, 0)
    + mine.reduce((a, h) => a + h.price, 0);
  const earnings = Math.round((totalCoins * share) / 100);

  const breakdown = GIFTS.slice(0, 7).map((g) => ({
    name: g.emoji,
    coins: (SEED.find((s) => s.giftId === g.id)?.count ?? 0) * g.price + mine.filter((m) => m.giftId === g.id).reduce((a, m) => a + m.price, 0),
  }));

  const supporters = SEED.map((s, i) => ({
    ...s,
    avatar: CREATORS[i].avatar,
    coins: (GIFTS.find((g) => g.id === s.giftId)?.price ?? 0) * s.count,
  })).sort((a, b) => b.coins - a.coins);

  return (
    <div className="space-y-6">
      <PageHeader title="Gifts Received" subtitle={`Your share: ${share}% of every gift`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Gift, label: "Total gifts", value: SEED.reduce((a, s) => a + s.count, 0) + mine.length },
          { icon: Coins, label: "Gift coins", value: totalCoins },
          { icon: TrendingUp, label: "Your earnings", value: earnings },
          { icon: Trophy, label: "Top supporter", value: supporters[0]?.customer ?? "—" },
        ].map((s) => (
          <GlassCard key={s.label}>
            <s.icon className="h-4 w-4 text-primary mb-1" />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <h3 className="font-bold mb-3">Gift breakdown</h3>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={breakdown}>
              <XAxis dataKey="name" stroke="#888" fontSize={18} />
              <Tooltip contentStyle={{ background: "rgba(20,15,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
              <Bar dataKey="coins" fill="oklch(0.7 0.22 350)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div>
        <h3 className="font-bold mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" /> Top Supporters</h3>
        <div className="space-y-2">
          {supporters.map((s, i) => (
            <GlassCard key={s.customer} className="flex items-center gap-3">
              <span className="font-bold gradient-text w-6">#{i + 1}</span>
              <img src={s.avatar} className="h-10 w-10 rounded-full object-cover" alt="" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{s.customer}</p>
                <p className="text-xs text-muted-foreground">{s.count} × {GIFTS.find((g) => g.id === s.giftId)?.emoji}</p>
              </div>
              <span className="text-sm font-semibold text-amber-400 flex items-center gap-1">
                <Coins className="h-3 w-3" /> {s.coins}
              </span>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
