import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import {
  ShieldAlert, AlertTriangle, Users2, FileWarning, Wallet, UserX,
  Search, X, ShieldCheck, Ban, Eye, Plus,
  Loader2, AlertCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// =========================================================
// API CONFIG
// =========================================================
const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

// =========================================================
// AUTH — read the logged-in user from localStorage.
// login.tsx stores the full user object, e.g.:
//   {"id":2,"user_id":2,"email":"nandhini@gmail.com",
//    "role":"admin","name":"","mobile":"","referral_code":"...","online":false}
// We try the common keys login flows use for the object, then fall back
// to individual fields.
// =========================================================
interface StoredUser {
  id?: number;
  user_id?: number;
  role?: string;
  name?: string;
  email?: string;
  mobile?: string;
  online?: boolean;
}

function getCurrentUser(): StoredUser | null {
  const objectKeys = ["user", "userData", "currentUser", "admin", "authUser", "loggedInUser"];
  for (const k of objectKeys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.user_id != null || parsed.id != null || parsed.role)) {
        return parsed as StoredUser;
      }
    } catch { /* not a JSON object — skip */ }
  }
  // Fallback: individual fields
  const user_id = Number(localStorage.getItem("user_id") || localStorage.getItem("admin_id") || 0);
  const role = localStorage.getItem("role") || localStorage.getItem("user_role") || "";
  if (user_id || role) {
    return { user_id: user_id || undefined, role: role || undefined };
  }
  return null;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const body = await res.json();
      msg = `${res.status}: ${body.detail || JSON.stringify(body)}`;
    } catch {
      msg = `${res.status}: ${await res.text().catch(() => res.statusText)}`;
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

// =========================================================
// TYPES (mirror /admin/fraud response shapes)
// =========================================================
interface AlertRow {
  id: number;
  alert_code: string;
  user_id: number;
  user_name: string;
  email: string;
  role: string;
  state_id: number | null;
  state: string | null;
  risk_score: number;
  risk_level: string;        // "low" | "medium" | "high"
  risk_type: string;
  description: string | null;
  status: string;            // "open" | "investigating" | "safe" | "suspended" | "banned"
  created_at: string;
  updated_at: string | null;
}
interface AlertsResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: AlertRow[];
}

interface DashboardData {
  fraud_alerts: number;
  suspicious_accounts: number;
  duplicate_kyc: number;
  suspicious_withdrawals: number;
  high_risk_users: number;
  blocked_accounts: number;
}

interface TrendItem { date: string; day: string; total_alerts: number; }
interface TrendsResponse {
  period: string;
  total_alerts: number;
  data: TrendItem[];
}

interface StateAnalyticsItem {
  state_id: number;
  state_name: string;
  total_alerts: number;
}
interface StateAnalyticsResponse {
  total_states: number;
  total_alerts: number;
  data: StateAnalyticsItem[];
}

interface AlertDetailKycDoc {
  document_type: string;
  photo: string | null;
  status: string | null;
}
interface AlertDetailWithdrawal {
  withdrawal_id: string;
  amount: number;
  status: string;
  bank_name: string | null;
  account_holder_name: string | null;
  masked_account_number: string | null;
  ifsc_code: string | null;
  requested_at: string;
  processed_at: string | null;
  rejection_reason: string | null;
}
interface AlertDetail {
  alert: {
    id: number;
    alert_code: string;
    risk_score: number;
    risk_level: string;
    risk_type: string;
    description: string | null;
    status: string;
    created_at: string;
  };
  user: {
    user_id: number;
    name: string;
    email: string;
    phone: string;
    profile_photo: string | null;
    role: string;
    state: string | null;
    is_active: boolean;
    is_verified: boolean;
    joined_at: string;
  };
  kyc_documents: AlertDetailKycDoc[];
  wallet_activity: {
    wallet_id: string | null;
    balance: number;
    coins: number;
    deposits: number;
    spending: number;
    approved_withdrawals: number;
    pending_withdrawals: number;
  };
  wallet_transactions: unknown[];
  withdrawal_history: AlertDetailWithdrawal[];
}

interface UserSearchResult {
  user_id: number;
  user_name: string;
  email: string;
  role: string;
  state_id: number | null;
  state: string | null;
}
interface UserSearchResponse {
  total: number;
  data: UserSearchResult[];
}

// =========================================================
// CONSTANTS
// =========================================================
const RISK_TYPES = [
  "Multiple Accounts", "Fake KYC", "Duplicate PAN", "Duplicate Aadhaar",
  "Withdrawal Abuse", "Wallet Abuse", "Spam Activity", "Suspicious Device",
] as const;

