import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-kit";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/app/games/leaderboard")({ component: Lb });

const players = Array.from({ length: 10 }).map((_, i) => ({
  rank: i + 1,
  name: ["Rohan", "Priya", "Karan", "Sneha", "Amit", "Neha", "Vikas", "Pooja", "Arjun", "You"][i],
  score: 5000 - i * 280,
  avatar: `https://api.dicebear.com/9.x/lorelei/svg?seed=${i}`,
}));

function Lb() {
  return (
    <div>
      <PageHeader title="Leaderboard" subtitle="Top players this week" />
      <div className="space-y-2">
        {players.map((p) => (
          <div key={p.rank} className={`glass rounded-2xl p-3 flex items-center gap-3 ${p.rank <= 3 ? "ring-1 ring-primary/40" : ""}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
              p.rank === 1 ? "bg-gradient-coin text-amber-950" :
              p.rank === 2 ? "bg-slate-300 text-slate-900" :
              p.rank === 3 ? "bg-orange-300 text-orange-900" : "glass"
            }`}>{p.rank}</div>
            <img src={p.avatar} alt="" className="h-10 w-10 rounded-full" />
            <p className="flex-1 text-sm font-medium">{p.name}</p>
            <p className="text-sm font-bold gradient-text flex items-center gap-1"><Trophy className="h-3 w-3" />{p.score}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
