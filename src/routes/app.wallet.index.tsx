import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-store";
import { TRANSACTIONS, COIN_PACKS } from "@/lib/mock-data";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { Coins, ArrowUpRight, ArrowDownLeft, Gift } from "lucide-react";

export const Route = createFileRoute("/app/wallet/")({ component: Wallet });

function Wallet() {
  const user = useAuth((s) => s.user);
  return (
    <div>
      <PageHeader title="Wallet" subtitle="Manage your coins" />
      <div className="glass-strong rounded-3xl p-6 mb-5 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-coin opacity-40 blur-2xl" />
        <p className="text-xs text-muted-foreground">Current balance</p>
        <div className="flex items-center gap-2 mt-1">
          <Coins className="h-7 w-7 text-amber-400" />
          <span className="text-4xl font-bold">{(user?.coins ?? 0).toLocaleString()}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">≈ ₹{((user?.coins ?? 0) * 0.9).toLocaleString()}</p>
        <div className="flex gap-2 mt-4 relative">
          <Link to="/app/wallet/buy" className="flex-1 rounded-xl bg-gradient-primary py-3 text-sm font-semibold shadow-glow text-center">
            + Buy Coins
          </Link>
          <Link to="/app/wallet/transactions" className="rounded-xl glass px-5 py-3 text-sm font-semibold">History</Link>
        </div>
      </div>

      <h3 className="font-semibold mb-3">Quick packs</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {COIN_PACKS.slice(0, 4).map((p) => (
          <Link key={p.coins} to="/app/wallet/buy">
            <GlassCard hover className="text-center relative">
              {p.popular && <span className="absolute -top-2 right-2 rounded-full bg-gradient-primary px-2 py-0.5 text-[10px]">Popular</span>}
              <Coins className="h-7 w-7 mx-auto text-amber-400 mb-1" />
              <p className="font-bold">{p.coins.toLocaleString()}</p>
              {p.bonus > 0 && <p className="text-[10px] text-success">+{p.bonus} bonus</p>}
              <p className="text-sm font-semibold mt-1 gradient-text">₹{p.price}</p>
            </GlassCard>
          </Link>
        ))}
      </div>

      <h3 className="font-semibold mb-3">Recent activity</h3>
      <div className="space-y-2">
        {TRANSACTIONS.slice(0, 4).map((t) => (
          <div key={t.id} className="glass rounded-xl p-3 flex items-center gap-3">
            <div className={`rounded-full p-2 ${t.coins > 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
              {t.coins > 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium capitalize">{t.type}</p>
              <p className="text-[10px] text-muted-foreground">{t.note || t.date}</p>
            </div>
            <p className={`text-sm font-bold ${t.coins > 0 ? "text-success" : "text-foreground"}`}>{t.coins > 0 ? "+" : ""}{t.coins}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
