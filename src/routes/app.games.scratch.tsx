import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/games/scratch")({ component: Scratch });

function Scratch() {
  const [scratched, setScratched] = useState(false);
  const [prize, setPrize] = useState(0);
  const [revealing, setRevealing] = useState(false);
  const spend = useAuth((s) => s.spendCoins);
  const addCoins = useAuth((s) => s.addCoins);

  const play = () => {
    if (!spend(100)) return toast.error("Need 100 coins to play");
    const p = [0, 50, 100, 200, 200][Math.floor(Math.random() * 5)];
    setPrize(p); setRevealing(true);
    setTimeout(() => {
      setScratched(true); setRevealing(false);
      if (p > 0) { addCoins(p); toast.success(`🎉 You won ${p} coins!`); }
      else toast("Better luck next time!");
    }, 1200);
  };

  const reset = () => { setScratched(false); setPrize(0); };

  return (
    <div>
      <Link to="/app/games" className="inline-flex rounded-full glass p-2 mb-4"><ArrowLeft className="h-4 w-4" /></Link>
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
                initial={false} animate={revealing ? { opacity: 0 } : { opacity: 1 }}
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
          <button onClick={reset} className="rounded-full glass px-6 py-3 font-semibold">Play again</button>
        ) : (
          <button onClick={play} disabled={revealing}
            className="rounded-full bg-gradient-primary px-6 py-3 font-semibold shadow-glow disabled:opacity-50">
            {revealing ? "Revealing..." : "Scratch · 100 coins"}
          </button>
        )}
        <p className="text-[10px] text-muted-foreground mt-4">Daily limit: 3 plays</p>
      </div>
    </div>
  );
}
