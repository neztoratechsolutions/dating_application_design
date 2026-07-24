import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import {
  TrendingUp, TrendingDown, Wallet, Coins, MessageSquare, Phone, Video, Gift,
  Gamepad2, Sparkles, Download, Calendar, IndianRupee, ArrowUpRight, ArrowDownRight, PieChart as PieIcon,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/revenue")({ component: RevenuePage });

type Range = "today" | "7d" | "30d" | "month" | "custom";

const SOURCES = [
  { key: "coin", label: "Coin Purchase", icon: Coins, color: "#f59e0b" },
  { key: "chat", label: "Chat", icon: MessageSquare, color: "#3b82f6" },
  { key: "voice", label: "Voice Call", icon: Phone, color: "#10b981" },
  { key: "video", label: "Video Call", icon: Video, color: "#8b5cf6" },
  { key: "gift", label: "Gifts", icon: Gift, color: "#ec4899" },
  { key: "color", label: "Colour Connect", icon: Gamepad2, color: "#06b6d4" },
  { key: "scratch", label: "Scratch Game", icon: Sparkles, color: "#f43f5e" },
] as const;

const TREND = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  return {
    date: `May ${day}`,
    revenue: 80000 + Math.round(Math.sin(i / 3) * 30000 + Math.random() * 25000 + i * 1800),
    profit: 24000 + Math.round(Math.cos(i / 4) * 9000 + Math.random() * 7000 + i * 600),
    payout: 50000 + Math.round(Math.sin(i / 5) * 15000 + Math.random() * 12000 + i * 1100),
  };
});

const MONTHLY = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => ({
  month: m,
  revenue: 1800000 + i * 240000 + Math.round(Math.random() * 400000),
  profit: 540000 + i * 80000 + Math.round(Math.random() * 120000),
}));

const SOURCE_REVENUE = SOURCES.map((s, i) => ({
  ...s,
  amount: [4820000, 2140000, 1680000, 2950000, 3180000, 740000, 520000][i],
  tx: [18420, 56210, 12380, 9870, 24100, 8420, 14200][i],
}));

const TOTAL = SOURCE_REVENUE.reduce((a, b) => a + b.amount, 0);

const TABLE_ROWS = Array.from({ length: 28 }, (_, i) => {
  const src = SOURCES[i % SOURCES.length];
  const amount = 18000 + Math.round(Math.random() * 180000);
  const payout = Math.round(amount * 0.7);
  return {
    id: i,
    date: `2026-05-${String(28 - (i % 28)).padStart(2, "0")}`,
    source: src.label,
    sourceKey: src.key,
    amount,
    tx: 40 + Math.round(Math.random() * 800),
    payout,
    profit: amount - payout,
  };
});

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const compact = (n: number) =>
  n >= 1e7 ? `₹${(n / 1e7).toFixed(2)}Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)}L` : n >= 1e3 ? `₹${(n / 1e3).toFixed(1)}K` : `₹${n}`;

