// import { createFileRoute } from "@tanstack/react-router";
// import { useMemo, useState } from "react";
// import { CREATORS, STATES } from "@/lib/mock-data";
// import { GlassCard, PageHeader } from "@/components/ui-kit";
// import {
//   Search, MessageSquare, Flag, ShieldAlert, AlertTriangle, Eye,
//   Ban, AlertCircle, UserX, Gift, ImageIcon, Filter, Calendar,
// } from "lucide-react";
// import { toast } from "sonner";

// export const Route = createFileRoute("/admin/chats")({ component: ChatsPage });

// const CUSTOMERS = [
//   "Rahul Sharma","Vikram Singh","Amit Patel","Rohan Mehta","Karan Joshi",
//   "Arjun Rao","Sahil Kapoor","Dev Iyer","Manish Roy","Yash Bose",
//   "Aman Khan","Nikhil Pillai","Aditya Verma","Sameer Gupta","Tushar Jain",
// ];

// type Reason = "Harassment" | "Spam" | "Abuse" | "Fraud" | null;

// interface Msg {
//   id: number;
//   from: "customer" | "creator" | "system";
//   text?: string;
//   image?: string;
//   gift?: { name: string; coins: number };
//   time: string;
// }

// interface Convo {
//   id: string;
//   customer: { name: string; avatar: string };
//   creator: typeof CREATORS[number];
//   last: string;
//   time: string;
//   reports: number;
//   flagged: boolean;
//   reason: Reason;
//   state: string;
//   date: string;
//   unread: number;
//   messages: Msg[];
// }

// const buildMessages = (i: number, customer: string, creator: string): Msg[] => {
//   const base: Msg[] = [
//     { id: 1, from: "system", text: "Chat session started", time: "10:00" },
//     { id: 2, from: "customer", text: `Hi ${creator}! How are you?`, time: "10:01" },
//     { id: 3, from: "creator", text: "Hey! I'm great, thanks 😊", time: "10:01" },
//     { id: 4, from: "customer", text: "What are you up to today?", time: "10:02" },
//     { id: 5, from: "creator", text: "Just chilling, watching a movie", time: "10:02" },
//     { id: 6, from: "customer", image: `https://picsum.photos/seed/c${i}/300/200`, time: "10:03" },
//     { id: 7, from: "creator", text: "Wow, nice pic!", time: "10:03" },
//     { id: 8, from: "customer", gift: { name: "Rose", coins: 10 }, time: "10:04" },
//     { id: 9, from: "creator", text: "Thank you so much for the rose! 🌹", time: "10:04" },
//     { id: 10, from: "customer", text: "Can we talk on call later?", time: "10:05" },
//     { id: 11, from: "creator", text: "Sure, around 8pm works for me", time: "10:05" },
//     { id: 12, from: "system", text: "Customer sent a gift worth ₹50", time: "10:06" },
//   ];
//   if (i % 4 === 0) base.push({ id: 13, from: "customer", text: "You are amazing!", time: "10:07" });
//   return base;
// };

// const CONVOS: Convo[] = CUSTOMERS.flatMap((cust, i) => {
//   const creator = CREATORS[i % CREATORS.length];
//   const reports = i % 5 === 0 ? (i % 3) + 1 : 0;
//   const flagged = i % 6 === 0;
//   const reason: Reason = reports > 0
//     ? (["Harassment", "Spam", "Abuse", "Fraud"] as Reason[])[i % 4]
//     : null;
//   return [{
//     id: `CH-${1000 + i}`,
//     customer: { name: cust, avatar: `https://i.pravatar.cc/200?u=${encodeURIComponent(cust)}` },
//     creator,
//     last: ["Sure, around 8pm works", "You are amazing!", "Thanks for the gift 🌹", "Can we voice call?", "Goodnight ✨"][i % 5],
//     time: ["2m", "10m", "1h", "3h", "yesterday"][i % 5],
//     reports,
//     flagged,
//     reason,
//     state: STATES[i % STATES.length],
//     date: `2026-05-${String(28 - (i % 26)).padStart(2, "0")}`,
//     unread: i % 3,
//     messages: buildMessages(i, cust, creator.name),
//   }];
// });

// const TONE_REASON: Record<string, string> = {
//   Harassment: "bg-rose-500/15 text-rose-400 border-rose-500/30",
//   Spam: "bg-amber-500/15 text-amber-400 border-amber-500/30",
//   Abuse: "bg-orange-500/15 text-orange-400 border-orange-500/30",
//   Fraud: "bg-purple-500/15 text-purple-400 border-purple-500/30",
// };

// function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) {
//   return (
//     <GlassCard className="relative overflow-hidden">
//       <div className={`absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none ${tone}`} />
//       <div className="relative flex items-start justify-between">
//         <div>
//           <p className="text-xs text-muted-foreground">{label}</p>
//           <p className="text-xl font-bold mt-1">{value}</p>
//         </div>
//         <Icon className="h-5 w-5 opacity-80" />
//       </div>
//     </GlassCard>
//   );
// }

// function ChatsPage() {
//   const [q, setQ] = useState("");
//   const [filter, setFilter] = useState<"all" | "reported" | "flagged">("all");
//   const [state, setState] = useState("all");
//   const [date, setDate] = useState("");
//   const [selected, setSelected] = useState<Convo | null>(CONVOS[0]);
//   const [reportModal, setReportModal] = useState(false);

//   const filtered = useMemo(() => CONVOS.filter((c) => {
//     if (filter === "reported" && c.reports === 0) return false;
//     if (filter === "flagged" && !c.flagged) return false;
//     if (state !== "all" && c.state !== state) return false;
//     if (date && c.date !== date) return false;
//     if (q) {
//       const s = q.toLowerCase();
//       const inMsg = c.messages.some((m) => m.text?.toLowerCase().includes(s));
//       if (!c.customer.name.toLowerCase().includes(s) && !c.creator.name.toLowerCase().includes(s) && !inMsg) return false;
//     }
//     return true;
//   }), [q, filter, state, date]);

//   const stats = {
//     total: CONVOS.length,
//     active: CONVOS.filter((c) => c.time.includes("m") || c.time.includes("h")).length,
//     reported: CONVOS.filter((c) => c.reports > 0).length,
//     flagged: CONVOS.filter((c) => c.flagged).length,
//   };

//   const moderate = (action: string) => {
//     if (!selected) return;
//     toast.success(`${action}: ${selected.customer.name}`);
//   };

