import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CREATORS } from "@/lib/mock-data";
import { GiftButton } from "@/components/gift-picker";
import {
  PhoneOff,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  FlipHorizontal,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/app/call/video/$id")({
  component: VideoCall,
  // Tolerant loader: the id coming from the URL is a string
  // (e.g. "1"), while mock/real creators may use a numeric id
  // or not be present in the mock at all. Compare as strings,
  // and never throw notFound() — the page can still render
  // with a fallback display name using the id from the URL.
  loader: ({ params }) => {
    const creator = CREATORS.find(
      (x) => String(x.id) === String(params.id)
    );
    return { creator: creator ?? null, id: params.id };
  },
});

function VideoCall() {
  const { creator, id } = Route.useLoaderData();
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const spendCoins = useAuth((s) => s.spendCoins);

  const videoPrice = creator?.videoPrice ?? 0;
  const name = creator?.name ?? `Creator #${id}`;
  const avatar = creator?.avatar ?? "";
  const creatorId = creator?.id ?? id;

  useEffect(() => {
    if (!videoPrice) return;
    const i = setInterval(() => {
      setSeconds((s) => {
        if (s % 60 === 0 && s > 0 && !spendCoins(videoPrice)) {
          toast.error("Out of coins!");
          navigate({ to: "/app/wallet" });
        }
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [videoPrice, spendCoins, navigate]);

  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toString().padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="absolute inset-0 bg-gradient-accent">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
        ) : null}
      </div>
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start">
        <div className="glass-strong rounded-2xl px-4 py-2">
          <p className="font-semibold text-sm">{name}</p>
          <p className="text-xs gradient-text font-mono">
            {mins}:{secs}
          </p>
        </div>
        <div className="glass-strong rounded-full px-3 py-1 text-xs">
          {videoPrice} coins/min
        </div>
      </div>

      <div className="absolute top-24 right-4 h-40 w-28 rounded-2xl bg-gradient-primary shadow-glow overflow-hidden flex items-center justify-center">
        {camOff ? (
          <VideoOff className="h-8 w-8" />
        ) : (
          <span className="text-xs text-center px-2">Your camera</span>
        )}
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4">
        <button
          onClick={() => setMuted(!muted)}
          className={`rounded-full p-4 ${
            muted ? "bg-destructive" : "glass-strong"
          }`}
        >
          {muted ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </button>
        <button
          onClick={() => setCamOff(!camOff)}
          className={`rounded-full p-4 ${
            camOff ? "bg-destructive" : "glass-strong"
          }`}
        >
          {camOff ? (
            <VideoOff className="h-5 w-5" />
          ) : (
            <VideoIcon className="h-5 w-5" />
          )}
        </button>
        <GiftButton
          creatorId={String(creatorId)}
          creatorName={name}
          className="p-4 glass-strong"
        />
        <button
          onClick={() => {
            toast("Call ended");
            navigate({
              to: "/app/creator/$id",
              params: { id: String(creatorId) },
            });
          }}
          className="rounded-full bg-destructive p-5 shadow-glow"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
        <button className="rounded-full glass-strong p-4">
          <FlipHorizontal className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
