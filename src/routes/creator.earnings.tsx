// import { createFileRoute } from "@tanstack/react-router";
// import { PageHeader, GlassCard } from "@/components/ui-kit";
// import { useAuth } from "@/lib/auth-store";
// import { toast } from "sonner";
// import { useCallback, useEffect, useState } from "react";
// import { Loader2 } from "lucide-react";

// export const Route = createFileRoute("/creator/earnings")({ component: E });

// // Backend base URL. Prefer Vite env vars; fall back to localhost so the URL
// // is never empty (an empty string makes the browser request a relative path
// // like /earnings/1 against the frontend origin → 404).
// const API_BASE_URL = String(
//   import.meta.env.VITE_BASE_URL ??
//     import.meta.env.VITE_API_BASE_URL ??
//     "http://127.0.0.1:8000"
// ).replace(/\/+$/, "");

// type Withdrawal = {
//   withdrawal_id: number;
//   user_id: number;
//   requested_amount: number;
//   status: string;
//   requested_at: string | null;
//   approved_at: string | null;
//   rejected_at: string | null;
// };

// // The withdraw endpoint can return `detail` as a plain string, a pydantic 422
// // array, or — for insufficient balance — an object with a message plus a
// // balance breakdown. Normalize all of them to a human-readable string.
// function extractError(detail: unknown): string {
//   if (!detail) return "";
//   if (typeof detail === "string") return detail;
//   if (Array.isArray(detail)) {
//     return detail
//       .map((e: any) => e?.msg || e?.message)
//       .filter(Boolean)
//       .join("; ");
//   }
//   if (typeof detail === "object") {
//     const d = detail as Record<string, any>;
//     const base = typeof d.message === "string" ? d.message : "";
//     const ab = d.available_balance;
//     const pw = d.pending_withdrawal;
//     const rb = d.remaining_balance;
//     if (ab != null && pw != null && rb != null) {
//       return `${base || "Insufficient available balance"} · available ₹${Number(ab).toLocaleString()} · pending ₹${Number(pw).toLocaleString()} · withdrawable ₹${Number(rb).toLocaleString()}`;
//     }
//     return base || JSON.stringify(detail);
//   }
//   return String(detail);
// }

// function E() {
//   const user = useAuth((s) => s.user);
//   const creatorId = user?.id ?? 1;

//   const [totalEarned, setTotalEarned] = useState<number | null>(null);
//   const [availablePayout, setAvailablePayout] = useState<number | null>(null);
//   const [withdrawnTotal, setWithdrawnTotal] = useState<number | null>(null);
//   const [history, setHistory] = useState<Withdrawal[]>([]);
//   const [loading, setLoading] = useState(true);

//   const [withdrawInput, setWithdrawInput] = useState("");
//   const [withdrawing, setWithdrawing] = useState(false);

//   // -------------------------------------------------------------------------
//   // GET /earnings/{user_id} — flat response (no `data` envelope)
//   // -------------------------------------------------------------------------
//   const loadEarnings = useCallback(async (silent = false) => {
//     if (!silent) setLoading(true);
//     try {
//       const res = await fetch(`${API_BASE_URL}/earnings/${creatorId}`);

//       // A creator with no earnings row yet gets a 404 — show zeros.
//       if (res.status === 404) {
//         setTotalEarned(0);
//         setAvailablePayout(0);
//         setWithdrawnTotal(0);
//         setHistory([]);
//         return;
//       }

//       if (!res.ok) {
//         const err = await res.json().catch(() => null);
//         throw new Error(
//           extractError(err?.detail) || `Failed to load earnings (${res.status})`
//         );
//       }

//       const body = await res.json();
//       setTotalEarned(Number(body.total_earned) || 0);
//       setAvailablePayout(Number(body.available_payout) || 0);
//       setWithdrawnTotal(Number(body.withdrawal_amount) || 0);
//       setHistory(
//         Array.isArray(body.withdrawal_history) ? body.withdrawal_history : []
//       );
//     } catch (err: any) {
//       toast.error(err?.message || "Failed to load earnings");
//     } finally {
//       if (!silent) setLoading(false);
//     }
//   }, [creatorId]);

//   useEffect(() => {
//     loadEarnings();
//   }, [loadEarnings]);

//   // The balance is only deducted when an admin *approves* a withdrawal, not
//   // when it is requested — so a pending request must NOT reduce the displayed
//   // payout. Show the raw balance; pending requests just appear in the history.

