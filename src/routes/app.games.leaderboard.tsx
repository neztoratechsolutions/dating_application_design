import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-kit";
import { Trophy, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/app/games/leaderboard")({ component: Lb });

const API_BASE_URL = String(import.meta.env.VITE_BASE_URL ?? "").replace(/\/+$/, "");

type LeaderboardPlayer = {
  rank: number;
  user_id: number;
  name: string;
  profile_image: string;
  coins: number;
};

type LeaderboardResponse = {
  message: string;
  period: string;
  total_players: number;
  leaderboard: LeaderboardPlayer[];
};

function Lb() {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!API_BASE_URL) {
        setError("API base URL is not configured.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/leaderboard/weekly`, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Failed to load leaderboard (${response.status})`);
        }

        const data: LeaderboardResponse = await response.json();
        setPlayers(data.leaderboard ?? []);
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
        setError(err instanceof Error ? err.message : "Unable to load leaderboard.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Helper to convert Windows backslashes + relative path to absolute URL
  const getImageUrl = (profileImage: string) => {
    if (!profileImage) return `https://api.dicebear.com/9.x/lorelei/svg?seed=${Math.random()}`;
    const cleanPath = profileImage.replace(/\\/g, "/");
    return /^https?:\/\//i.test(cleanPath)
      ? cleanPath
      : `${API_BASE_URL}/${cleanPath.replace(/^\/+/, "")}`;
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Leaderboard" subtitle="Top players this week" />
        <div className="flex justify-center items-center pt-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Leaderboard" subtitle="Top players this week" />
        <p className="text-center text-sm text-muted-foreground pt-10">{error}</p>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div>
        <PageHeader title="Leaderboard" subtitle="Top players this week" />
        <p className="text-center text-sm text-muted-foreground pt-10">
          No players on the leaderboard yet this week.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Leaderboard" subtitle="Top players this week" />
      <div className="space-y-2">
        {players.map((p) => (
          <div
            key={p.user_id}
            className={`glass rounded-2xl p-3 flex items-center gap-3 ${
              p.rank <= 3 ? "ring-1 ring-primary/40" : ""
            }`}
          >
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                p.rank === 1
                  ? "bg-gradient-coin text-amber-950"
                  : p.rank === 2
                  ? "bg-slate-300 text-slate-900"
                  : p.rank === 3
                  ? "bg-orange-300 text-orange-900"
                  : "glass"
              }`}
            >
              {p.rank}
            </div>
            <img
              src={getImageUrl(p.profile_image)}
              alt={p.name}
              className="h-10 w-10 rounded-full object-cover bg-glass"
              onError={(e) => {
                // Fallback to dicebear if the server image fails to load
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/lorelei/svg?seed=${p.user_id}`;
              }}
            />
            <p className="flex-1 text-sm font-medium truncate">{p.name}</p>
            <p className="text-sm font-bold gradient-text flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              {p.coins}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}