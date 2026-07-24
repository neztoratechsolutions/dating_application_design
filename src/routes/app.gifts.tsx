import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, GlassCard, EmptyState } from "@/components/ui-kit";
import { useGifts, giftById } from "@/lib/gift-store";
import { Gift as GiftIcon, Coins } from "lucide-react";

export const Route = createFileRoute("/app/gifts")({ component: MyGifts });

function MyGifts() {
  const history = useGifts((s) => s.history);
  const total = history.reduce((a, g) => a + g.price, 0);

  return (
    <div>
      <PageHeader title="My Gifts Sent" subtitle={`${history.length} gifts · ${total} coins spent`} />
      {history.length === 0 ? (
        <EmptyState
          icon={GiftIcon}
          title="No gifts sent yet"
          desc="Surprise your favourite creators with a gift!"
          action={<Link to="/app/creators" className="rounded-full bg-gradient-primary px-4 py-2 text-sm shadow-glow">Browse creators</Link>}
        />
      ) : (
        <div className="space-y-2">
          {history.map((h) => {
            const g = giftById(h.giftId);
            return (
              <GlassCard key={h.id} className="flex items-center gap-3">
                <div className="text-3xl">{g?.emoji ?? "🎁"}</div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{g?.name ?? "Gift"}</p>
                  <p className="text-xs text-muted-foreground">to {h.creatorName} · {new Date(h.time).toLocaleString()}</p>
                </div>
                <span className="text-sm font-semibold text-amber-400 flex items-center gap-1">
                  <Coins className="h-3 w-3" /> {h.price}
                </span>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
