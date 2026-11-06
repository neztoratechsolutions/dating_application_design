// import { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Gift as GiftIcon, X, Coins } from "lucide-react";
// import { GIFTS, useGifts, type Gift } from "@/lib/gift-store";
// import { useAuth } from "@/lib/auth-store";
// import { toast } from "sonner";
// import { cn } from "@/lib/utils";

// type Tier = "starter" | "popular" | "premium";

// export function GiftButton({
//   creatorId,
//   creatorName,
//   onSent,
//   className,
//   label = "Gift",
// }: {
//   creatorId: string;
//   creatorName: string;
//   onSent?: (g: Gift) => void;
//   className?: string;
//   label?: string;
// }) {
//   const [open, setOpen] = useState(false);
//   const [tier, setTier] = useState<Tier>("starter");
//   const [flying, setFlying] = useState<Gift | null>(null);
//   const spend = useAuth((s) => s.spendCoins);
//   const send = useGifts((s) => s.send);

//   const handleSend = (g: Gift) => {
//     if (!spend(g.price)) return toast.error("Not enough coins!");
//     send({ giftId: g.id, creatorId, creatorName, price: g.price });
//     setFlying(g);
//     setTimeout(() => setFlying(null), 1600);
//     toast.success(`Sent ${g.name} ${g.emoji}`);
//     setOpen(false);
//     onSent?.(g);
//   };

//   const filtered = GIFTS.filter((g) => g.tier === tier);

//   return (
//     <>
//       <button
//         onClick={() => setOpen(true)}
//         className={cn("rounded-full glass p-2 hover:bg-glass", className)}
//         aria-label="Send gift"
//       >
//         <GiftIcon className="h-4 w-4 text-primary" />
//         {label && <span className="sr-only">{label}</span>}
//       </button>

//       <AnimatePresence>
//         {flying && (
//           <motion.div
//             initial={{ y: 100, opacity: 0, scale: 0.5 }}
//             animate={{ y: -200, opacity: [0, 1, 1, 0], scale: [0.5, 1.4, 1.2, 0.8] }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 1.5 }}
//             className="fixed left-1/2 bottom-32 -translate-x-1/2 z-[60] text-7xl pointer-events-none"
//           >
//             {flying.emoji}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {open && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={() => setOpen(false)}
//             className="fixed inset-0 z-[55] bg-background/80 backdrop-blur-sm flex items-end md:items-center justify-center"
//           >
//             <motion.div
//               initial={{ y: 400 }}
//               animate={{ y: 0 }}
//               exit={{ y: 400 }}
//               transition={{ type: "spring", damping: 28 }}
//               onClick={(e) => e.stopPropagation()}
//               className="glass-strong rounded-t-3xl md:rounded-3xl w-full md:max-w-lg p-5 max-h-[85vh] overflow-y-auto"
//             >
//               <div className="flex items-center justify-between mb-4">
//                 <div>
//                   <h3 className="font-bold text-lg">Send a Gift</h3>
//                   <p className="text-xs text-muted-foreground">to {creatorName}</p>
//                 </div>
//                 <button onClick={() => setOpen(false)} className="rounded-full glass p-2">
//                   <X className="h-4 w-4" />
//                 </button>
//               </div>

//               <div className="flex gap-1 glass rounded-full p-1 mb-4">
//                 {(["starter", "popular", "premium"] as Tier[]).map((t) => (
//                   <button
//                     key={t}
//                     onClick={() => setTier(t)}
//                     className={cn(
//                       "flex-1 rounded-full py-2 text-xs font-semibold capitalize transition",
//                       tier === t ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground",
//                     )}
//                   >
//                     {t}
//                   </button>
//                 ))}
//               </div>

//               <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
//                 {filtered.map((g) => (
//                   <motion.button
//                     key={g.id}
//                     whileHover={{ scale: 1.05, y: -2 }}
//                     whileTap={{ scale: 0.95 }}
//                     onClick={() => handleSend(g)}
//                     className="glass rounded-2xl p-3 text-center hover:shadow-glow transition"
//                   >
//                     <div className="text-4xl mb-1">{g.emoji}</div>
//                     <p className="text-[11px] font-semibold truncate">{g.name}</p>
//                     <p className="text-[10px] text-amber-400 flex items-center justify-center gap-0.5">
//                       <Coins className="h-2.5 w-2.5" />{g.price}
//                     </p>
//                   </motion.button>
//                 ))}
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </>
//   );
// }
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift as GiftIcon, X, Coins } from "lucide-react";
import { Gift, useGifts } from "@/lib/gift-store";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ApiGift {
  id: number;
  catalog_name: string;
  icon: string;
  coins: number;
}

interface GiftButtonProps {
  creatorId: string;
  creatorName: string;
  onSent?: (gift: Gift) => void;
  className?: string;
  label?: string;
}

const BASE_URL = import.meta.env.VITE_BASE_URL || "";

const GIFTS_API = `${BASE_URL}/gifts/`;
const GIFT_DETAILS_API = `${BASE_URL}/gift-details/`;

