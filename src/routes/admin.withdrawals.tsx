import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CREATORS } from "@/lib/mock-data";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import {
  Search, Download, Filter, Eye, Check, X, PauseCircle, FileText,
  Wallet, Clock, CheckCircle2, XCircle, Banknote, Calendar, Gift,
  MessageSquare, Phone, Video, ShieldCheck, ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/withdrawals")({ component: WithdrawalsPage });

type Status = "Pending" | "Approved" | "Rejected" | "Hold";

const BANKS = ["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Mahindra", "Yes Bank", "IndusInd"];

interface Withdrawal {
  id: string;
  creator: typeof CREATORS[number];
  bank: string;
  account: string;
  ifsc: string;
  holder: string;
  amount: number;
  date: string;
  status: Status;
  kyc: "Verified" | "Pending";
  earnings: { chat: number; voice: number; video: number; gift: number };
}

const ROWS: Withdrawal[] = CREATORS.map((c, i) => {
  const chat = 2400 + i * 320;
  const voice = 3800 + i * 480;
  const video = 5200 + i * 610;
  const gift = 4100 + i * 540;
  return {
    id: `WD-${20240 + i}`,
    creator: c,
    bank: BANKS[i % BANKS.length],
    account: `XXXX${String(1234 + i * 17).slice(0, 4)}`,
    ifsc: `HDFC0${String(100000 + i * 27).slice(0, 6)}`,
    holder: c.name,
    amount: 5000 + (i % 9) * 4500,
    date: `2026-05-${String(28 - (i % 26)).padStart(2, "0")}`,
    status: (["Pending", "Approved", "Rejected", "Hold", "Pending", "Approved"] as Status[])[i % 6],
    kyc: i % 7 === 0 ? "Pending" : "Verified",
    earnings: { chat, voice, video, gift },
  };
});

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const TONE: Record<Status, string> = {
  Pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Rejected: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  Hold: "bg-sky-500/15 text-sky-400 border-sky-500/30",
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

function WithdrawalsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "all">("all");
  const [bank, setBank] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState(ROWS);
  const [open, setOpen] = useState<Withdrawal | null>(null);

  const filtered = useMemo(() => rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (bank !== "all" && r.bank !== bank) return false;
    if (from && r.date < from) return false;
    if (to && r.date > to) return false;
    if (q) {
      const s = q.toLowerCase();
      if (!r.creator.name.toLowerCase().includes(s) && !r.id.toLowerCase().includes(s) && !r.bank.toLowerCase().includes(s)) return false;
    }
    return true;
  }), [rows, status, bank, from, to, q]);

  const counts = useMemo(() => ({
    pending: rows.filter((r) => r.status === "Pending").length,
    approved: rows.filter((r) => r.status === "Approved").length,
    rejected: rows.filter((r) => r.status === "Rejected").length,
    total: rows.reduce((a, b) => a + b.amount, 0),
    today: rows.filter((r) => r.date === "2026-05-28").reduce((a, b) => a + b.amount, 0),
  }), [rows]);

  const updateStatus = (id: string, s: Status) => {
    setRows((rs) => rs.map((r) => r.id === id ? { ...r, status: s } : r));
    toast.success(`Marked ${s.toLowerCase()}`);
  };

  const exportCSV = () => {
    const head = ["ID","Creator","Bank","Account","Holder","Amount","Date","Status"];
    const data = [head, ...filtered.map((r) => [r.id, r.creator.name, r.bank, r.account, r.holder, r.amount, r.date, r.status])];
    const blob = new Blob([data.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "withdrawals.csv"; a.click();
    toast.success("CSV exported");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Withdrawals"
        subtitle="Creator payout management & approvals"
        action={
          <button onClick={exportCSV} className="glass rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" />Export CSV
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Pending" value={String(counts.pending)} icon={Clock} tone="from-amber-500/20 to-amber-500/5" />
        <Kpi label="Approved" value={String(counts.approved)} icon={CheckCircle2} tone="from-emerald-500/20 to-emerald-500/5" />
        <Kpi label="Rejected" value={String(counts.rejected)} icon={XCircle} tone="from-rose-500/20 to-rose-500/5" />
        <Kpi label="Total Payout" value={inr(counts.total)} icon={Banknote} tone="from-primary/20 to-primary/5" />
        <Kpi label="Today's Withdrawals" value={inr(counts.today)} icon={Wallet} tone="from-sky-500/20 to-sky-500/5" />
      </div>

      {/* Filters */}
      <GlassCard>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search creator, ID, bank…" className="w-full glass rounded-full pl-9 pr-4 py-2 text-sm outline-none" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="glass rounded-full px-3 py-2 text-xs outline-none">
            <option value="all">All Status</option>
            <option>Pending</option><option>Approved</option><option>Rejected</option><option>Hold</option>
          </select>
          <select value={bank} onChange={(e) => setBank(e.target.value)} className="glass rounded-full px-3 py-2 text-xs outline-none">
            <option value="all">All Banks</option>
            {BANKS.map((b) => <option key={b}>{b}</option>)}
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="glass rounded-full px-3 py-2 text-xs outline-none" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="glass rounded-full px-3 py-2 text-xs outline-none" />
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border/40 bg-card/40">
                <th className="py-3 px-3">Creator</th>
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Bank</th>
                <th className="py-3 px-3">Holder</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/20 hover:bg-card/40">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <img src={r.creator.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                      <div>
                        <p className="font-medium text-sm">{r.creator.name}</p>
                        <p className="text-[10px] text-muted-foreground">{r.creator.id} · {r.creator.state}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-xs text-muted-foreground">{r.id}</td>
                  <td className="py-2 px-3 text-xs"><div>{r.bank}</div><div className="text-[10px] text-muted-foreground">{r.account}</div></td>
                  <td className="py-2 px-3 text-xs">{r.holder}</td>
                  <td className="py-2 px-3 text-right font-semibold">{inr(r.amount)}</td>
                  <td className="py-2 px-3 text-xs">{r.date}</td>
                  <td className="py-2 px-3"><span className={`text-[10px] rounded-full px-2 py-0.5 border ${TONE[r.status]}`}>{r.status}</span></td>
                  <td className="py-2 px-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setOpen(r)} title="View" className="rounded-full bg-card/60 hover:bg-card p-1.5"><Eye className="h-3.5 w-3.5" /></button>
                      <button onClick={() => updateStatus(r.id, "Approved")} title="Approve" className="rounded-full bg-emerald-500/15 text-emerald-400 p-1.5"><Check className="h-3.5 w-3.5" /></button>
                      <button onClick={() => updateStatus(r.id, "Rejected")} title="Reject" className="rounded-full bg-rose-500/15 text-rose-400 p-1.5"><X className="h-3.5 w-3.5" /></button>
                      <button onClick={() => updateStatus(r.id, "Hold")} title="Hold" className="rounded-full bg-sky-500/15 text-sky-400 p-1.5"><PauseCircle className="h-3.5 w-3.5" /></button>
                      <button onClick={() => toast.success("Receipt downloaded")} title="Receipt" className="rounded-full bg-card/60 hover:bg-card p-1.5"><FileText className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No withdrawals match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Detail modal */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(null)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl glass rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={open.creator.avatar} className="h-14 w-14 rounded-full object-cover" alt="" />
                  <div>
                    <h2 className="font-bold text-lg">{open.creator.name}</h2>
                    <p className="text-xs text-muted-foreground">{open.creator.id} · {open.creator.state} · {open.creator.language}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] mt-1 rounded-full px-2 py-0.5 border ${open.kyc === "Verified" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-amber-500/30 text-amber-400 bg-amber-500/10"}`}>
                      {open.kyc === "Verified" ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />} KYC {open.kyc}
                    </span>
                  </div>
                </div>
                <button onClick={() => setOpen(null)} className="rounded-full bg-card/60 p-1.5"><X className="h-4 w-4" /></button>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/40 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Withdrawal</p>
                  <p className="text-2xl font-bold">{inr(open.amount)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Requested {open.date}</p>
                  <span className={`mt-2 inline-block text-[10px] rounded-full px-2 py-0.5 border ${TONE[open.status]}`}>{open.status}</span>
                </div>
                <div className="rounded-xl border border-border/40 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Bank Details</p>
                  <p className="text-sm font-semibold">{open.bank}</p>
                  <p className="text-xs">A/C: {open.account}</p>
                  <p className="text-xs">IFSC: {open.ifsc}</p>
                  <p className="text-xs">Holder: {open.holder}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Earnings Breakdown</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: "Chat", value: open.earnings.chat, icon: MessageSquare, color: "text-sky-400" },
                    { label: "Voice", value: open.earnings.voice, icon: Phone, color: "text-emerald-400" },
                    { label: "Video", value: open.earnings.video, icon: Video, color: "text-violet-400" },
                    { label: "Gifts", value: open.earnings.gift, icon: Gift, color: "text-pink-400" },
                  ].map((e) => {
                    const Icon = e.icon;
                    return (
                      <div key={e.label} className="rounded-xl border border-border/40 p-3">
                        <Icon className={`h-4 w-4 ${e.color}`} />
                        <p className="text-[10px] text-muted-foreground mt-1">{e.label}</p>
                        <p className="text-sm font-bold">{inr(e.value)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 justify-end">
                <button onClick={() => { updateStatus(open.id, "Hold"); setOpen(null); }} className="rounded-full px-4 py-1.5 text-xs bg-sky-500/15 text-sky-400 inline-flex items-center gap-1"><PauseCircle className="h-3.5 w-3.5" />Hold</button>
                <button onClick={() => { updateStatus(open.id, "Rejected"); setOpen(null); }} className="rounded-full px-4 py-1.5 text-xs bg-rose-500/15 text-rose-400 inline-flex items-center gap-1"><X className="h-3.5 w-3.5" />Reject</button>
                <button onClick={() => { updateStatus(open.id, "Approved"); setOpen(null); }} className="rounded-full px-4 py-1.5 text-xs bg-emerald-500 text-white inline-flex items-center gap-1"><Check className="h-3.5 w-3.5" />Approve Payout</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