//   return (
//     <div className="space-y-6">
//       <PageHeader title="Chat Moderation" subtitle="Monitor conversations & enforce policy" />

//       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//         <Kpi label="Total Chats" value={stats.total.toLocaleString()} icon={MessageSquare} tone="from-primary/20 to-primary/5" />
//         <Kpi label="Active Chats" value={String(stats.active)} icon={MessageSquare} tone="from-emerald-500/20 to-emerald-500/5" />
//         <Kpi label="Reported Chats" value={String(stats.reported)} icon={Flag} tone="from-rose-500/20 to-rose-500/5" />
//         <Kpi label="Flagged Chats" value={String(stats.flagged)} icon={ShieldAlert} tone="from-amber-500/20 to-amber-500/5" />
//       </div>

//       {/* Filters */}
//       <GlassCard>
//         <div className="flex flex-wrap items-center gap-2">
//           <div className="relative flex-1 min-w-[220px]">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//             <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages, users…" className="w-full glass rounded-full pl-9 pr-4 py-2 text-sm outline-none" />
//           </div>
//           <div className="flex rounded-full glass p-1 text-xs">
//             {(["all","reported","flagged"] as const).map((k) => (
//               <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1 rounded-full capitalize ${filter === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{k}</button>
//             ))}
//           </div>
//           <select value={state} onChange={(e) => setState(e.target.value)} className="glass rounded-full px-3 py-2 text-xs outline-none">
//             <option value="all">All States</option>
//             {STATES.map((s) => <option key={s}>{s}</option>)}
//           </select>
//           <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="glass rounded-full px-3 py-2 text-xs outline-none" />
//         </div>
//       </GlassCard>

//       {/* Split panel */}
//       <div className="grid lg:grid-cols-[360px_1fr] gap-4">
//         {/* Conversation list */}
//         <GlassCard className="p-0 overflow-hidden max-h-[70vh] flex flex-col">
//           <div className="p-3 border-b border-border/40 text-xs text-muted-foreground">{filtered.length} conversations</div>
//           <div className="overflow-y-auto flex-1 divide-y divide-border/20">
//             {filtered.map((c) => {
//               const active = selected?.id === c.id;
//               return (
//                 <button key={c.id} onClick={() => setSelected(c)} className={`w-full text-left p-3 transition flex gap-3 ${active ? "bg-primary/15" : "hover:bg-card/40"}`}>
//                   <div className="relative flex-shrink-0">
//                     <div className="flex -space-x-3">
//                       <img src={c.customer.avatar} className="h-8 w-8 rounded-full ring-2 ring-background object-cover" alt="" />
//                       <img src={c.creator.avatar} className="h-8 w-8 rounded-full ring-2 ring-background object-cover" alt="" />
//                     </div>
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center justify-between gap-1">
//                       <p className="text-xs font-semibold truncate">{c.customer.name} → {c.creator.name}</p>
//                       <span className="text-[10px] text-muted-foreground">{c.time}</span>
//                     </div>
//                     <p className="text-xs text-muted-foreground truncate">{c.last}</p>
//                     <div className="flex items-center gap-1 mt-1">
//                       {c.reports > 0 && <span className="text-[10px] rounded-full px-1.5 py-0 bg-rose-500/15 text-rose-400 inline-flex items-center gap-0.5"><Flag className="h-2.5 w-2.5" />{c.reports}</span>}
//                       {c.flagged && <span className="text-[10px] rounded-full px-1.5 py-0 bg-amber-500/15 text-amber-400 inline-flex items-center gap-0.5"><ShieldAlert className="h-2.5 w-2.5" />flagged</span>}
//                       {c.reason && <span className={`text-[10px] rounded-full px-1.5 py-0 border ${TONE_REASON[c.reason]}`}>{c.reason}</span>}
//                     </div>
//                   </div>
//                 </button>
//               );
//             })}
//             {filtered.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">No conversations</p>}
//           </div>
//         </GlassCard>

//         {/* Chat viewer */}
//         <GlassCard className="p-0 overflow-hidden flex flex-col max-h-[70vh]">
//           {selected ? (
//             <>
//               <div className="p-3 border-b border-border/40 flex items-center justify-between flex-wrap gap-2">
//                 <div className="flex items-center gap-3">
//                   <div className="flex -space-x-3">
//                     <img src={selected.customer.avatar} className="h-9 w-9 rounded-full ring-2 ring-background object-cover" alt="" />
//                     <img src={selected.creator.avatar} className="h-9 w-9 rounded-full ring-2 ring-background object-cover" alt="" />
//                   </div>
//                   <div>
//                     <p className="text-sm font-semibold">{selected.customer.name} ↔ {selected.creator.name}</p>
//                     <p className="text-[10px] text-muted-foreground">{selected.id} · {selected.state} · {selected.date}</p>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-1">
//                   <button onClick={() => moderate("Viewed profile")} className="rounded-full glass px-2.5 py-1 text-[10px] inline-flex items-center gap-1"><Eye className="h-3 w-3" />View User</button>
//                   <button onClick={() => moderate("Warned")} className="rounded-full bg-amber-500/15 text-amber-400 px-2.5 py-1 text-[10px] inline-flex items-center gap-1"><AlertCircle className="h-3 w-3" />Warn</button>
//                   <button onClick={() => moderate("Suspended")} className="rounded-full bg-orange-500/15 text-orange-400 px-2.5 py-1 text-[10px] inline-flex items-center gap-1"><UserX className="h-3 w-3" />Suspend</button>
//                   <button onClick={() => moderate("Banned")} className="rounded-full bg-rose-500/15 text-rose-400 px-2.5 py-1 text-[10px] inline-flex items-center gap-1"><Ban className="h-3 w-3" />Ban</button>
//                   <button onClick={() => setReportModal(true)} className="rounded-full glass px-2.5 py-1 text-[10px] inline-flex items-center gap-1"><Flag className="h-3 w-3" />Report</button>
//                 </div>
//               </div>

