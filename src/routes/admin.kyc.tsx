// import { createFileRoute } from "@tanstack/react-router";
// import { useCallback, useEffect, useMemo, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { GlassCard, PageHeader } from "@/components/ui-kit";
// import {
//   Search, Filter, Download, CheckCircle2, XCircle, RotateCcw, Ban, ShieldAlert,
//   Clock, FileCheck2, Users, AlertTriangle, X, Eye, MapPin, Mail, Phone,
//   Calendar, CreditCard, FileText, Camera, ShieldCheck, History, Fingerprint,
//   ChevronLeft, ChevronRight, Loader2, RefreshCw, ImageOff,
// } from "lucide-react";
// import { toast } from "sonner";

// export const Route = createFileRoute("/admin/kyc")({ component: KycPage });

// /* ------------------------------------------------------------------ */
// /* API configuration                                                   */
// /* ------------------------------------------------------------------ */

// const API_BASE_URL = String(import.meta.env.VITE_BASE_URL ?? "").replace(/\/+$/, "");

// const ENDPOINTS = {
//   dashboard: `${API_BASE_URL}/admin/kyc-dashboard/`,
//   review: (userId: number) => `${API_BASE_URL}/admin/kyc/review/${userId}`,
//   updateStatus: (userId: number) => `${API_BASE_URL}/admin/kyc/user/${userId}/status`,
//   exportPdf: (status: ExportStatus) =>
//     `${API_BASE_URL}/admin/kyc-dashboard/export/${status}/pdf`,
// };

// function getAuthToken(): string | null {
//   try {
//     return (
//       localStorage.getItem("token") ||
//       localStorage.getItem("access_token") ||
//       null
//     );
//   } catch {
//     return null;
//   }
// }

// function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
//   const token = getAuthToken();
//   return {
//     ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     ...extra,
//   };
// }

// // Backend stores document photos as relative paths (e.g. "uploads/kyc/uuid.jpg").
// // Resolve them to absolute URLs against the API origin.
// function resolveAsset(path: string | null | undefined): string | undefined {
//   if (!path) return undefined;
//   if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) return path;
//   if (path.startsWith("/")) return `${API_BASE_URL}${path}`;
//   return `${API_BASE_URL}/${path}`;
// }

// /* ------------------------------------------------------------------ */
// /* Types                                                               */
// /* ------------------------------------------------------------------ */

// type KycStatus =
//   | "Pending"
//   | "Under Review"
//   | "Approved"
//   | "Rejected"
//   | "Re-upload Required";

// type DocStatus = "Verified" | "Pending" | "Rejected" | "Re-upload";

// const STATUSES: KycStatus[] = [
//   "Pending",
//   "Under Review",
//   "Approved",
//   "Rejected",
//   "Re-upload Required",
// ];

// type ExportStatus = "approved" | "pending" | "rejected" | "re-upload";

// const REJECTION_REASONS = [
//   "Aadhaar blurry",
//   "PAN blurry",
//   "Selfie mismatch",
//   "Name mismatch",
//   "Invalid document",
//   "Duplicate account",
//   "Other reason",
// ];

// interface Creator {
//   id: number | null;
//   user_id: number;
//   creator_id: string;
//   display_name: string;
//   email: string;
//   phone: string;
//   state_id: number | null;
//   state_name: string | null;
//   profile_photo: string | null;
//   joined_date: string;
//   aadhar_photo: string | null;
//   pan_photo: string | null;
//   selfie_photo: string | null;
//   aadhar_status: DocStatus;
//   pan_status: DocStatus;
//   selfie_status: DocStatus;
//   status: KycStatus;
//   rejection_reason: string | null;
//   updated_at: string;
//   risk: any;
// }

// interface StateOption {
//   id: number;
//   state_name: string;
// }

// interface DashboardSummary {
//   total_creators: number;
//   pending_kyc: number;
//   approved: number;
//   rejected: number;
//   re_upload: number;
//   completed_today: number;
// }

// interface Pagination {
//   page: number;
//   limit: number;
//   total_records: number;
//   total_pages: number;
//   has_next: boolean;
//   has_previous: boolean;
// }

// interface DashboardResponse {
//   success: boolean;
//   message: string;
//   summary: DashboardSummary;
//   states: StateOption[];
//   filters: Record<string, any>;
//   pagination: Pagination;
//   creators: Creator[];
// }

// interface ReviewData {
//   user_id: number;
//   creator_id: string;
//   personal_details: {
//     display_name: string;
//     phone: string;
//     email: string;
//     state_id: number | null;
//     state_name: string | null;
//     profile_photo: string | null;
//     joined_date: string;
//   };
//   bank_details: {
//     bank_photo: string | null;
//     bank_status: string | null;
//     uploaded_at: string | null;
//     updated_at: string | null;
//   } | null;
//   documents: {
//     aadhar: { photo: string | null; status: DocStatus };
//     pan: { photo: string | null; status: DocStatus };
//     selfie: { photo: string | null; status: DocStatus };
//   };
//   kyc_status: KycStatus;
//   rejection_reason: string | null;
//   kyc_timeline: { title: string; date: string }[];
// }

// /* ------------------------------------------------------------------ */
// /* Display helpers                                                     */
// /* ------------------------------------------------------------------ */

// const STAT_COLORS: Record<DocStatus | KycStatus, string> = {
//   Verified: "bg-success/20 text-success",
//   Approved: "bg-success/20 text-success",
//   Pending: "bg-warning/20 text-warning",
//   "Under Review": "bg-blue-500/20 text-blue-300",
//   Rejected: "bg-destructive/20 text-destructive",
//   "Re-upload": "bg-orange-500/20 text-orange-300",
//   "Re-upload Required": "bg-orange-500/20 text-orange-300",
// };

// function StatusPill({ s }: { s: KycStatus | DocStatus }) {
//   return (
//     <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${STAT_COLORS[s] ?? "bg-muted/20 text-muted-foreground"}`}>
//       {s}
//     </span>
//   );
// }

// function formatDate(value: string | null | undefined): string {
//   if (!value) return "—";
//   const d = new Date(value);
//   if (isNaN(d.getTime())) return value;
//   return d.toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// }

// function formatDateTime(value: string | null | undefined): string {
//   if (!value) return "—";
//   const d = new Date(value);
//   if (isNaN(d.getTime())) return value;
//   return d.toLocaleString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// function SummaryCard({ icon: Icon, label, value, tone, loading }: any) {
//   return (
//     <GlassCard className="!p-4">
//       <div className="flex items-start justify-between">
//         <div>
//           <p className="text-xs text-muted-foreground">{label}</p>
//           <p className="text-2xl font-bold mt-1">
//             {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (value ?? 0).toLocaleString()}
//           </p>
//         </div>
//         <div className={`rounded-xl p-2 ${tone}`}>
//           <Icon className="h-4 w-4" />
//         </div>
//       </div>
//     </GlassCard>
//   );
// }

// function DocImage({ src, label }: { src: string | undefined; label: string }) {
//   const [broken, setBroken] = useState(false);
//   if (!src || broken) {
//     return (
//       <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 gap-1">
//         <ImageOff className="h-6 w-6" />
//         <span className="text-[10px]">No image</span>
//       </div>
//     );
//   }
//   return (
//     <img
//       src={src}
//       alt={label}
//       className="w-full h-full object-cover"
//       onError={() => setBroken(true)}
//     />
//   );
// }

// /* ------------------------------------------------------------------ */
// /* Page                                                                */
// /* ------------------------------------------------------------------ */

// function KycPage() {
//   // Filters
//   const [search, setSearch] = useState("");
//   const [stateId, setStateId] = useState<number | "all">("all");
//   const [statusF, setStatusF] = useState<"all" | KycStatus>("all");
//   const [dateF, setDateF] = useState("");

//   // Data
//   const [data, setData] = useState<DashboardResponse | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Pagination (server-side)
//   const [page, setPage] = useState(1);
//   const limit = 8;

//   // Detail modal
//   const [selected, setSelected] = useState<Creator | null>(null);
//   const [review, setReview] = useState<ReviewData | null>(null);
//   const [reviewLoading, setReviewLoading] = useState(false);
//   const [rejectOpen, setRejectOpen] = useState(false);
//   const [reuploadOpen, setReuploadOpen] = useState(false);
//   const [actionLoading, setActionLoading] = useState(false);

