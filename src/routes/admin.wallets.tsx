import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CREATORS } from "@/lib/mock-data";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import {
  Search, Download, Wallet, Coins, TrendingUp, TrendingDown, Clock, Users,
  Snowflake, Flame, Plus, Minus, Eye, X, ArrowUpRight, ArrowDownLeft, FileText,
  ChevronLeft, ChevronRight, History, Filter, CheckCircle2, XCircle, RotateCcw,
  Gift, MessageSquare, Phone, Video, PauseCircle, PlayCircle,
} from "lucide-react";
import { toast } from "sonner";

type Role = "customer" | "creator";
type WalletStatus = "Active" | "Frozen" | "Hold";
type TxStatus = "Success" | "Pending" | "Failed" | "Refunded";
type TxType = "deposit" | "spend" | "withdraw" | "gift" | "chat" | "voice" | "video" | "refund";

interface WalletRow {
  id: string;
  walletId: string;
  role: Role;
  name: string;
  avatar: string;
  mobile: string;
  status: WalletStatus;
  balance: number;
  coins: number;
  deposits: number;
  spending: number;
  pending: number;
  earnings: number;
  withdrawn: number;
  breakdown: { gift: number; chat: number; voice: number; video: number };
  lastTx: string;
}

interface Transaction {
  id: string;
  userId: string;
  user: string;
  type: TxType;
  amount: number;
  coins: number;
  method: string;
  status: TxStatus;
  date: string;
}

const STATUSES: WalletStatus[] = ["Active", "Frozen", "Hold"];
const PAY_METHODS = ["UPI", "Card", "Netbanking", "Wallet", "Bank Transfer"];

const WALLETS: WalletRow[] = [
  ...CREATORS.slice(0, 12).map((c, i): WalletRow => {
    const deposits = 1000 + i * 850;
    const spending = 400 + i * 320;
    return {
      id: `cust_${i}`,
      walletId: `WLT-C${10000 + i}`,
      role: "customer",
      name: ["Rahul Sharma", "Vikram Singh", "Amit Patel", "Rohan Mehta", "Karan Joshi", "Arjun Rao", "Sahil Kapoor", "Dev Iyer", "Manish Roy", "Yash Bose", "Aman Khan", "Nikhil Pillai"][i],
      avatar: `https://i.pravatar.cc/200?u=cust${i}`,
      mobile: `+91 98${String(10000000 + i * 137).slice(0, 8)}`,
      status: STATUSES[i % 5 === 0 ? 1 : 0],
      balance: deposits - spending,
      coins: (deposits - spending) * 2,
      deposits,
      spending,
      pending: 0,
      earnings: 0,
      withdrawn: 0,
      breakdown: { gift: 0, chat: 0, voice: 0, video: 0 },
      lastTx: new Date(2026, 4, 20 + (i % 10)).toISOString().slice(0, 10),
    };
  }),
  ...CREATORS.slice(0, 14).map((c, i): WalletRow => {
    const gift = 2000 + i * 540;
    const chat = 800 + i * 230;
    const voice = 1200 + i * 310;
    const video = 1800 + i * 420;
    const earnings = gift + chat + voice + video;
    const withdrawn = Math.floor(earnings * 0.55);
    const pending = Math.floor(earnings * 0.15);
    return {
      id: `cr_${c.id}`,
      walletId: `WLT-K${20000 + i}`,
      role: "creator",
      name: c.name,
      avatar: c.avatar,
      mobile: `+91 97${String(20000000 + i * 211).slice(0, 8)}`,
      status: i % 7 === 0 ? "Hold" : i % 11 === 0 ? "Frozen" : "Active",
      balance: earnings - withdrawn - pending,
      coins: 0,
      deposits: 0,
      spending: 0,
      pending,
      earnings,
      withdrawn,
      breakdown: { gift, chat, voice, video },
      lastTx: new Date(2026, 4, 18 + (i % 12)).toISOString().slice(0, 10),
    };
  }),
];