//               <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-card/20">
//                 {selected.messages.map((m) => {
//                   if (m.from === "system") {
//                     return (
//                       <div key={m.id} className="text-center">
//                         <span className="inline-block text-[10px] text-muted-foreground bg-card/60 rounded-full px-3 py-1">{m.text}</span>
//                       </div>
//                     );
//                   }
//                   const mine = m.from === "customer";
//                   return (
//                     <div key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"} gap-2`}>
//                       {mine && <img src={selected.customer.avatar} className="h-7 w-7 rounded-full object-cover" alt="" />}
//                       <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-card" : "bg-primary text-primary-foreground"}`}>
//                         {m.text && <p>{m.text}</p>}
//                         {m.image && (
//                           <div className="mt-1">
//                             <img src={m.image} className="rounded-lg max-h-40 object-cover" alt="" />
//                             <p className="text-[10px] opacity-70 mt-1 inline-flex items-center gap-1"><ImageIcon className="h-2.5 w-2.5" /> Image</p>
//                           </div>
//                         )}
//                         {m.gift && (
//                           <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5 text-xs">
//                             <Gift className="h-3 w-3" /> {m.gift.name} · {m.gift.coins} coins
//                           </div>
//                         )}
//                         <p className="text-[10px] opacity-60 mt-1 text-right">{m.time}</p>
//                       </div>
//                       {!mine && <img src={selected.creator.avatar} className="h-7 w-7 rounded-full object-cover" alt="" />}
//                     </div>
//                   );
//                 })}
//               </div>
//             </>
//           ) : (
//             <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Select a conversation</div>
//           )}
//         </GlassCard>
//       </div>

//       {/* Report modal */}
//       {reportModal && selected && (
//         <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReportModal(false)}>
//           <div onClick={(e) => e.stopPropagation()} className="glass rounded-2xl p-6 w-full max-w-md">
//             <h3 className="font-semibold mb-1">File a report</h3>
//             <p className="text-xs text-muted-foreground mb-4">Categorize the issue on chat {selected.id}</p>
//             <div className="grid grid-cols-2 gap-2">
//               {(["Harassment","Spam","Abuse","Fraud"] as const).map((r) => (
//                 <button key={r} onClick={() => { toast.success(`Reported as ${r}`); setReportModal(false); }} className={`rounded-xl border p-3 text-left text-sm ${TONE_REASON[r]}`}>
//                   <AlertTriangle className="h-4 w-4 mb-1" />
//                   {r}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import {
  Search,
  MessageSquare,
  Flag,
  ShieldAlert,
  AlertCircle,
  Ban,
  UserX,
  Gift,
  ImageIcon,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  FileText,
  History,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/chats")({
  component: ChatsPage,
});

// =========================================================
// CONFIGURATION
// =========================================================