// Backend stores risk_level lowercase. The schema's default_scores map only
// has low/medium/high — "critical" is NOT supported, so it is removed here.
const LEVELS = ["low", "medium", "high"] as const;
type Level = typeof LEVELS[number];

// Backend statuses: open / investigating / safe / suspended / banned
const STATUSES = ["open", "investigating", "safe", "suspended", "banned"] as const;

const LEVEL_TONE: Record<string, string> = {
  low:      "bg-muted/40 text-foreground",
  medium:   "bg-warning/20 text-warning",
  high:     "bg-orange-500/20 text-orange-400",
  critical: "bg-destructive/20 text-destructive animate-pulse",
};

const REFRESH_MS = 30000;   // fraud data changes slower than live-users
const PAGE_SIZE  = 30;

// =========================================================
// HELPERS
// =========================================================
function titleCase(s: string | null | undefined): string {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}
function inr(n: number): string {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}
function scoreColor(score: number): string {
  // Aligned with backend get_risk_level(): >=60 high, >=30 medium, else low
  if (score >= 80) return "bg-destructive";
  if (score >= 60) return "bg-orange-500";
  if (score >= 30) return "bg-warning";
  return "bg-success";
}
function kycTone(status: string): string {
  const s = (status || "").toLowerCase();
  if (s.includes("verified") || s === "ok" || s === "approved") return "text-success";
  if (s.includes("duplicate") || s.includes("flag") || s.includes("pending") || s.includes("hold")) return "text-warning";
  if (s.includes("rejected") || s.includes("failed")) return "text-destructive";
  return "text-muted-foreground";
}

