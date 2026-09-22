import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-store";
import { PageHeader } from "@/components/ui-kit";
import { Coins, Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/app/wallet/buy")({ component: BuyCoins });

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

type CoinPack = {
  id: number;
  coins: number;
  bonus: number;
  mrp: number;
  is_active: boolean;
  display_order: number;
};

function BuyCoins() {
  const [coinPacks, setCoinPacks] = useState<CoinPack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const addCoins = useAuth((s) => s.addCoins);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/quick-packs/`);
        if (response.ok) {
          const data = await response.json();
          setCoinPacks(data);
          // Auto-select the first pack by default
          if (data.length > 0) {
            setSelectedId(data[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch coin packs:", error);
        toast.error("Failed to load coin packs.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPacks();
  }, []);

  // Find the selected pack object from the array
  const selectedPack = coinPacks.find((p) => p.id === selectedId);

  const handlePay = () => {
    if (!selectedPack) return;
    
    addCoins(selectedPack.coins + selectedPack.bonus);
    toast.success(`${(selectedPack.coins + selectedPack.bonus).toLocaleString()} coins added 🎉`);
    navigate({ to: "/app/wallet" });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Buy Coins" subtitle="Choose a pack" />
      
      {coinPacks.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          No coin packs available right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {coinPacks.map((p) => (
            <button 
              key={p.id} 
              onClick={() => setSelectedId(p.id)}
              className={`glass rounded-2xl p-4 text-left relative transition ${selectedId === p.id ? "ring-2 ring-primary shadow-glow" : ""}`}
            >
              {/* Using display_order to replicate "Most popular" tag */}
              {p.display_order === 1 && (
                <span className="absolute -top-2 right-3 rounded-full bg-gradient-primary px-2 py-0.5 text-[10px]">
                  Most popular
                </span>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Coins className="h-8 w-8 text-amber-400" />
                  <div>
                    <p className="font-bold">{p.coins.toLocaleString()} coins</p>
                    {p.bonus > 0 && <p className="text-xs text-success">+{p.bonus} bonus</p>}
                  </div>
                </div>
                <p className="font-bold gradient-text">₹{p.mrp}</p>
              </div>
              
              {selectedId === p.id && (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }}
                  className="absolute top-3 left-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="h-3 w-3" />
                </motion.div>
              )}
            </button>
          ))}
        </div>
      )}

      <h3 className="font-semibold mb-3">Pay via</h3>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {["UPI", "Cards", "Net Banking", "Wallets"].map((m) => (
          <button key={m} className="glass rounded-xl py-3 text-sm font-medium">{m}</button>
        ))}
      </div>

      <button 
        onClick={handlePay} 
        disabled={!selectedPack}
        className="w-full rounded-xl bg-gradient-primary py-3.5 font-semibold shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selectedPack ? `Pay ₹${selectedPack.mrp}` : "Select a pack"}
      </button>
      <p className="text-center text-[10px] text-muted-foreground mt-2">Demo purchase — no real payment processed</p>
    </div>
  );
}