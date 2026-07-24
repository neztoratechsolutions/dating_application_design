import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Send, Calendar, Image as ImageIcon, Users, Search, Filter,
  Copy, Trash2, BarChart3, CheckCircle2, XCircle, Clock, Eye, MousePointerClick,
} from "lucide-react";

const TYPES = ["Announcement", "Promotion", "Wallet Update", "Creator Update", "KYC Update", "Game Promotion", "System Alert"];
const AUDIENCES = ["All Users", "Customers Only", "Creators Only", "Specific State", "Specific Language", "Specific User"];
const STATES = ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Gujarat"];
const LANGS = ["Hindi", "English", "Marathi", "Tamil", "Telugu"];

type Notif = {
  id: string; title: string; message: string; audience: string; type: string;
  sent: number; delivered: number; failed: number; date: string;
  status: "Draft" | "Scheduled" | "Sent"; openRate: number; clickRate: number;
};

const seed: Notif[] = Array.from({ length: 28 }).map((_, i) => {
  const status = (["Sent", "Sent", "Sent", "Scheduled", "Draft"] as const)[i % 5];
  const sent = status === "Sent" ? 50000 + Math.floor(Math.random() * 130000) : 0;
  const delivered = Math.floor(sent * (0.92 + Math.random() * 0.07));
  return {
    id: `NTF-${10000 + i}`,
    title: ["New Creators Online 🔥", "Weekend Bonus", "KYC Reminder", "Scratch & Win ₹500", "Wallet Recharge Offer"][i % 5],
    message: "Tap to know more",
    audience: AUDIENCES[i % AUDIENCES.length],
    type: TYPES[i % TYPES.length],
    sent, delivered, failed: sent - delivered,
    date: `2026-06-${String(8 - (i % 8)).padStart(2, "0")} ${String(10 + (i % 12)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
    status,
    openRate: +(20 + Math.random() * 40).toFixed(1),
    clickRate: +(3 + Math.random() * 12).toFixed(1),
  };
});

const STATUS_TONE: Record<string, string> = {
  Sent: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Scheduled: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Draft: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

function Kpi({ icon: Icon, label, value, tone }: any) {
  return (
    <GlassCard>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`rounded-xl p-2 ${tone}`}><Icon className="h-5 w-5" /></div>
      </div>
    </GlassCard>
  );
}

function Page() {
  const [list, setList] = useState<Notif[]>(seed);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [typeF, setTypeF] = useState("all");
  const [analytics, setAnalytics] = useState<Notif | null>(null);
  const [form, setForm] = useState({
    title: "", message: "", banner: "", type: TYPES[0], audience: AUDIENCES[0],
    target: "", date: "", time: "",
  });

  const totalSent = list.filter((n) => n.status === "Sent").length;
  const todaySent = list.filter((n) => n.status === "Sent" && n.date.startsWith("2026-06-08")).length;
  const delivered = list.reduce((a, b) => a + b.delivered, 0);
  const failed = list.reduce((a, b) => a + b.failed, 0);
  const scheduled = list.filter((n) => n.status === "Scheduled").length;

  const filtered = useMemo(() => list.filter((n) => {
    if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusF !== "all" && n.status !== statusF) return false;
    if (typeF !== "all" && n.type !== typeF) return false;
    return true;
  }), [list, search, statusF, typeF]);

  function create(status: "Sent" | "Scheduled" | "Draft") {
    if (!form.title || !form.message) return toast.error("Title and message required");
    const sent = status === "Sent" ? 80000 + Math.floor(Math.random() * 50000) : 0;
    const d = Math.floor(sent * 0.95);
    const n: Notif = {
      id: `NTF-${20000 + list.length}`, title: form.title, message: form.message,
      audience: form.audience, type: form.type, sent, delivered: d, failed: sent - d,
      date: status === "Scheduled" ? `${form.date} ${form.time}` : new Date().toISOString().slice(0, 16).replace("T", " "),
      status, openRate: 0, clickRate: 0,
    };
    setList([n, ...list]);
    setForm({ ...form, title: "", message: "" });
    toast.success(status === "Sent" ? "Notification sent" : status === "Scheduled" ? "Notification scheduled" : "Draft saved");
  }

  function duplicate(n: Notif) {
    setList([{ ...n, id: `NTF-${30000 + list.length}`, status: "Draft", title: `${n.title} (Copy)` }, ...list]);
    toast.success("Campaign duplicated");
  }
  function remove(id: string) { setList(list.filter((n) => n.id !== id)); toast.success("Deleted"); }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Push Notifications" subtitle="Send, schedule and analyze campaigns" />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi icon={Send} label="Total Sent" value={totalSent} tone="bg-primary/15 text-primary" />
        <Kpi icon={Bell} label="Today" value={todaySent} tone="bg-sky-500/15 text-sky-300" />
        <Kpi icon={CheckCircle2} label="Delivered" value={delivered.toLocaleString()} tone="bg-emerald-500/15 text-emerald-300" />
        <Kpi icon={XCircle} label="Failed" value={failed.toLocaleString()} tone="bg-rose-500/15 text-rose-300" />
        <Kpi icon={Clock} label="Scheduled" value={scheduled} tone="bg-amber-500/15 text-amber-300" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-1">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Send className="h-4 w-4" /> Create Notification</h3>
          <div className="space-y-2.5">
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full glass rounded-xl px-3 py-2 text-sm outline-none" />
            <textarea placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} className="w-full glass rounded-xl px-3 py-2 text-sm outline-none" />
            <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <input placeholder="Banner image URL" value={form.banner} onChange={(e) => setForm({ ...form, banner: e.target.value })} className="flex-1 bg-transparent text-sm outline-none" />
            </div>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full glass rounded-xl px-3 py-2 text-sm outline-none">
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className="w-full glass rounded-xl px-3 py-2 text-sm outline-none">
              {AUDIENCES.map((t) => <option key={t}>{t}</option>)}
            </select>
            {form.audience === "Specific State" && (
              <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="w-full glass rounded-xl px-3 py-2 text-sm outline-none">
                <option value="">Select state</option>{STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            )}
            {form.audience === "Specific Language" && (
              <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="w-full glass rounded-xl px-3 py-2 text-sm outline-none">
                <option value="">Select language</option>{LANGS.map((s) => <option key={s}>{s}</option>)}
              </select>
            )}
            {form.audience === "Specific User" && (
              <input placeholder="User ID / mobile" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="w-full glass rounded-xl px-3 py-2 text-sm outline-none" />
            )}
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="glass rounded-xl px-3 py-2 text-sm outline-none" />
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="glass rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button onClick={() => create("Sent")} className="rounded-xl bg-gradient-primary py-2 text-xs font-semibold shadow-glow">Send Now</button>
              <button onClick={() => create("Scheduled")} className="rounded-xl glass border border-white/10 py-2 text-xs font-semibold">Schedule</button>
              <button onClick={() => create("Draft")} className="rounded-xl glass border border-white/10 py-2 text-xs font-semibold">Draft</button>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 flex items-center gap-2 glass rounded-xl px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input placeholder="Search title" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" />
            </div>
            <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="glass rounded-xl px-3 py-2 text-xs outline-none">
              <option value="all">All Status</option><option>Sent</option><option>Scheduled</option><option>Draft</option>
            </select>
            <select value={typeF} onChange={(e) => setTypeF(e.target.value)} className="glass rounded-xl px-3 py-2 text-xs outline-none">
              <option value="all">All Types</option>{TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="overflow-auto max-h-[560px]">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground sticky top-0 bg-background/80 backdrop-blur">
                <tr><th className="text-left p-2">Title</th><th className="text-left p-2">Audience</th><th className="text-right p-2">Sent</th><th className="text-right p-2">Delivered</th><th className="text-right p-2">Failed</th><th className="text-left p-2">Date</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((n) => (
                  <tr key={n.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                    <td className="p-2 font-medium">{n.title}<div className="text-[10px] text-muted-foreground">{n.type}</div></td>
                    <td className="p-2 text-xs">{n.audience}</td>
                    <td className="p-2 text-right">{n.sent.toLocaleString()}</td>
                    <td className="p-2 text-right text-emerald-300">{n.delivered.toLocaleString()}</td>
                    <td className="p-2 text-right text-rose-300">{n.failed.toLocaleString()}</td>
                    <td className="p-2 text-xs whitespace-nowrap">{n.date}</td>
                    <td className="p-2 text-center"><span className={`px-2 py-0.5 rounded-full border text-[10px] ${STATUS_TONE[n.status]}`}>{n.status}</span></td>
                    <td className="p-2"><div className="flex justify-center gap-1">
                      <button onClick={() => setAnalytics(n)} className="p-1.5 rounded-lg glass hover:bg-primary/20" title="Analytics"><BarChart3 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => duplicate(n)} className="p-1.5 rounded-lg glass hover:bg-primary/20" title="Duplicate"><Copy className="h-3.5 w-3.5" /></button>
                      <button onClick={() => remove(n.id)} className="p-1.5 rounded-lg glass hover:bg-rose-500/20 text-rose-300" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      <AnimatePresence>
        {analytics && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4" onClick={() => setAnalytics(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-lg">{analytics.title}</h3>
              <p className="text-xs text-muted-foreground mb-4">{analytics.id} · {analytics.type}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="glass rounded-xl p-3 text-center"><Eye className="h-4 w-4 mx-auto text-sky-300" /><p className="text-xs text-muted-foreground mt-1">Open Rate</p><p className="text-xl font-bold">{analytics.openRate}%</p></div>
                <div className="glass rounded-xl p-3 text-center"><MousePointerClick className="h-4 w-4 mx-auto text-amber-300" /><p className="text-xs text-muted-foreground mt-1">Click Rate</p><p className="text-xl font-bold">{analytics.clickRate}%</p></div>
                <div className="glass rounded-xl p-3 text-center"><CheckCircle2 className="h-4 w-4 mx-auto text-emerald-300" /><p className="text-xs text-muted-foreground mt-1">Delivery</p><p className="text-xl font-bold">{analytics.sent ? ((analytics.delivered / analytics.sent) * 100).toFixed(1) : 0}%</p></div>
              </div>
              <button onClick={() => setAnalytics(null)} className="mt-4 w-full rounded-xl bg-gradient-primary py-2.5 font-semibold">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const Route = createFileRoute("/admin/notifications")({ component: Page });
