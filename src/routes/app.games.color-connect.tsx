import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Coins, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app/games/color-connect")({ component: ColorConnect });

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

type Dot = {
  dot_id: string | number;
  color: string;
};

function ColorConnect() {
  const user = useAuth((s) => s.user);
  
  const [board, setBoard] = useState<Dot[]>([]);
  const [matchedDotIds, setMatchedDotIds] = useState<(string | number)[]>([]);
  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [matches, setMatches] = useState(0);
  const [matchesRequired, setMatchesRequired] = useState(6);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [entryFee, setEntryFee] = useState(0);
  const [gamePlayId, setGamePlayId] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [walletCoins, setWalletCoins] = useState<number | null>(null);

  const userId = Number(user?.user_id || user?.id);

  // --- Start Game API ---
  const start = async () => {
    if (!userId) {
      toast.error("Please login to play");
      return;
    }

    setIsStarting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/games/color-connect/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to start game");
      }

      // Setup game state from server response
      setBoard(data.board || []);
      setMatchedDotIds([]);
      setSelected([]);
      setMatches(0);
      setMatchesRequired(data.matches_required || 6);
      setRewardAmount(data.reward_amount || 0);
      setEntryFee(data.entry_fee || 0);
      setGamePlayId(data.game_play_id);
      setWalletCoins(data.wallet_coins);
      setIsStarted(true);

      toast.success(`Game started! Entry fee: ${data.entry_fee} coins`);
    } catch (err: any) {
      toast.error(err.message || "Unable to start game");
    } finally {
      setIsStarting(false);
    }
  };

  // --- Match Dots API ---
  const tap = async (dotId: string | number) => {
    if (!isStarted || !gamePlayId || isMatching) return;
    if (matchedDotIds.includes(dotId) || selected.includes(dotId)) return;

    const next = [...selected, dotId];
    setSelected(next);

    // Only call match API when 3 dots are selected
    if (next.length === 3) {
      setIsMatching(true);
      try {
        const res = await fetch(`${API_BASE_URL}/games/color-connect/match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game_play_id: gamePlayId,
            user_id: userId,
            dot_ids: next,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || "Match failed");
        }

        // Add the matched dots to the matched list
        setMatchedDotIds(prev => [...prev, ...next]);
        setMatches(data.matches_completed);
        toast.success(`Match! ${data.matches_completed}/${data.matches_required}`);

        // If game is completed, call complete API
        if (data.game_completed) {
          await completeGame();
        }
      } catch (err: any) {
        toast.error(err.message || "Match failed");
      } finally {
        // Clear selection after match attempt (success or fail)
        setTimeout(() => setSelected([]), 300);
        setIsMatching(false);
      }
    }
  };

  // --- Complete Game API ---
  const completeGame = async () => {
    if (!gamePlayId) return;

    setIsCompleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/games/color-connect/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_play_id: gamePlayId,
          user_id: userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to complete game");
      }

      setWalletCoins(data.wallet_coins);
      toast.success(`🎉 You won ${data.reward_coins} coins!`);
      setIsStarted(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to complete game");
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div>
      <Link to="/app/games" className="inline-flex rounded-full glass p-2 mb-4"><ArrowLeft className="h-4 w-4" /></Link>
      <div className="glass-strong rounded-3xl p-6 text-center">
        <h1 className="text-2xl font-bold">Color Connect</h1>
        <p className="text-xs text-muted-foreground mt-1">Tap 3 same-color dots to match. {matchesRequired} matches = {rewardAmount || 200} coins!</p>
        
        <div className="flex justify-around my-5 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Matches</p>
            <p className="font-bold text-xl gradient-text">{matches}/{matchesRequired}</p>
          </div>
          {walletCoins !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Wallet</p>
              <p className="font-bold text-xl gradient-text flex items-center justify-center gap-1">
                <Coins className="h-4 w-4" /> {walletCoins}
              </p>
            </div>
          )}
        </div>

        {!isStarted ? (
          <button 
            onClick={start} 
            disabled={isStarting}
            className="rounded-full bg-gradient-primary px-6 py-3 font-semibold shadow-glow disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {isStarting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Starting...
              </>
            ) : (
              <>
                <Coins className="h-4 w-4" /> Play Game
              </>
            )}
          </button>
        ) : (
          <>
            <div className="grid grid-cols-6 gap-2 max-w-md mx-auto">
              {board.map((dot, i) => {
                const isMatched = matchedDotIds.includes(dot.dot_id);
                const isSelected = selected.includes(dot.dot_id);
                
                return (
                  <motion.button 
                    key={dot.dot_id || i} 
                    disabled={isMatched || isMatching} 
                    onClick={() => tap(dot.dot_id)} 
                    whileTap={{ scale: 0.9 }}
                    className={`aspect-square rounded-xl transition-all ${isSelected ? "ring-2 ring-primary scale-110" : ""} ${isMatched ? "opacity-20" : ""}`}
                    style={{ 
                      background: isMatched ? "transparent" : dot.color, 
                      border: isMatched ? "1px dashed oklch(1 0 0 / 0.1)" : "none" 
                    }} 
                  />
                );
              })}
            </div>
            
            {isCompleting && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Completing game...
              </div>
            )}
            
            {isMatching && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking match...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}