const API_BASE = (
  import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const ADMIN_CHAT_API = `${API_BASE}/admin/chat-moderation`;

const DEFAULT_ADMIN_ID = 1;

const LIST_LIMIT = 20;
const MESSAGE_LIMIT = 50;
const REPORTS_LIMIT = 20;

// =========================================================
// API TYPES
// =========================================================

interface UserData {
  id: number;
  name: string;
  email: string | null;
}

interface ReportItem {
  id: number;
  chat_id: number;
  message_id: number | null;
  reported_by: number;
  reason: string | null;
  description: string | null;
  status: string | null;
  is_resolved: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface MessageItem {
  message_id: number;
  chat_id: number;
  sender_id: number;
  sender: UserData | null;
  receiver_id: number;
  receiver: UserData | null;
  message: string | null;
  message_type: string;
  attachment: string | null;
  is_read: boolean;
  is_delivered: boolean;
  is_deleted: boolean;
  created_at: string | null;
  report_count: number;
  reports: ReportItem[];
}

interface ChatItem {
  chat_id: number;
  user_one_id: number;
  user_one: UserData | null;
  user_two_id: number;
  user_two: UserData | null;
  last_message: string | null;
  last_message_at: string | null;
  last_message_by: number | null;
  message_count: number;
  pending_report_count: number;
  status: boolean;
  created_at: string | null;
  updated_at: string | null;
  last_message_details: MessageItem | null;
}

interface Overview {
  total_conversations: number;
  active_conversations: number;
  total_reports: number;
  pending_reports: number;
  flagged_messages: number;
}

interface ModerationAction {
  id: number;
  chat_id: number;
  user_id: number;
  admin_id: number;
  action: string;
  reason: string | null;
  duration: number | null;
  created_at: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

interface ApiResponse<T> {
  status_code?: number;
  message?: string;
  data: T;
  pagination?: Pagination;
}

// =========================================================
// HELPERS
// =========================================================

function avatarUrl(
  seed: string | number | null | undefined
): string {
  return `https://i.pravatar.cc/200?u=${encodeURIComponent(
    String(seed ?? "x")
  )}`;
}

function fmtTime(iso: string | null): string {
  if (!iso) return "";

  const d = new Date(iso);

  if (isNaN(d.getTime())) return "";

  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";

  const d = new Date(iso);

  if (isNaN(d.getTime())) return "—";

  return d.toLocaleString();
}

function relative(iso: string | null): string {
  if (!iso) return "";

  const d = new Date(iso);

  if (isNaN(d.getTime())) return "";

  const seconds = Math.floor(
    (Date.now() - d.getTime()) / 1000
  );

  if (seconds < 60) return "just now";

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h`;
  }

  return `${Math.floor(seconds / 86400)}d`;
}

function actionTone(action: string): string {
  const value = (action || "").toLowerCase();

  if (value === "warn") {
    return "bg-amber-500/15 text-amber-400";
  }

  if (value === "suspend") {
    return "bg-orange-500/15 text-orange-400";
  }

  if (value === "ban") {
    return "bg-rose-500/15 text-rose-400";
  }

  return "bg-muted/30 text-muted-foreground";
}

function reasonTone(
  reason: string | null | undefined
): string {
  const value = (reason || "").toLowerCase();

  if (value.includes("harass")) {
    return "bg-rose-500/15 text-rose-400 border-rose-500/30";
  }

  if (value.includes("spam")) {
    return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  }

  if (value.includes("abuse")) {
    return "bg-orange-500/15 text-orange-400 border-orange-500/30";
  }

  if (value.includes("fraud")) {
    return "bg-purple-500/15 text-purple-400 border-purple-500/30";
  }

  return "bg-muted/30 text-muted-foreground border-border";
}

// =========================================================
// API HELPERS
// =========================================================

async function getJson<T = any>(
  url: string,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  let body: any = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message =
      body?.detail ||
      body?.message ||
      `Request failed (${response.status})`;

    throw new Error(message);
  }

  return body;
}

async function postJson<T = any>(
  url: string
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });

  let body: any = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message =
      body?.detail ||
      body?.message ||
      `Request failed (${response.status})`;

    throw new Error(message);
  }

  return body;
}

function buildQuery(
  params: Record<string, string | number | undefined | null>
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
}

// =========================================================
// MODERATION MODAL
// =========================================================

type ModerationActionType =
  | "warn"
  | "suspend"
  | "ban";

interface ModerationModalProps {
  action: ModerationActionType;
  chatId: number;
  userOptions: {
    id: number;
    name: string;
  }[];
  onClose: () => void;
  onDone: () => void;
}

function ModerationModal({
  action,
  chatId,
  userOptions,
  onClose,
  onDone,
}: ModerationModalProps) {
  const [userId, setUserId] = useState<number>(
    userOptions[0]?.id ?? 0
  );

  const [reason, setReason] = useState("");

  const [duration, setDuration] = useState(60);

  const [busy, setBusy] = useState(false);

  const title =
    action === "warn"
      ? "Warn User"
      : action === "suspend"
        ? "Suspend User"
        : "Ban User";

  const tone =
    action === "warn"
      ? "text-amber-400"
      : action === "suspend"
        ? "text-orange-400"
        : "text-rose-400";

  const submit = async () => {
    if (!userId) {
      toast.error("Please select a user");
      return;
    }

    if (action === "suspend" && duration < 1) {
      toast.error("Duration must be at least 1 minute");
      return;
    }

    setBusy(true);

    try {
      const params = new URLSearchParams();

      params.set("user_id", String(userId));
      params.set("admin_id", String(DEFAULT_ADMIN_ID));

      if (reason.trim()) {
        params.set("reason", reason.trim());
      }

      if (action === "suspend") {
        params.set("duration", String(duration));
      }

      const url =
        `${ADMIN_CHAT_API}/${chatId}/${action}?${params.toString()}`;

      await postJson(url);

      toast.success(`${title} recorded successfully`);

      onDone();

      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Moderation action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="glass rounded-2xl p-6 w-full max-w-md"
      >
        <h3 className={`font-semibold mb-1 ${tone}`}>
          {title}
        </h3>

        <p className="text-xs text-muted-foreground mb-4">
          Chat #{chatId} · recorded by admin #{DEFAULT_ADMIN_ID}
        </p>

        <label className="text-[10px] text-muted-foreground uppercase">
          Target user
        </label>

        <select
          value={userId}
          onChange={(event) =>
            setUserId(Number(event.target.value))
          }
          className="w-full glass rounded-xl px-3 py-2 text-sm mb-3 outline-none"
        >
          {userOptions.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} · #{user.id}
            </option>
          ))}
        </select>

        <label className="text-[10px] text-muted-foreground uppercase">
          Reason
        </label>

        <input
          value={reason}
          onChange={(event) =>
            setReason(event.target.value)
          }
          placeholder="e.g. harassment, spam…"
          className="w-full glass rounded-xl px-3 py-2 text-sm mb-3 outline-none"
        />

        {action === "suspend" && (
          <>
            <label className="text-[10px] text-muted-foreground uppercase">
              Duration (minutes)
            </label>

            <input
              type="number"
              min={1}
              value={duration}
              onChange={(event) => {
                const value = Number(event.target.value);

                setDuration(
                  Number.isFinite(value)
                    ? Math.max(1, value)
                    : 1
                );
              }}
              className="w-full glass rounded-xl px-3 py-2 text-sm mb-3 outline-none"
            />
          </>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-full glass px-4 py-2 text-sm"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={busy || userOptions.length === 0}
            className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
          >
            {busy && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// KPI CARD
// =========================================================

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: any;
  tone: string;
}) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div
        className={`absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none ${tone}`}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            {label}
          </p>

          <p className="text-xl font-bold mt-1">
            {value}
          </p>
        </div>

        <Icon className="h-5 w-5 opacity-80" />
      </div>
    </GlassCard>
  );
}

// =========================================================
// CHAT MODERATION PAGE
// =========================================================

function ChatsPage() {
  // -------------------------------------------------------
  // DASHBOARD
  // -------------------------------------------------------

  const [overview, setOverview] =
    useState<Overview | null>(null);

  const [loadingOverview, setLoadingOverview] =
    useState(true);

  const [overviewError, setOverviewError] =
    useState<string | null>(null);

  // -------------------------------------------------------
  // CONVERSATION LIST
  // -------------------------------------------------------

  const [convos, setConvos] =
    useState<ChatItem[]>([]);

  const [listTotal, setListTotal] = useState(0);

  const [listPage, setListPage] = useState(1);

  const [listTotalPages, setListTotalPages] =
    useState(1);

  const [loadingList, setLoadingList] =
    useState(true);

  // -------------------------------------------------------
  // FILTERS
  // -------------------------------------------------------

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] = useState("");

  const [filterType, setFilterType] =
    useState<"all" | "reported" | "flagged">("all");

  const [statusFilter, setStatusFilter] =
    useState<"all" | "active" | "inactive">("all");

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");

  // -------------------------------------------------------
  // SELECTED CONVERSATION
  // -------------------------------------------------------

  const [selected, setSelected] =
    useState<ChatItem | null>(null);

  const [messages, setMessages] =
    useState<MessageItem[]>([]);

  const [msgPage, setMsgPage] = useState(1);

  const [msgTotalPages, setMsgTotalPages] =
    useState(1);

  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [msgSearch, setMsgSearch] = useState("");

  // -------------------------------------------------------
  // TABS
  // -------------------------------------------------------

  const [tab, setTab] =
    useState<"messages" | "reports" | "history">(
      "messages"
    );

  const [reports, setReports] =
    useState<ReportItem[]>([]);

  const [loadingReports, setLoadingReports] =
    useState(false);

  const [actions, setActions] =
    useState<ModerationAction[]>([]);

  const [loadingActions, setLoadingActions] =
    useState(false);

  // -------------------------------------------------------
  // MODERATION MODAL
  // -------------------------------------------------------

  const [modModal, setModModal] =
    useState<ModerationActionType | null>(null);

  // =======================================================
  // LOAD DASHBOARD
  // GET /admin/chat-moderation/dashboard
  // =======================================================

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    setOverviewError(null);

    try {
      const response =
        await getJson<ApiResponse<Overview>>(
          `${ADMIN_CHAT_API}/dashboard`
        );

      setOverview(response.data);
    } catch (error: any) {
      setOverviewError(
        error?.message || "Failed to load dashboard"
      );
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // =======================================================
  // SEARCH DEBOUNCE
  // =======================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setListPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // =======================================================
  // FILTER HANDLERS
  // =======================================================

  const onFilterType = (
    value: "all" | "reported" | "flagged"
  ) => {
    setFilterType(value);
    setListPage(1);
  };

  const onStatus = (
    value: "all" | "active" | "inactive"
  ) => {
    setStatusFilter(value);
    setListPage(1);
  };

  const onStartDate = (value: string) => {
    setStartDate(value);
    setListPage(1);
  };

  const onEndDate = (value: string) => {
    setEndDate(value);
    setListPage(1);
  };

  // =======================================================
  // LOAD CONVERSATIONS
  // GET /admin/chat-moderation
  // =======================================================

  const loadList = useCallback(
    async (signal?: AbortSignal) => {
      setLoadingList(true);

      try {
        const query = buildQuery({
          search: search || undefined,

          filter_type:
            filterType !== "all"
              ? filterType
              : undefined,

          status:
            statusFilter !== "all"
              ? statusFilter
              : undefined,

          start_date: startDate
            ? `${startDate}T00:00:00`
            : undefined,

          end_date: endDate
            ? `${endDate}T23:59:59`
            : undefined,

          page: listPage,

          limit: LIST_LIMIT,
        });

        const response =
          await getJson<ApiResponse<ChatItem[]>>(
            `${ADMIN_CHAT_API}?${query}`,
            signal
          );

        setConvos(response.data || []);

        setListTotal(
          response.pagination?.total ?? 0
        );

        setListTotalPages(
          Math.max(
            1,
            response.pagination?.total_pages ?? 1
          )
        );
      } catch (error: any) {
        if (error?.name === "AbortError") return;

        toast.error(
          error?.message || "Failed to load conversations"
        );

        setConvos([]);
        setListTotal(0);
        setListTotalPages(1);
      } finally {
        if (!signal?.aborted) {
          setLoadingList(false);
        }
      }
    },
    [
      search,
      filterType,
      statusFilter,
      startDate,
      endDate,
      listPage,
    ]
  );

  useEffect(() => {
    const controller = new AbortController();

    loadList(controller.signal);

    return () => controller.abort();
  }, [loadList]);

  // =======================================================
  // LOAD MESSAGES
  // GET /admin/chat-moderation/{chat_id}/messages
  // =======================================================

  const loadMessages = useCallback(
    async (
      chatId: number,
      page: number,
      searchValue: string,
      signal?: AbortSignal
    ) => {
      setLoadingMessages(true);

      try {
        const query = buildQuery({
          search: searchValue.trim() || undefined,
          page,
          limit: MESSAGE_LIMIT,
        });

        const response =
          await getJson<ApiResponse<MessageItem[]>>(
            `${ADMIN_CHAT_API}/${chatId}/messages?${query}`,
            signal
          );

        setMessages(response.data || []);

        setMsgTotalPages(
          Math.max(
            1,
            response.pagination?.total_pages ?? 1
          )
        );
      } catch (error: any) {
        if (error?.name === "AbortError") return;

        toast.error(
          error?.message || "Failed to load messages"
        );

        setMessages([]);
        setMsgTotalPages(1);
      } finally {
        if (!signal?.aborted) {
          setLoadingMessages(false);
        }
      }
    },
    []
  );

  // Automatically reload messages whenever:
  // selected conversation, page, or message search changes.

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(() => {
      loadMessages(
        selected.chat_id,
        msgPage,
        msgSearch,
        controller.signal
      );
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    selected,
    msgPage,
    msgSearch,
    loadMessages,
  ]);

  // =======================================================
  // LOAD REPORTS
  // GET /admin/chat-moderation/reports/list
  // =======================================================

  const loadReports = useCallback(
    async (chatId: number) => {
      setLoadingReports(true);

      try {
        const query = buildQuery({
          chat_id: chatId,
          page: 1,
          limit: REPORTS_LIMIT,
        });

        const response =
          await getJson<ApiResponse<ReportItem[]>>(
            `${ADMIN_CHAT_API}/reports/list?${query}`
          );

        setReports(response.data || []);
      } catch (error: any) {
        toast.error(
          error?.message || "Failed to load reports"
        );

        setReports([]);
      } finally {
        setLoadingReports(false);
      }
    },
    []
  );

  // =======================================================
  // LOAD MODERATION HISTORY
  // GET /admin/chat-moderation/{chat_id}/actions
  // =======================================================

  const loadActions = useCallback(
    async (chatId: number) => {
      setLoadingActions(true);

      try {
        const response =
          await getJson<ApiResponse<ModerationAction[]>>(
            `${ADMIN_CHAT_API}/${chatId}/actions`
          );

        setActions(response.data || []);
      } catch (error: any) {
        toast.error(
          error?.message || "Failed to load moderation history"
        );

        setActions([]);
      } finally {
        setLoadingActions(false);
      }
    },
    []
  );

  // =======================================================
  // SELECT CONVERSATION
  // =======================================================

  const selectConvo = (conversation: ChatItem) => {
    setSelected(conversation);

    setMsgPage(1);

    setMsgSearch("");

    setMessages([]);

    setReports([]);

    setActions([]);
  };

  // =======================================================
  // LOAD CURRENT TAB DATA
  // =======================================================

  useEffect(() => {
    if (!selected) return;

    if (tab === "reports") {
      loadReports(selected.chat_id);
    }

    if (tab === "history") {
      loadActions(selected.chat_id);
    }
  }, [
    tab,
    selected,
    loadReports,
    loadActions,
  ]);

  // =======================================================
  // RESOLVE REPORT
  // POST /admin/chat-moderation/reports/{report_id}/resolve
  // =======================================================

  const resolveReport = async (reportId: number) => {
    try {
      await postJson(
        `${ADMIN_CHAT_API}/reports/${reportId}/resolve`
      );

      toast.success("Report resolved successfully");

      if (selected) {
        await loadReports(selected.chat_id);
      }

      await loadOverview();

      await loadList();
    } catch (error: any) {
      toast.error(
        error?.message || "Failed to resolve report"
      );
    }
  };

  // =======================================================
  // MODERATION USERS
  // =======================================================

  const userOptions = useMemo(() => {
    if (!selected) return [];

    const options: {
      id: number;
      name: string;
    }[] = [];

    if (selected.user_one) {
      options.push({
        id: selected.user_one.id,
        name: selected.user_one.name,
      });
    }

    if (selected.user_two) {
      options.push({
        id: selected.user_two.id,
        name: selected.user_two.name,
      });
    }

    return options;
  }, [selected]);

  // =======================================================
  // REFRESH
  // =======================================================

  const refreshAll = () => {
    loadOverview();

    loadList();

    if (!selected) return;

    if (tab === "messages") {
      loadMessages(
        selected.chat_id,
        msgPage,
        msgSearch
      );
    }

    if (tab === "reports") {
      loadReports(selected.chat_id);
    }

    if (tab === "history") {
      loadActions(selected.chat_id);
    }
  };

  // =======================================================
  // FILTERS
  // =======================================================

  const hasFilters =
    searchInput ||
    search ||
    filterType !== "all" ||
    statusFilter !== "all" ||
    startDate ||
    endDate;

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setFilterType("all");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setListPage(1);
  };

  // =======================================================
  // INITIAL LOADING
  // =======================================================

  if (loadingOverview && !overview) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // =======================================================
  // DASHBOARD ERROR
  // =======================================================

  if (overviewError && !overview) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Chat Moderation"
          subtitle="Monitor conversations & enforce policy"
        />

        <GlassCard className="text-center py-20 flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />

          <div>
            <h3 className="font-bold text-lg">
              Failed to Load Dashboard
            </h3>

            <p className="text-sm text-muted-foreground mt-1">
              {overviewError}
            </p>
          </div>

          <button
            onClick={loadOverview}
            className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </GlassCard>
      </div>
    );
  }

  // =======================================================
  // MAIN UI
  // =======================================================

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chat Moderation"
        subtitle="Monitor conversations & enforce policy"
        action={
          <button
            onClick={refreshAll}
            disabled={loadingOverview || loadingList}
            className="glass rounded-full px-3 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loadingOverview || loadingList
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>
        }
      />

      {/* ===================================================
          KPI CARDS
      =================================================== */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          label="Total Chats"
          value={(
            overview?.total_conversations ?? 0
          ).toLocaleString()}
          icon={MessageSquare}
          tone="from-primary/20 to-primary/5"
        />

        <Kpi
          label="Active Chats"
          value={(
            overview?.active_conversations ?? 0
          ).toLocaleString()}
          icon={MessageSquare}
          tone="from-emerald-500/20 to-emerald-500/5"
        />

        <Kpi
          label="Pending Reports"
          value={(
            overview?.pending_reports ?? 0
          ).toLocaleString()}
          icon={Flag}
          tone="from-rose-500/20 to-rose-500/5"
        />

        <Kpi
          label="Flagged Messages"
          value={(
            overview?.flagged_messages ?? 0
          ).toLocaleString()}
          icon={ShieldAlert}
          tone="from-amber-500/20 to-amber-500/5"
        />
      </div>

      {/* ===================================================
          FILTERS
      =================================================== */}

      <GlassCard>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}

          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <input
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Search users, messages, chat ID…"
              className="w-full glass rounded-full pl-9 pr-4 py-2 text-sm outline-none"
            />
          </div>

          {/* Filter type */}

          <div className="flex rounded-full glass p-1 text-xs">
            {(
              ["all", "reported", "flagged"] as const
            ).map((value) => (
              <button
                key={value}
                onClick={() => onFilterType(value)}
                className={`px-3 py-1 rounded-full capitalize ${
                  filterType === value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(event) =>
              onStatus(
                event.target.value as
                  | "all"
                  | "active"
                  | "inactive"
              )
            }
            className="glass rounded-full px-3 py-2 text-xs outline-none"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Start date */}

          <input
            type="date"
            value={startDate}
            onChange={(event) =>
              onStartDate(event.target.value)
            }
            className="glass rounded-full px-3 py-2 text-xs outline-none"
          />

          <span className="text-xs text-muted-foreground">
            to
          </span>

          {/* End date */}

          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) =>
              onEndDate(event.target.value)
            }
            className="glass rounded-full px-3 py-2 text-xs outline-none"
          />

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </GlassCard>

      {/* ===================================================
          SPLIT PANEL
      =================================================== */}

      <div className="grid lg:grid-cols-[360px_1fr] gap-4">
        {/* =================================================
            CONVERSATION LIST
        ================================================= */}

        <GlassCard className="p-0 overflow-hidden max-h-[70vh] flex flex-col">
          {/* List header */}

          <div className="p-3 border-b border-border/40 text-xs text-muted-foreground flex items-center justify-between">
            <span>
              {loadingList
                ? "Loading…"
                : `${listTotal} conversations`}
            </span>

            <span className="text-[10px]">
              page {listPage}/{listTotalPages}
            </span>
          </div>

          {/* List body */}

          <div className="overflow-y-auto flex-1 divide-y divide-border/20">
            {loadingList ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin inline-block mb-2" />

                <p>Loading conversations…</p>
              </div>
            ) : convos.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">
                No conversations found
              </p>
            ) : (
              convos.map((conversation) => {
                const active =
                  selected?.chat_id === conversation.chat_id;

                const userOne = conversation.user_one;

                const userTwo = conversation.user_two;

                return (
                  <button
                    key={conversation.chat_id}
                    onClick={() =>
                      selectConvo(conversation)
                    }
                    className={`w-full text-left p-3 transition flex gap-3 ${
                      active
                        ? "bg-primary/15"
                        : "hover:bg-card/40"
                    }`}
                  >
                    {/* Avatars */}

                    <div className="flex -space-x-3 flex-shrink-0">
                      <img
                        src={avatarUrl(
                          userOne?.id ?? userOne?.name
                        )}
                        className="h-8 w-8 rounded-full ring-2 ring-background object-cover"
                        alt=""
                      />

                      <img
                        src={avatarUrl(
                          userTwo?.id ?? userTwo?.name
                        )}
                        className="h-8 w-8 rounded-full ring-2 ring-background object-cover"
                        alt=""
                      />
                    </div>

                    {/* Conversation information */}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold truncate">
                          {userOne?.name ?? "Unknown"} →{" "}
                          {userTwo?.name ?? "Unknown"}
                        </p>

                        <span className="text-[10px] text-muted-foreground">
                          {relative(
                            conversation.last_message_at ||
                              conversation.updated_at
                          )}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground truncate">
                        {conversation.last_message || "—"}
                      </p>

                      {/* Conversation badges */}

                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {conversation.pending_report_count > 0 && (
                          <span className="text-[10px] rounded-full px-1.5 py-0 bg-rose-500/15 text-rose-400 inline-flex items-center gap-0.5">
                            <Flag className="h-2.5 w-2.5" />

                            {conversation.pending_report_count}
                          </span>
                        )}

                        <span className="text-[10px] rounded-full px-1.5 py-0 bg-muted/30 text-muted-foreground inline-flex items-center gap-0.5">
                          <MessageSquare className="h-2.5 w-2.5" />

                          {conversation.message_count}
                        </span>

                        {conversation.status ? (
                          <span className="text-[10px] rounded-full px-1.5 py-0 bg-emerald-500/15 text-emerald-400">
                            active
                          </span>
                        ) : (
                          <span className="text-[10px] rounded-full px-1.5 py-0 bg-muted/30 text-muted-foreground">
                            inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* List pagination */}

          <div className="p-2 border-t border-border/40 flex items-center justify-between text-[10px]">
            <button
              disabled={listPage <= 1 || loadingList}
              onClick={() =>
                setListPage((page) =>
                  Math.max(1, page - 1)
                )
              }
              className="glass rounded-full p-1.5 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <span className="text-muted-foreground">
              {listPage} / {listTotalPages}
            </span>

            <button
              disabled={
                listPage >= listTotalPages || loadingList
              }
              onClick={() =>
                setListPage((page) =>
                  Math.min(listTotalPages, page + 1)
                )
              }
              className="glass rounded-full p-1.5 disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </GlassCard>

        {/* =================================================
            CHAT VIEWER
        ================================================= */}

        <GlassCard className="p-0 overflow-hidden flex flex-col max-h-[70vh]">
          {selected ? (
            <>
              {/* Chat header */}

              <div className="p-3 border-b border-border/40 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    <img
                      src={avatarUrl(
                        selected.user_one?.id ??
                          selected.user_one?.name
                      )}
                      className="h-9 w-9 rounded-full ring-2 ring-background object-cover"
                      alt=""
                    />

                    <img
                      src={avatarUrl(
                        selected.user_two?.id ??
                          selected.user_two?.name
                      )}
                      className="h-9 w-9 rounded-full ring-2 ring-background object-cover"
                      alt=""
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      {selected.user_one?.name ?? "Unknown"} ↔{" "}
                      {selected.user_two?.name ?? "Unknown"}
                    </p>

                    <p className="text-[10px] text-muted-foreground">
                      #{selected.chat_id} ·{" "}
                      {selected.message_count} messages ·{" "}
                      {selected.pending_report_count} pending reports
                    </p>
                  </div>
                </div>

                {/* Moderation buttons */}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setModModal("warn")}
                    disabled={userOptions.length === 0}
                    className="rounded-full bg-amber-500/15 text-amber-400 px-2.5 py-1 text-[10px] inline-flex items-center gap-1 disabled:opacity-40"
                  >
                    <AlertCircle className="h-3 w-3" />

                    Warn
                  </button>

                  <button
                    onClick={() => setModModal("suspend")}
                    disabled={userOptions.length === 0}
                    className="rounded-full bg-orange-500/15 text-orange-400 px-2.5 py-1 text-[10px] inline-flex items-center gap-1 disabled:opacity-40"
                  >
                    <UserX className="h-3 w-3" />

                    Suspend
                  </button>

                  <button
                    onClick={() => setModModal("ban")}
                    disabled={userOptions.length === 0}
                    className="rounded-full bg-rose-500/15 text-rose-400 px-2.5 py-1 text-[10px] inline-flex items-center gap-1 disabled:opacity-40"
                  >
                    <Ban className="h-3 w-3" />

                    Ban
                  </button>
                </div>
              </div>

              {/* =================================================
                  TABS
              ================================================= */}

              <div className="px-3 pt-2 flex items-center gap-1 text-xs border-b border-border/40">
                {(
                  [
                    {
                      key: "messages",
                      label: "Messages",
                      icon: MessageSquare,
                    },
                    // {
                    //   key: "reports",
                    //   label: `Reports${
                    //     reports.length
                    //       ? ` (${reports.filter((r) => !r.is_resolved).length})`
                    //       : ""
                    //   }`,
                    //   icon: Flag,
                    // },
                    {
                      key: "history",
                      label: "History",
                      icon: History,
                    },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setTab(item.key)}
                    className={`px-3 py-1.5 rounded-t-lg inline-flex items-center gap-1.5 ${
                      tab === item.key
                        ? "bg-card/40 text-foreground font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    <item.icon className="h-3 w-3" />

                    {item.label}
                  </button>
                ))}
              </div>

              {/* =================================================
                  TAB CONTENT
              ================================================= */}

              <div className="flex-1 overflow-y-auto">
                {/* =================================================
                    MESSAGES TAB
                ================================================= */}

                {tab === "messages" && (
                  <div className="p-4 space-y-3 bg-card/20">
                    {/* Message search */}

                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />

                      <input
                        value={msgSearch}
                        onChange={(event) => {
                          setMsgSearch(event.target.value);
                          setMsgPage(1);
                        }}
                        placeholder="Search messages…"
                        className="w-full glass rounded-full pl-8 pr-3 py-1.5 text-xs outline-none"
                      />
                    </div>

                    {/* Loading */}

                    {loadingMessages ? (
                      <div className="text-center text-xs text-muted-foreground py-6">
                        <Loader2 className="h-4 w-4 animate-spin inline-block mr-1" />

                        Loading messages…
                      </div>
                    ) : messages.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-6">
                        No messages found
                      </p>
                    ) : (
                      messages.map((message) => {
                        const mine =
                          selected.user_one_id ===
                          message.sender_id;

                        const messageType =
                          (message.message_type || "").toLowerCase();

                        const isGift =
                          messageType.includes("gift");

                        const isImage =
                          messageType.includes("image") ||
                          /\.(png|jpe?g|gif|webp)$/i.test(
                            message.attachment || ""
                          );

                        return (
                          <div
                            key={message.message_id}
                            className={`flex ${
                              mine
                                ? "justify-start"
                                : "justify-end"
                            } gap-2`}
                          >
                            {mine && (
                              <img
                                src={avatarUrl(
                                  message.sender?.id ??
                                    message.sender?.name
                                )}
                                className="h-7 w-7 rounded-full object-cover"
                                alt=""
                              />
                            )}

                            <div
                              className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                                mine
                                  ? "bg-card"
                                  : "bg-primary text-primary-foreground"
                              }`}
                            >
                              <p className="text-[10px] opacity-60 mb-0.5">
                                {message.sender?.name ??
                                  "Unknown"}
                              </p>

                              {/* Message text */}

                              {message.message && (
                                <p className="whitespace-pre-wrap break-words">
                                  {message.message}
                                </p>
                              )}

                              {/* Image attachment */}

                              {isImage &&
                                message.attachment && (
                                  <div className="mt-1">
                                    <a
                                      href={message.attachment}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      <img
                                        src={message.attachment}
                                        className="rounded-lg max-h-40 object-cover"
                                        alt="Chat attachment"
                                      />
                                    </a>

                                    <p className="text-[10px] opacity-70 mt-1 inline-flex items-center gap-1">
                                      <ImageIcon className="h-2.5 w-2.5" />

                                      Image
                                    </p>
                                  </div>
                                )}

                              {/* Gift */}

                              {isGift && (
                                <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5 text-xs">
                                  <Gift className="h-3 w-3" />

                                  Gift
                                </div>
                              )}

                              {/* Reports */}

                              {message.report_count > 0 && (
                                <p className="text-[10px] mt-1 inline-flex items-center gap-1 text-rose-400">
                                  <Flag className="h-2.5 w-2.5" />

                                  {message.report_count} report
                                  {message.report_count === 1
                                    ? ""
                                    : "s"}
                                </p>
                              )}

                              {/* Timestamp */}

                              <p className="text-[10px] opacity-60 mt-1 text-right">
                                {fmtTime(message.created_at)}
                              </p>
                            </div>

                            {!mine && (
                              <img
                                src={avatarUrl(
                                  message.sender?.id ??
                                    message.sender?.name
                                )}
                                className="h-7 w-7 rounded-full object-cover"
                                alt=""
                              />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* =================================================
                    REPORTS TAB
                ================================================= */}

                {tab === "reports" && (
                  <div className="p-4 space-y-2">
                    {loadingReports ? (
                      <div className="text-center text-xs text-muted-foreground py-6">
                        <Loader2 className="h-4 w-4 animate-spin inline-block mr-1" />

                        Loading reports…
                      </div>
                    ) : reports.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-6">
                        No reports filed for this conversation
                      </p>
                    ) : (
                      reports.map((report) => (
                        <div
                          key={report.id}
                          className="glass-strong rounded-xl p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Flag className="h-3.5 w-3.5 text-rose-400" />

                              <span className="text-sm font-semibold">
                                Report #{report.id}
                              </span>

                              {report.reason && (
                                <span
                                  className={`text-[10px] rounded-full px-2 py-0.5 border ${reasonTone(
                                    report.reason
                                  )}`}
                                >
                                  {report.reason}
                                </span>
                              )}
                            </div>

                            <span
                              className={`text-[10px] rounded-full px-2 py-0.5 ${
                                report.is_resolved
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : "bg-amber-500/15 text-amber-400"
                              }`}
                            >
                              {report.is_resolved
                                ? "resolved"
                                : "pending"}
                            </span>
                          </div>

                          {report.description && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {report.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <FileText className="h-3 w-3" />

                              msg #{report.message_id ?? "—"} · by user #{report.reported_by}
                            </span>

                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />

                              {fmtDateTime(report.created_at)}
                            </span>
                          </div>

                          {!report.is_resolved && (
                            <button
                              onClick={() =>
                                resolveReport(report.id)
                              }
                              className="mt-2 rounded-full bg-emerald-500/15 text-emerald-400 px-3 py-1 text-[10px] inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3" />

                              Resolve
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* =================================================
                    HISTORY TAB
                ================================================= */}

                {tab === "history" && (
                  <div className="p-4 space-y-2">
                    {loadingActions ? (
                      <div className="text-center text-xs text-muted-foreground py-6">
                        <Loader2 className="h-4 w-4 animate-spin inline-block mr-1" />

                        Loading history…
                      </div>
                    ) : actions.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-6">
                        No moderation actions recorded
                      </p>
                    ) : (
                      actions.map((action) => (
                        <div
                          key={action.id}
                          className="glass-strong rounded-xl p-3 flex items-start gap-3"
                        >
                          <div
                            className={`text-[10px] rounded-full px-2 py-1 font-semibold uppercase ${actionTone(
                              action.action
                            )}`}
                          >
                            {action.action}
                          </div>

                          <div className="flex-1">
                            <p className="text-xs">
                              User #{action.user_id} · by admin #{action.admin_id}

                              {action.duration
                                ? ` · ${action.duration} min`
                                : ""}
                            </p>

                            {action.reason && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {action.reason}
                              </p>
                            )}

                            <p className="text-[10px] text-muted-foreground mt-1 inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />

                              {fmtDateTime(action.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* =================================================
                  MESSAGE PAGINATION
              ================================================= */}

              {tab === "messages" && (
                <div className="p-2 border-t border-border/40 flex items-center justify-between text-[10px]">
                  <button
                    disabled={
                      msgPage <= 1 || loadingMessages
                    }
                    onClick={() =>
                      setMsgPage((page) =>
                        Math.max(1, page - 1)
                      )
                    }
                    className="glass rounded-full p-1.5 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>

                  <span className="text-muted-foreground">
                    {msgPage} / {msgTotalPages}
                  </span>

                  <button
                    disabled={
                      msgPage >= msgTotalPages ||
                      loadingMessages
                    }
                    onClick={() =>
                      setMsgPage((page) =>
                        Math.min(msgTotalPages, page + 1)
                      )
                    }
                    className="glass rounded-full p-1.5 disabled:opacity-40"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Select a conversation
            </div>
          )}
        </GlassCard>
      </div>

      {/* =====================================================
          MODERATION MODAL
      ===================================================== */}

      {modModal && selected && (
        <ModerationModal
          action={modModal}
          chatId={selected.chat_id}
          userOptions={userOptions}
          onClose={() => setModModal(null)}
          onDone={() => {
            loadActions(selected.chat_id);

            loadOverview();

            loadList();
          }}
        />
      )}
    </div>
  );
}