//   // -------------------------------------------------------------------------
//   // POST /earnings/{user_id}/withdraw?amount=...  (amount is a query param,
//   // NOT a JSON body — the new signature is `amount: Decimal` with no Body())
//   // -------------------------------------------------------------------------
//   async function handleWithdraw() {
//     const raw = withdrawInput.trim();
//     const amount = parseFloat(raw);

//     if (!raw || isNaN(amount) || amount <= 0) {
//       toast.error("Enter a valid amount to withdraw");
//       return;
//     }
//     if ((raw.split(".")[1]?.length ?? 0) > 2) {
//       toast.error("Amount cannot have more than 2 decimal places");
//       return;
//     }
//     if (amount > (availablePayout ?? 0)) {
//       toast.error(
//         `Amount exceeds available payout (₹${(availablePayout ?? 0).toLocaleString()})`
//       );
//       return;
//     }

//     setWithdrawing(true);
//     try {
//       const res = await fetch(
//         `${API_BASE_URL}/earnings/${creatorId}/withdraw?amount=${encodeURIComponent(
//           String(amount)
//         )}`,
//         { method: "POST" }
//       );

//       if (!res.ok) {
//         const err = await res.json().catch(() => null);
//         throw new Error(
//           extractError(err?.detail) || `Withdrawal failed (${res.status})`
//         );
//       }

//       const body = await res.json().catch(() => ({}));

//       // Optimistically push the new pending request into the local history so
//       // it appears instantly. The payout itself stays unchanged (the balance
//       // isn't deducted until admin approval); the re-fetch reconciles the list.
//       setHistory((prev) => [
//         {
//           withdrawal_id: body?.withdrawal_id ?? -Date.now(),
//           user_id: creatorId,
//           requested_amount: amount,
//           status: body?.status ?? "pending",
//           requested_at: body?.requested_at ?? new Date().toISOString(),
//           approved_at: null,
//           rejected_at: null,
//         } as Withdrawal,
//         ...prev,
//       ]);

//       setWithdrawInput("");
//       toast.success(
//         `₹${amount.toLocaleString()} withdrawal requested${
//           body?.withdrawal_id ? ` (#${body.withdrawal_id})` : ""
//         }`
//       );

//       // Silent re-fetch reconciles with the server without flashing the
//       // loading spinner over the optimistic entry.
//       await loadEarnings(true);
//     } catch (err: any) {
//       toast.error(err?.message || "Withdrawal failed. Please try again.");
//     } finally {
//       setWithdrawing(false);
//     }
//   }

//   const canWithdraw = (availablePayout ?? 0) > 0 && !withdrawing;

//   return (
//     <div>
//       <PageHeader title="Earnings" />

//       <div className="grid grid-cols-2 gap-3 mb-5">
//         <GlassCard>
//           <p className="text-xs text-muted-foreground">Total earned</p>
//           <p className="text-2xl font-bold gradient-text">
//             {totalEarned == null ? "—" : `₹${totalEarned.toLocaleString()}`}
//           </p>
//         </GlassCard>
//         <GlassCard>
//           <p className="text-xs text-muted-foreground">Available payout</p>
//           <p className="text-2xl font-bold">
//             {availablePayout == null ? "—" : `₹${availablePayout.toLocaleString()}`}
//           </p>
//         </GlassCard>
//       </div>

//       {/* Withdrawal history. The new /earnings endpoint no longer returns a
//           7-day chart array, so the history list takes its place. */}
//       <GlassCard className="mb-5">
//         <div className="flex items-center justify-between mb-3">
//           <p className="text-xs text-muted-foreground">Withdrawal history</p>
//           {withdrawnTotal != null && withdrawnTotal > 0 && (
//             <p className="text-xs text-muted-foreground">
//               Approved: ₹{withdrawnTotal.toLocaleString()}
//             </p>
//           )}
//         </div>

