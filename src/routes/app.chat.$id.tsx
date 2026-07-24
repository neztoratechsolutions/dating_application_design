import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { CREATORS } from "@/lib/mock-data";
import { OnlineDot } from "@/components/ui-kit";
import { ArrowLeft, Send, Phone, Video, Smile, Coins, ImagePlus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-store";
import { useChat } from "@/lib/chat-store";
import { GiftButton } from "@/components/gift-picker";
import { toast } from "sonner";

export const Route = createFileRoute("/app/chat/$id")({
  component: ChatRoom,
  loader: ({ params }) => {
    const c = CREATORS.find((x) => x.id === params.id);
    if (!c) throw notFound();
    return { creator: c };
  },
});

function ChatRoom() {
  const { creator } = Route.useLoaderData();
  const navigate = useNavigate();
  const spendCoins = useAuth((s) => s.spendCoins);
  const msgs = useChat((s) => s.threads[creator.id]) ?? useChat.getState().get(creator.id);
  const send = useChat((s) => s.send);
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const handleSend = () => {
    if (!text.trim()) return;
    if (!spendCoins(creator.chatPrice)) return toast.error("Not enough coins!");
    send(creator.id, { from: "customer", text });
    setText("");
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!spendCoins(creator.chatPrice * 2)) return toast.error("Not enough coins for image!");
    const reader = new FileReader();
    reader.onload = () => send(creator.id, { from: "customer", image: reader.result as string });
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] -mx-4 md:mx-0">
      <div className="glass-strong px-4 py-3 flex items-center gap-3 sticky top-16 z-30">
        <button onClick={() => navigate({ to: "/app/chat" })}><ArrowLeft className="h-5 w-5" /></button>
        <img src={creator.avatar} className="h-10 w-10 rounded-full object-cover" alt="" />
        <div className="flex-1">
          <p className="font-semibold text-sm">{creator.name}</p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <OnlineDot online={creator.online} /> {creator.online ? "Online" : "Offline"}
          </p>
        </div>
        <GiftButton creatorId={creator.id} creatorName={creator.name} />
        <Link to="/app/call/voice/$id" params={{ id: creator.id }} className="rounded-full glass p-2"><Phone className="h-4 w-4" /></Link>
        <Link to="/app/call/video/$id" params={{ id: creator.id }} className="rounded-full glass p-2"><Video className="h-4 w-4" /></Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        <AnimatePresence>
          {msgs.map((m) => {
            const mine = m.from === "customer";
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-gradient-primary shadow-glow" : "glass"}`}>
                  {m.image && <img src={m.image} alt="" className="rounded-xl mb-1 max-h-60 object-cover" />}
                  {m.text && <p>{m.text}</p>}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      <div className="glass-strong p-3 flex items-center gap-2 sticky bottom-0">
        <button className="rounded-full p-2 hover:bg-glass"><Smile className="h-5 w-5 text-muted-foreground" /></button>
        <button onClick={() => fileRef.current?.click()} className="rounded-full p-2 hover:bg-glass">
          <ImagePlus className="h-5 w-5 text-muted-foreground" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage} />
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={`Message · ${creator.chatPrice} coins/msg`}
          className="flex-1 glass rounded-full px-4 py-2.5 text-sm outline-none" />
        <button onClick={handleSend} className="rounded-full bg-gradient-primary p-2.5 shadow-glow"><Send className="h-4 w-4" /></button>
      </div>
      <p className="text-center text-[10px] text-muted-foreground py-1 flex items-center justify-center gap-1">
        <Coins className="h-3 w-3" /> {creator.chatPrice} coins/msg · {creator.chatPrice * 2} coins/image
      </p>
    </div>
  );
}