//   // Audit log (client-side, local only)
//   const [auditLog, setAuditLog] = useState<
//     { admin: string; action: string; ts: string; notes?: string }[]
//   >([
//     {
//       admin: "admin@velora.live",
//       action: "Logged in",
//       ts: new Date().toLocaleString(),
//     },
//   ]);

//   /* ---------------- fetching ---------------- */

//   const buildQuery = useCallback(
//     (overrides: Record<string, any> = {}) => {
//       const params = new URLSearchParams();
//       params.set("page", String(page));
//       params.set("limit", String(limit));
//       if (search.trim()) params.set("search", search.trim());
//       if (stateId !== "all") params.set("state_id", String(stateId));
//       if (statusF !== "all") params.set("kyc_status", statusF);
//       if (dateF) {
//         params.set("start_date", dateF);
//         params.set("end_date", dateF);
//       }
//       Object.entries(overrides).forEach(([k, v]) => {
//         if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
//       });
//       return params.toString();
//     },
//     [page, search, stateId, statusF, dateF],
//   );

//   const fetchDashboard = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await fetch(`${ENDPOINTS.dashboard}?${buildQuery()}`, {
//         headers: authHeaders({ Accept: "application/json" }),
//       });
//       if (!res.ok) throw new Error(`Request failed (${res.status})`);
//       const json: DashboardResponse = await res.json();
//       if (!json.success) throw new Error(json.message || "Failed to load KYC data");
//       setData(json);
//     } catch (e: any) {
//       setError(e?.message || "Failed to load KYC data");
//       setData(null);
//     } finally {
//       setLoading(false);
//     }
//   }, [buildQuery]);

//   // Debounced search + refetch on filter/pagination change
//   useEffect(() => {
//     const t = setTimeout(fetchDashboard, search ? 350 : 0);
//     return () => clearTimeout(t);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [search, stateId, statusF, dateF, page]);

//   const fetchReview = useCallback(async (userId: number) => {
//     setReviewLoading(true);
//     setReview(null);
//     try {
//       const res = await fetch(ENDPOINTS.review(userId), {
//         headers: authHeaders({ Accept: "application/json" }),
//       });
//       if (!res.ok) throw new Error(`Request failed (${res.status})`);
//       const json = await res.json();
//       setReview(json?.data ?? null);
//     } catch {
//       // Review endpoint is optional — modal still works from dashboard row.
//       setReview(null);
//     } finally {
//       setReviewLoading(false);
//     }
//   }, []);

//   /* ---------------- exports ---------------- */

//   const handleExport = useCallback(
//     async (status: ExportStatus, label: string) => {
//       const qs = buildQuery({ page: undefined, limit: undefined });
//       try {
//         const res = await fetch(`${ENDPOINTS.exportPdf(status)}?${qs}`, {
//           headers: authHeaders(),
//         });
//         if (!res.ok) throw new Error(`Export failed (${res.status})`);
//         const blob = await res.blob();
//         const cd = res.headers.get("content-disposition") ?? "";
//         const match = cd.match(/filename="?([^"]+)"?/i);
//         const filename = match?.[1] ?? `kyc_${status}.pdf`;
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = filename;
//         a.click();
//         URL.revokeObjectURL(url);
//         toast.success(`${label} PDF exported`);
//       } catch (e: any) {
//         toast.error(e?.message || "Export failed");
//       }
//     },
//     [buildQuery],
//   );

//   /* ---------------- actions ---------------- */

//   const logAction = (action: string, notes?: string) => {
//     setAuditLog((l) => [
//       {
//         admin: "admin@velora.live",
//         action,
//         ts: new Date().toLocaleString(),
//         notes,
//       },
//       ...l,
//     ]);
//   };

//   const updateStatus = useCallback(
//     async (creator: Creator, status: KycStatus, reason?: string) => {
//       setActionLoading(true);
//       try {
//         const res = await fetch(ENDPOINTS.updateStatus(creator.user_id), {
//           method: "PUT",
//           headers: authHeaders({ "Content-Type": "application/json" }),
//           body: JSON.stringify({
//             status,
//             ...(reason ? { rejection_reason: reason } : {}),
//           }),
//         });
//         if (!res.ok) {
//           const body = await res.json().catch(() => ({}));
//           throw new Error(body?.detail || `Request failed (${res.status})`);
//         }
//         // Update local row + open modal row.
//         setData((d) =>
//           d
//             ? {
//                 ...d,
//                 creators: d.creators.map((c) =>
//                   c.user_id === creator.user_id
//                     ? {
//                         ...c,
//                         status,
//                         rejection_reason: reason ?? c.rejection_reason,
//                       }
//                     : c,
//                 ),
//               }
//             : d,
//         );
//         setSelected((s) =>
//           s && s.user_id === creator.user_id
//             ? { ...s, status, rejection_reason: reason ?? s.rejection_reason }
//             : s,
//         );
//         return true;
//       } catch (e: any) {
//         toast.error(e?.message || "Action failed");
//         return false;
//       } finally {
//         setActionLoading(false);
//       }
//     },
//     [],
//   );

//   const onApprove = async (r: Creator) => {
//     const ok = await updateStatus(r, "Approved");
//     if (ok) {
//       logAction(`Approved KYC: ${r.creator_id}`);
//       toast.success(`✅ ${r.display_name} approved · notification sent`);
//     }
//   };

//   const onReject = async (r: Creator, reason: string) => {
//     const ok = await updateStatus(r, "Rejected", reason);
//     if (ok) {
//       logAction(`Rejected KYC: ${r.creator_id}`, reason);
//       toast.error(`❌ ${r.display_name} rejected · "${reason}" sent to creator`);
//       setRejectOpen(false);
//     }
//   };

//   const onReupload = async (r: Creator, items: string[]) => {
//     const ok = await updateStatus(r, "Re-upload Required");
//     if (ok) {
//       logAction(`Re-upload requested: ${r.creator_id}`, items.join(", "));
//       toast(`📩 Re-upload notice sent to ${r.display_name}`);
//       setReuploadOpen(false);
//     }
//   };

//   const onSuspend = (r: Creator) => {
//     // No backend endpoint yet — local audit only.
//     logAction(`Suspended: ${r.creator_id}`);
//     toast.warning(`${r.display_name} suspended (local action — no API endpoint)`);
//   };

//   const onBan = (r: Creator) => {
//     logAction(`Banned: ${r.creator_id}`);
//     toast.error(`${r.display_name} banned (local action — no API endpoint)`);
//   };

//   /* ---------------- derived ---------------- */

//   const creators = data?.creators ?? [];
//   const summary = data?.summary;
//   const states = data?.states ?? [];
//   const pagination = data?.pagination;

//   const hasFilters =
//     !!search || stateId !== "all" || statusF !== "all" || !!dateF;

//   const clearFilters = () => {
//     setSearch("");
//     setStateId("all");
//     setStatusF("all");
//     setDateF("");
//     setPage(1);
//   };

//   const openDetail = (c: Creator) => {
//     setSelected(c);
//     fetchReview(c.user_id);
//   };

//   /* ---------------- render ---------------- */

//   return (
//     <div>
//       <PageHeader
//         title="KYC Management"
//         subtitle="Review, approve & monitor creator verifications"
//         action={
//           <div className="flex flex-wrap gap-2">
//             <button
//               onClick={() => handleExport("approved", "Approved")}
//               className="glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5"
//             >
//               <Download className="h-3.5 w-3.5" /> Approved
//             </button>
//             <button
//               onClick={() => handleExport("pending", "Pending")}
//               className="glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5"
//             >
//               <Download className="h-3.5 w-3.5" /> Pending
//             </button>
//             <button
//               onClick={() => handleExport("rejected", "Rejected")}
//               className="glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5"
//             >
//               <Download className="h-3.5 w-3.5" /> Rejected
//             </button>
//             <button
//               onClick={() => handleExport("re-upload", "Re-upload")}
//               className="glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5"
//             >
//               <Download className="h-3.5 w-3.5" /> Re-upload
//             </button>
//           </div>
//         }
//       />