function Kpi({
  label, value, delta, icon: Icon, tone = "primary",
}: { label: string; value: string; delta?: number; icon: any; tone?: "primary" | "success" | "warning" | "danger" | "info" }) {
  const tones: Record<string, string> = {
    primary: "from-primary/20 to-primary/5 text-primary",
    success: "from-emerald-500/20 to-emerald-500/5 text-emerald-400",
    warning: "from-amber-500/20 to-amber-500/5 text-amber-400",
    danger: "from-rose-500/20 to-rose-500/5 text-rose-400",
    info: "from-sky-500/20 to-sky-500/5 text-sky-400",
  };
  return (
    <GlassCard className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none ${tones[tone]}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold mt-1">{value}</p>
          {delta !== undefined && (
            <p className={`text-xs mt-1 inline-flex items-center gap-1 ${delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta)}% vs prev
            </p>
          )}
        </div>
        <div className={`rounded-xl p-2 ${tones[tone]}`}><Icon className="h-5 w-5" /></div>
      </div>
    </GlassCard>
  );
}

function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function RevenuePage() {
  const [range, setRange] = useState<Range>("30d");
  const [source, setSource] = useState<string>("all");

  const filtered = useMemo(
    () => TABLE_ROWS.filter((r) => source === "all" || r.sourceKey === source),
    [source],
  );

  const today = 248_400, yesterday = 231_900, week = 1_640_500, month = 6_842_300;
  const totalRev = 32_180_000, profit = Math.round(totalRev * 0.3), payouts = totalRev - profit, pending = 184_500;

  const exportCSV = () => {
    const rows = [
      ["Date", "Source", "Amount", "Transactions", "Creator Payout", "Platform Profit"],
      ...filtered.map((r) => [r.date, r.source, r.amount, r.tx, r.payout, r.profit]),
    ];
    downloadFile("revenue.csv", rows.map((r) => r.join(",")).join("\n"), "text/csv");
    toast.success("CSV exported");
  };
  const exportExcel = () => {
    const rows = [
      ["Date", "Source", "Amount", "Transactions", "Creator Payout", "Platform Profit"],
      ...filtered.map((r) => [r.date, r.source, r.amount, r.tx, r.payout, r.profit]),
    ];
    downloadFile("revenue.xls", rows.map((r) => r.join("\t")).join("\n"), "application/vnd.ms-excel");
    toast.success("Excel exported");
  };
  const exportPDF = () => { toast.message("Opening print dialog…"); setTimeout(() => window.print(), 200); };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue"
        subtitle="Platform financial analytics & profitability"
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={exportCSV} className="glass rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5"><Download className="h-3.5 w-3.5" />CSV</button>
            <button onClick={exportExcel} className="glass rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5"><Download className="h-3.5 w-3.5" />Excel</button>
            <button onClick={exportPDF} className="glass rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5"><Download className="h-3.5 w-3.5" />PDF</button>
          </div>
        }
      />

      {/* Range filters */}
      <div className="flex flex-wrap gap-2">
        {([
          ["today", "Today"], ["7d", "Last 7 Days"], ["30d", "Last 30 Days"], ["month", "This Month"], ["custom", "Custom Range"],
        ] as [Range, string][]).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setRange(k)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium border transition ${
              range === k ? "bg-primary text-primary-foreground border-primary" : "glass border-transparent hover:border-border"
            }`}
          >
            <Calendar className="inline h-3 w-3 mr-1" />{l}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Today's Revenue" value={inr(today)} delta={7.1} icon={IndianRupee} tone="success" />
        <Kpi label="Yesterday's Revenue" value={inr(yesterday)} delta={-2.4} icon={TrendingDown} tone="info" />
        <Kpi label="Weekly Revenue" value={inr(week)} delta={12.8} icon={TrendingUp} tone="primary" />
        <Kpi label="Monthly Revenue" value={inr(month)} delta={9.2} icon={Wallet} tone="success" />
        <Kpi label="Total Revenue" value={compact(totalRev)} delta={18.4} icon={Coins} tone="primary" />
        <Kpi label="Platform Profit" value={compact(profit)} delta={14.6} icon={TrendingUp} tone="success" />
        <Kpi label="Creator Payouts" value={compact(payouts)} delta={11.2} icon={ArrowUpRight} tone="info" />
        <Kpi label="Pending Withdrawals" value={inr(pending)} icon={ArrowDownRight} tone="warning" />
      </div>

      {/* Revenue sources */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Revenue by Source</h2>
            <p className="text-xs text-muted-foreground">Lifetime breakdown across products</p>
          </div>
          <PieIcon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid lg:grid-cols-7 gap-3">
          {SOURCE_REVENUE.map((s) => {
            const Icon = s.icon;
            const pct = ((s.amount / TOTAL) * 100).toFixed(1);
            return (
              <button
                key={s.key}
                onClick={() => setSource(s.key)}
                className={`text-left rounded-xl p-3 border transition ${source === s.key ? "border-primary bg-primary/10" : "border-border/40 hover:border-border bg-card/40"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-lg p-1.5" style={{ background: `${s.color}22`, color: s.color }}><Icon className="h-3.5 w-3.5" /></span>
                  <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                </div>
                <p className="text-base font-bold">{compact(s.amount)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.tx.toLocaleString()} tx · {pct}%</p>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard>
          <h3 className="font-semibold mb-1">Revenue Trend</h3>
          <p className="text-xs text-muted-foreground mb-3">Last 30 days · revenue vs profit</p>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={TREND}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                  <linearGradient id="prof" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.5} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke="#ffffff10" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} formatter={(v: any) => inr(v as number)} />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="url(#rev)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#prof)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-1">Daily Revenue</h3>
          <p className="text-xs text-muted-foreground mb-3">Bar view · last 30 days</p>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={TREND}>
                <CartesianGrid stroke="#ffffff10" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} formatter={(v: any) => inr(v as number)} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-1">Monthly Revenue & Profit</h3>
          <p className="text-xs text-muted-foreground mb-3">Year-to-date comparison</p>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={MONTHLY}>
                <CartesianGrid stroke="#ffffff10" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v/100000).toFixed(0)}L`} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} formatter={(v: any) => inr(v as number)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-1">Creator Payouts</h3>
          <p className="text-xs text-muted-foreground mb-3">Payout vs platform profit · last 30 days</p>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={TREND}>
                <CartesianGrid stroke="#ffffff10" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} formatter={(v: any) => inr(v as number)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="payout" stackId="a" fill="#0ea5e9" radius={[0, 0, 0, 0]} />
                <Bar dataKey="profit" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h3 className="font-semibold mb-1">Revenue Split</h3>
          <p className="text-xs text-muted-foreground mb-3">Share of revenue by product</p>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={SOURCE_REVENUE} dataKey="amount" nameKey="label" outerRadius={90} innerRadius={50} paddingAngle={2}>
                  {SOURCE_REVENUE.map((s) => <Cell key={s.key} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} formatter={(v: any) => inr(v as number)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Table */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">Revenue Ledger</h3>
            <p className="text-xs text-muted-foreground">{filtered.length} entries{source !== "all" ? ` · ${source}` : ""}</p>
          </div>
          <button onClick={() => setSource("all")} className="text-xs text-primary hover:underline">Clear filter</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border/40">
                <th className="py-2 px-2">Date</th>
                <th className="py-2 px-2">Source</th>
                <th className="py-2 px-2 text-right">Amount</th>
                <th className="py-2 px-2 text-right">Transactions</th>
                <th className="py-2 px-2 text-right">Creator Payout</th>
                <th className="py-2 px-2 text-right">Platform Profit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const src = SOURCES.find((s) => s.key === r.sourceKey)!;
                return (
                  <tr key={r.id} className="border-b border-border/20 hover:bg-card/40">
                    <td className="py-2 px-2 text-xs">{r.date}</td>
                    <td className="py-2 px-2">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className="h-2 w-2 rounded-full" style={{ background: src.color }} />
                        {r.source}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-semibold">{inr(r.amount)}</td>
                    <td className="py-2 px-2 text-right text-xs text-muted-foreground">{r.tx.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-sky-400">{inr(r.payout)}</td>
                    <td className="py-2 px-2 text-right text-emerald-400 font-medium">{inr(r.profit)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
