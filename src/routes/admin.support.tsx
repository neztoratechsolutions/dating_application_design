import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { TicketIcon, AlertTriangle, CheckCircle2, Clock, Search, Send, Paperclip } from "lucide-react";

const SUBJECTS = ["Payment not received", "Coin not credited", "KYC rejected", "Video call issue", "Refund request", "App crash", "Profile update", "Withdrawal pending"];
const NAMES = ["Rahul Sharma", "Priya Patel", "Karan Mehta", "Ananya Iyer", "Vikram Singh", "Neha Roy", "Sneha Kapoor", "Arjun Verma"];
const TYPES = ["Customer", "Creator"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
const STATUSES = ["Open", "In Progress", "Resolved", "Closed"] as const;

type Ticket = {
  id: string; user: string; userType: string; subject: string;
  priority: typeof PRIORITIES[number]; status: typeof STATUSES[number]; created: string;
  messages: { from: "user" | "admin"; text: string; time: string }[];
  notes: string;
};

const seed: Ticket[] = Array.from({ length: 30 }).map((_, i) => ({
  id: `TKT-${10000 + i}`,
  user: NAMES[i % NAMES.length],
  userType: TYPES[i % 2],
  subject: SUBJECTS[i % SUBJECTS.length],
  priority: PRIORITIES[i % 4],
  status: STATUSES[i % 4],
  created: `2026-06-${String(8 - (i % 8)).padStart(2, "0")} ${String(9 + (i % 10)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
  messages: [
    { from: "user", text: `Hi, I have an issue with ${SUBJECTS[i % SUBJECTS.length].toLowerCase()}. Please help.`, time: "10:30 AM" },
    { from: "admin", text: "Hi, we are looking into this. Could you share more details?", time: "10:45 AM" },
  ],
  notes: "Internal: verify wallet ledger before resolving.",
}));

const PRI_TONE: Record<string, string> = {
  Low: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  Medium: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  High: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Critical: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};
const STATUS_TONE: Record<string, string> = {
  Open: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "In Progress": "bg-sky-500/15 text-sky-300 border-sky-500/30",
  Resolved: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  Closed: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

function Kpi({ icon: Icon, label, value, tone }: any) {
  return <GlassCard><div className="flex items-start justify-between">
    <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold mt-1">{value}</p></div>
    <div className={`rounded-xl p-2 ${tone}`}><Icon className="h-5 w-5" /></div>
  </div></GlassCard>;
}

function Page() {
  const [list, setList] = useState<Ticket[]>(seed);
  const [search, setSearch] = useState("");
  const [priF, setPriF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [active, setActive] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");

  const open = list.filter((t) => t.status === "Open").length;
  const pending = list.filter((t) => t.status === "In Progress").length;
  const resolved = list.filter((t) => t.status === "Resolved" || t.status === "Closed").length;
  const high = list.filter((t) => t.priority === "High" || t.priority === "Critical").length;

  const filtered = useMemo(() => list.filter((t) => {
    if (search && !t.user.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (priF !== "all" && t.priority !== priF) return false;
    if (statusF !== "all" && t.status !== statusF) return false;
    return true;
  }), [list, search, priF, statusF]);

  function sendReply() {
    if (!active || !reply) return;
    const updated = { ...active, messages: [...active.messages, { from: "admin" as const, text: reply, time: "now" }] };
    setList(list.map((t) => (t.id === active.id ? updated : t))); setActive(updated); setReply("");
    toast.success("Reply sent");
  }
  function setStatus(s: typeof STATUSES[number]) {
    if (!active) return;
    const updated = { ...active, status: s };
    setList(list.map((t) => (t.id === active.id ? updated : t))); setActive(updated);
    toast.success(`Marked ${s}`);
  }
  function setPri(p: typeof PRIORITIES[number]) {
    if (!active) return;
    const updated = { ...active, priority: p };
    setList(list.map((t) => (t.id === active.id ? updated : t))); setActive(updated);
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Support Center" subtitle="Tickets, conversations & resolution" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={TicketIcon} label="Open Tickets" value={open} tone="bg-emerald-500/15 text-emerald-300" />
        <Kpi icon={Clock} label="In Progress" value={pending} tone="bg-sky-500/15 text-sky-300" />
        <Kpi icon={CheckCircle2} label="Resolved" value={resolved} tone="bg-violet-500/15 text-violet-300" />
        <Kpi icon={AlertTriangle} label="High Priority" value={high} tone="bg-rose-500/15 text-rose-300" />
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 glass rounded-xl px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input placeholder="Search ticket ID or user" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <select value={priF} onChange={(e) => setPriF(e.target.value)} className="glass rounded-xl px-3 py-2 text-xs outline-none">
            <option value="all">All Priority</option>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="glass rounded-xl px-3 py-2 text-xs outline-none">
            <option value="all">All Status</option>{STATUSES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground"><tr>
              <th className="text-left p-2">Ticket</th><th className="text-left p-2">User</th>
              <th className="text-left p-2">Subject</th><th className="p-2">Priority</th>
              <th className="p-2">Status</th><th className="text-left p-2">Created</th>
            </tr></thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} onClick={() => setActive(t)} className="border-t border-white/5 hover:bg-white/[0.05] cursor-pointer">
                  <td className="p-2 font-mono text-xs">{t.id}</td>
                  <td className="p-2"><div className="font-medium">{t.user}</div><div className="text-[10px] text-muted-foreground">{t.userType}</div></td>
                  <td className="p-2">{t.subject}</td>
                  <td className="p-2 text-center"><span className={`px-2 py-0.5 rounded-full border text-[10px] ${PRI_TONE[t.priority]}`}>{t.priority}</span></td>
                  <td className="p-2 text-center"><span className={`px-2 py-0.5 rounded-full border text-[10px] ${STATUS_TONE[t.status]}`}>{t.status}</span></td>
                  <td className="p-2 text-xs whitespace-nowrap">{t.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <AnimatePresence>
        {active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4" onClick={() => setActive(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{active.subject}</h3>
                  <p className="text-xs text-muted-foreground">{active.id} · {active.user} ({active.userType}) · {active.created}</p>
                </div>
                <div className="flex gap-1">
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] ${PRI_TONE[active.priority]}`}>{active.priority}</span>
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] ${STATUS_TONE[active.status]}`}>{active.status}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-[1fr_220px] gap-4">
                <div>
                  <div className="glass rounded-xl p-3 space-y-2 max-h-72 overflow-auto">
                    {active.messages.map((m, i) => (
                      <div key={i} className={`flex ${m.from === "admin" ? "justify-end" : "justify-start"}`}>
                        <div className={`rounded-2xl px-3 py-2 text-sm max-w-[75%] ${m.from === "admin" ? "bg-gradient-primary" : "bg-white/10"}`}>
                          {m.text}<div className="text-[10px] opacity-70 mt-0.5">{m.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2 glass rounded-xl px-3 py-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type reply…" className="flex-1 bg-transparent text-sm outline-none" />
                    <button onClick={sendReply} className="rounded-lg bg-gradient-primary px-3 py-1 text-xs font-semibold"><Send className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Internal Notes</p>
                    <textarea defaultValue={active.notes} rows={2} className="w-full glass rounded-xl px-3 py-2 text-sm outline-none" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="glass rounded-xl p-3 text-sm">
                    <p className="text-xs text-muted-foreground mb-1">User Info</p>
                    <p className="font-medium">{active.user}</p>
                    <p className="text-xs text-muted-foreground">{active.userType} · ID U-{1000 + parseInt(active.id.slice(-3))}</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-2">Change Priority</p>
                    <select value={active.priority} onChange={(e) => setPri(e.target.value as any)} className="w-full glass rounded-lg px-2 py-1.5 text-xs outline-none">
                      {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="glass rounded-xl p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Actions</p>
                    <button onClick={() => toast.success("Agent assigned")} className="w-full glass rounded-lg py-1.5 text-xs">Assign Agent</button>
                    <button onClick={() => setStatus("In Progress")} className="w-full glass rounded-lg py-1.5 text-xs">Mark In Progress</button>
                    <button onClick={() => setStatus("Resolved")} className="w-full rounded-lg bg-emerald-500/20 text-emerald-300 py-1.5 text-xs font-semibold">Resolve</button>
                    <button onClick={() => setStatus("Closed")} className="w-full rounded-lg bg-rose-500/20 text-rose-300 py-1.5 text-xs font-semibold">Close Ticket</button>
                  </div>
                </div>
              </div>
              <button onClick={() => setActive(null)} className="mt-4 w-full rounded-xl bg-gradient-primary py-2.5 font-semibold">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const Route = createFileRoute("/admin/support")({ component: Page });