//       {/* Summary cards */}
//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
//         <SummaryCard icon={Users} label="Total Creators" value={summary?.total_creators} tone="bg-primary/20 text-primary" loading={loading && !summary} />
//         <SummaryCard icon={Clock} label="Pending KYC" value={summary?.pending_kyc} tone="bg-warning/20 text-warning" loading={loading && !summary} />
//         <SummaryCard icon={CheckCircle2} label="Approved" value={summary?.approved} tone="bg-success/20 text-success" loading={loading && !summary} />
//         <SummaryCard icon={XCircle} label="Rejected" value={summary?.rejected} tone="bg-destructive/20 text-destructive" loading={loading && !summary} />
//         <SummaryCard icon={RotateCcw} label="Re-upload" value={summary?.re_upload} tone="bg-orange-500/20 text-orange-300" loading={loading && !summary} />
//         <SummaryCard icon={FileCheck2} label="Completed Today" value={summary?.completed_today} tone="bg-blue-500/20 text-blue-300" loading={loading && !summary} />
//       </div>

//       {/* Filters */}
//       <GlassCard className="!p-3 mb-4">
//         <div className="flex flex-wrap gap-2 items-center">
//           <div className="relative flex-1 min-w-[200px]">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//             <input
//               value={search}
//               onChange={(e) => { setSearch(e.target.value); setPage(1); }}
//               placeholder="Search name, mobile, email, creator ID..."
//               className="w-full bg-background/40 rounded-full pl-9 pr-4 py-2 text-sm outline-none border border-border/40"
//             />
//           </div>
//           <select
//             value={stateId === "all" ? "all" : String(stateId)}
//             onChange={(e) => { setStateF(e.target.value === "all" ? "all" : Number(e.target.value)); setPage(1); }}
//             className="bg-background/40 border border-border/40 rounded-full px-3 py-2 text-sm outline-none"
//           >
//             <option value="all">All states</option>
//             {states.map((s) => (
//               <option key={s.id} value={s.id}>{s.state_name}</option>
//             ))}
//           </select>
//           <select
//             value={statusF}
//             onChange={(e) => { setStatusF(e.target.value as any); setPage(1); }}
//             className="bg-background/40 border border-border/40 rounded-full px-3 py-2 text-sm outline-none"
//           >
//             <option value="all">All status</option>
//             {STATUSES.map((s) => (
//               <option key={s} value={s}>{s}</option>
//             ))}
//           </select>
//           <input
//             type="date"
//             value={dateF}
//             onChange={(e) => { setDateF(e.target.value); setPage(1); }}
//             className="bg-background/40 border border-border/40 rounded-full px-3 py-2 text-sm outline-none"
//           />
//           {hasFilters && (
//             <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
//               <Filter className="h-3 w-3" /> Clear
//             </button>
//           )}
//           <button
//             onClick={fetchDashboard}
//             disabled={loading}
//             className="ml-auto glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-50"
//           >
//             <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
//           </button>
//         </div>
//       </GlassCard>

//       {/* Error */}
//       {error && (
//         <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
//           <AlertTriangle className="h-4 w-4" />
//           <span className="flex-1">{error}</span>
//           <button onClick={fetchDashboard} className="text-xs underline hover:no-underline">Retry</button>
//         </div>
//       )}

//       {/* Table */}
//       <GlassCard className="!p-0 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead className="bg-background/40 text-xs text-muted-foreground">
//               <tr>
//                 <th className="text-left p-3">Creator</th>
//                 <th className="text-left p-3">ID</th>
//                 <th className="text-left p-3">Mobile</th>
//                 <th className="text-left p-3">State</th>
//                 <th className="text-left p-3">Joined</th>
//                 <th className="text-left p-3">Aadhaar</th>
//                 <th className="text-left p-3">PAN</th>
//                 <th className="text-left p-3">Selfie</th>
//                 <th className="text-left p-3">Status</th>
//                 <th className="text-left p-3">Risk</th>
//                 <th className="text-right p-3">Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading && creators.length === 0 ? (
//                 <tr>
//                   <td colSpan={11} className="text-center py-10 text-muted-foreground">
//                     <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading KYC records…
//                   </td>
//                 </tr>
//               ) : creators.length === 0 ? (
//                 <tr>
//                   <td colSpan={11} className="text-center py-10 text-muted-foreground text-sm">
//                     No KYC records match your filters
//                   </td>
//                 </tr>
//               ) : (
//                 creators.map((r) => (
//                   <tr key={r.user_id} className="border-t border-border/30 hover:bg-background/30">
//                     <td className="p-3">
//                       <div className="flex items-center gap-2 min-w-[160px]">
//                         {r.profile_photo ? (
//                           <img
//                             src={resolveAsset(r.profile_photo)}
//                             className="h-9 w-9 rounded-full object-cover"
//                             alt=""
//                           />
//                         ) : (
//                           <div className="h-9 w-9 rounded-full bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
//                             {r.display_name?.charAt(0)?.toUpperCase() ?? "?"}
//                           </div>
//                         )}
//                         <div>
//                           <p className="font-semibold text-xs">{r.display_name}</p>
//                           <p className="text-[10px] text-muted-foreground">{r.email}</p>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="p-3 text-xs font-mono">{r.creator_id}</td>
//                     <td className="p-3 text-xs">{r.phone}</td>
//                     <td className="p-3 text-xs">{r.state_name ?? "—"}</td>
//                     <td className="p-3 text-xs">{formatDate(r.joined_date)}</td>
//                     <td className="p-3"><StatusPill s={r.aadhar_status} /></td>
//                     <td className="p-3"><StatusPill s={r.pan_status} /></td>
//                     <td className="p-3"><StatusPill s={r.selfie_status} /></td>
//                     <td className="p-3"><StatusPill s={r.status} /></td>
//                     <td className="p-3">
//                       {r.rejection_reason ? (
//                         <span title={r.rejection_reason} className="inline-flex items-center gap-1 text-[10px] bg-destructive/20 text-destructive rounded-full px-2 py-0.5">
//                           <ShieldAlert className="h-3 w-3" /> !
//                         </span>
//                       ) : (
//                         <span className="text-[10px] text-muted-foreground">—</span>
//                       )}
//                     </td>
//                     <td className="p-3 text-right">
//                       <button
//                         onClick={() => openDetail(r)}
//                         className="inline-flex items-center gap-1 rounded-full bg-primary/20 text-primary px-3 py-1 text-xs"
//                       >
//                         <Eye className="h-3 w-3" /> Review
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
//         {pagination && (
//           <div className="flex items-center justify-between p-3 border-t border-border/30 text-xs">
//             <p className="text-muted-foreground">
//               {pagination.total_records} records · page {pagination.page} of {Math.max(1, pagination.total_pages)}
//             </p>
//             <div className="flex items-center gap-1">
//               <button
//                 disabled={!pagination.has_previous}
//                 onClick={() => setPage((p) => Math.max(1, p - 1))}
//                 className="glass rounded-full p-1.5 disabled:opacity-40"
//               >
//                 <ChevronLeft className="h-3.5 w-3.5" />
//               </button>
//               {Array.from({ length: Math.min(5, pagination.total_pages) }).map((_, i) => {
//                 const start = Math.max(1, pagination.page - 2);
//                 const p = start + i;
//                 if (p > pagination.total_pages) return null;
//                 return (
//                   <button
//                     key={p}
//                     onClick={() => setPage(p)}
//                     className={`rounded-full w-7 h-7 text-xs ${pagination.page === p ? "bg-primary text-primary-foreground" : "glass"}`}
//                   >
//                     {p}
//                   </button>
//                 );
//               })}
//               <button
//                 disabled={!pagination.has_next}
//                 onClick={() => setPage((p) => p + 1)}
//                 className="glass rounded-full p-1.5 disabled:opacity-40"
//               >
//                 <ChevronRight className="h-3.5 w-3.5" />
//               </button>
//             </div>
//           </div>
//         )}
//       </GlassCard>

