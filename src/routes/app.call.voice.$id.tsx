import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { CREATORS } from "@/lib/mock-data";
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from "lucide-react";
import { GiftButton } from "@/components/gift-picker";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/app/call/voice/$id")({
  component: VoiceCall,
  loader: ({ params }) => {
    const c = CREATORS.find((x) => x.id === params.id);
    if (!c) throw notFound();
    return { creator: c };
  },
});

function VoiceCall() {
  const { creator } = Route.useLoaderData();
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const spendCoins = useAuth((s) => s.spendCoins);
  const user = useAuth((s) => s.user);

  useEffect(() => {
    const i = setInterval(() => {
      setSeconds((s) => {
        if (s % 60 === 0 && s > 0) {
          if (!spendCoins(creator.voicePrice)) {
            toast.error("Out of coins!");
            navigate({ to: "/app/wallet" });
          }
        }
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [creator.voicePrice, spendCoins, navigate]);

  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toString().padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-gradient-bg">
      <div className="text-center mt-12">
        <p className="text-xs text-muted-foreground mb-2">Voice call · {creator.voicePrice} coins/min</p>
        <motion.img animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}
          src={creator.avatar} className="h-40 w-40 rounded-full mx-auto ring-4 ring-primary shadow-glow" alt="" />
        <h2 className="text-2xl font-bold mt-5">{creator.name}</h2>
        <p className="text-sm text-success mt-1">● Connected</p>
        <p className="text-4xl font-bold gradient-text mt-4">{mins}:{secs}</p>
        <p className="text-xs text-muted-foreground mt-2">Balance: {user?.coins ?? 0} coins</p>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => setMuted(!muted)} className={`rounded-full p-4 ${muted ? "bg-destructive" : "glass"}`}>
          {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <GiftButton creatorId={creator.id} creatorName={creator.name} className="p-4" />
        <button onClick={() => { toast("Call ended"); navigate({ to: "/app/creator/$id", params: { id: creator.id } }); }}
          className="rounded-full bg-destructive p-5 shadow-glow">
          <PhoneOff className="h-6 w-6" />
        </button>
        <button className="rounded-full glass p-4"><Volume2 className="h-5 w-5" /></button>
      </div>
    </div>
  );
}