export function GiftButton({
  creatorId,
  creatorName,
  onSent,
  className,
  label = "Gift",
}: GiftButtonProps) {
  const [open, setOpen] = useState(false);

  const [gifts, setGifts] = useState<ApiGift[]>([]);

  const [loading, setLoading] = useState(false);

  const [sendingGiftId, setSendingGiftId] = useState<number | null>(null);

  const [flying, setFlying] = useState<Gift | null>(null);

  const user = useAuth((state) => state.user);

  const send = useGifts((state) => state.send);

  const customerId = Number(user?.user_id || user?.id);

  // --------------------------------------------------
  // GET ALL GIFTS
  // --------------------------------------------------

  const fetchGifts = async () => {
    setLoading(true);

    try {
      const response = await fetch(GIFTS_API);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to fetch gifts"
        );
      }

      // Backend response is directly an array:
      // [
      //   { id, catalog_name, icon, coins }
      // ]

      if (!Array.isArray(data)) {
        throw new Error("Invalid gifts response");
      }

      setGifts(data);

    } catch (error) {
      console.error("Fetch gifts error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load gifts"
      );

    } finally {
      setLoading(false);
    }
  };

  // Fetch gifts whenever the popup opens

  useEffect(() => {
    if (open) {
      fetchGifts();
    }
  }, [open]);

  // --------------------------------------------------
  // SEND GIFT
  // --------------------------------------------------

  const handleSend = async (gift: ApiGift) => {
    if (sendingGiftId !== null) return;

    if (!customerId) {
      toast.error("Please login first");
      return;
    }

    if (customerId === Number(creatorId)) {
      toast.error("You cannot send a gift to yourself");
      return;
    }

    setSendingGiftId(gift.id);

    try {
      const response = await fetch(GIFT_DETAILS_API, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          user_id: Number(creatorId),
          sender_id: customerId,
          gift_id: gift.id,
          earnings: gift.coins,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to send gift"
        );
      }

      // Gift API successfully processed the transaction.
      // Backend handles wallet deduction.

      const selectedGift = {
        id: String(gift.id),
        name: gift.catalog_name,
        emoji: gift.icon,
        price: gift.coins,
      } as Gift;

      // Save gift activity in frontend store

      send({
        giftId: String(gift.id),
        creatorId,
        creatorName,
        price: gift.coins,
      });

      // Flying gift animation

      setFlying(selectedGift);

      window.setTimeout(() => {
        setFlying(null);
      }, 1600);

      toast.success(
        `Sent ${gift.catalog_name} ${gift.icon}`
      );

      setOpen(false);

      onSent?.(selectedGift);

    } catch (error) {
      console.error("Send gift error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send gift"
      );

    } finally {
      setSendingGiftId(null);
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <>
      {/* Gift Button */}

      <button
        onClick={() => setOpen(true)}
        className={cn(
          "rounded-full glass p-2 hover:bg-glass",
          className
        )}
        aria-label="Send gift"
      >
        <GiftIcon className="h-4 w-4 text-primary" />

        {label && (
          <span className="sr-only">{label}</span>
        )}
      </button>

      {/* Flying Gift Animation */}

      <AnimatePresence>
        {flying && (
          <motion.div
            initial={{
              y: 100,
              opacity: 0,
              scale: 0.5,
            }}
            animate={{
              y: -200,
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.4, 1.2, 0.8],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="fixed left-1/2 bottom-32 -translate-x-1/2 z-[60] text-7xl pointer-events-none"
          >
            {flying.emoji}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gift Popup */}

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
              transition={{
                type: "spring",
                damping: 28,
              }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-t-3xl md:rounded-3xl w-full md:max-w-lg p-5 max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}

              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-lg">
                    Send a Gift
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    to {creatorName}
                  </p>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full glass p-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Loading */}

              {loading && (
                <div className="py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    Loading gifts...
                  </p>
                </div>
              )}

              {/* All Gifts */}

              {!loading && gifts.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {gifts.map((gift) => {
                    const sending =
                      sendingGiftId === gift.id;

                    return (
                      <motion.button
                        key={gift.id}
                        whileHover={{
                          scale: 1.05,
                          y: -2,
                        }}
                        whileTap={{
                          scale: 0.95,
                        }}
                        disabled={sendingGiftId !== null}
                        onClick={() => handleSend(gift)}
                        className="glass rounded-2xl p-3 text-center hover:shadow-glow transition disabled:opacity-50"
                      >
                        {/* Gift Icon */}

                        <div className="text-4xl mb-2">
                          {gift.icon}
                        </div>

                        {/* Gift Name */}

                        <p className="text-[11px] font-semibold truncate">
                          {gift.catalog_name}
                        </p>

                        {/* Gift Coins */}

                        <p className="text-[10px] text-amber-400 flex items-center justify-center gap-0.5 mt-1">
                          <Coins className="h-2.5 w-2.5" />

                          {sending
                            ? "Sending..."
                            : gift.coins}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Empty */}

              {!loading && gifts.length === 0 && (
                <div className="py-10 text-center">
                  <GiftIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />

                  <p className="text-sm text-muted-foreground">
                    No gifts available
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