const TRANSACTIONS: Transaction[] = Array.from({ length: 60 }).map((_, i) => {
  const w = WALLETS[i % WALLETS.length];
  const types: TxType[] = w.role === "customer"
    ? ["deposit", "spend", "gift", "chat", "refund"]
    : ["gift", "chat", "voice", "video", "withdraw"];
  const type = types[i % types.length];
  const statuses: TxStatus[] = ["Success", "Success", "Success", "Pending", "Failed", "Refunded"];
  return {
    id: `TX${1000000 + i}`,
    userId: w.id,
    user: w.name,
    type,
    amount: 50 + (i * 73) % 4500,
    coins: 50 + (i * 53) % 800,
    method: PAY_METHODS[i % PAY_METHODS.length],
    status: statuses[i % statuses.length],
    date: new Date(2026, 4, 1 + (i % 28), (i * 3) % 24, (i * 7) % 60).toLocaleString(),
  };
});

const STATUS_TONE: Record<WalletStatus | TxStatus, string> = {
  Active: "bg-success/20 text-success",
  Frozen: "bg-blue-500/20 text-blue-300",
  Hold: "bg-warning/20 text-warning",
  Success: "bg-success/20 text-success",
  Pending: "bg-warning/20 text-warning",
  Failed: "bg-destructive/20 text-destructive",
  Refunded: "bg-orange-500/20 text-orange-300",
};

