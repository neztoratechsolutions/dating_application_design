import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift as GiftIcon, X, Coins } from "lucide-react";
import { GIFTS, useGifts, type Gift } from "@/lib/gift-store";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Tier = "starter" | "popular" | "premium";

export function GiftButton({
  creatorId,
  creatorName,
  onSent,
  className,
  label = "Gift",
}: {
  creatorId: string;
  creatorName: string;
  onSent?: (g: Gift) => void;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState<Tier>("starter");
  const [flying, setFlying] = useState<Gift | null>(null);
  const spend = useAuth((s) => s.spendCoins);
  const send = useGifts((s) => s.send);

  const handleSend = (g: Gift) => {
    if (!spend(g.price)) return toast.error("Not enough coins!");
    send({ giftId: g.id, creatorId, creatorName, price: g.price });
    setFlying(g);
    setTimeout(() => setFlying(null), 1600);
    toast.success(`Sent ${g.name} ${g.emoji}`);
    setOpen(false);
    onSent?.(g);
  };

  const filtered = GIFTS.filter((g) => g.tier === tier);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn("rounded-full glass p-2 hover:bg-glass", className)}
        aria-label="Send gift"
      >
        <GiftIcon className="h-4 w-4 text-primary" />
        {label && <span className="sr-only">{label}</span>}
      </button>

      <AnimatePresence>
        {flying && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.5 }}
            animate={{ y: -200, opacity: [0, 1, 1, 0], scale: [0.5, 1.4, 1.2, 0.8] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="fixed left-1/2 bottom-32 -translate-x-1/2 z-[60] text-7xl pointer-events-none"
          >
            {flying.emoji}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[55] bg-background/80 backdrop-blur-sm flex items-end md:items-center justify-center"
          >
            <motion.div
              initial={{ y: 400 }}
              animate={{ y: 0 }}
              exit={{ y: 400 }}
              transition={{ type: "spring", damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-t-3xl md:rounded-3xl w-full md:max-w-lg p-5 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">Send a Gift</h3>
                  <p className="text-xs text-muted-foreground">to {creatorName}</p>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-full glass p-2">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex gap-1 glass rounded-full p-1 mb-4">
                {(["starter", "popular", "premium"] as Tier[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTier(t)}
                    className={cn(
                      "flex-1 rounded-full py-2 text-xs font-semibold capitalize transition",
                      tier === t ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {filtered.map((g) => (
                  <motion.button
                    key={g.id}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSend(g)}
                    className="glass rounded-2xl p-3 text-center hover:shadow-glow transition"
                  >
                    <div className="text-4xl mb-1">{g.emoji}</div>
                    <p className="text-[11px] font-semibold truncate">{g.name}</p>
                    <p className="text-[10px] text-amber-400 flex items-center justify-center gap-0.5">
                      <Coins className="h-2.5 w-2.5" />{g.price}
                    </p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
