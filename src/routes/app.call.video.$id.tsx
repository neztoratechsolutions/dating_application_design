import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { CREATORS } from "@/lib/mock-data";
import { GiftButton } from "@/components/gift-picker";
import { PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff, FlipHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/app/call/video/$id")({
  component: VideoCall,
  loader: ({ params }) => {
    const c = CREATORS.find((x) => x.id === params.id);
    if (!c) throw notFound();
    return { creator: c };
  },
});

function VideoCall() {
  const { creator } = Route.useLoaderData();
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const spendCoins = useAuth((s) => s.spendCoins);

  useEffect(() => {
    const i = setInterval(() => {
      setSeconds((s) => {
        if (s % 60 === 0 && s > 0 && !spendCoins(creator.videoPrice)) {
          toast.error("Out of coins!");
          navigate({ to: "/app/wallet" });
        }
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [creator.videoPrice, spendCoins, navigate]);

  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toString().padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="absolute inset-0 bg-gradient-accent">
        <img src={creator.avatar} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
      </div>
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start">
        <div className="glass-strong rounded-2xl px-4 py-2">
          <p className="font-semibold text-sm">{creator.name}</p>
          <p className="text-xs gradient-text font-mono">{mins}:{secs}</p>
        </div>
        <div className="glass-strong rounded-full px-3 py-1 text-xs">{creator.videoPrice} coins/min</div>
      </div>

      <div className="absolute top-24 right-4 h-40 w-28 rounded-2xl bg-gradient-primary shadow-glow overflow-hidden flex items-center justify-center">
        {camOff ? <VideoOff className="h-8 w-8" /> : <span className="text-xs text-center px-2">Your camera</span>}
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4">
        <button onClick={() => setMuted(!muted)} className={`rounded-full p-4 ${muted ? "bg-destructive" : "glass-strong"}`}>
          {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <button onClick={() => setCamOff(!camOff)} className={`rounded-full p-4 ${camOff ? "bg-destructive" : "glass-strong"}`}>
          {camOff ? <VideoOff className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
        </button>
        <GiftButton creatorId={creator.id} creatorName={creator.name} className="p-4 glass-strong" />
        <button onClick={() => { toast("Call ended"); navigate({ to: "/app/creator/$id", params: { id: creator.id } }); }}
          className="rounded-full bg-destructive p-5 shadow-glow">
          <PhoneOff className="h-6 w-6" />
        </button>
        <button className="rounded-full glass-strong p-4"><FlipHorizontal className="h-5 w-5" /></button>
      </div>
    </div>
  );
}
