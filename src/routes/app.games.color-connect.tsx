import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Coins } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app/games/color-connect")({ component: ColorConnect });

const COLORS = ["#ff5e7e", "#7c5cff", "#5cc8ff", "#5fffa3", "#ffd45c", "#ff9b5c"];

function ColorConnect() {
  const [grid, setGrid] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [timer, setTimer] = useState(45);
  const [started, setStarted] = useState(false);
  const spend = useAuth((s) => s.spendCoins);
  const addCoins = useAuth((s) => s.addCoins);

  useEffect(() => {
    if (!started) return;
    if (timer <= 0) { toast(`Time up! ${matches * 30} coins earned`); addCoins(matches * 30); setStarted(false); return; }
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, started, matches, addCoins]);

  const start = () => {
    if (!spend(100)) return toast.error("Need 100 coins to play");
    const arr: string[] = [];
    COLORS.forEach((c) => { arr.push(c, c, c); }); // 3 of each, 18 total
    arr.sort(() => Math.random() - 0.5);
    setGrid(arr); setSelected([]); setMatches(0); setTimer(45); setStarted(true);
  };

  const tap = (i: number) => {
    if (!started || selected.includes(i) || !grid[i]) return;
    const next = [...selected, i];
    setSelected(next);
    if (next.length === 3) {
      if (grid[next[0]] === grid[next[1]] && grid[next[1]] === grid[next[2]]) {
        const g = [...grid]; next.forEach((idx) => g[idx] = "");
        setGrid(g); setMatches(matches + 1); toast.success("Match! +30 coins");
        if (matches + 1 >= 6) { addCoins(200); toast.success("🎉 You won ₹200!"); setStarted(false); }
      }
      setTimeout(() => setSelected([]), 400);
    }
  };

  return (
    <div>
      <Link to="/app/games" className="inline-flex rounded-full glass p-2 mb-4"><ArrowLeft className="h-4 w-4" /></Link>
      <div className="glass-strong rounded-3xl p-6 text-center">
        <h1 className="text-2xl font-bold">Color Connect</h1>
        <p className="text-xs text-muted-foreground mt-1">Tap 3 same-color dots to match. 6 matches = ₹200!</p>
        <div className="flex justify-around my-5 text-sm">
          <div><p className="text-xs text-muted-foreground">Time</p><p className="font-bold text-xl gradient-text">{timer}s</p></div>
          <div><p className="text-xs text-muted-foreground">Matches</p><p className="font-bold text-xl gradient-text">{matches}/6</p></div>
        </div>

        {!started ? (
          <button onClick={start} className="rounded-full bg-gradient-primary px-6 py-3 font-semibold shadow-glow">
            <Coins className="inline h-4 w-4 mr-1" /> Play · 100 coins
          </button>
        ) : (
          <div className="grid grid-cols-6 gap-2 max-w-md mx-auto">
            {grid.map((c, i) => (
              <motion.button key={i} disabled={!c} onClick={() => tap(i)} whileTap={{ scale: 0.9 }}
                className={`aspect-square rounded-xl ${selected.includes(i) ? "ring-2 ring-primary scale-110" : ""}`}
                style={{ background: c || "transparent", border: c ? "none" : "1px dashed oklch(1 0 0 / 0.1)" }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