//       {/* Audit log */}
//       <div className="mt-6">
//         <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
//           <History className="h-4 w-4" /> Admin Audit Log
//         </h3>
//         <GlassCard className="!p-3 max-h-48 overflow-y-auto">
//           <div className="space-y-1.5 text-xs">
//             {auditLog.map((l, i) => (
//               <div key={i} className="flex justify-between border-b border-border/20 pb-1.5">
//                 <div>
//                   <span className="font-medium">{l.admin}</span>
//                   <span className="text-muted-foreground"> · {l.action}</span>
//                   {l.notes && <span className="text-muted-foreground italic"> — {l.notes}</span>}
//                 </div>
//                 <span className="text-muted-foreground">{l.ts}</span>
//               </div>
//             ))}
//           </div>
//         </GlassCard>
//       </div>

//       {/* Detail Modal */}
//       <AnimatePresence>
//         {selected && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
//             onClick={() => { setSelected(null); setReview(null); }}
//           >
//             <motion.div
//               initial={{ y: 30, scale: 0.96 }}
//               animate={{ y: 0, scale: 1 }}
//               exit={{ y: 30, scale: 0.96 }}
//               onClick={(e) => e.stopPropagation()}
//               className="bg-card border border-border/40 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
//             >
//               {/* Header */}
//               <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/40 p-4 flex items-center justify-between z-10">
//                 <div className="flex items-center gap-3">
//                   {selected.profile_photo ? (
//                     <img src={resolveAsset(selected.profile_photo)} className="h-12 w-12 rounded-full object-cover" alt="" />
//                   ) : (
//                     <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
//                       {selected.display_name?.charAt(0)?.toUpperCase() ?? "?"}
//                     </div>
//                   )}
//                   <div>
//                     <h2 className="font-bold">{selected.display_name}</h2>
//                     <p className="text-xs text-muted-foreground font-mono">
//                       {selected.creator_id} · <StatusPill s={selected.status} />
//                     </p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => { setSelected(null); setReview(null); }}
//                   className="glass rounded-full p-2"
//                 >
//                   <X className="h-4 w-4" />
//                 </button>
//               </div>

//               <div className="p-4 grid lg:grid-cols-2 gap-4">
//                 {/* Personal */}
//                 <GlassCard>
//                   <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
//                     <Users className="h-4 w-4" /> Personal Details
//                   </h3>
//                   <div className="space-y-2 text-xs">
//                     <div className="flex items-center gap-2"><Phone className="h-3 w-3 text-muted-foreground" /> {selected.phone}</div>
//                     <div className="flex items-center gap-2"><Mail className="h-3 w-3 text-muted-foreground" /> {selected.email}</div>
//                     <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-muted-foreground" /> {selected.state_name ?? "—"}</div>
//                     <div className="flex items-center gap-2"><Calendar className="h-3 w-3 text-muted-foreground" /> Joined {formatDate(selected.joined_date)}</div>
//                   </div>
//                 </GlassCard>

//                 {/* Bank */}
//                 <GlassCard>
//                   <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
//                     <CreditCard className="h-4 w-4" /> Bank Details
//                     {reviewLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
//                   </h3>
//                   {review?.bank_details ? (
//                     <div className="space-y-1.5 text-xs">
//                       <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span>{review.bank_details.bank_status ?? "—"}</span></div>
//                       <div className="flex justify-between"><span className="text-muted-foreground">Uploaded</span><span>{formatDate(review.bank_details.uploaded_at)}</span></div>
//                       <div className="flex justify-between"><span className="text-muted-foreground">Updated</span><span>{formatDate(review.bank_details.updated_at)}</span></div>
//                       {review.bank_details.bank_photo && (
//                         <div className="mt-2 rounded-lg overflow-hidden border border-border/40 aspect-[4/3] bg-background/40">
//                           <DocImage src={resolveAsset(review.bank_details.bank_photo)} label="Bank proof" />
//                         </div>
//                       )}
//                     </div>
//                   ) : (
//                     <p className="text-xs text-muted-foreground">
//                       {reviewLoading ? "Loading bank details…" : "Bank details not available."}
//                     </p>
//                   )}
//                 </GlassCard>

//                 {/* Documents */}
//                 <GlassCard className="lg:col-span-2">
//                   <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
//                     <FileText className="h-4 w-4" /> Documents
//                   </h3>
//                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                     {[
//                       { label: "Aadhaar Front", photo: selected.aadhar_photo, status: selected.aadhar_status },
//                       { label: "Aadhaar Back", photo: selected.aadhar_photo, status: selected.aadhar_status },
//                       { label: "PAN Card", photo: selected.pan_photo, status: selected.pan_status },
//                       { label: "Selfie", photo: selected.selfie_photo, status: selected.selfie_status, icon: Camera },
//                     ].map((d, i) => (
//                       <div key={i} className="space-y-1.5">
//                         <div className="relative rounded-lg overflow-hidden border border-border/40 aspect-[4/3] bg-background/40">
//                           <DocImage src={resolveAsset(d.photo)} label={d.label} />
//                           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//                             <span className="text-white/20 text-3xl font-black rotate-[-25deg] tracking-widest">VELORA</span>
//                           </div>
//                         </div>
//                         <div className="flex justify-between items-center">
//                           <p className="text-[11px] font-medium">{d.label}</p>
//                           <StatusPill s={d.status} />
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </GlassCard>

//                 {/* Agreement */}
//                 <GlassCard>
//                   <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
//                     <ShieldCheck className="h-4 w-4" /> Creator Agreement
//                   </h3>
//                   <div className="text-xs space-y-1.5">
//                     <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="text-success">Accepted ✓</span></div>
//                     <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{formatDate(selected.joined_date)}</span></div>
//                     {selected.rejection_reason && (
//                       <div className="flex justify-between gap-2"><span className="text-muted-foreground">Rejection</span><span className="text-destructive text-right">{selected.rejection_reason}</span></div>
//                     )}
//                     <button
//                       onClick={() => toast("Agreement PDF not available via API yet")}
//                       className="mt-2 w-full glass rounded-lg py-1.5 text-xs"
//                     >
//                       View agreement
//                     </button>
//                   </div>
//                 </GlassCard>

//                 {/* Fraud signals */}
//                 <GlassCard>
//                   <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
//                     <Fingerprint className="h-4 w-4" /> Fraud Signals
//                   </h3>
//                   {selected.rejection_reason ? (
//                     <div className="space-y-1.5">
//                       <div className="flex items-center gap-2 text-xs bg-destructive/10 text-destructive rounded-lg px-2 py-1.5">
//                         <AlertTriangle className="h-3.5 w-3.5" /> {selected.rejection_reason}
//                       </div>
//                     </div>
//                   ) : (
//                     <p className="text-xs text-success flex items-center gap-1">
//                       <CheckCircle2 className="h-3 w-3" /> No fraud signals detected
//                     </p>
//                   )}
//                 </GlassCard>

//                 {/* Timeline */}
//                 <GlassCard className="lg:col-span-2">
//                   <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
//                     <History className="h-4 w-4" /> KYC Timeline
//                     {reviewLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
//                   </h3>
//                   {review?.kyc_timeline?.length ? (
//                     <div className="space-y-2">
//                       {review.kyc_timeline.map((t, i) => (
//                         <div key={i} className="flex gap-3 text-xs">
//                           <div className="flex flex-col items-center">
//                             <div className="h-2 w-2 rounded-full bg-primary" />
//                             {i < review.kyc_timeline.length - 1 && <div className="w-px flex-1 bg-border/40" />}
//                           </div>
//                           <div className="pb-2">
//                             <p className="font-medium">{t.title}</p>
//                             <p className="text-muted-foreground text-[10px]">{formatDateTime(t.date)}</p>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <p className="text-xs text-muted-foreground">
//                       {reviewLoading ? "Loading timeline…" : "Timeline not available."}
//                     </p>
//                   )}
//                 </GlassCard>