// =========================================================
// PAGE
// =========================================================
function FraudPage() {
  // ---- filters ----
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [typeF, setTypeF] = useState("All");
  const [levelF, setLevelF] = useState<"All" | Level>("All");
  const [statusF, setStatusF] = useState("All");
  const [page, setPage] = useState(1);

  // ---- data ----
  const [alertsData, setAlertsData] = useState<AlertsResponse | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [stateAnalytics, setStateAnalytics] = useState<StateAnalyticsItem[]>([]);

  // ---- status ----
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ---- detail modal ----
  const [openAlertId, setOpenAlertId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AlertDetail | null>(null);

  // ---- flag account modal ----
  const [addOpen, setAddOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [newRiskType, setNewRiskType] = useState<(typeof RISK_TYPES)[number]>(RISK_TYPES[0]);
  const [newLevel, setNewLevel] = useState<Level>("high");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // ---------------------------------------------------------
  // Current admin (from login session). Re-read on every mount
  // so navigating to /admin/fraud after login picks up the user.
  // ---------------------------------------------------------
  const currentUser = useMemo(() => getCurrentUser(), []);
  const adminId = Number(currentUser?.user_id ?? currentUser?.id ?? 1);
  const isAdmin = (currentUser?.role || "").toLowerCase() === "admin";

  // ---------------------------------------------------------
  // Debounce alerts search
  // ---------------------------------------------------------
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  // ---------------------------------------------------------
  // Reset to page 1 on any filter change
  // ---------------------------------------------------------
  useEffect(() => { setPage(1); }, [debouncedQ, typeF, levelF, statusF]);

  // ---------------------------------------------------------
  // Build alerts query string (server-side filters)
  // ---------------------------------------------------------
  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (debouncedQ.trim()) p.set("search", debouncedQ.trim());
    if (typeF !== "All")   p.set("risk_type", typeF);
    if (levelF !== "All")  p.set("risk_level", levelF);     // lowercase
    if (statusF !== "All") p.set("status", statusF);         // lowercase
    p.set("page", String(page));
    p.set("limit", String(PAGE_SIZE));
    return p.toString();
  }, [debouncedQ, typeF, levelF, statusF, page]);

  // ---------------------------------------------------------
  // Fetchers
  // ---------------------------------------------------------
  const fetchAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    setError(null);
    try {
      const res = await apiFetch<AlertsResponse>(`/admin/fraud/alerts?${queryString}`);
      setAlertsData(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load fraud alerts");
    } finally {
      setLoadingAlerts(false);
    }
  }, [queryString]);

  const fetchDashboard = useCallback(async () => {
    try {
      // /dashboard returns the six counts at the top level
      const r = await apiFetch<DashboardData>(`/admin/fraud/dashboard`);
      setDashboard(r);
    } catch { /* stat cards just stay 0 */ }
  }, []);

  const fetchTrends = useCallback(async () => {
    try {
      const r = await apiFetch<TrendsResponse>(`/admin/fraud/trends?days=7`);
      setTrend(r.data || []);
    } catch { /* silent */ }
  }, []);

  const fetchStateAnalytics = useCallback(async () => {
    try {
      const r = await apiFetch<StateAnalyticsResponse>(`/admin/fraud/state-analytics`);
      setStateAnalytics(r.data || []);
    } catch { /* silent */ }
  }, []);

  // Initial + filter-driven fetch
  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);
  useEffect(() => {
    fetchDashboard();
    fetchTrends();
    fetchStateAnalytics();
  }, [fetchDashboard, fetchTrends, fetchStateAnalytics]);

  // Auto-refresh (alerts + dashboard every 30s)
  useEffect(() => {
    const t = setInterval(() => {
      fetchAlerts();
      fetchDashboard();
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, [fetchAlerts, fetchDashboard]);

  // ---------------------------------------------------------
  // Open detail modal -> GET /alerts/{id}/details (rich view)
  // ---------------------------------------------------------
  const openDetail = useCallback(async (alertId: number) => {
    setOpenAlertId(alertId);
    setDetail(null);
    setLoadingDetail(true);
    try {
      const r = await apiFetch<AlertDetail>(`/admin/fraud/alerts/${alertId}/details`);
      setDetail(r);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load alert detail");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const closeModal = useCallback(() => {
    setOpenAlertId(null);
    setDetail(null);
  }, []);

  // ---------------------------------------------------------
  // Action buttons -> 4 separate POST endpoints
  //   mark_safe -> /mark-safe   (AdminActionRequest)
  //   suspend   -> /suspend     (SuspendRequest, includes suspend_until)
  // ---------------------------------------------------------
  const takeAction = useCallback(async (
    action: "mark_safe" | "investigate" | "suspend" | "ban",
    label: string,
  ) => {
    if (openAlertId == null) return;
    setActing(action);
    try {
      const suffix = action === "mark_safe" ? "mark-safe" : action;
      const body =
        action === "suspend"
          ? { admin_id: adminId, remarks: null, suspend_until: null }
          : { admin_id: adminId, remarks: null };

      await apiFetch(`/admin/fraud/alerts/${openAlertId}/${suffix}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      toast.success(`${label} — action recorded`);
      closeModal();
      fetchAlerts();
      fetchDashboard();
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    } finally {
      setActing(null);
    }
  }, [openAlertId, closeModal, fetchAlerts, fetchDashboard, adminId]);

  // ---------------------------------------------------------
  // Flag Account modal: user search via /users/search (debounced)
  // ---------------------------------------------------------
  useEffect(() => {
    if (!addOpen) return;
    const term = userSearch.trim();
    if (!term) { setUserResults([]); return; }
    const t = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const r = await apiFetch<UserSearchResponse>(
          `/admin/fraud/users/search?search=${encodeURIComponent(term)}&limit=10`
        );
        setUserResults(r.data || []);
      } catch {
        setUserResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch, addOpen]);

  const resetFlagForm = useCallback(() => {
    setUserSearch("");
    setUserResults([]);
    setSelectedUser(null);
    setNewRiskType(RISK_TYPES[0]);
    setNewLevel("high");
    setNewDesc("");
  }, []);

  // Reset flag form shortly after the modal closes (post exit-animation)
  useEffect(() => {
    if (addOpen) return;
    const t = setTimeout(resetFlagForm, 300);
    return () => clearTimeout(t);
  }, [addOpen, resetFlagForm]);

  // ---------------------------------------------------------
  // Create alert -> POST /alerts
  // ---------------------------------------------------------
  const createAlert = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error("Select a user to flag");
      return;
    }
    setCreating(true);
    try {
      await apiFetch(`/admin/fraud/alerts`, {
        method: "POST",
        body: JSON.stringify({
          admin_id: adminId,
          user_id: selectedUser.user_id,
          risk_type: newRiskType,
          risk_level: newLevel,            // must be lowercase; default_scores dict uses low/medium/high
          description: newDesc.trim(),
        }),
      });
      toast.success(`${selectedUser.user_name} added for fraud review`);
      setAddOpen(false);
      fetchAlerts();
      fetchDashboard();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create fraud alert");
    } finally {
      setCreating(false);
    }
  }, [selectedUser, newRiskType, newLevel, newDesc, fetchAlerts, fetchDashboard, adminId]);

  // ---------------------------------------------------------
  // Derived
  // ---------------------------------------------------------
  const rows = alertsData?.data ?? [];

  const statCards = [
    { l: "Fraud Alerts",            v: dashboard?.fraud_alerts ?? 0,            icon: AlertTriangle, tone: "text-destructive"      },
    { l: "Suspicious Accounts",     v: dashboard?.suspicious_accounts ?? 0,     icon: ShieldAlert,   tone: "text-warning"          },
    { l: "Duplicate KYC",           v: dashboard?.duplicate_kyc ?? 0,           icon: FileWarning,   tone: "text-orange-400"       },
    { l: "Suspicious Withdrawals",  v: dashboard?.suspicious_withdrawals ?? 0,  icon: Wallet,        tone: "text-warning"          },
    { l: "High Risk Users",         v: dashboard?.high_risk_users ?? 0,         icon: Users2,        tone: "text-destructive"      },
    { l: "Blocked Accounts",        v: dashboard?.blocked_accounts ?? 0,        icon: UserX,         tone: "text-muted-foreground" },
  ];

  const stateChartData = useMemo(
    () => stateAnalytics.map(s => ({
      state: (s.state_name || "").slice(0, 6),
      count: s.total_alerts,
    })),
    [stateAnalytics],
  );

  // ---------------------------------------------------------
  // Role guard — only admins may view this dashboard.
  // (All hooks are declared above, so an early return is safe here.)
  // ---------------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive mb-3" />
        <h2 className="text-lg font-bold">Admin access required</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Your account{currentUser?.email ? ` (${currentUser.email})` : ""} does not have
          permission to view the Fraud Detection dashboard. Sign in with an admin account.
        </p>
      </div>
    );
  }

  const kycStatus = (docType: string): string => {
    if (!detail) return "Not Submitted";
    const doc = detail.kyc_documents.find(
      d => d.document_type.toLowerCase() === docType.toLowerCase()
    );
    return doc?.status || "Not Submitted";
  };

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div>
      <PageHeader
        title="Fraud Detection"
        subtitle="Admin-managed risk register · flag accounts for review"
        action={
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Signed in as <span className="font-medium text-foreground">{currentUser?.name || currentUser?.email || "admin"}</span>
            </span>
            <Button onClick={() => setAddOpen(true)}><Plus /> Flag Account</Button>
          </div>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {statCards.map((s, i) => (
          <GlassCard key={i}>
            <s.icon className={`h-5 w-5 ${s.tone} mb-2`} />
            <p className="text-xs text-muted-foreground">{s.l}</p>
            <p className="text-xl font-bold mt-1">{s.v}</p>
          </GlassCard>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <GlassCard>
          <p className="text-xs text-muted-foreground mb-2">Fraud Trends (last 7 days)</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="day" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Area
                dataKey="total_alerts"
                name="Alerts"
                stroke="hsl(var(--destructive))"
                fill="hsl(var(--destructive))"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard>
          <p className="text-xs text-muted-foreground mb-2">State-wise Fraud</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stateChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="state" fontSize={10} />
              <YAxis fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="count" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />{error}
        </div>
      )}

      {/* Filters */}
      <GlassCard className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search user, email, alert code..."
              className="w-full bg-transparent rounded-full pl-9 pr-4 py-2 text-sm outline-none border border-border"
            />
          </div>
          <select value={typeF} onChange={e => setTypeF(e.target.value)} className="glass rounded-full px-3 py-2 text-sm">
            <option>All</option>{RISK_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={levelF} onChange={e => setLevelF(e.target.value as any)} className="glass rounded-full px-3 py-2 text-sm">
            <option>All</option>{LEVELS.map(l => <option key={l} value={l}>{titleCase(l)}</option>)}
          </select>
          <select value={statusF} onChange={e => setStatusF(e.target.value)} className="glass rounded-full px-3 py-2 text-sm">
            <option>All</option>{STATUSES.map(s => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
        </div>
      </GlassCard>

      {/* Alerts table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs text-muted-foreground">
              <tr>
                {["Alert", "User", "Risk Score", "Risk Type", "State", "Date", "Status", ""].map(h =>
                  <th key={h} className="text-left p-3 font-medium">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loadingAlerts && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Loading fraud alerts…
                  </td>
                </tr>
              )}

              {!loadingAlerts && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No fraud alerts match the current filters.
                  </td>
                </tr>
              )}

              {rows.map(a => (
                <tr key={a.id} className="border-t border-border hover:bg-muted/20">
                  <td className="p-3 font-mono text-xs">{a.alert_code}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {/* list endpoint doesn't return avatar — use initial badge */}
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                        {(a.user_name || "?").charAt(0).toUpperCase()}
                      </div>
                      {a.user_name}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${scoreColor(a.risk_score)}`} style={{ width: `${a.risk_score}%` }} />
                      </div>
                      <span className="text-xs font-bold">{a.risk_score}</span>
                      <span className={`text-[9px] rounded-full px-2 py-0.5 ${LEVEL_TONE[a.risk_level] ?? LEVEL_TONE.low}`}>
                        {titleCase(a.risk_level)}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-xs">{a.risk_type}</td>
                  <td className="p-3 text-xs text-muted-foreground">{a.state ?? "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">{formatDate(a.created_at)}</td>
                  <td className="p-3">
                    <span className="text-[10px] rounded-full px-2 py-0.5 bg-muted/40">{titleCase(a.status)}</span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => openDetail(a.id)}
                      className="rounded-full bg-primary/20 text-primary px-3 py-1 text-xs flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {alertsData && alertsData.total_pages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-border text-xs text-muted-foreground">
            <span>Page {alertsData.page} / {alertsData.total_pages} · {alertsData.total} alerts</span>
            <div className="flex items-center gap-1">
              <button
                disabled={alertsData.page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="glass rounded-full p-1.5 disabled:opacity-40 hover:bg-muted/40"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                disabled={alertsData.page >= alertsData.total_pages}
                onClick={() => setPage(p => p + 1)}
                className="glass rounded-full p-1.5 disabled:opacity-40 hover:bg-muted/40"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Flag Account modal — user search -> POST /alerts */}
      <AnimatePresence>
        {addOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setAddOpen(false)}
          >
            <motion.form
              initial={{ y: 20, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.96 }}
              onSubmit={createAlert}
              onClick={e => e.stopPropagation()}
              className="glass rounded-2xl p-6 w-full max-w-lg space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">Flag an account</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Search for a customer or creator to add to the review queue.
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={() => setAddOpen(false)}>
                  <X />
                </Button>
              </div>

              {/* User search / selection */}
              {!selectedUser ? (
                <div className="space-y-2">
                  <label className="block text-sm">
                    <span className="text-muted-foreground">Search user</span>
                    <div className="relative mt-1.5">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        autoFocus
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        placeholder="Type name, email…"
                        className="glass w-full rounded-lg border border-border pl-9 pr-9 py-2.5 outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                      {searchingUsers && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </label>

                  {userResults.length > 0 && (
                    <div className="max-h-56 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                      {userResults.map(u => (
                        <button
                          type="button"
                          key={u.user_id}
                          onClick={() => { setSelectedUser(u); setUserResults([]); }}
                          className="w-full text-left px-3 py-2 hover:bg-muted/40 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium">{u.user_name}</p>
                            <p className="text-[10px] text-muted-foreground">{u.email} · {u.role}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{u.state ?? "—"}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {!searchingUsers && userSearch.trim() && userResults.length === 0 && (
                    <p className="text-xs text-muted-foreground">No users found.</p>
                  )}
                </div>
              ) : (
                <div className="glass-strong rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{selectedUser.user_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedUser.email} · {selectedUser.role} · {selectedUser.state ?? "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedUser(null); setUserSearch(""); }}
                    className="text-xs text-primary"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Risk type + level */}
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block space-y-1.5 text-sm">
                  <span className="text-muted-foreground">Risk type</span>
                  <select
                    value={newRiskType}
                    onChange={e => setNewRiskType(e.target.value as (typeof RISK_TYPES)[number])}
                    className="glass w-full rounded-lg border border-border px-3 py-2.5"
                  >
                    {RISK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span className="text-muted-foreground">Risk level</span>
                  <select
                    value={newLevel}
                    onChange={e => setNewLevel(e.target.value as Level)}
                    className="glass w-full rounded-lg border border-border px-3 py-2.5"
                  >
                    {LEVELS.map(l => <option key={l} value={l}>{titleCase(l)}</option>)}
                  </select>
                </label>
              </div>

              {/* Description */}
              <label className="block space-y-1.5 text-sm">
                <span className="text-muted-foreground">Description (optional)</span>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder="Reason for flagging…"
                  className="glass w-full rounded-lg border border-border px-3 py-2.5 outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={!selectedUser || creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus />}
                  Add to review queue
                </Button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail modal — GET /alerts/{id}/details */}
      <AnimatePresence>
        {openAlertId != null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ y: 20, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.96 }}
              className="glass rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {detail?.user?.profile_photo ? (
                    <img src={detail.user.profile_photo} className="h-12 w-12 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-bold">
                      {(detail?.user?.name || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold">{detail?.user?.name ?? "Loading…"}</h3>
                    <p className="text-xs text-muted-foreground">
                      {detail?.alert?.alert_code ?? "—"} · {detail?.user?.state ?? "—"}
                    </p>
                  </div>
                </div>
                <button onClick={closeModal} className="rounded-full p-2 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {loadingDetail && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Loading alert detail…
                </div>
              )}

              {detail && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="glass-strong rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground">Risk Score</p>
                      <p className="text-xl font-bold">{detail.alert.risk_score}</p>
                      <span className={`text-[10px] rounded-full px-2 py-0.5 ${LEVEL_TONE[detail.alert.risk_level] ?? LEVEL_TONE.low}`}>
                        {titleCase(detail.alert.risk_level)}
                      </span>
                    </div>
                    <div className="glass-strong rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground">Risk Type</p>
                      <p className="text-sm font-semibold mt-1">{detail.alert.risk_type}</p>
                    </div>
                    <div className="glass-strong rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground">Status</p>
                      <p className="text-sm font-semibold mt-1">{titleCase(detail.alert.status)}</p>
                    </div>
                  </div>

                  {detail.alert.description && (
                    <div className="glass-strong rounded-xl p-3 mb-4">
                      <p className="text-xs font-semibold mb-1">Description</p>
                      <p className="text-xs text-muted-foreground">{detail.alert.description}</p>
                    </div>
                  )}

                  <div className="space-y-3 mb-4">
                    {/* Wallet activity */}
                    <div className="glass-strong rounded-xl p-3">
                      <p className="text-xs font-semibold mb-2">Wallet Activity</p>
                      <div className="grid grid-cols-3 gap-2 text-xs text-center">
                        <div>
                          <p className="text-muted-foreground">Deposits</p>
                          <p className="font-semibold">{inr(detail.wallet_activity.deposits)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Withdrawals</p>
                          <p className="font-semibold">{inr(detail.wallet_activity.approved_withdrawals)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pending</p>
                          <p className="font-semibold text-warning">{inr(detail.wallet_activity.pending_withdrawals)}</p>
                        </div>
                      </div>
                    </div>

                    {/* KYC + withdrawal history */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="glass-strong rounded-xl p-3">
                        <p className="text-xs font-semibold mb-2">KYC Documents</p>
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Aadhaar</span>
                            <span className={kycTone(kycStatus("Aadhaar"))}>{kycStatus("Aadhaar")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">PAN</span>
                            <span className={kycTone(kycStatus("PAN"))}>{kycStatus("PAN")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Selfie</span>
                            <span className={kycTone(kycStatus("Selfie"))}>{kycStatus("Selfie")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="glass-strong rounded-xl p-3">
                        <p className="text-xs font-semibold mb-2">Withdrawal History</p>
                        <div className="text-xs space-y-1">
                          {detail.withdrawal_history.slice(0, 3).map((w, i) => (
                            <div key={i} className="flex justify-between">
                              <span className="text-muted-foreground">{formatDate(w.requested_at)}</span>
                              <span>{inr(w.amount)}</span>
                            </div>
                          ))}
                          {detail.withdrawal_history.length === 0 && (
                            <p className="text-muted-foreground">No withdrawals yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => takeAction("mark_safe", "Marked Safe")}
                      disabled={acting !== null}
                      className="rounded-xl bg-success/20 text-success py-2 text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {acting === "mark_safe" ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                      Mark Safe
                    </button>
                    <button
                      onClick={() => takeAction("investigate", "Investigating")}
                      disabled={acting !== null}
                      className="rounded-xl bg-primary/20 text-primary py-2 text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {acting === "investigate" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                      Investigate
                    </button>
                    <button
                      onClick={() => takeAction("suspend", "Suspended")}
                      disabled={acting !== null}
                      className="rounded-xl bg-warning/20 text-warning py-2 text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {acting === "suspend" ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserX className="h-3 w-3" />}
                      Suspend
                    </button>
                    <button
                      onClick={() => takeAction("ban", "Banned")}
                      disabled={acting !== null}
                      className="rounded-xl bg-destructive/20 text-destructive py-2 text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {acting === "ban" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
                      Ban
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const Route = createFileRoute("/admin/fraud")({ component: FraudPage });
