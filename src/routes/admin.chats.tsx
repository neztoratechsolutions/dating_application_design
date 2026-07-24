import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CREATORS, STATES } from "@/lib/mock-data";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import {
  Search, MessageSquare, Flag, ShieldAlert, AlertTriangle, Eye,
  Ban, AlertCircle, UserX, Gift, ImageIcon, Filter, Calendar,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/chats")({ component: ChatsPage });

const CUSTOMERS = [
  "Rahul Sharma","Vikram Singh","Amit Patel","Rohan Mehta","Karan Joshi",
  "Arjun Rao","Sahil Kapoor","Dev Iyer","Manish Roy","Yash Bose",
  "Aman Khan","Nikhil Pillai","Aditya Verma","Sameer Gupta","Tushar Jain",
];

type Reason = "Harassment" | "Spam" | "Abuse" | "Fraud" | null;

interface Msg {
  id: number;
  from: "customer" | "creator" | "system";
  text?: string;
  image?: string;
  gift?: { name: string; coins: number };
  time: string;
}

interface Convo {
  id: string;
  customer: { name: string; avatar: string };
  creator: typeof CREATORS[number];
  last: string;
  time: string;
  reports: number;
  flagged: boolean;
  reason: Reason;
  state: string;
  date: string;
  unread: number;
  messages: Msg[];
}

const buildMessages = (i: number, customer: string, creator: string): Msg[] => {
  const base: Msg[] = [
    { id: 1, from: "system", text: "Chat session started", time: "10:00" },
    { id: 2, from: "customer", text: `Hi ${creator}! How are you?`, time: "10:01" },
    { id: 3, from: "creator", text: "Hey! I'm great, thanks 😊", time: "10:01" },
    { id: 4, from: "customer", text: "What are you up to today?", time: "10:02" },
    { id: 5, from: "creator", text: "Just chilling, watching a movie", time: "10:02" },
    { id: 6, from: "customer", image: `https://picsum.photos/seed/c${i}/300/200`, time: "10:03" },
    { id: 7, from: "creator", text: "Wow, nice pic!", time: "10:03" },
    { id: 8, from: "customer", gift: { name: "Rose", coins: 10 }, time: "10:04" },
    { id: 9, from: "creator", text: "Thank you so much for the rose! 🌹", time: "10:04" },
    { id: 10, from: "customer", text: "Can we talk on call later?", time: "10:05" },
    { id: 11, from: "creator", text: "Sure, around 8pm works for me", time: "10:05" },
    { id: 12, from: "system", text: "Customer sent a gift worth ₹50", time: "10:06" },
  ];
  if (i % 4 === 0) base.push({ id: 13, from: "customer", text: "You are amazing!", time: "10:07" });
  return base;
};

const CONVOS: Convo[] = CUSTOMERS.flatMap((cust, i) => {
  const creator = CREATORS[i % CREATORS.length];
  const reports = i % 5 === 0 ? (i % 3) + 1 : 0;
  const flagged = i % 6 === 0;
  const reason: Reason = reports > 0
    ? (["Harassment", "Spam", "Abuse", "Fraud"] as Reason[])[i % 4]
    : null;
  return [{
    id: `CH-${1000 + i}`,
    customer: { name: cust, avatar: `https://i.pravatar.cc/200?u=${encodeURIComponent(cust)}` },
    creator,
    last: ["Sure, around 8pm works", "You are amazing!", "Thanks for the gift 🌹", "Can we voice call?", "Goodnight ✨"][i % 5],
    time: ["2m", "10m", "1h", "3h", "yesterday"][i % 5],
    reports,
    flagged,
    reason,
    state: STATES[i % STATES.length],
    date: `2026-05-${String(28 - (i % 26)).padStart(2, "0")}`,
    unread: i % 3,
    messages: buildMessages(i, cust, creator.name),
  }];
});

const TONE_REASON: Record<string, string> = {
  Harassment: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  Spam: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Abuse: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Fraud: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none ${tone}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="h-5 w-5 opacity-80" />
      </div>
    </GlassCard>
  );
}

function ChatsPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "reported" | "flagged">("all");
  const [state, setState] = useState("all");
  const [date, setDate] = useState("");
  const [selected, setSelected] = useState<Convo | null>(CONVOS[0]);
  const [reportModal, setReportModal] = useState(false);

  const filtered = useMemo(() => CONVOS.filter((c) => {
    if (filter === "reported" && c.reports === 0) return false;
    if (filter === "flagged" && !c.flagged) return false;
    if (state !== "all" && c.state !== state) return false;
    if (date && c.date !== date) return false;
    if (q) {
      const s = q.toLowerCase();
      const inMsg = c.messages.some((m) => m.text?.toLowerCase().includes(s));
      if (!c.customer.name.toLowerCase().includes(s) && !c.creator.name.toLowerCase().includes(s) && !inMsg) return false;
    }
    return true;
  }), [q, filter, state, date]);

  const stats = {
    total: CONVOS.length,
    active: CONVOS.filter((c) => c.time.includes("m") || c.time.includes("h")).length,
    reported: CONVOS.filter((c) => c.reports > 0).length,
    flagged: CONVOS.filter((c) => c.flagged).length,
  };

  const moderate = (action: string) => {
    if (!selected) return;
    toast.success(`${action}: ${selected.customer.name}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Chat Moderation" subtitle="Monitor conversations & enforce policy" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Total Chats" value={stats.total.toLocaleString()} icon={MessageSquare} tone="from-primary/20 to-primary/5" />
        <Kpi label="Active Chats" value={String(stats.active)} icon={MessageSquare} tone="from-emerald-500/20 to-emerald-500/5" />
        <Kpi label="Reported Chats" value={String(stats.reported)} icon={Flag} tone="from-rose-500/20 to-rose-500/5" />
        <Kpi label="Flagged Chats" value={String(stats.flagged)} icon={ShieldAlert} tone="from-amber-500/20 to-amber-500/5" />
      </div>

      {/* Filters */}
      <GlassCard>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages, users…" className="w-full glass rounded-full pl-9 pr-4 py-2 text-sm outline-none" />
          </div>
          <div className="flex rounded-full glass p-1 text-xs">
            {(["all","reported","flagged"] as const).map((k) => (
              <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1 rounded-full capitalize ${filter === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{k}</button>
            ))}
          </div>
          <select value={state} onChange={(e) => setState(e.target.value)} className="glass rounded-full px-3 py-2 text-xs outline-none">
            <option value="all">All States</option>
            {STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="glass rounded-full px-3 py-2 text-xs outline-none" />
        </div>
      </GlassCard>

      {/* Split panel */}
      <div className="grid lg:grid-cols-[360px_1fr] gap-4">
        {/* Conversation list */}
        <GlassCard className="p-0 overflow-hidden max-h-[70vh] flex flex-col">
          <div className="p-3 border-b border-border/40 text-xs text-muted-foreground">{filtered.length} conversations</div>
          <div className="overflow-y-auto flex-1 divide-y divide-border/20">
            {filtered.map((c) => {
              const active = selected?.id === c.id;
              return (
                <button key={c.id} onClick={() => setSelected(c)} className={`w-full text-left p-3 transition flex gap-3 ${active ? "bg-primary/15" : "hover:bg-card/40"}`}>
                  <div className="relative flex-shrink-0">
                    <div className="flex -space-x-3">
                      <img src={c.customer.avatar} className="h-8 w-8 rounded-full ring-2 ring-background object-cover" alt="" />
                      <img src={c.creator.avatar} className="h-8 w-8 rounded-full ring-2 ring-background object-cover" alt="" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold truncate">{c.customer.name} → {c.creator.name}</p>
                      <span className="text-[10px] text-muted-foreground">{c.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.last}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {c.reports > 0 && <span className="text-[10px] rounded-full px-1.5 py-0 bg-rose-500/15 text-rose-400 inline-flex items-center gap-0.5"><Flag className="h-2.5 w-2.5" />{c.reports}</span>}
                      {c.flagged && <span className="text-[10px] rounded-full px-1.5 py-0 bg-amber-500/15 text-amber-400 inline-flex items-center gap-0.5"><ShieldAlert className="h-2.5 w-2.5" />flagged</span>}
                      {c.reason && <span className={`text-[10px] rounded-full px-1.5 py-0 border ${TONE_REASON[c.reason]}`}>{c.reason}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">No conversations</p>}
          </div>
        </GlassCard>

        {/* Chat viewer */}
        <GlassCard className="p-0 overflow-hidden flex flex-col max-h-[70vh]">
          {selected ? (
            <>
              <div className="p-3 border-b border-border/40 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    <img src={selected.customer.avatar} className="h-9 w-9 rounded-full ring-2 ring-background object-cover" alt="" />
                    <img src={selected.creator.avatar} className="h-9 w-9 rounded-full ring-2 ring-background object-cover" alt="" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{selected.customer.name} ↔ {selected.creator.name}</p>
                    <p className="text-[10px] text-muted-foreground">{selected.id} · {selected.state} · {selected.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => moderate("Viewed profile")} className="rounded-full glass px-2.5 py-1 text-[10px] inline-flex items-center gap-1"><Eye className="h-3 w-3" />View User</button>
                  <button onClick={() => moderate("Warned")} className="rounded-full bg-amber-500/15 text-amber-400 px-2.5 py-1 text-[10px] inline-flex items-center gap-1"><AlertCircle className="h-3 w-3" />Warn</button>
                  <button onClick={() => moderate("Suspended")} className="rounded-full bg-orange-500/15 text-orange-400 px-2.5 py-1 text-[10px] inline-flex items-center gap-1"><UserX className="h-3 w-3" />Suspend</button>
                  <button onClick={() => moderate("Banned")} className="rounded-full bg-rose-500/15 text-rose-400 px-2.5 py-1 text-[10px] inline-flex items-center gap-1"><Ban className="h-3 w-3" />Ban</button>
                  <button onClick={() => setReportModal(true)} className="rounded-full glass px-2.5 py-1 text-[10px] inline-flex items-center gap-1"><Flag className="h-3 w-3" />Report</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-card/20">
                {selected.messages.map((m) => {
                  if (m.from === "system") {
                    return (
                      <div key={m.id} className="text-center">
                        <span className="inline-block text-[10px] text-muted-foreground bg-card/60 rounded-full px-3 py-1">{m.text}</span>
                      </div>
                    );
                  }
                  const mine = m.from === "customer";
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"} gap-2`}>
                      {mine && <img src={selected.customer.avatar} className="h-7 w-7 rounded-full object-cover" alt="" />}
                      <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-card" : "bg-primary text-primary-foreground"}`}>
                        {m.text && <p>{m.text}</p>}
                        {m.image && (
                          <div className="mt-1">
                            <img src={m.image} className="rounded-lg max-h-40 object-cover" alt="" />
                            <p className="text-[10px] opacity-70 mt-1 inline-flex items-center gap-1"><ImageIcon className="h-2.5 w-2.5" /> Image</p>
                          </div>
                        )}
                        {m.gift && (
                          <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5 text-xs">
                            <Gift className="h-3 w-3" /> {m.gift.name} · {m.gift.coins} coins
                          </div>
                        )}
                        <p className="text-[10px] opacity-60 mt-1 text-right">{m.time}</p>
                      </div>
                      {!mine && <img src={selected.creator.avatar} className="h-7 w-7 rounded-full object-cover" alt="" />}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Select a conversation</div>
          )}
        </GlassCard>
      </div>

      {/* Report modal */}
      {reportModal && selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReportModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="glass rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-semibold mb-1">File a report</h3>
            <p className="text-xs text-muted-foreground mb-4">Categorize the issue on chat {selected.id}</p>
            <div className="grid grid-cols-2 gap-2">
              {(["Harassment","Spam","Abuse","Fraud"] as const).map((r) => (
                <button key={r} onClick={() => { toast.success(`Reported as ${r}`); setReportModal(false); }} className={`rounded-xl border p-3 text-left text-sm ${TONE_REASON[r]}`}>
                  <AlertTriangle className="h-4 w-4 mb-1" />
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