//                 {/* Actions */}
//                 <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-5 gap-2">
//                   <button
//                     onClick={() => onApprove(selected)}
//                     disabled={actionLoading}
//                     className="rounded-xl bg-success/20 text-success py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-success/30 disabled:opacity-50"
//                   >
//                     {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Approve
//                   </button>
//                   <button
//                     onClick={() => setRejectOpen(true)}
//                     disabled={actionLoading}
//                     className="rounded-xl bg-destructive/20 text-destructive py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-destructive/30 disabled:opacity-50"
//                   >
//                     <XCircle className="h-4 w-4" /> Reject
//                   </button>
//                   <button
//                     onClick={() => setReuploadOpen(true)}
//                     disabled={actionLoading}
//                     className="rounded-xl bg-orange-500/20 text-orange-300 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-orange-500/30 disabled:opacity-50"
//                   >
//                     <RotateCcw className="h-4 w-4" /> Re-upload
//                   </button>
//                   <button
//                     onClick={() => onSuspend(selected)}
//                     className="rounded-xl bg-warning/20 text-warning py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-warning/30"
//                   >
//                     <ShieldAlert className="h-4 w-4" /> Suspend
//                   </button>
//                   <button
//                     onClick={() => onBan(selected)}
//                     className="rounded-xl bg-destructive/30 text-destructive py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-destructive/40"
//                   >
//                     <Ban className="h-4 w-4" /> Ban
//                   </button>
//                 </div>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Reject reasons */}
//       <AnimatePresence>
//         {rejectOpen && selected && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
//             onClick={() => setRejectOpen(false)}
//           >
//             <motion.div
//               initial={{ scale: 0.95 }}
//               animate={{ scale: 1 }}
//               onClick={(e) => e.stopPropagation()}
//               className="bg-card border border-border/40 rounded-2xl max-w-md w-full p-5"
//             >
//               <h3 className="font-bold mb-1">Reject KYC</h3>
//               <p className="text-xs text-muted-foreground mb-4">Choose a reason — creator gets notified</p>
//               <div className="space-y-1.5">
//                 {REJECTION_REASONS.map((r) => (
//                   <button
//                     key={r}
//                     onClick={() => onReject(selected, r)}
//                     disabled={actionLoading}
//                     className="w-full text-left glass rounded-lg px-3 py-2 text-xs hover:bg-destructive/10 disabled:opacity-50"
//                   >
//                     {r}
//                   </button>
//                 ))}
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Re-upload selection */}
//       <AnimatePresence>
//         {reuploadOpen && selected && (
//           <ReuploadModal
//             creator={selected}
//             onClose={() => setReuploadOpen(false)}
//             onConfirm={(items) => onReupload(selected, items)}
//           />
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// function ReuploadModal({
//   creator,
//   onClose,
//   onConfirm,
// }: {
//   creator: Creator;
//   onClose: () => void;
//   onConfirm: (items: string[]) => void;
// }) {
//   const [picked, setPicked] = useState<string[]>([]);
//   const items = ["Aadhaar", "PAN", "Selfie", "Bank details"];
//   const toggle = (i: string) =>
//     setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
//       onClick={onClose}
//     >
//       <motion.div
//         initial={{ scale: 0.95 }}
//         animate={{ scale: 1 }}
//         onClick={(e) => e.stopPropagation()}
//         className="bg-card border border-border/40 rounded-2xl max-w-md w-full p-5"
//       >
//         <h3 className="font-bold mb-1">Request Re-upload</h3>
//         <p className="text-xs text-muted-foreground mb-4">
//           Pick what {creator.display_name} needs to re-submit
//         </p>
//         <div className="space-y-1.5 mb-4">
//           {items.map((i) => (
//             <label key={i} className="flex items-center gap-2 glass rounded-lg px-3 py-2 text-xs cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={picked.includes(i)}
//                 onChange={() => toggle(i)}
//                 className="accent-primary"
//               />
//               {i}
//             </label>
//           ))}
//         </div>
//         <button
//           disabled={picked.length === 0}
//           onClick={() => onConfirm(picked)}
//           className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold disabled:opacity-40"
//         >
//           Send Notification
//         </button>
//       </motion.div>
//     </motion.div>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, PageHeader } from "@/components/ui-kit";
import {
  Search, Filter, Download, CheckCircle2, XCircle, RotateCcw, Ban,
  ShieldAlert, Clock, FileCheck2, Users, AlertTriangle, X, Eye,
  MapPin, Mail, Phone, Calendar, CreditCard, Camera,
  History, ChevronLeft, ChevronRight,
  Loader2, RefreshCw, ImageOff,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/kyc")({
  component: KycPage,
});

/* ============================================================
   API CONFIGURATION
============================================================ */

const API_BASE_URL = String(
  import.meta.env.VITE_BASE_URL ?? "",
).replace(/\/+$/, "");

type KycStatus =
  | "Pending"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Re-upload Required";

type DocStatus =
  | "Verified"
  | "Pending"
  | "Rejected"
  | "Re-upload";

type ExportStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "re-upload";

type ReuploadDocument = "bank" | "selfie";

const ENDPOINTS = {
  dashboard: `${API_BASE_URL}/admin/kyc-dashboard/`,

  review: (userId: number) =>
    `${API_BASE_URL}/kyc/review/${userId}`,

  // IMPORTANT:
  // This assumes your FastAPI route is mounted at:
  // /admin/kyc/user/{creator_id}/status
  updateStatus: (userId: number) =>
    `${API_BASE_URL}/kyc/review/${userId}/status`,

  exportPdf: (status: ExportStatus) =>
    `${API_BASE_URL}/admin/kyc-dashboard/export/${status}/pdf`,
};

function getAuthToken(): string | null {
  try {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      null
    );
  } catch {
    return null;
  }
}

function authHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  const token = getAuthToken();

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