//         {loading ? (
//           <div className="flex items-center justify-center py-6">
//             <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
//           </div>
//         ) : history.length === 0 ? (
//           <p className="text-sm text-muted-foreground py-6 text-center">
//             No withdrawals yet
//           </p>
//         ) : (
//           <div className="space-y-2">
//             {history.map((h) => (
//               <div
//                 key={h.withdrawal_id}
//                 className="flex items-center justify-between rounded-xl bg-glass p-3"
//               >
//                 <div>
//                   <p className="text-sm font-medium">
//                     ₹{Number(h.requested_amount).toLocaleString()}
//                   </p>
//                   <p className="text-xs text-muted-foreground">
//                     {h.requested_at
//                       ? new Date(h.requested_at).toLocaleString()
//                       : "—"}
//                   </p>
//                 </div>
//                 <StatusBadge status={h.status} />
//               </div>
//             ))}
//           </div>
//         )}
//       </GlassCard>

//       {/* Withdrawal request */}
//       <GlassCard className="mb-5">
//         <p className="text-xs text-muted-foreground mb-2">Request withdrawal</p>
//         <div className="flex gap-2">
//           <div className="flex items-center flex-1 rounded-xl bg-glass border border-glass px-3">
//             <span className="text-sm text-muted-foreground">₹</span>
//             <input
//               type="number"
//               inputMode="decimal"
//               min="0"
//               step="0.01"
//               placeholder="Enter amount"
//               value={withdrawInput}
//               onChange={(e) => setWithdrawInput(e.target.value)}
//               disabled={!canWithdraw}
//               className="flex-1 w-full bg-transparent py-3 px-2 text-sm outline-none disabled:opacity-50"
//             />
//           </div>
//           <button
//             onClick={handleWithdraw}
//             disabled={!canWithdraw}
//             className={`rounded-xl bg-gradient-primary px-5 py-3 font-semibold shadow-glow text-sm ${
//               canWithdraw ? "" : "opacity-60 pointer-events-none"
//             }`}
//           >
//             {withdrawing ? (
//               <Loader2 className="h-4 w-4 animate-spin" />
//             ) : (
//               "Withdraw"
//             )}
//           </button>
//         </div>

//         {(availablePayout ?? 0) > 0 && (
//           <button
//             onClick={() => setWithdrawInput((availablePayout ?? 0).toFixed(2))}
//             disabled={withdrawing}
//             className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
//           >
//             Use max · ₹{(availablePayout ?? 0).toLocaleString()}
//           </button>
//         )}
//       </GlassCard>

//       <p className="text-xs text-muted-foreground mt-2 text-center">
//         Default commission: 20% · Calls under 1 min not charged
//       </p>
//     </div>
//   );
// }

// function StatusBadge({ status }: { status: string }) {
//   const styles: Record<string, string> = {
//     pending: "bg-yellow-500/20 text-yellow-500",
//     approved: "bg-success/20 text-success",
//     rejected: "bg-destructive/20 text-destructive",
//   };
//   const cls = styles[status] || "bg-muted text-muted-foreground";
//   return (
//     <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${cls}`}>
//       {status}
//     </span>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, GlassCard } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Loader2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/creator/earnings")({
  component: E,
});

// --------------------------------------------------
// API BASE URL
// --------------------------------------------------

const API_BASE_URL = String(
  import.meta.env.VITE_BASE_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    "http://127.0.0.1:8000"
).replace(/\/+$/, "");

// --------------------------------------------------
// TYPES
// --------------------------------------------------

type Withdrawal = {
  withdrawal_id: number;
  user_id: number;
  requested_amount: number;
  status: string;
  requested_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
};

type EarningsResponse = {
  status_code?: number;
  message?: string;
  data?: {
    user_id?: number;
    total_earned?: number;
    gift_earnings?: number;
    withdrawal_amount?: number;
    available_payout?: number;
    withdrawal_history?: Withdrawal[];
  };
};

// --------------------------------------------------
// ERROR HANDLING
// --------------------------------------------------

function extractError(detail: unknown): string {
  if (!detail) {
    return "";
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((e: any) => e?.msg || e?.message)
      .filter(Boolean)
      .join("; ");
  }

  if (typeof detail === "object") {
    const d = detail as Record<string, any>;

    const base =
      typeof d.message === "string"
        ? d.message
        : "";

    const availableBalance = d.available_balance;
    const pendingWithdrawal = d.pending_withdrawal;
    const remainingBalance = d.remaining_balance;

    if (
      availableBalance != null &&
      pendingWithdrawal != null &&
      remainingBalance != null
    ) {
      return `${
        base || "Insufficient available balance"
      } · available ₹${Number(
        availableBalance
      ).toLocaleString("en-IN")} · pending ₹${Number(
        pendingWithdrawal
      ).toLocaleString("en-IN")} · withdrawable ₹${Number(
        remainingBalance
      ).toLocaleString("en-IN")}`;
    }

    return base || JSON.stringify(detail);
  }

  return String(detail);
}

