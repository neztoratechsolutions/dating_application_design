import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { GIFTS, useGifts } from "@/lib/gift-store";
import { Coins, TrendingUp, Gift as GiftIcon, Percent } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/gifts")({ component: AdminGifts });

function AdminGifts() {
  const share = useGifts((s) => s.creatorShare);
  const setShare = useGifts((s) => s.setCreatorShare);
  const history = useGifts((s) => s.history);
  const [draft, setDraft] = useState(share);

  const totalCoins = history.reduce((a, h) => a + h.price, 0);
  const creatorCut = Math.round((totalCoins * share) / 100);
  const platformCut = totalCoins - creatorCut;

  return (
    <div className="space-y-6">
      <PageHeader title="Gift Management" subtitle="Configure gift catalog & revenue split" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: GiftIcon, label: "Gifts sent", value: history.length },
          { icon: Coins, label: "Gift revenue", value: totalCoins },
          { icon: TrendingUp, label: "Platform earnings", value: platformCut },
          { icon: Percent, label: "Creator share", value: `${share}%` },
        ].map((s) => (
          <GlassCard key={s.label}>
            <s.icon className="h-4 w-4 text-primary mb-1" />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <h3 className="font-bold mb-3">Revenue Split</h3>
        <p className="text-xs text-muted-foreground mb-3">Creators get <b>{draft}%</b> · Platform keeps {100 - draft}%</p>
        <input
          type="range"
          min={5}
          max={80}
          value={draft}
          onChange={(e) => setDraft(+e.target.value)}
          className="w-full"
        />
        <button
          onClick={() => { setShare(draft); toast.success(`Creator share set to ${draft}%`); }}
          className="mt-3 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold shadow-glow"
        >
          Save changes
        </button>
      </GlassCard>

      <div>
        <h3 className="font-bold mb-3">Gift Catalog ({GIFTS.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {GIFTS.map((g) => (
            <GlassCard key={g.id} className="text-center">
              <div className="text-3xl mb-1">{g.emoji}</div>
              <p className="font-semibold text-xs">{g.name}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{g.tier}</p>
              <p className="text-amber-400 text-xs font-semibold flex items-center justify-center gap-0.5 mt-1">
                <Coins className="h-3 w-3" /> {g.price}
              </p>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
