import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/games/scratch")({ component: Scratch });

const API_BASE_URL = String(import.meta.env.VITE_BASE_URL ?? "").replace(/\/+$/, "");
const DAILY_LIMIT = 3;

// Helper to get today's date string in YYYY-MM-DD format
const getTodayKey = () => new Date().toISOString().split("T")[0];

// Helper to read today's play count
const getTodayPlays = (): number => {
  try {
    const stored = localStorage.getItem("scratch_plays");
    if (!stored) return 0;
    const parsed = JSON.parse(stored) as { date: string; count: number };
    if (parsed.date !== getTodayKey()) return 0; // Reset for new day
    return parsed.count;
  } catch {
    return 0;
  }
};

// Helper to save today's play count
const saveTodayPlays = (count: number) => {
  try {
    localStorage.setItem(
      "scratch_plays",
      JSON.stringify({ date: getTodayKey(), count })
    );
  } catch {
    // Ignore storage errors
  }
};

function Scratch() {
  const [scratched, setScratched] = useState(false);
  const [prize, setPrize] = useState(0);
  const [revealing, setRevealing] = useState(false);
  const [gamePlayId, setGamePlayId] = useState<number | null>(null);
  const [playsToday, setPlaysToday] = useState(0);

  const user = useAuth((s) => s.user);
  const spend = useAuth((s) => s.spendCoins);
  const addCoins = useAuth((s) => s.addCoins);

  const currentUserId = Number(user?.id ?? user?.user_id);

  // Load today's play count on mount
  useEffect(() => {
    setPlaysToday(getTodayPlays());
  }, []);

  // Reset scratch card state, but keep the daily count
  const reset = useCallback(() => {
    setScratched(false);
    setPrize(0);
    setGamePlayId(null);
  }, []);

  const remaining = Math.max(0, DAILY_LIMIT - playsToday);
  const limitReached = remaining === 0;

  const play = async () => {
    if (!currentUserId) {
      toast.error("Please log in to play.");
      return;
    }

    // Frontend daily limit check
    if (limitReached) {
      toast.error("Daily limit reached! Come back tomorrow.");
      return;
    }

    setRevealing(true);

    try {
      // 1. Start the game on the backend
      const startRes = await fetch(`${API_BASE_URL}/games/scratch/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ user_id: currentUserId }),
      });

      const startData = await startRes.json().catch(() => ({}));

      if (!startRes.ok) {
        throw new Error(startData.detail || "Failed to start game.");
      }

      // Mirror entry fee deduction locally (already done on backend)
      spend(startData.entry_fee ?? 100);

      // Increment daily play count locally
      const newCount = playsToday + 1;
      setPlaysToday(newCount);
      saveTodayPlays(newCount);

      setGamePlayId(startData.game_play_id);
      setPrize(0); // reset until revealed

      // 2. Wait for the scratch animation to play
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // 3. Reveal the result from the backend
      const revealRes = await fetch(`${API_BASE_URL}/games/scratch/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          game_play_id: startData.game_play_id,
          user_id: currentUserId,
        }),
      });

      const revealData = await revealRes.json().catch(() => ({}));

      if (!revealRes.ok) {
        throw new Error(revealData.detail || "Failed to reveal result.");
      }

      // Mirror reward addition locally (already done on backend)
      const reward = revealData.reward_coins || 0;
      if (reward > 0) {
        addCoins(reward);
      }

      setPrize(reward);
      setScratched(true);
      setRevealing(false);

      if (reward > 0) {
        toast.success(`🎉 You won ${reward} coins!`);
      } else {
        toast("Better luck next time!");
      }
    } catch (error) {
      console.error("Scratch game error:", error);
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
      setRevealing(false);
    }
  };

  return (
    <div>
      <Link to="/app/games" className="inline-flex rounded-full glass p-2 mb-4">
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <div className="glass-strong rounded-3xl p-6 text-center">
        <h1 className="text-2xl font-bold">Scratch & Win</h1>
        <p className="text-xs text-muted-foreground mt-1">Spend 100 coins · Win up to 200</p>

        <div className="relative mx-auto my-8 h-56 w-56 rounded-3xl overflow-hidden shadow-glow">
          <div className="absolute inset-0 bg-gradient-primary flex items-center justify-center">
            {scratched ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                <p className="text-5xl font-bold gradient-text drop-shadow-lg">{prize}</p>
                <p className="text-sm mt-1">{prize > 0 ? "coins won!" : "Try again"}</p>
              </motion.div>
            ) : (
              <motion.div
                initial={false}
                animate={revealing ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 bg-gradient-coin flex items-center justify-center text-amber-950"
              >
                <div className="text-center">
                  <Sparkles className="h-10 w-10 mx-auto mb-2" />
                  <p className="font-bold text-lg">SCRATCH HERE</p>
                  <p className="text-xs">Tap below to reveal</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {scratched ? (
          <button
            onClick={reset}
            disabled={limitReached}
            className="rounded-full glass px-6 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {limitReached ? "Come back tomorrow" : "Play again"}
          </button>
        ) : (
          <button
            onClick={play}
            disabled={revealing || limitReached}
            className="rounded-full bg-gradient-primary px-6 py-3 font-semibold shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {revealing
              ? "Revealing..."
              : limitReached
              ? "Daily limit reached"
              : "Scratch · 100 coins"}
          </button>
        )}
        <p className="text-[10px] text-muted-foreground mt-4">
          Daily limit: {playsToday}/{DAILY_LIMIT} plays used
        </p>
      </div>
    </div>
  );
}