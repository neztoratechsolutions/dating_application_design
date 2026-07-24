import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CREATORS, STATES } from "@/lib/mock-data";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import {
  Search, Filter, Download, CheckCircle2, XCircle, RotateCcw, Ban, ShieldAlert,
  Clock, FileCheck2, Users, AlertTriangle, X, Eye, MapPin, Mail, Phone,
  Calendar, CreditCard, FileText, Camera, ShieldCheck, History, Fingerprint,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

type KycStatus = "Pending" | "Under Review" | "Approved" | "Rejected" | "Re-upload Required";
type DocStatus = "Verified" | "Pending" | "Rejected" | "Re-upload";

interface KycRow {
  id: string;
  creatorId: string;
  name: string;
  avatar: string;
  mobile: string;
  email: string;
  state: string;
  joinDate: string;
  aadhaar: DocStatus;
  pan: DocStatus;
  selfie: DocStatus;
  status: KycStatus;
  fraud: string[];
  bank: { holder: string; account: string; ifsc: string; bank: string };
  agreement: { date: string; ip: string; accepted: boolean };
  timeline: { ts: string; event: string }[];
}

const STATUSES: KycStatus[] = ["Pending", "Under Review", "Approved", "Rejected", "Re-upload Required"];
const REJECTION_REASONS = [
  "Aadhaar blurry", "PAN blurry", "Selfie mismatch", "Name mismatch",
  "Invalid document", "Duplicate account", "Other reason",
];
const FRAUD_FLAGS = [
  "Duplicate PAN detected", "Duplicate Aadhaar detected",
  "Multiple accounts detected", "Suspicious device", "High-risk account",
];

const DOC_IMG = "https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?w=600&q=70";
const SELFIE_IMG = (s: string) => `https://i.pravatar.cc/600?u=${encodeURIComponent(s)}`;

const INITIAL_ROWS: KycRow[] = CREATORS.map((c, i) => {
  const status = STATUSES[i % STATUSES.length];
  const docMap: Record<KycStatus, DocStatus> = {
    "Approved": "Verified", "Pending": "Pending", "Under Review": "Pending",
    "Rejected": "Rejected", "Re-upload Required": "Re-upload",
  };
  const ds = docMap[status];
  return {
    id: `kyc_${c.id}`,
    creatorId: `VLR${10000 + i}`,
    name: c.name,
    avatar: c.avatar,
    mobile: `+91 9${String(800000000 + i * 137).slice(0, 9)}`,
    email: `${c.name.toLowerCase().replace(/\s+/g, ".")}@velora.live`,
    state: c.state,
    joinDate: new Date(2026, 4, 1 + (i % 28)).toISOString().slice(0, 10),
    aadhaar: ds,
    pan: i % 7 === 0 ? "Re-upload" : ds,
    selfie: i % 9 === 0 ? "Rejected" : ds,
    status,
    fraud: i % 5 === 0 ? [FRAUD_FLAGS[i % FRAUD_FLAGS.length]] : [],
    bank: {
      holder: c.name,
      account: `XXXX XXXX ${1000 + i * 7}`,
      ifsc: `HDFC000${1000 + i}`,
      bank: ["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak"][i % 5],
    },
    agreement: {
      date: new Date(2026, 4, 1 + (i % 28)).toISOString().slice(0, 10),
      ip: `103.${20 + (i % 200)}.${i % 255}.${(i * 7) % 255}`,
      accepted: true,
    },
    timeline: [
      { ts: "2026-05-01 09:12", event: "Signup completed" },
      { ts: "2026-05-02 11:40", event: "Aadhaar uploaded" },
      { ts: "2026-05-02 11:42", event: "PAN uploaded" },
      { ts: "2026-05-02 11:45", event: "Selfie captured" },
      { ts: "2026-05-02 12:00", event: "KYC submitted for review" },
    ],
  };
});

const STAT_COLORS: Record<DocStatus | KycStatus, string> = {
  "Verified": "bg-success/20 text-success",
  "Approved": "bg-success/20 text-success",
  "Pending": "bg-warning/20 text-warning",
  "Under Review": "bg-blue-500/20 text-blue-300",
  "Rejected": "bg-destructive/20 text-destructive",
  "Re-upload": "bg-orange-500/20 text-orange-300",
  "Re-upload Required": "bg-orange-500/20 text-orange-300",
};

function StatusPill({ s }: { s: KycStatus | DocStatus }) {
  return <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${STAT_COLORS[s]}`}>{s}</span>;
}

function SummaryCard({ icon: Icon, label, value, tone }: any) {
  return (
    <GlassCard className="!p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
        </div>
        <div className={`rounded-xl p-2 ${tone}`}><Icon className="h-4 w-4" /></div>
      </div>
    </GlassCard>
  );
}

function exportCsv(rows: KycRow[], name: string) {
  const head = ["creatorId", "name", "mobile", "email", "state", "joinDate", "status"];
  const csv = [head.join(","), ...rows.map(r => head.map(k => `"${(r as any)[k]}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${name}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast.success(`${name}.csv exported`);
}

function KycPage() {
  const [rows, setRows] = useState<KycRow[]>(INITIAL_ROWS);
  const [search, setSearch] = useState("");
  const [stateF, setStateF] = useState("all");
  const [statusF, setStatusF] = useState<"all" | KycStatus>("all");
  const [dateF, setDateF] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<KycRow | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reuploadOpen, setReuploadOpen] = useState(false);
  const [auditLog, setAuditLog] = useState<{ admin: string; action: string; ts: string; notes?: string }[]>([
    { admin: "admin@velora.live", action: "Logged in", ts: new Date().toLocaleString() },
  ]);

  const filtered = useMemo(() => rows.filter(r => {
    const q = search.toLowerCase();
    if (q && !(r.name.toLowerCase().includes(q) || r.mobile.includes(q) || r.email.toLowerCase().includes(q) || r.creatorId.toLowerCase().includes(q))) return false;
    if (stateF !== "all" && r.state !== stateF) return false;
    if (statusF !== "all" && r.status !== statusF) return false;
    if (dateF && r.joinDate !== dateF) return false;
    return true;
  }), [rows, search, stateF, statusF, dateF]);

  const perPage = 8;
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const view = filtered.slice((page - 1) * perPage, page * perPage);

  const stats = useMemo(() => ({
    total: rows.length,
    pending: rows.filter(r => r.status === "Pending" || r.status === "Under Review").length,
    approved: rows.filter(r => r.status === "Approved").length,
    rejected: rows.filter(r => r.status === "Rejected").length,
    reupload: rows.filter(r => r.status === "Re-upload Required").length,
    today: rows.filter(r => r.status === "Approved").length,
  }), [rows]);

  const logAction = (action: string, notes?: string) => {
    setAuditLog(l => [{ admin: "admin@velora.live", action, ts: new Date().toLocaleString(), notes }, ...l]);
  };

  const updateStatus = (id: string, status: KycStatus, evt: string) => {
    setRows(rs => rs.map(r => r.id === id ? {
      ...r, status,
      timeline: [...r.timeline, { ts: new Date().toLocaleString(), event: evt }],
    } : r));
    if (selected?.id === id) setSelected(s => s ? { ...s, status, timeline: [...s.timeline, { ts: new Date().toLocaleString(), event: evt }] } : s);
  };

  const onApprove = (r: KycRow) => {
    updateStatus(r.id, "Approved", "KYC Approved by admin");
    logAction(`Approved KYC: ${r.creatorId}`);
    toast.success(`✅ ${r.name} approved · notification sent`);
  };
  const onReject = (r: KycRow, reason: string) => {
    updateStatus(r.id, "Rejected", `Rejected: ${reason}`);
    logAction(`Rejected KYC: ${r.creatorId}`, reason);
    toast.error(`❌ ${r.name} rejected · "${reason}" sent to creator`);
    setRejectOpen(false);
  };
  const onReupload = (r: KycRow, items: string[]) => {
    updateStatus(r.id, "Re-upload Required", `Re-upload requested: ${items.join(", ")}`);
    logAction(`Re-upload requested: ${r.creatorId}`, items.join(", "));
    toast(`📩 Re-upload notice sent to ${r.name}`);
    setReuploadOpen(false);
  };
  const onSuspend = (r: KycRow) => { logAction(`Suspended: ${r.creatorId}`); toast.warning(`${r.name} suspended`); };
  const onBan = (r: KycRow) => { logAction(`Banned: ${r.creatorId}`); toast.error(`${r.name} permanently banned`); };

  return (
    <div>
      <PageHeader
        title="KYC Management"
        subtitle="Review, approve & monitor creator verifications"
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={() => exportCsv(rows.filter(r => r.status === "Approved"), "approved-kyc")} className="glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5"><Download className="h-3.5 w-3.5" /> Approved</button>
            <button onClick={() => exportCsv(rows.filter(r => r.status === "Pending" || r.status === "Under Review"), "pending-kyc")} className="glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5"><Download className="h-3.5 w-3.5" /> Pending</button>
            <button onClick={() => exportCsv(rows.filter(r => r.status === "Rejected"), "rejected-kyc")} className="glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5"><Download className="h-3.5 w-3.5" /> Rejected</button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <SummaryCard icon={Users} label="Total Creators" value={stats.total} tone="bg-primary/20 text-primary" />
        <SummaryCard icon={Clock} label="Pending KYC" value={stats.pending} tone="bg-warning/20 text-warning" />
        <SummaryCard icon={CheckCircle2} label="Approved" value={stats.approved} tone="bg-success/20 text-success" />
        <SummaryCard icon={XCircle} label="Rejected" value={stats.rejected} tone="bg-destructive/20 text-destructive" />
        <SummaryCard icon={RotateCcw} label="Re-upload" value={stats.reupload} tone="bg-orange-500/20 text-orange-300" />
        <SummaryCard icon={FileCheck2} label="Completed Today" value={stats.today} tone="bg-blue-500/20 text-blue-300" />
      </div>

      {/* Filters */}
      <GlassCard className="!p-3 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, mobile, email, creator ID..." className="w-full bg-background/40 rounded-full pl-9 pr-4 py-2 text-sm outline-none border border-border/40" />
          </div>
          <select value={stateF} onChange={e => { setStateF(e.target.value); setPage(1); }} className="bg-background/40 border border-border/40 rounded-full px-3 py-2 text-sm outline-none">
            <option value="all">All states</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={statusF} onChange={e => { setStatusF(e.target.value as any); setPage(1); }} className="bg-background/40 border border-border/40 rounded-full px-3 py-2 text-sm outline-none">
            <option value="all">All status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" value={dateF} onChange={e => { setDateF(e.target.value); setPage(1); }} className="bg-background/40 border border-border/40 rounded-full px-3 py-2 text-sm outline-none" />
          {(search || stateF !== "all" || statusF !== "all" || dateF) && (
            <button onClick={() => { setSearch(""); setStateF("all"); setStatusF("all"); setDateF(""); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><Filter className="h-3 w-3" /> Clear</button>
          )}
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left p-3">Creator</th>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Mobile</th>
                <th className="text-left p-3">State</th>
                <th className="text-left p-3">Joined</th>
                <th className="text-left p-3">Aadhaar</th>
                <th className="text-left p-3">PAN</th>
                <th className="text-left p-3">Selfie</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Risk</th>
                <th className="text-right p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {view.map(r => (
                <tr key={r.id} className="border-t border-border/30 hover:bg-background/30">
                  <td className="p-3">
                    <div className="flex items-center gap-2 min-w-[160px]">
                      <img src={r.avatar} className="h-9 w-9 rounded-full" alt="" />
                      <div>
                        <p className="font-semibold text-xs">{r.name}</p>
                        <p className="text-[10px] text-muted-foreground">{r.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-xs font-mono">{r.creatorId}</td>
                  <td className="p-3 text-xs">{r.mobile}</td>
                  <td className="p-3 text-xs">{r.state}</td>
                  <td className="p-3 text-xs">{r.joinDate}</td>
                  <td className="p-3"><StatusPill s={r.aadhaar} /></td>
                  <td className="p-3"><StatusPill s={r.pan} /></td>
                  <td className="p-3"><StatusPill s={r.selfie} /></td>
                  <td className="p-3"><StatusPill s={r.status} /></td>
                  <td className="p-3">
                    {r.fraud.length > 0 ? (
                      <span title={r.fraud.join(", ")} className="inline-flex items-center gap-1 text-[10px] bg-destructive/20 text-destructive rounded-full px-2 py-0.5"><ShieldAlert className="h-3 w-3" /> {r.fraud.length}</span>
                    ) : <span className="text-[10px] text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => setSelected(r)} className="inline-flex items-center gap-1 rounded-full bg-primary/20 text-primary px-3 py-1 text-xs"><Eye className="h-3 w-3" /> Review</button>
                  </td>
                </tr>
              ))}
              {view.length === 0 && (
                <tr><td colSpan={11} className="text-center py-10 text-muted-foreground text-sm">No KYC records match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-3 border-t border-border/30 text-xs">
          <p className="text-muted-foreground">{filtered.length} records · page {page} of {pages}</p>
          <div className="flex items-center gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="glass rounded-full p-1.5 disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" /></button>
            {Array.from({ length: pages }).slice(0, 5).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`rounded-full w-7 h-7 text-xs ${page === i + 1 ? "bg-primary text-primary-foreground" : "glass"}`}>{i + 1}</button>
            ))}
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="glass rounded-full p-1.5 disabled:opacity-40"><ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </GlassCard>

      {/* Audit log */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><History className="h-4 w-4" /> Admin Audit Log</h3>
        <GlassCard className="!p-3 max-h-48 overflow-y-auto">
          <div className="space-y-1.5 text-xs">
            {auditLog.map((l, i) => (
              <div key={i} className="flex justify-between border-b border-border/20 pb-1.5">
                <div>
                  <span className="font-medium">{l.admin}</span>
                  <span className="text-muted-foreground"> · {l.action}</span>
                  {l.notes && <span className="text-muted-foreground italic"> — {l.notes}</span>}
                </div>
                <span className="text-muted-foreground">{l.ts}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <motion.div initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, scale: 0.96 }} onClick={e => e.stopPropagation()} className="bg-card border border-border/40 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/40 p-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <img src={selected.avatar} className="h-12 w-12 rounded-full" alt="" />
                  <div>
                    <h2 className="font-bold">{selected.name}</h2>
                    <p className="text-xs text-muted-foreground font-mono">{selected.creatorId} · <StatusPill s={selected.status} /></p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="glass rounded-full p-2"><X className="h-4 w-4" /></button>
              </div>

              <div className="p-4 grid lg:grid-cols-2 gap-4">
                {/* Personal */}
                <GlassCard>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><Users className="h-4 w-4" /> Personal Details</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2"><Phone className="h-3 w-3 text-muted-foreground" /> {selected.mobile}</div>
                    <div className="flex items-center gap-2"><Mail className="h-3 w-3 text-muted-foreground" /> {selected.email}</div>
                    <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-muted-foreground" /> {selected.state}</div>
                    <div className="flex items-center gap-2"><Calendar className="h-3 w-3 text-muted-foreground" /> Joined {selected.joinDate}</div>
                  </div>
                </GlassCard>

                {/* Bank */}
                <GlassCard>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><CreditCard className="h-4 w-4" /> Bank Details</h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Holder</span><span>{selected.bank.holder}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="font-mono">{selected.bank.account}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">IFSC</span><span className="font-mono">{selected.bank.ifsc}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span>{selected.bank.bank}</span></div>
                  </div>
                </GlassCard>

                {/* Documents */}
                <GlassCard className="lg:col-span-2">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><FileText className="h-4 w-4" /> Documents</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Aadhaar Front", img: DOC_IMG, status: selected.aadhaar },
                      { label: "Aadhaar Back", img: DOC_IMG, status: selected.aadhaar },
                      { label: "PAN Card", img: DOC_IMG, status: selected.pan },
                      { label: "Selfie", img: SELFIE_IMG(selected.name), status: selected.selfie, icon: Camera },
                    ].map((d, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="relative rounded-lg overflow-hidden border border-border/40 aspect-[4/3] bg-background/40">
                          <img src={d.img} className="w-full h-full object-cover" alt={d.label} />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-white/20 text-3xl font-black rotate-[-25deg] tracking-widest">VELORA</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[11px] font-medium">{d.label}</p>
                          <StatusPill s={d.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* Agreement */}
                <GlassCard>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Creator Agreement</h3>
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="text-success">Accepted ✓</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{selected.agreement.date}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">IP Address</span><span className="font-mono">{selected.agreement.ip}</span></div>
                    <button onClick={() => toast("Opening signed agreement PDF...")} className="mt-2 w-full glass rounded-lg py-1.5 text-xs">View agreement</button>
                  </div>
                </GlassCard>

                {/* Fraud */}
                <GlassCard>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><Fingerprint className="h-4 w-4" /> Fraud Signals</h3>
                  {selected.fraud.length === 0 ? (
                    <p className="text-xs text-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> No fraud signals detected</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selected.fraud.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs bg-destructive/10 text-destructive rounded-lg px-2 py-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" /> {f}
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>

                {/* Timeline */}
                <GlassCard className="lg:col-span-2">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><History className="h-4 w-4" /> KYC Timeline</h3>
                  <div className="space-y-2">
                    {selected.timeline.map((t, i) => (
                      <div key={i} className="flex gap-3 text-xs">
                        <div className="flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          {i < selected.timeline.length - 1 && <div className="w-px flex-1 bg-border/40" />}
                        </div>
                        <div className="pb-2">
                          <p className="font-medium">{t.event}</p>
                          <p className="text-muted-foreground text-[10px]">{t.ts}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* Actions */}
                <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-5 gap-2">
                  <button onClick={() => onApprove(selected)} className="rounded-xl bg-success/20 text-success py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-success/30"><CheckCircle2 className="h-4 w-4" /> Approve</button>
                  <button onClick={() => setRejectOpen(true)} className="rounded-xl bg-destructive/20 text-destructive py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-destructive/30"><XCircle className="h-4 w-4" /> Reject</button>
                  <button onClick={() => setReuploadOpen(true)} className="rounded-xl bg-orange-500/20 text-orange-300 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-orange-500/30"><RotateCcw className="h-4 w-4" /> Re-upload</button>
                  <button onClick={() => onSuspend(selected)} className="rounded-xl bg-warning/20 text-warning py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-warning/30"><ShieldAlert className="h-4 w-4" /> Suspend</button>
                  <button onClick={() => onBan(selected)} className="rounded-xl bg-destructive/30 text-destructive py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-destructive/40"><Ban className="h-4 w-4" /> Ban</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject reasons */}
      <AnimatePresence>
        {rejectOpen && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setRejectOpen(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="bg-card border border-border/40 rounded-2xl max-w-md w-full p-5">
              <h3 className="font-bold mb-1">Reject KYC</h3>
              <p className="text-xs text-muted-foreground mb-4">Choose a reason — creator gets notified</p>
              <div className="space-y-1.5">
                {REJECTION_REASONS.map(r => (
                  <button key={r} onClick={() => onReject(selected, r)} className="w-full text-left glass rounded-lg px-3 py-2 text-xs hover:bg-destructive/10">{r}</button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Re-upload selection */}
      <AnimatePresence>
        {reuploadOpen && selected && (
          <ReuploadModal creator={selected} onClose={() => setReuploadOpen(false)} onConfirm={(items) => onReupload(selected, items)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ReuploadModal({ creator, onClose, onConfirm }: { creator: KycRow; onClose: () => void; onConfirm: (items: string[]) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const items = ["Aadhaar", "PAN", "Selfie", "Bank details"];
  const toggle = (i: string) => setPicked(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="bg-card border border-border/40 rounded-2xl max-w-md w-full p-5">
        <h3 className="font-bold mb-1">Request Re-upload</h3>
        <p className="text-xs text-muted-foreground mb-4">Pick what {creator.name} needs to re-submit</p>
        <div className="space-y-1.5 mb-4">
          {items.map(i => (
            <label key={i} className="flex items-center gap-2 glass rounded-lg px-3 py-2 text-xs cursor-pointer">
              <input type="checkbox" checked={picked.includes(i)} onChange={() => toggle(i)} className="accent-primary" />
              {i}
            </label>
          ))}
        </div>
        <button disabled={picked.length === 0} onClick={() => onConfirm(picked)} className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold disabled:opacity-40">Send Notification</button>
      </motion.div>
    </motion.div>
  );
}

export const Route = createFileRoute("/admin/kyc")({ component: KycPage });
