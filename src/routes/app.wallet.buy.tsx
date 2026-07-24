import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { COIN_PACKS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-store";
import { PageHeader } from "@/components/ui-kit";
import { Coins, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/app/wallet/buy")({ component: BuyCoins });

function BuyCoins() {
  const [selected, setSelected] = useState(1);
  const addCoins = useAuth((s) => s.addCoins);
  const navigate = useNavigate();
  const pack = COIN_PACKS[selected];

  return (
    <div>
      <PageHeader title="Buy Coins" subtitle="Choose a pack" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {COIN_PACKS.map((p, i) => (
          <button key={p.coins} onClick={() => setSelected(i)}
            className={`glass rounded-2xl p-4 text-left relative transition ${selected === i ? "ring-2 ring-primary shadow-glow" : ""}`}>
            {p.popular && <span className="absolute -top-2 right-3 rounded-full bg-gradient-primary px-2 py-0.5 text-[10px]">Most popular</span>}
            {p.best && <span className="absolute -top-2 right-3 rounded-full bg-gradient-coin text-amber-950 px-2 py-0.5 text-[10px]">Best value</span>}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Coins className="h-8 w-8 text-amber-400" />
                <div>
                  <p className="font-bold">{p.coins.toLocaleString()} coins</p>
                  {p.bonus > 0 && <p className="text-xs text-success">+{p.bonus} bonus</p>}
                </div>
              </div>
              <p className="font-bold gradient-text">₹{p.price}</p>
            </div>
            {selected === i && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute top-3 left-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-3 w-3" />
              </motion.div>
            )}
          </button>
        ))}
      </div>

      <h3 className="font-semibold mb-3">Pay via</h3>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {["UPI", "Cards", "Net Banking", "Wallets"].map((m) => (
          <button key={m} className="glass rounded-xl py-3 text-sm font-medium">{m}</button>
        ))}
      </div>

      <button onClick={() => {
        addCoins(pack.coins + pack.bonus);
        toast.success(`${(pack.coins + pack.bonus).toLocaleString()} coins added 🎉`);
        navigate({ to: "/app/wallet" });
      }} className="w-full rounded-xl bg-gradient-primary py-3.5 font-semibold shadow-glow">
        Pay ₹{pack.price}
      </button>
      <p className="text-center text-[10px] text-muted-foreground mt-2">Demo purchase — no real payment processed</p>
    </div>
  );
}
