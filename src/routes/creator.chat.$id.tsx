import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { CREATORS } from "@/lib/mock-data";
import { OnlineDot } from "@/components/ui-kit";
import { ArrowLeft, Send, Smile, ImagePlus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/lib/chat-store";

export const Route = createFileRoute("/creator/chat/$id")({
  component: CreatorChatRoom,
  loader: ({ params }) => {
    const c = CREATORS.find((x) => x.id === params.id);
    if (!c) throw notFound();
    return { customer: c };
  },
});

function CreatorChatRoom() {
  const { customer } = Route.useLoaderData();
  const navigate = useNavigate();
  const msgs = useChat((s) => s.threads[customer.id]) ?? useChat.getState().get(customer.id);
  const send = useChat((s) => s.send);
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const handleSend = () => {
    if (!text.trim()) return;
    send(customer.id, { from: "creator", text });
    setText("");
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => send(customer.id, { from: "creator", image: reader.result as string });
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] -mx-4 md:mx-0">
      <div className="glass-strong px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate({ to: "/creator/chat" })}><ArrowLeft className="h-5 w-5" /></button>
        <img src={customer.avatar} className="h-10 w-10 rounded-full object-cover" alt="" />
        <div className="flex-1">
          <p className="font-semibold text-sm">{customer.name}</p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <OnlineDot online={customer.online} /> Customer
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        <AnimatePresence>
          {msgs.map((m) => {
            const mine = m.from === "creator";
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
          placeholder="Reply to your fan…"
          className="flex-1 glass rounded-full px-4 py-2.5 text-sm outline-none" />
        <button onClick={handleSend} className="rounded-full bg-gradient-primary p-2.5 shadow-glow"><Send className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