function resolveAsset(
  path: string | null | undefined,
): string | undefined {
  if (!path) return undefined;

  if (
    /^(https?:)?\/\//i.test(path) ||
    path.startsWith("data:")
  ) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${API_BASE_URL}${path}`;
  }

  return `${API_BASE_URL}/${path}`;
}

/* ============================================================
   TYPES
============================================================ */

interface Creator {
  id: number | null;
  user_id: number;
  creator_id: string;
  display_name: string;
  email: string;
  phone: string;
  state_id: number | null;
  state_name: string | null;
  profile_photo: string | null;
  joined_date: string;
  selfie_photo: string | null;
  selfie_status: DocStatus;
  status: KycStatus;
  rejection_reason: string | null;
  updated_at: string;
}

interface StateOption {
  id: number;
  state_name: string;
}

interface DashboardSummary {
  total_creators: number;
  pending_kyc: number;
  approved: number;
  rejected: number;
  re_upload: number;
  completed_today: number;
}

interface Pagination {
  page: number;
  limit: number;
  total_records: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

interface DashboardResponse {
  success: boolean;
  message: string;
  summary: DashboardSummary;
  states: StateOption[];
  filters: Record<string, any>;
  pagination: Pagination;
  creators: Creator[];
}

interface ReviewData {
  user_id: number;
  creator_id: string;

  personal_details: {
    display_name: string;
    phone: string;
    email: string;
    state_id: number | null;
    state_name: string | null;
    profile_photo: string | null;
    joined_date: string;
  };

  bank_details: {
    bank_photo: string | null;
    bank_status: string | null;
    uploaded_at: string | null;
    updated_at: string | null;
  } | null;

  documents: {
    selfie: { photo: string | null; status: DocStatus };
  };

  kyc_status: KycStatus;
  rejection_reason: string | null;
}

interface AuditEntry {
  admin: string;
  action: string;
  ts: string;
  notes?: string;
}

/* ============================================================
   CONSTANTS
============================================================ */

const STATUSES: KycStatus[] = [
  "Pending",
  "Under Review",
  "Approved",
  "Rejected",
  "Re-upload Required",
];

const REJECTION_REASONS = [
  "Bank proof blurry",
  "Bank statement invalid",
  "Selfie mismatch",
  "Name mismatch",
  "Invalid document",
  "Duplicate account",
  "Other reason",
];

const STAT_COLORS: Record<string, string> = {
  Verified: "bg-success/20 text-success",
  Approved: "bg-success/20 text-success",
  Pending: "bg-warning/20 text-warning",
  "Under Review": "bg-blue-500/20 text-blue-300",
  Rejected: "bg-destructive/20 text-destructive",
  "Re-upload": "bg-orange-500/20 text-orange-300",
  "Re-upload Required": "bg-orange-500/20 text-orange-300",
};

/* ============================================================
   DISPLAY HELPERS
============================================================ */

function StatusPill({
  s,
}: {
  s: KycStatus | DocStatus;
}) {
  return (
    <span
      className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${
        STAT_COLORS[s] ??
        "bg-muted/20 text-muted-foreground"
      }`}
    >
      {s}
    </span>
  );
}

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) return "—";

  const d = new Date(value);

  if (isNaN(d.getTime())) return value;

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
  loading,
}: any) {
  return (
    <GlassCard className="!p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            {label}
          </p>

          <p className="text-2xl font-bold mt-1">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              (value ?? 0).toLocaleString()
            )}
          </p>
        </div>

        <div className={`rounded-xl p-2 ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </GlassCard>
  );
}

function DocImage({
  src,
  label,
}: {
  src: string | undefined;
  label: string;
}) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 gap-1">
        <ImageOff className="h-6 w-6" />
        <span className="text-[10px]">
          No image
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={label}
      className="w-full h-full object-cover"
      onError={() => setBroken(true)}
    />
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */

function KycPage() {
  /* ---------------- FILTERS ---------------- */

  const [search, setSearch] = useState("");

  const [stateId, setStateId] = useState<
    number | "all"
  >("all");

  const [statusF, setStatusF] = useState<
    "all" | KycStatus
  >("all");

  const [dateF, setDateF] = useState("");

  /* ---------------- DATA ---------------- */

  const [data, setData] =
    useState<DashboardResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null,
  );

  /* ---------------- PAGINATION ---------------- */

  const [page, setPage] = useState(1);

  const limit = 8;

  /* ---------------- MODALS ---------------- */

  const [selected, setSelected] =
    useState<Creator | null>(null);

  const [review, setReview] =
    useState<ReviewData | null>(null);

  const [reviewLoading, setReviewLoading] =
    useState(false);

  const [rejectOpen, setRejectOpen] =
    useState(false);

  const [reuploadOpen, setReuploadOpen] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  /* ---------------- AUDIT LOG ---------------- */

  const [auditLog, setAuditLog] = useState<
    AuditEntry[]
  >([
    {
      admin: "admin@velora.live",
      action: "Logged in",
      ts: new Date().toLocaleString(),
    },
  ]);

  /* ============================================================
     BUILD QUERY
  ============================================================ */

  const buildQuery = useCallback(
    (overrides: Record<string, any> = {}) => {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(limit));

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (stateId !== "all") {
        params.set("state_id", String(stateId));
      }

      if (statusF !== "all") {
        params.set("kyc_status", statusF);
      }

      if (dateF) {
        params.set("start_date", dateF);
        params.set("end_date", dateF);
      }

      Object.entries(overrides).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          params.set(key, String(value));
        }
      });

      return params.toString();
    },
    [page, search, stateId, statusF, dateF],
  );

  /* ============================================================
     FETCH DASHBOARD
  ============================================================ */

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${ENDPOINTS.dashboard}?${buildQuery()}`,
        {
          method: "GET",
          headers: authHeaders({
            Accept: "application/json",
          }),
        },
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof json?.detail === "string"
            ? json.detail
            : json?.message ||
                `Request failed (${res.status})`,
        );
      }

      if (!json.success) {
        throw new Error(
          json.message || "Failed to load KYC data",
        );
      }

      setData(json);
    } catch (e: any) {
      setError(
        e?.message || "Failed to load KYC data",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        fetchDashboard();
      },
      search ? 350 : 0,
    );

    return () => clearTimeout(timer);
  }, [
    search,
    stateId,
    statusF,
    dateF,
    page,
    fetchDashboard,
  ]);

  /* ============================================================
     FETCH REVIEW
  ============================================================ */

  const fetchReview = useCallback(
    async (userId: number) => {
      setReviewLoading(true);
      setReview(null);

      try {
        const res = await fetch(
          ENDPOINTS.review(userId),
          {
            method: "GET",
            headers: authHeaders({
              Accept: "application/json",
            }),
          },
        );

        if (!res.ok) {
          throw new Error(
            `Review request failed (${res.status})`,
          );
        }

        const json = await res.json();

        setReview(json?.data ?? json ?? null);
      } catch (e) {
        console.error("KYC review error:", e);
        setReview(null);
      } finally {
        setReviewLoading(false);
      }
    },
    [],
  );

  /* ============================================================
     EXPORT PDF
  ============================================================ */

  const handleExport = useCallback(
    async (
      status: ExportStatus,
      label: string,
    ) => {
      try {
        const params = new URLSearchParams(
          buildQuery({
            page: undefined,
            limit: undefined,
          }),
        );

        params.delete("page");
        params.delete("limit");

        const res = await fetch(
          `${ENDPOINTS.exportPdf(status)}?${params.toString()}`,
          {
            method: "GET",
            headers: authHeaders(),
          },
        );

        if (!res.ok) {
          throw new Error(
            `Export failed (${res.status})`,
          );
        }

        const blob = await res.blob();

        const cd =
          res.headers.get("content-disposition") ?? "";

        const match = cd.match(
          /filename="?([^"]+)"?/i,
        );

        const filename =
          match?.[1] ?? `kyc_${status}.pdf`;

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;
        a.download = filename;

        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(url);

        toast.success(`${label} PDF exported`);
      } catch (e: any) {
        toast.error(e?.message || "Export failed");
      }
    },
    [buildQuery],
  );

  /* ============================================================
     AUDIT LOG
  ============================================================ */

  const logAction = (
    action: string,
    notes?: string,
  ) => {
    setAuditLog((previous) => [
      {
        admin: "admin@velora.live",
        action,
        ts: new Date().toLocaleString(),
        notes,
      },
      ...previous,
    ]);
  };

  /* ============================================================
     UPDATE KYC STATUS API
  ============================================================ */

  const updateStatus = useCallback(
    async (
      creator: Creator,
      status: KycStatus,
      reason?: string,
      document?: ReuploadDocument,
    ): Promise<boolean> => {
      if (
        (status === "Rejected" ||
          status === "Re-upload Required") &&
        !reason?.trim()
      ) {
        toast.error("Please provide a reason.");
        return false;
      }

      if (
        status === "Re-upload Required" &&
        !document
      ) {
        toast.error("Please select a document.");
        return false;
      }

      setActionLoading(true);

      try {
        const payload = {
          status,
          ...(reason?.trim()
            ? { reason: reason.trim() }
            : {}),
          ...(document ? { document } : {}),
        };

        const res = await fetch(
          ENDPOINTS.updateStatus(creator.user_id),
          {
            method: "POST",
            headers: authHeaders({
              "Content-Type": "application/json",
              Accept: "application/json",
            }),
            body: JSON.stringify(payload),
          },
        );

        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          const detail = body?.detail;

          const message =
            typeof detail === "string"
              ? detail
              : Array.isArray(detail)
                ? detail
                    .map(
                      (item: any) =>
                        item.msg ||
                        JSON.stringify(item),
                    )
                    .join(", ")
                : body?.message ||
                  `Request failed (${res.status})`;

          throw new Error(message);
        }

        const returnedStatus: KycStatus =
          body?.kyc_status || status;

        const returnedReason: string | null =
          body?.reason ??
          (status === "Approved"
            ? null
            : reason ?? null);

        const updateCreator = (
          creatorData: Creator,
        ): Creator => ({
          ...creatorData,

          status: returnedStatus,

          rejection_reason: returnedReason,

          selfie_status:
            status === "Approved"
              ? "Verified"
              : document === "selfie"
                ? "Re-upload"
                : creatorData.selfie_status,
        });

        // Update dashboard row.
        setData((previous) => {
          if (!previous) return previous;

          return {
            ...previous,
            creators: previous.creators.map((c) =>
              c.user_id === creator.user_id
                ? updateCreator(c)
                : c,
            ),
          };
        });

        // Update selected creator.
        setSelected((previous) => {
          if (
            !previous ||
            previous.user_id !== creator.user_id
          ) {
            return previous;
          }

          return updateCreator(previous);
        });

        toast.success(
          body?.message ||
            `KYC status updated to ${returnedStatus}.`,
        );

        // Refresh server data and summary.
        await fetchDashboard();

        return true;
      } catch (e: any) {
        toast.error(
          e?.message || "Failed to update KYC status.",
        );

        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchDashboard],
  );

  /* ============================================================
     APPROVE
  ============================================================ */

  const onApprove = async (creator: Creator) => {
    const ok = await updateStatus(
      creator,
      "Approved",
    );

    if (ok) {
      logAction(
        `Approved KYC: ${creator.creator_id}`,
      );
    }
  };

  /* ============================================================
     REJECT
  ============================================================ */

  const onReject = async (
    creator: Creator,
    reason: string,
  ) => {
    const ok = await updateStatus(
      creator,
      "Rejected",
      reason,
    );

    if (ok) {
      logAction(
        `Rejected KYC: ${creator.creator_id}`,
        reason,
      );

      setRejectOpen(false);
    }
  };

  /* ============================================================
     REQUEST RE-UPLOAD
  ============================================================ */

  const onReupload = async (
    creator: Creator,
    document: ReuploadDocument,
    reason: string,
  ) => {
    const ok = await updateStatus(
      creator,
      "Re-upload Required",
      reason,
      document,
    );

    if (ok) {
      logAction(
        `Re-upload requested: ${creator.creator_id}`,
        `${document}: ${reason}`,
      );

      setReuploadOpen(false);
    }
  };

  /* ============================================================
     SUSPEND / BAN
  ============================================================ */

  const onSuspend = (creator: Creator) => {
    logAction(
      `Suspend requested: ${creator.creator_id}`,
    );

    toast.warning(
      "Suspend API is not connected yet.",
    );
  };

  const onBan = (creator: Creator) => {
    logAction(
      `Ban requested: ${creator.creator_id}`,
    );

    toast.warning(
      "Ban API is not connected yet.",
    );
  };

  /* ============================================================
     DERIVED DATA
  ============================================================ */

  const creators = data?.creators ?? [];
  const summary = data?.summary;
  const states = data?.states ?? [];
  const pagination = data?.pagination;

  const hasFilters =
    !!search ||
    stateId !== "all" ||
    statusF !== "all" ||
    !!dateF;

  const clearFilters = () => {
    setSearch("");
    setStateId("all");
    setStatusF("all");
    setDateF("");
    setPage(1);
  };

  const openDetail = (creator: Creator) => {
    setSelected(creator);
    fetchReview(creator.user_id);
  };

  const closeDetail = () => {
    setSelected(null);
    setReview(null);
    setRejectOpen(false);
    setReuploadOpen(false);
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div>
      <PageHeader
        title="KYC Management"
        subtitle="Review, approve & monitor creator verifications"
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                handleExport("approved", "Approved")
              }
              className="glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Approved
            </button>

            <button
              onClick={() =>
                handleExport("pending", "Pending")
              }
              className="glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Pending
            </button>

            <button
              onClick={() =>
                handleExport("rejected", "Rejected")
              }
              className="glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Rejected
            </button>

            <button
              onClick={() =>
                handleExport("re-upload", "Re-upload")
              }
              className="glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Re-upload
            </button>
          </div>
        }
      />

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <SummaryCard
          icon={Users}
          label="Total Creators"
          value={summary?.total_creators}
          tone="bg-primary/20 text-primary"
          loading={loading && !summary}
        />

        <SummaryCard
          icon={Clock}
          label="Pending KYC"
          value={summary?.pending_kyc}
          tone="bg-warning/20 text-warning"
          loading={loading && !summary}
        />

        <SummaryCard
          icon={CheckCircle2}
          label="Approved"
          value={summary?.approved}
          tone="bg-success/20 text-success"
          loading={loading && !summary}
        />

        <SummaryCard
          icon={XCircle}
          label="Rejected"
          value={summary?.rejected}
          tone="bg-destructive/20 text-destructive"
          loading={loading && !summary}
        />

        <SummaryCard
          icon={RotateCcw}
          label="Re-upload"
          value={summary?.re_upload}
          tone="bg-orange-500/20 text-orange-300"
          loading={loading && !summary}
        />

        <SummaryCard
          icon={FileCheck2}
          label="Completed Today"
          value={summary?.completed_today}
          tone="bg-blue-500/20 text-blue-300"
          loading={loading && !summary}
        />
      </div>

      {/* FILTERS */}

      <GlassCard className="!p-3 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, mobile, email, creator ID..."
              className="w-full bg-background/40 rounded-full pl-9 pr-4 py-2 text-sm outline-none border border-border/40"
            />
          </div>

          <select
            value={
              stateId === "all"
                ? "all"
                : String(stateId)
            }
            onChange={(e) => {
              setStateId(
                e.target.value === "all"
                  ? "all"
                  : Number(e.target.value),
              );

              setPage(1);
            }}
            className="bg-background/40 border border-border/40 rounded-full px-3 py-2 text-sm outline-none"
          >
            <option value="all">All states</option>

            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.state_name}
              </option>
            ))}
          </select>

          <select
            value={statusF}
            onChange={(e) => {
              setStatusF(
                e.target.value as "all" | KycStatus,
              );

              setPage(1);
            }}
            className="bg-background/40 border border-border/40 rounded-full px-3 py-2 text-sm outline-none"
          >
            <option value="all">All status</option>

            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateF}
            onChange={(e) => {
              setDateF(e.target.value);
              setPage(1);
            }}
            className="bg-background/40 border border-border/40 rounded-full px-3 py-2 text-sm outline-none"
          />

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Filter className="h-3 w-3" />
              Clear
            </button>
          )}

          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="ml-auto glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                loading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>
      </GlassCard>

      {/* ERROR */}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />

          <span className="flex-1">
            {error}
          </span>

          <button
            onClick={fetchDashboard}
            className="text-xs underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* CREATOR TABLE */}

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
                <th className="text-left p-3">Selfie</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Risk</th>
                <th className="text-right p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading && creators.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-10 text-muted-foreground"
                  >
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                    Loading KYC records…
                  </td>
                </tr>
              ) : creators.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-10 text-muted-foreground text-sm"
                  >
                    No KYC records match your filters
                  </td>
                </tr>
              ) : (
                creators.map((r) => (
                  <tr
                    key={r.user_id}
                    className="border-t border-border/30 hover:bg-background/30"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2 min-w-[160px]">
                        {r.profile_photo ? (
                          <img
                            src={resolveAsset(r.profile_photo)}
                            className="h-9 w-9 rounded-full object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
                            {r.display_name
                              ?.charAt(0)
                              ?.toUpperCase() ?? "?"}
                          </div>
                        )}

                        <div>
                          <p className="font-semibold text-xs">
                            {r.display_name}
                          </p>

                          <p className="text-[10px] text-muted-foreground">
                            {r.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-xs font-mono">
                      {r.creator_id}
                    </td>

                    <td className="p-3 text-xs">
                      {r.phone}
                    </td>

                    <td className="p-3 text-xs">
                      {r.state_name ?? "—"}
                    </td>

                    <td className="p-3 text-xs">
                      {formatDate(r.joined_date)}
                    </td>

                    <td className="p-3">
                      <StatusPill s={r.selfie_status} />
                    </td>

                    <td className="p-3">
                      <StatusPill s={r.status} />
                    </td>

                    <td className="p-3">
                      {r.rejection_reason ? (
                        <span
                          title={r.rejection_reason}
                          className="inline-flex items-center gap-1 text-[10px] bg-destructive/20 text-destructive rounded-full px-2 py-0.5"
                        >
                          <ShieldAlert className="h-3 w-3" />
                          !
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">
                          —
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => openDetail(r)}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/20 text-primary px-3 py-1 text-xs"
                      >
                        <Eye className="h-3 w-3" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        {pagination && (
          <div className="flex items-center justify-between p-3 border-t border-border/30 text-xs">
            <p className="text-muted-foreground">
              {pagination.total_records} records · page{" "}
              {pagination.page} of{" "}
              {Math.max(1, pagination.total_pages)}
            </p>

            <div className="flex items-center gap-1">
              <button
                disabled={!pagination.has_previous}
                onClick={() =>
                  setPage((p) => Math.max(1, p - 1))
                }
                className="glass rounded-full p-1.5 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              {Array.from({
                length: Math.min(
                  5,
                  pagination.total_pages,
                ),
              }).map((_, i) => {
                const start = Math.max(
                  1,
                  pagination.page - 2,
                );

                const p = start + i;

                if (p > pagination.total_pages) {
                  return null;
                }

                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`rounded-full w-7 h-7 text-xs ${
                      pagination.page === p
                        ? "bg-primary text-primary-foreground"
                        : "glass"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                disabled={!pagination.has_next}
                onClick={() => setPage((p) => p + 1)}
                className="glass rounded-full p-1.5 disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* AUDIT LOG */}

      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <History className="h-4 w-4" />
          Admin Audit Log
        </h3>

        <GlassCard className="!p-3 max-h-48 overflow-y-auto">
          <div className="space-y-1.5 text-xs">
            {auditLog.map((l, i) => (
              <div
                key={i}
                className="flex justify-between border-b border-border/20 pb-1.5"
              >
                <div>
                  <span className="font-medium">
                    {l.admin}
                  </span>

                  <span className="text-muted-foreground">
                    {" "}· {l.action}
                  </span>

                  {l.notes && (
                    <span className="text-muted-foreground italic">
                      {" "}— {l.notes}
                    </span>
                  )}
                </div>

                <span className="text-muted-foreground">
                  {l.ts}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* ========================================================
          DETAIL MODAL
      ======================================================== */}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeDetail}
          >
            <motion.div
              initial={{ y: 30, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 30, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border/40 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* MODAL HEADER */}

              <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/40 p-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  {selected.profile_photo ? (
                    <img
                      src={resolveAsset(selected.profile_photo)}
                      className="h-12 w-12 rounded-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
                      {selected.display_name
                        ?.charAt(0)
                        ?.toUpperCase() ?? "?"}
                    </div>
                  )}

                  <div>
                    <h2 className="font-bold">
                      {selected.display_name}
                    </h2>

                    <p className="text-xs text-muted-foreground font-mono">
                      {selected.creator_id} ·{" "}
                      <StatusPill s={selected.status} />
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeDetail}
                  className="glass rounded-full p-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 grid lg:grid-cols-2 gap-4">
                {/* PERSONAL DETAILS */}

                <GlassCard>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    Personal Details
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {selected.phone}
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {selected.email}
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {selected.state_name ?? "—"}
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      Joined {formatDate(selected.joined_date)}
                    </div>
                  </div>
                </GlassCard>

                {/* BANK DETAILS */}

                <GlassCard>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4" />
                    Bank Details

                    {reviewLoading && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                  </h3>

                  {review?.bank_details ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Status
                        </span>
                        <span>
                          {review.bank_details.bank_status ?? "—"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Uploaded
                        </span>
                        <span>
                          {formatDate(
                            review.bank_details.uploaded_at,
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Updated
                        </span>
                        <span>
                          {formatDate(
                            review.bank_details.updated_at,
                          )}
                        </span>
                      </div>

                      {review.bank_details.bank_photo && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-border/40 aspect-[4/3] bg-background/40">
                          <DocImage
                            src={resolveAsset(
                              review.bank_details.bank_photo,
                            )}
                            label="Bank proof"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {reviewLoading
                        ? "Loading bank details…"
                        : "Bank details not available."}
                    </p>
                  )}
                </GlassCard>

                {/* SELFIE VERIFICATION */}

                <GlassCard className="lg:col-span-2">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                    <Camera className="h-4 w-4" />
                    Selfie Verification
                  </h3>

                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="relative rounded-lg overflow-hidden border border-border/40 aspect-[4/3] bg-background/40 w-full sm:w-60">
                      <DocImage
                        src={resolveAsset(selected.selfie_photo)}
                        label="Selfie"
                      />

                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-white/20 text-3xl font-black rotate-[-25deg] tracking-widest">
                          VELORA
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-[11px] font-medium">
                          Selfie
                        </p>

                        <StatusPill s={selected.selfie_status} />
                      </div>

                      {selected.rejection_reason ? (
                        <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {selected.rejection_reason}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No issues flagged for this creator.
                        </p>
                      )}
                    </div>
                  </div>
                </GlassCard>

                {/* ACTION BUTTONS */}

                <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-5 gap-2">
                  <button
                    onClick={() => onApprove(selected)}
                    disabled={actionLoading}
                    className="rounded-xl bg-success/20 text-success py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-success/30 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Approve
                  </button>

                  <button
                    onClick={() => setRejectOpen(true)}
                    disabled={actionLoading}
                    className="rounded-xl bg-destructive/20 text-destructive py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-destructive/30 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>

                  <button
                    onClick={() => setReuploadOpen(true)}
                    disabled={actionLoading}
                    className="rounded-xl bg-orange-500/20 text-orange-300 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-orange-500/30 disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Re-upload
                  </button>

                  <button
                    onClick={() => onSuspend(selected)}
                    className="rounded-xl bg-warning/20 text-warning py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-warning/30"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Suspend
                  </button>

                  <button
                    onClick={() => onBan(selected)}
                    className="rounded-xl bg-destructive/30 text-destructive py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-destructive/40"
                  >
                    <Ban className="h-4 w-4" />
                    Ban
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          REJECTION MODAL
      ======================================================== */}

      <AnimatePresence>
        {rejectOpen && selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setRejectOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border/40 rounded-2xl max-w-md w-full p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">
                  Reject KYC
                </h3>

                <button
                  onClick={() => setRejectOpen(false)}
                  className="glass rounded-full p-1.5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                Choose a rejection reason.
              </p>

              <div className="space-y-1.5">
                {REJECTION_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() =>
                      onReject(selected, reason)
                    }
                    disabled={actionLoading}
                    className="w-full text-left glass rounded-lg px-3 py-2 text-xs hover:bg-destructive/10 disabled:opacity-50"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          RE-UPLOAD MODAL
      ======================================================== */}

      <AnimatePresence>
        {reuploadOpen && selected && (
          <ReuploadModal
            creator={selected}
            onClose={() => setReuploadOpen(false)}
            onConfirm={(document, reason) =>
              onReupload(
                selected,
                document,
                reason,
              )
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   RE-UPLOAD MODAL COMPONENT
============================================================ */

function ReuploadModal({
  creator,
  onClose,
  onConfirm,
}: {
  creator: Creator;
  onClose: () => void;
  onConfirm: (
    document: ReuploadDocument,
    reason: string,
  ) => Promise<void>;
}) {
  const [document, setDocument] = useState<
    ReuploadDocument | ""
  >("");

  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const handleSubmit = async () => {
    if (!document) {
      toast.error("Please select a document.");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please enter the reason.");
      return;
    }

    setSubmitting(true);

    try {
      await onConfirm(document, reason.trim());
    } finally {
      setSubmitting(false);
    }
  };

  const documents: {
    label: string;
    value: ReuploadDocument;
  }[] = [
    {
      label: "Bank Proof",
      value: "bank",
    },
    {
      label: "Selfie",
      value: "selfie",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border/40 rounded-2xl max-w-md w-full p-5"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold">
            Request Re-upload
          </h3>

          <button
            onClick={onClose}
            disabled={submitting}
            className="glass rounded-full p-1.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Select the document that{" "}
          {creator.display_name} needs to submit again.
        </p>

        <div className="space-y-2 mb-4">
          {documents.map((item) => (
            <label
              key={item.value}
              className="flex items-center gap-2 glass rounded-lg px-3 py-3 text-xs cursor-pointer"
            >
              <input
                type="radio"
                name="reupload-document"
                value={item.value}
                checked={document === item.value}
                onChange={() =>
                  setDocument(item.value)
                }
                className="accent-primary"
              />

              <span>{item.label}</span>
            </label>
          ))}
        </div>

        <label className="block text-xs font-medium mb-2">
          Re-upload Reason
        </label>

        <textarea
          value={reason}
          onChange={(e) =>
            setReason(e.target.value)
          }
          placeholder="Example: Bank proof image is blurry. Please upload a clear image."
          rows={4}
          className="w-full bg-background/40 border border-border/40 rounded-xl p-3 text-sm outline-none resize-none mb-4"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 glass rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              !document ||
              !reason.trim() ||
              submitting
            }
            onClick={handleSubmit}
            className="flex-1 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Request Re-upload
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
