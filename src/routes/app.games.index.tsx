import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { Gamepad2, Trophy, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/games/")({ component: Games });

function Games() {
  return (
    <div>
      <PageHeader title="Games Zone" subtitle="Play & win real rewards" action={
        <Link to="/app/games/leaderboard" className="rounded-full glass px-3 py-1.5 text-xs flex items-center gap-1">
          <Trophy className="h-3.5 w-3.5" /> Leaderboard
        </Link>
      } />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/app/games/color-connect">
          <GlassCard hover className="!p-0 overflow-hidden">
            <div className="aspect-video bg-gradient-primary p-6 flex flex-col justify-end relative">
              <div className="absolute top-4 right-4 grid grid-cols-3 gap-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="h-3 w-3 rounded-full" style={{ background: `hsl(${i * 40}, 80%, 60%)` }} />
                ))}
              </div>
              <h3 className="text-xl font-bold">Color Connect</h3>
              <p className="text-xs opacity-90">Match colors & win ₹200</p>
            </div>
            <div className="p-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Entry: ₹100</span>
              <span className="rounded-full bg-success/20 text-success px-2 py-0.5">Win up to ₹200</span>
            </div>
          </GlassCard>
        </Link>
        <Link to="/app/games/scratch">
          <GlassCard hover className="!p-0 overflow-hidden">
            <div className="aspect-video bg-gradient-coin p-6 flex flex-col justify-end relative text-amber-950">
              <Sparkles className="absolute top-4 right-4 h-8 w-8" />
              <h3 className="text-xl font-bold">Scratch & Win</h3>
              <p className="text-xs opacity-90">Reveal your daily prize</p>
            </div>
            <div className="p-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Entry: ₹100</span>
              <span className="rounded-full bg-success/20 text-success px-2 py-0.5">Win up to ₹200</span>
            </div>
          </GlassCard>
        </Link>
      </div>
    </div>
  );
}