// --------------------------------------------------
// CURRENCY FORMAT
// --------------------------------------------------

function formatCurrency(amount: number | null): string {
  if (amount === null) {
    return "—";
  }

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------

function E() {
  const user = useAuth((s) => s.user);

  const creatorId = user?.id ?? 1;

  // --------------------------------------------------
  // EARNINGS STATES
  // --------------------------------------------------

  const [totalEarned, setTotalEarned] =
    useState<number | null>(null);

  const [giftEarnings, setGiftEarnings] =
    useState<number | null>(null);

  const [availablePayout, setAvailablePayout] =
    useState<number | null>(null);

  const [withdrawnTotal, setWithdrawnTotal] =
    useState<number | null>(null);

  // --------------------------------------------------
  // WITHDRAWAL HISTORY
  // --------------------------------------------------

  const [history, setHistory] = useState<Withdrawal[]>([]);

  // --------------------------------------------------
  // LOADING STATES
  // --------------------------------------------------

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [withdrawing, setWithdrawing] = useState(false);

  // --------------------------------------------------
  // WITHDRAW INPUT
  // --------------------------------------------------

  const [withdrawInput, setWithdrawInput] = useState("");

  // --------------------------------------------------
  // GET EARNINGS API
  // GET /earnings/{user_id}
  // --------------------------------------------------

  const loadEarnings = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const res = await fetch(
          `${API_BASE_URL}/earnings/${creatorId}`
        );

        // --------------------------------------------------
        // NO EARNINGS RECORD
        // --------------------------------------------------

        if (res.status === 404) {
          setTotalEarned(0);
          setGiftEarnings(0);
          setAvailablePayout(0);
          setWithdrawnTotal(0);
          setHistory([]);

          return;
        }

        // --------------------------------------------------
        // API ERROR
        // --------------------------------------------------

        if (!res.ok) {
          const err = await res.json().catch(() => null);

          throw new Error(
            extractError(err?.detail) ||
              `Failed to load earnings (${res.status})`
          );
        }

        // --------------------------------------------------
        // RESPONSE
        // --------------------------------------------------

        const body: EarningsResponse = await res.json();

        // Supports:
        // { data: { total_earned, gift_earnings, ... } }
        //
        // Also supports flat response:
        // { total_earned, gift_earnings, ... }

        const earningsData = body?.data ?? body;

        // --------------------------------------------------
        // TOTAL EARNED
        // --------------------------------------------------

        setTotalEarned(
          Number(earningsData.total_earned) || 0
        );

        // --------------------------------------------------
        // GIFT EARNINGS
        // --------------------------------------------------

        setGiftEarnings(
          Number(earningsData.gift_earnings) || 0
        );

        // --------------------------------------------------
        // AVAILABLE PAYOUT
        // --------------------------------------------------

        setAvailablePayout(
          Number(earningsData.available_payout) || 0
        );

        // --------------------------------------------------
        // WITHDRAWAL AMOUNT
        // --------------------------------------------------

        setWithdrawnTotal(
          Number(earningsData.withdrawal_amount) || 0
        );

        // --------------------------------------------------
        // WITHDRAWAL HISTORY
        // --------------------------------------------------

        setHistory(
          Array.isArray(earningsData.withdrawal_history)
            ? earningsData.withdrawal_history
            : []
        );

      } catch (err: any) {
        toast.error(
          err?.message || "Failed to load earnings"
        );

      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [creatorId]
  );

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  // --------------------------------------------------
  // REFRESH
  // --------------------------------------------------

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await loadEarnings(true);
    } finally {
      setRefreshing(false);
    }
  }

  // --------------------------------------------------
  // WITHDRAWAL REQUEST
  //
  // POST /earnings/{user_id}/withdraw?amount=...
  // --------------------------------------------------

  async function handleWithdraw() {
    const raw = withdrawInput.trim();

    const amount = Number(raw);

    // --------------------------------------------------
    // VALIDATE INPUT
    // --------------------------------------------------

    if (
      !raw ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      toast.error("Enter a valid amount to withdraw");
      return;
    }

    // --------------------------------------------------
    // VALIDATE DECIMAL PLACES
    // --------------------------------------------------

    if ((raw.split(".")[1]?.length ?? 0) > 2) {
      toast.error(
        "Amount cannot have more than 2 decimal places"
      );

      return;
    }

    // --------------------------------------------------
    // VALIDATE AVAILABLE BALANCE
    // --------------------------------------------------

    if (amount > (availablePayout ?? 0)) {
      toast.error(
        `Amount exceeds available payout (${formatCurrency(
          availablePayout
        )})`
      );

      return;
    }

    // --------------------------------------------------
    // START REQUEST
    // --------------------------------------------------

    setWithdrawing(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/earnings/${creatorId}/withdraw?amount=${encodeURIComponent(
          String(amount)
        )}`,
        {
          method: "POST",
        }
      );

      // --------------------------------------------------
      // API ERROR
      // --------------------------------------------------

      if (!res.ok) {
        const err = await res.json().catch(() => null);

        throw new Error(
          extractError(err?.detail) ||
            `Withdrawal failed (${res.status})`
        );
      }

      // --------------------------------------------------
      // SUCCESS RESPONSE
      // --------------------------------------------------

      const body = await res.json().catch(() => ({}));

      // --------------------------------------------------
      // ADD PENDING WITHDRAWAL TO HISTORY
      // --------------------------------------------------

      const newWithdrawal: Withdrawal = {
        withdrawal_id:
          body?.withdrawal_id ?? -Date.now(),

        user_id: creatorId,

        requested_amount: Number(
          body?.requested_amount ?? amount
        ),

        status: body?.status ?? "pending",

        requested_at:
          body?.requested_at ??
          new Date().toISOString(),

        approved_at: null,

        rejected_at: null,
      };

      setHistory((prev) => [
        newWithdrawal,
        ...prev,
      ]);

      // --------------------------------------------------
      // CLEAR INPUT
      // --------------------------------------------------

      setWithdrawInput("");

      // --------------------------------------------------
      // SUCCESS MESSAGE
      // --------------------------------------------------

      toast.success(
        `₹${amount.toLocaleString("en-IN")} withdrawal requested${
          body?.withdrawal_id
            ? ` (#${body.withdrawal_id})`
            : ""
        }`
      );

      // --------------------------------------------------
      // REFRESH DATA
      // --------------------------------------------------

      await loadEarnings(true);

    } catch (err: any) {
      toast.error(
        err?.message ||
          "Withdrawal failed. Please try again."
      );

    } finally {
      setWithdrawing(false);
    }
  }

  // --------------------------------------------------
  // MAX WITHDRAWAL
  // --------------------------------------------------

  function handleUseMax() {
    if (
      availablePayout === null ||
      availablePayout <= 0
    ) {
      return;
    }

    setWithdrawInput(
      availablePayout.toFixed(2)
    );
  }

  // --------------------------------------------------
  // WITHDRAW BUTTON
  // --------------------------------------------------

  const canWithdraw =
    (availablePayout ?? 0) > 0 &&
    !withdrawing &&
    !loading;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div>
      {/* --------------------------------------------------
          PAGE HEADER
      -------------------------------------------------- */}

      <PageHeader title="Earnings" />

      {/* --------------------------------------------------
          EARNINGS SUMMARY
      -------------------------------------------------- */}

     <div className="grid grid-cols-4 gap-3 mb-5">

  {/* CHAT + CALLS EARNED */}
  <GlassCard>
    <p className="text-xs text-muted-foreground">
      CHAT+CALLS Earned
    </p>

    <p className="text-2xl font-bold gradient-text">
      {loading ? "—" : formatCurrency(totalEarned ?? 0)}
    </p>
  </GlassCard>

  {/* GIFT EARNINGS */}
  <GlassCard>
    <p className="text-xs text-muted-foreground">
      Gift earnings
    </p>

    <p className="text-2xl font-bold gradient-text">
      {loading ? "—" : formatCurrency(giftEarnings ?? 0)}
    </p>
  </GlassCard>

  {/* TOTAL EARNED */}
  <GlassCard>
    <p className="text-xs text-muted-foreground">
      TOTAL EARNED
    </p>

    <p className="text-2xl font-bold gradient-text">
      {loading
        ? "—"
        : formatCurrency(
            (totalEarned ?? 0) + (giftEarnings ?? 0)
          )}
    </p>
  </GlassCard>

  {/* AVAILABLE PAYOUT */}
  <GlassCard>
    <p className="text-xs text-muted-foreground">
      Available payout
    </p>

    <p className="text-2xl font-bold">
      {loading ? "—" : formatCurrency(availablePayout ?? 0)}
    </p>
  </GlassCard>

</div>

      {/* --------------------------------------------------
          WITHDRAWAL HISTORY
      -------------------------------------------------- */}

      <GlassCard className="mb-5">

        {/* HEADER */}

        <div className="flex items-center justify-between mb-3">

          <p className="text-xs text-muted-foreground">
            Withdrawal history
          </p>

          <div className="flex items-center gap-3">

            {/* TOTAL WITHDRAWAL */}

            {withdrawnTotal !== null &&
              withdrawnTotal > 0 && (
                <p className="text-xs text-muted-foreground">
                  Approved: {formatCurrency(withdrawnTotal)}
                </p>
              )}

            {/* REFRESH */}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-2 rounded-lg hover:bg-glass transition-colors disabled:opacity-50"
              title="Refresh earnings"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />
            </button>

          </div>

        </div>

        {/* LOADING */}

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>

        ) : history.length === 0 ? (

          /* EMPTY HISTORY */

          <p className="text-sm text-muted-foreground py-6 text-center">
            No withdrawals yet
          </p>

        ) : (

          /* WITHDRAWAL LIST */

          <div className="space-y-2">

            {history.map((h) => (

              <div
                key={h.withdrawal_id}
                className="flex items-center justify-between rounded-xl bg-glass p-3"
              >

                {/* AMOUNT AND DATE */}

                <div>

                  <p className="text-sm font-medium">
                    {formatCurrency(
                      Number(h.requested_amount) || 0
                    )}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {h.requested_at
                      ? new Date(
                          h.requested_at
                        ).toLocaleString("en-IN")
                      : "—"}
                  </p>

                </div>

                {/* STATUS */}

                <StatusBadge status={h.status} />

              </div>

            ))}

          </div>

        )}

      </GlassCard>

      {/* --------------------------------------------------
          REQUEST WITHDRAWAL
      -------------------------------------------------- */}

      <GlassCard className="mb-5">

        <p className="text-xs text-muted-foreground mb-2">
          Request withdrawal
        </p>

        {/* INPUT AND BUTTON */}

        <div className="flex gap-2">

          {/* AMOUNT INPUT */}

          <div className="flex items-center flex-1 rounded-xl bg-glass border border-glass px-3">

            <span className="text-sm text-muted-foreground">
              ₹
            </span>

            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="Enter amount"
              value={withdrawInput}
              onChange={(e) =>
                setWithdrawInput(e.target.value)
              }
              disabled={!canWithdraw}
              className="flex-1 w-full bg-transparent py-3 px-2 text-sm outline-none disabled:opacity-50"
            />

          </div>

          {/* WITHDRAW BUTTON */}

          <button
            type="button"
            onClick={handleWithdraw}
            disabled={!canWithdraw}
            className={`rounded-xl bg-gradient-primary px-5 py-3 font-semibold shadow-glow text-sm ${
              canWithdraw
                ? ""
                : "opacity-60 pointer-events-none"
            }`}
          >

            {withdrawing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Withdraw"
            )}

          </button>

        </div>

        {/* MAX AMOUNT */}

        {(availablePayout ?? 0) > 0 && (

          <button
            type="button"
            onClick={handleUseMax}
            disabled={withdrawing || loading}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >

            Use max · {formatCurrency(availablePayout)}

          </button>

        )}

        {/* AVAILABLE BALANCE */}

        <p className="text-xs text-muted-foreground mt-3">
          Available balance: {formatCurrency(availablePayout)}
        </p>

      </GlassCard>

      {/* --------------------------------------------------
          COMMISSION INFORMATION
      -------------------------------------------------- */}

      <p className="text-xs text-muted-foreground mt-2 text-center">
        Default commission: 20% · Calls under 1 min not charged
      </p>

    </div>
  );
}

// --------------------------------------------------
// WITHDRAWAL STATUS BADGE
// --------------------------------------------------

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-500",
    approved: "bg-success/20 text-success",
    rejected: "bg-destructive/20 text-destructive",
  };

  const cls =
    styles[status?.toLowerCase()] ||
    "bg-muted text-muted-foreground";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${cls}`}
    >
      {status}
    </span>
  );
}