function Pill({ s }: { s: WalletStatus | TxStatus }) {
  return <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${STATUS_TONE[s]}`}>{s}</span>;
}

function SummaryCard({ icon: Icon, label, value, sub, tone }: any) {
  return (
    <GlassCard className="!p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold mt-1">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={`rounded-xl p-2 ${tone}`}><Icon className="h-4 w-4" /></div>
      </div>
    </GlassCard>
  );
}

function exportCsv(rows: any[], name: string, head: string[]) {
  const csv = [head.join(","), ...rows.map(r => head.map(k => `"${(r as any)[k] ?? ""}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${name}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast.success(`${name}.csv exported`);
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function WalletsPage() {
  const [wallets, setWallets] = useState<WalletRow[]>(WALLETS);
  const [txs, setTxs] = useState<Transaction[]>(TRANSACTIONS);
  const [search, setSearch] = useState("");
  const [roleF, setRoleF] = useState<"all" | Role>("all");
  const [statusF, setStatusF] = useState<"all" | WalletStatus>("all");
  const [dateF, setDateF] = useState("");
  const [tab, setTab] = useState<"customer" | "creator" | "transactions">("customer");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<WalletRow | null>(null);
  const [adjustOpen, setAdjustOpen] = useState<{ mode: "add" | "deduct" | "adjust" } | null>(null);
  const [audit, setAudit] = useState<{ admin: string; action: string; ts: string }[]>([
    { admin: "admin@velora.live", action: "Opened wallets dashboard", ts: new Date().toLocaleString() },
  ]);

  const logAction = (action: string) =>
    setAudit(a => [{ admin: "admin@velora.live", action, ts: new Date().toLocaleString() }, ...a]);

  const stats = useMemo(() => {
    const customers = wallets.filter(w => w.role === "customer");
    const creators = wallets.filter(w => w.role === "creator");
    const today = new Date().toISOString().slice(0, 10);
    return {
      platform: customers.reduce((s, w) => s + w.deposits, 0) - creators.reduce((s, w) => s + w.withdrawn, 0),
      customerBal: customers.reduce((s, w) => s + w.balance, 0),
      creatorBal: creators.reduce((s, w) => s + w.balance, 0),
      todayDeposits: txs.filter(t => t.type === "deposit" && t.status === "Success").reduce((s, t) => s + t.amount, 0),
      todayWithdrawals: txs.filter(t => t.type === "withdraw" && t.status === "Success").reduce((s, t) => s + t.amount, 0),
      pendingWd: txs.filter(t => t.type === "withdraw" && t.status === "Pending").length,
      coins: customers.reduce((s, w) => s + w.coins, 0),
    };
  }, [wallets, txs]);

  const filtered = useMemo(() => {
    const base = tab === "transactions" ? [] : wallets.filter(w => w.role === tab);
    return base.filter(w => {
      const q = search.toLowerCase();
      if (q && !(w.name.toLowerCase().includes(q) || w.walletId.toLowerCase().includes(q) || w.mobile.includes(q))) return false;
      if (roleF !== "all" && w.role !== roleF) return false;
      if (statusF !== "all" && w.status !== statusF) return false;
      if (dateF && w.lastTx !== dateF) return false;
      return true;
    });
  }, [wallets, search, tab, roleF, statusF, dateF]);

  const filteredTx = useMemo(() => txs.filter(t => {
    const q = search.toLowerCase();
    if (q && !(t.user.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))) return false;
    return true;
  }), [txs, search]);

  const perPage = 8;
  const list = tab === "transactions" ? filteredTx : filtered;
  const pages = Math.max(1, Math.ceil(list.length / perPage));
  const view = list.slice((page - 1) * perPage, page * perPage);

  const userTxs = (uid: string) => txs.filter(t => t.userId === uid);

  const toggleFreeze = (w: WalletRow) => {
    const next: WalletStatus = w.status === "Frozen" ? "Active" : "Frozen";
    setWallets(ws => ws.map(x => x.id === w.id ? { ...x, status: next } : x));
    if (selected?.id === w.id) setSelected({ ...w, status: next });
    logAction(`${next === "Frozen" ? "Froze" : "Unfroze"} wallet ${w.walletId}`);
    toast.success(`${w.name}'s wallet ${next.toLowerCase()}`);
  };
  const toggleHold = (w: WalletRow) => {
    const next: WalletStatus = w.status === "Hold" ? "Active" : "Hold";
    setWallets(ws => ws.map(x => x.id === w.id ? { ...x, status: next } : x));
    if (selected?.id === w.id) setSelected({ ...w, status: next });
    logAction(`${next === "Hold" ? "Held" : "Released"} earnings ${w.walletId}`);
    toast(`${w.name}'s earnings ${next === "Hold" ? "on hold" : "released"}`);
  };
  const applyAdjust = (w: WalletRow, delta: number, mode: "add" | "deduct" | "adjust") => {
    setWallets(ws => ws.map(x => x.id === w.id ? {
      ...x,
      coins: w.role === "customer" ? Math.max(0, x.coins + delta) : x.coins,
      balance: w.role === "creator" ? Math.max(0, x.balance + delta) : x.balance,
    } : x));
    logAction(`${mode === "add" ? "Added" : mode === "deduct" ? "Deducted" : "Adjusted"} ${Math.abs(delta)} on ${w.walletId}`);
    toast.success(`${mode === "add" ? "Added" : mode === "deduct" ? "Deducted" : "Adjusted"} ${Math.abs(delta)}`);
    setAdjustOpen(null);
  };

  return (
    <div>
      <PageHeader
        title="Wallet Management"
        subtitle="Customer & creator wallets, deposits, earnings & withdrawals"
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={() => exportCsv(wallets, "wallets", ["walletId", "role", "name", "mobile", "status", "balance", "coins"])} className="glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5"><Download className="h-3.5 w-3.5" /> CSV</button>
            <button onClick={() => exportCsv(wallets, "wallets-excel", ["walletId", "role", "name", "mobile", "status", "balance", "coins"])} className="glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Excel</button>
            <button onClick={() => { window.print(); toast("Opening print → save as PDF"); }} className="glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> PDF</button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <SummaryCard icon={Wallet} label="Platform Balance" value={inr(stats.platform)} tone="bg-primary/20 text-primary" />
        <SummaryCard icon={Users} label="Customer Wallets" value={inr(stats.customerBal)} tone="bg-blue-500/20 text-blue-300" />
        <SummaryCard icon={Users} label="Creator Wallets" value={inr(stats.creatorBal)} tone="bg-purple-500/20 text-purple-300" />
        <SummaryCard icon={TrendingUp} label="Today's Deposits" value={inr(stats.todayDeposits)} tone="bg-success/20 text-success" />
        <SummaryCard icon={TrendingDown} label="Today's Withdrawals" value={inr(stats.todayWithdrawals)} tone="bg-orange-500/20 text-orange-300" />
        <SummaryCard icon={Clock} label="Pending WD" value={stats.pendingWd} tone="bg-warning/20 text-warning" />
        <SummaryCard icon={Coins} label="Coins in Circulation" value={stats.coins.toLocaleString()} tone="bg-amber-500/20 text-amber-300" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 glass rounded-full p-1 w-fit">
        {(["customer", "creator", "transactions"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }} className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {t === "transactions" ? "Transactions" : `${t} Wallets`}
          </button>
        ))}
      </div>

      {/* Filters */}
      <GlassCard className="!p-3 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, wallet ID, mobile..." className="w-full bg-background/40 rounded-full pl-9 pr-4 py-2 text-sm outline-none border border-border/40" />
          </div>
          {tab !== "transactions" && (
            <>
              <select value={statusF} onChange={e => { setStatusF(e.target.value as any); setPage(1); }} className="bg-background/40 border border-border/40 rounded-full px-3 py-2 text-sm outline-none">
                <option value="all">All status</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="date" value={dateF} onChange={e => { setDateF(e.target.value); setPage(1); }} className="bg-background/40 border border-border/40 rounded-full px-3 py-2 text-sm outline-none" />
            </>
          )}
          {(search || statusF !== "all" || dateF) && (
            <button onClick={() => { setSearch(""); setStatusF("all"); setDateF(""); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><Filter className="h-3 w-3" /> Clear</button>
          )}
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {tab === "customer" && (
            <table className="w-full text-sm">
              <thead className="bg-background/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Customer</th>
                  <th className="text-left p-3">Wallet ID</th>
                  <th className="text-right p-3">Balance</th>
                  <th className="text-right p-3">Coins</th>
                  <th className="text-right p-3">Deposits</th>
                  <th className="text-right p-3">Spending</th>
                  <th className="text-left p-3">Last Tx</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(view as WalletRow[]).map(w => (
                  <tr key={w.id} className="border-t border-border/30 hover:bg-background/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <img src={w.avatar} className="h-9 w-9 rounded-full" alt="" />
                        <div>
                          <p className="font-semibold text-xs">{w.name}</p>
                          <p className="text-[10px] text-muted-foreground">{w.mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-xs font-mono">{w.walletId}</td>
                    <td className="p-3 text-right text-xs font-semibold">{inr(w.balance)}</td>
                    <td className="p-3 text-right text-xs text-amber-300">{w.coins.toLocaleString()}</td>
                    <td className="p-3 text-right text-xs text-success">{inr(w.deposits)}</td>
                    <td className="p-3 text-right text-xs text-orange-300">{inr(w.spending)}</td>
                    <td className="p-3 text-xs">{w.lastTx}</td>
                    <td className="p-3"><Pill s={w.status} /></td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setSelected(w)} title="View" className="rounded-full bg-primary/20 text-primary p-1.5"><Eye className="h-3 w-3" /></button>
                        <button onClick={() => { setSelected(w); setAdjustOpen({ mode: "add" }); }} title="Add coins" className="rounded-full bg-success/20 text-success p-1.5"><Plus className="h-3 w-3" /></button>
                        <button onClick={() => { setSelected(w); setAdjustOpen({ mode: "deduct" }); }} title="Deduct coins" className="rounded-full bg-orange-500/20 text-orange-300 p-1.5"><Minus className="h-3 w-3" /></button>
                        <button onClick={() => toggleFreeze(w)} title="Freeze/Unfreeze" className={`rounded-full p-1.5 ${w.status === "Frozen" ? "bg-orange-500/20 text-orange-300" : "bg-blue-500/20 text-blue-300"}`}>{w.status === "Frozen" ? <Flame className="h-3 w-3" /> : <Snowflake className="h-3 w-3" />}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "creator" && (
            <table className="w-full text-sm">
              <thead className="bg-background/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Creator</th>
                  <th className="text-left p-3">Wallet ID</th>
                  <th className="text-right p-3">Balance</th>
                  <th className="text-right p-3">Pending</th>
                  <th className="text-right p-3">Earnings</th>
                  <th className="text-right p-3">Withdrawn</th>
                  <th className="text-right p-3">Gift</th>
                  <th className="text-right p-3">Chat</th>
                  <th className="text-right p-3">Voice</th>
                  <th className="text-right p-3">Video</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(view as WalletRow[]).map(w => (
                  <tr key={w.id} className="border-t border-border/30 hover:bg-background/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <img src={w.avatar} className="h-9 w-9 rounded-full" alt="" />
                        <p className="font-semibold text-xs">{w.name}</p>
                      </div>
                    </td>
                    <td className="p-3 text-xs font-mono">{w.walletId}</td>
                    <td className="p-3 text-right text-xs font-semibold">{inr(w.balance)}</td>
                    <td className="p-3 text-right text-xs text-warning">{inr(w.pending)}</td>
                    <td className="p-3 text-right text-xs text-success">{inr(w.earnings)}</td>
                    <td className="p-3 text-right text-xs text-orange-300">{inr(w.withdrawn)}</td>
                    <td className="p-3 text-right text-xs">{inr(w.breakdown.gift)}</td>
                    <td className="p-3 text-right text-xs">{inr(w.breakdown.chat)}</td>
                    <td className="p-3 text-right text-xs">{inr(w.breakdown.voice)}</td>
                    <td className="p-3 text-right text-xs">{inr(w.breakdown.video)}</td>
                    <td className="p-3"><Pill s={w.status} /></td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setSelected(w)} title="View" className="rounded-full bg-primary/20 text-primary p-1.5"><Eye className="h-3 w-3" /></button>
                        <button onClick={() => { setSelected(w); setAdjustOpen({ mode: "adjust" }); }} title="Adjust balance" className="rounded-full bg-purple-500/20 text-purple-300 p-1.5"><RotateCcw className="h-3 w-3" /></button>
                        <button onClick={() => toggleHold(w)} title="Hold/Release" className={`rounded-full p-1.5 ${w.status === "Hold" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}>{w.status === "Hold" ? <PlayCircle className="h-3 w-3" /> : <PauseCircle className="h-3 w-3" />}</button>
                        <button onClick={() => toggleFreeze(w)} title="Freeze/Unfreeze" className={`rounded-full p-1.5 ${w.status === "Frozen" ? "bg-orange-500/20 text-orange-300" : "bg-blue-500/20 text-blue-300"}`}>{w.status === "Frozen" ? <Flame className="h-3 w-3" /> : <Snowflake className="h-3 w-3" />}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "transactions" && (
            <table className="w-full text-sm">
              <thead className="bg-background/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Tx ID</th>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-right p-3">Coins</th>
                  <th className="text-left p-3">Method</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {(view as Transaction[]).map(t => (
                  <tr key={t.id} className="border-t border-border/30 hover:bg-background/30">
                    <td className="p-3 text-xs font-mono">{t.id}</td>
                    <td className="p-3 text-xs">{t.user}</td>
                    <td className="p-3 text-xs capitalize flex items-center gap-1">
                      {t.type === "deposit" || t.type === "refund" ? <ArrowDownLeft className="h-3 w-3 text-success" /> : <ArrowUpRight className="h-3 w-3 text-orange-300" />}
                      {t.type}
                    </td>
                    <td className="p-3 text-right text-xs font-semibold">{inr(t.amount)}</td>
                    <td className="p-3 text-right text-xs text-amber-300">{t.coins}</td>
                    <td className="p-3 text-xs">{t.method}</td>
                    <td className="p-3"><Pill s={t.status} /></td>
                    <td className="p-3 text-xs">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {view.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">No records match your filters</div>}
        </div>

        <div className="flex items-center justify-between p-3 border-t border-border/30 text-xs">
          <p className="text-muted-foreground">{list.length} records · page {page} of {pages}</p>
          <div className="flex items-center gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="glass rounded-full p-1.5 disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" /></button>
            {Array.from({ length: Math.min(5, pages) }).map((_, i) => (
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
            {audit.map((l, i) => (
              <div key={i} className="flex justify-between border-b border-border/20 pb-1.5">
                <div><span className="font-medium">{l.admin}</span><span className="text-muted-foreground"> · {l.action}</span></div>
                <span className="text-muted-foreground">{l.ts}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Wallet detail modal */}
      <AnimatePresence>
        {selected && !adjustOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <motion.div initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30 }} onClick={e => e.stopPropagation()} className="bg-card border border-border/40 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/40 p-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <img src={selected.avatar} className="h-12 w-12 rounded-full" alt="" />
                  <div>
                    <h2 className="font-bold">{selected.name}</h2>
                    <p className="text-xs text-muted-foreground font-mono">{selected.walletId} · {selected.role} · <Pill s={selected.status} /></p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="glass rounded-full p-2"><X className="h-4 w-4" /></button>
              </div>

              <div className="p-4 space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <GlassCard className="!p-3"><p className="text-[10px] text-muted-foreground">Balance</p><p className="font-bold text-lg">{inr(selected.balance)}</p></GlassCard>
                  {selected.role === "customer" ? (
                    <>
                      <GlassCard className="!p-3"><p className="text-[10px] text-muted-foreground">Coins</p><p className="font-bold text-lg text-amber-300">{selected.coins.toLocaleString()}</p></GlassCard>
                      <GlassCard className="!p-3"><p className="text-[10px] text-muted-foreground">Total Deposits</p><p className="font-bold text-lg text-success">{inr(selected.deposits)}</p></GlassCard>
                      <GlassCard className="!p-3"><p className="text-[10px] text-muted-foreground">Total Spending</p><p className="font-bold text-lg text-orange-300">{inr(selected.spending)}</p></GlassCard>
                    </>
                  ) : (
                    <>
                      <GlassCard className="!p-3"><p className="text-[10px] text-muted-foreground">Pending</p><p className="font-bold text-lg text-warning">{inr(selected.pending)}</p></GlassCard>
                      <GlassCard className="!p-3"><p className="text-[10px] text-muted-foreground">Total Earnings</p><p className="font-bold text-lg text-success">{inr(selected.earnings)}</p></GlassCard>
                      <GlassCard className="!p-3"><p className="text-[10px] text-muted-foreground">Withdrawn</p><p className="font-bold text-lg text-orange-300">{inr(selected.withdrawn)}</p></GlassCard>
                    </>
                  )}
                </div>

                {/* Earnings breakdown for creators */}
                {selected.role === "creator" && (
                  <GlassCard>
                    <h3 className="font-semibold text-sm mb-3">Earnings Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { icon: Gift, label: "Gifts", val: selected.breakdown.gift, tone: "text-pink-300" },
                        { icon: MessageSquare, label: "Chat", val: selected.breakdown.chat, tone: "text-blue-300" },
                        { icon: Phone, label: "Voice", val: selected.breakdown.voice, tone: "text-purple-300" },
                        { icon: Video, label: "Video", val: selected.breakdown.video, tone: "text-green-300" },
                      ].map((b, i) => (
                        <div key={i} className="bg-background/40 rounded-xl p-3">
                          <b.icon className={`h-4 w-4 mb-1 ${b.tone}`} />
                          <p className="text-[10px] text-muted-foreground">{b.label}</p>
                          <p className="font-bold text-sm">{inr(b.val)}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* Transactions for this user */}
                <GlassCard>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><History className="h-4 w-4" /> Transaction History</h3>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {userTxs(selected.id).length === 0 && <p className="text-xs text-muted-foreground">No transactions yet</p>}
                    {userTxs(selected.id).map(t => (
                      <div key={t.id} className="flex items-center justify-between bg-background/30 rounded-lg p-2 text-xs">
                        <div className="flex items-center gap-2">
                          {t.type === "deposit" || t.type === "refund" ? <ArrowDownLeft className="h-3.5 w-3.5 text-success" /> : <ArrowUpRight className="h-3.5 w-3.5 text-orange-300" />}
                          <div>
                            <p className="capitalize font-medium">{t.type} · {t.method}</p>
                            <p className="text-[10px] text-muted-foreground">{t.id} · {t.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{inr(t.amount)}</p>
                          <Pill s={t.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* Actions */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {selected.role === "customer" ? (
                    <>
                      <button onClick={() => setAdjustOpen({ mode: "add" })} className="rounded-xl bg-success/20 text-success py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"><Plus className="h-4 w-4" /> Add Coins</button>
                      <button onClick={() => setAdjustOpen({ mode: "deduct" })} className="rounded-xl bg-orange-500/20 text-orange-300 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"><Minus className="h-4 w-4" /> Deduct</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setAdjustOpen({ mode: "adjust" })} className="rounded-xl bg-purple-500/20 text-purple-300 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"><RotateCcw className="h-4 w-4" /> Adjust</button>
                      <button onClick={() => toggleHold(selected)} className="rounded-xl bg-warning/20 text-warning py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5">{selected.status === "Hold" ? <><PlayCircle className="h-4 w-4" /> Release</> : <><PauseCircle className="h-4 w-4" /> Hold</>}</button>
                    </>
                  )}
                  <button onClick={() => toggleFreeze(selected)} className="rounded-xl bg-blue-500/20 text-blue-300 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5">{selected.status === "Frozen" ? <><Flame className="h-4 w-4" /> Unfreeze</> : <><Snowflake className="h-4 w-4" /> Freeze</>}</button>
                  <button onClick={() => exportCsv(userTxs(selected.id), `${selected.walletId}-tx`, ["id", "type", "amount", "coins", "method", "status", "date"])} className="rounded-xl bg-primary/20 text-primary py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"><Download className="h-4 w-4" /> Export</button>
                  <button onClick={() => { setSelected(null); toast("Closed"); }} className="rounded-xl glass py-2.5 text-xs font-semibold">Close</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adjust modal */}
      <AnimatePresence>
        {adjustOpen && selected && (
          <AdjustModal mode={adjustOpen.mode} wallet={selected} onClose={() => setAdjustOpen(null)} onConfirm={(amt) => applyAdjust(selected, adjustOpen.mode === "deduct" ? -amt : amt, adjustOpen.mode)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function AdjustModal({ mode, wallet, onClose, onConfirm }: { mode: "add" | "deduct" | "adjust"; wallet: WalletRow; onClose: () => void; onConfirm: (n: number) => void }) {
  const [amount, setAmount] = useState(100);
  const [note, setNote] = useState("");
  const title = mode === "add" ? "Add Coins" : mode === "deduct" ? "Deduct Coins" : "Adjust Balance";
  const Icon = mode === "add" ? Plus : mode === "deduct" ? Minus : RotateCcw;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="bg-card border border-border/40 rounded-2xl max-w-md w-full p-5">
        <div className="flex items-center gap-2 mb-1"><Icon className="h-5 w-5 text-primary" /><h3 className="font-bold">{title}</h3></div>
        <p className="text-xs text-muted-foreground mb-4">{wallet.name} · {wallet.walletId}</p>
        <label className="text-xs text-muted-foreground">Amount {wallet.role === "customer" ? "(coins)" : "(₹)"}</label>
        <input type="number" value={amount} onChange={e => setAmount(+e.target.value)} className="w-full bg-background/40 border border-border/40 rounded-lg px-3 py-2 text-sm mt-1 mb-3 outline-none" />
        <label className="text-xs text-muted-foreground">Reason / note</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Audit note..." className="w-full bg-background/40 border border-border/40 rounded-lg px-3 py-2 text-sm mt-1 mb-4 outline-none h-20 resize-none" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 glass rounded-xl py-2.5 text-sm">Cancel</button>
          <button onClick={() => onConfirm(amount)} className="flex-1 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold">Confirm</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export const Route = createFileRoute("/admin/wallets")({ component: WalletsPage });
