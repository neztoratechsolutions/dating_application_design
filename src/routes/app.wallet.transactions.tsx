import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-store";
import { PageHeader } from "@/components/ui-kit";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  RefreshCw,
  Filter,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

export const Route = createFileRoute("/app/wallet/transactions")({
  component: Tx,
});

// =====================================================
// API BASE URL
// =====================================================

const API_BASE_URL =
  import.meta.env.VITE_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

// =====================================================
// TYPES
// =====================================================

type WalletTransaction = {
  id: number;
  transaction_id: string;
  user_id: number;
  user_name: string;
  wallet_id: number | string;
  type: string;
  amount: string | number;
  coins: number;
  method: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  indian_date: string | null;
  indian_time: string | null;
};

// =====================================================
// TRANSACTION PAGE
// =====================================================

function Tx() {
  const user = useAuth((s) => s.user);

  // ===================================================
  // STATES
  // ===================================================

  const [transactions, setTransactions] = useState<
    WalletTransaction[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  // ===================================================
  // FILTER STATES
  // ===================================================

  const [statusFilter, setStatusFilter] = useState("all");

  const [transactionType, setTransactionType] = useState("");

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");

  // ===================================================
  // FETCH TRANSACTIONS API
  // ===================================================

  const fetchTransactions = useCallback(async () => {
    if (!user?.id) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      // STATUS FILTER

      params.append("status_filter", statusFilter);

      // USER ID

      params.append("user_id", String(user.id));

      // TRANSACTION TYPE

      if (transactionType) {
        params.append("transaction_type", transactionType);
      }

      // START DATE
      // Backend expects DD-MM-YYYY

      if (startDate) {
        params.append("start_date", startDate);
      }

      // END DATE
      // Backend expects DD-MM-YYYY

      if (endDate) {
        params.append("end_date", endDate);
      }

      const response = await fetch(
        `${API_BASE_URL}/wallets/transactions?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      // Backend returns 404 when no transactions exist.

      if (response.status === 404) {
        setTransactions([]);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
            `Failed to fetch transactions (${response.status})`
        );
      }

      const data: WalletTransaction[] = await response.json();

      setTransactions(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error("Transaction API error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load transactions"
      );

      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    user?.id,
    statusFilter,
    transactionType,
    startDate,
    endDate,
  ]);

  // ===================================================
  // LOAD TRANSACTIONS
  // ===================================================

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // ===================================================
  // RESET FILTERS
  // ===================================================

  const resetFilters = () => {
    setStatusFilter("all");
    setTransactionType("");
    setStartDate("");
    setEndDate("");
  };

  // ===================================================
  // FORMAT DATE
  // ===================================================

  const formatDate = (transaction: WalletTransaction) => {
    if (
      transaction.indian_date &&
      transaction.indian_time
    ) {
      return `${transaction.indian_date} • ${transaction.indian_time}`;
    }

    if (transaction.indian_date) {
      return transaction.indian_date;
    }

    if (transaction.created_at) {
      return new Date(
        transaction.created_at
      ).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }

    return "";
  };

  // ===================================================
  // FORMAT AMOUNT
  // ===================================================

  const formatAmount = (amount: string | number) => {
    return Number(amount ?? 0).toFixed(2);
  };

  // ===================================================
  // TRANSACTION CREDIT / DEBIT
  // ===================================================

  const isCreditTransaction = (
    transaction: WalletTransaction
  ) => {
    const type = transaction.type.toLowerCase();

    const method = transaction.method?.toLowerCase();

    return (
      type === "deposit" ||
      type === "refund" ||
      type === "credit" ||
      method === "deposit" ||
      method === "refund"
    );
  };

  // ===================================================
  // TRANSACTION TITLE
  // ===================================================

  const getTransactionTitle = (
    transaction: WalletTransaction
  ) => {
    const type = transaction.type.toLowerCase();

    const method = transaction.method?.toLowerCase();

    if (type === "chat") {
      return "Chat";
    }

    if (type === "debit" && method === "gift") {
      return "Gift";
    }

    if (type === "deposit") {
      return "Deposit";
    }

    if (type === "spend") {
      return "Spend";
    }

    if (type === "refund") {
      return "Refund";
    }

    if (type === "debit") {
      return method
        ? method.charAt(0).toUpperCase() + method.slice(1)
        : "Debit";
    }

    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // ===================================================
  // TRANSACTION STATUS COLOR
  // ===================================================

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
      case "completed":
        return "text-success";

      case "failed":
        return "text-destructive";

      case "pending":
        return "text-yellow-500";

      case "refund":
        return "text-blue-500";

      default:
        return "text-muted-foreground";
    }
  };

  // ===================================================
  // TRANSACTION UI
  // ===================================================

  return (
    <div>
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <PageHeader
        title="Transactions"
        subtitle="All your wallet activity"
      />

      {/* ================================================= */}
      {/* FILTER SECTION */}
      {/* ================================================= */}

      <div className="glass rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />

            <h3 className="text-sm font-semibold">
              Filter Transactions
            </h3>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-primary font-semibold"
          >
            Reset
          </button>
        </div>

        {/* STATUS FILTER */}

        <div className="mb-3">
          <label className="text-xs text-muted-foreground block mb-1">
            Status
          </label>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="w-full rounded-xl glass p-3 text-sm outline-none"
          >
            <option value="all">All Transactions</option>
            <option value="success">Success</option>
            <option value="refund">Refund</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* TRANSACTION TYPE */}

        <div className="mb-3">
          <label className="text-xs text-muted-foreground block mb-1">
            Transaction Type
          </label>

          <select
            value={transactionType}
            onChange={(e) =>
              setTransactionType(e.target.value)
            }
            className="w-full rounded-xl glass p-3 text-sm outline-none"
          >
            <option value="">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="spend">Spend</option>
            <option value="gift">Gift</option>
            <option value="refund">Refund</option>
            <option value="chat">Chat</option>
          </select>
        </div>

        {/* DATE FILTER */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* START DATE */}

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Start Date
            </label>

            <input
              type="date"
              value={
                startDate
                  ? startDate.split("-").reverse().join("-")
                  : ""
              }
              onChange={(e) => {
                const value = e.target.value;

                setStartDate(
                  value
                    ? value.split("-").reverse().join("-")
                    : ""
                );
              }}
              className="w-full rounded-xl glass p-3 text-sm outline-none"
            />
          </div>

          {/* END DATE */}

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              End Date
            </label>

            <input
              type="date"
              value={
                endDate
                  ? endDate.split("-").reverse().join("-")
                  : ""
              }
              onChange={(e) => {
                const value = e.target.value;

                setEndDate(
                  value
                    ? value.split("-").reverse().join("-")
                    : ""
                );
              }}
              className="w-full rounded-xl glass p-3 text-sm outline-none"
            />
          </div>
        </div>

        {/* APPLY FILTER */}

        <button
          type="button"
          onClick={fetchTransactions}
          disabled={isLoading}
          className="w-full mt-4 rounded-xl bg-gradient-primary py-3 text-sm font-semibold flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Filter className="h-4 w-4" />
          )}

          Apply Filters
        </button>
      </div>

      {/* ================================================= */}
      {/* TRANSACTION HEADER */}
      {/* ================================================= */}

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">
          Transaction History
        </h3>

        <button
          type="button"
          onClick={fetchTransactions}
          disabled={isLoading}
          className="rounded-lg glass p-2"
          title="Refresh transactions"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* ================================================= */}
      {/* LOADING */}
      {/* ================================================= */}

      {isLoading && (
        <div className="glass rounded-xl p-10 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />

          <p className="text-sm text-muted-foreground">
            Loading transactions...
          </p>
        </div>
      )}

      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {!isLoading && error && (
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-destructive">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchTransactions}
            className="mt-3 text-sm font-semibold flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {/* ================================================= */}
      {/* EMPTY STATE */}
      {/* ================================================= */}

      {!isLoading &&
        !error &&
        transactions.length === 0 && (
          <div className="glass rounded-xl p-10 text-center">
            <p className="text-sm font-medium">
              No transactions found
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              Your wallet transactions will appear here.
            </p>
          </div>
        )}

      {/* ================================================= */}
      {/* TRANSACTION LIST */}
      {/* ================================================= */}

      {!isLoading &&
        !error &&
        transactions.length > 0 && (
          <div className="space-y-2">
            {transactions.map((t) => {
              const isCredit = isCreditTransaction(t);

              return (
                <div
                  key={t.id}
                  className="glass rounded-xl p-3 flex items-center gap-3"
                >
                  {/* ICON */}

                  <div
                    className={`rounded-full p-2 ${
                      isCredit
                        ? "bg-success/20 text-success"
                        : "bg-destructive/20 text-destructive"
                    }`}
                  >
                    {isCredit ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>

                  {/* DETAILS */}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize truncate">
                      {getTransactionTitle(t)}
                    </p>

                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(t)}
                    </p>

                    <p className="text-[10px] text-muted-foreground truncate">
                      {t.transaction_id}
                    </p>

                    {t.method && (
                      <p className="text-[10px] text-muted-foreground capitalize">
                        Method: {t.method}
                      </p>
                    )}

                    <p
                      className={`text-[10px] capitalize ${getStatusColor(
                        t.status
                      )}`}
                    >
                      {t.status}
                    </p>
                  </div>

                  {/* AMOUNT */}

                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-bold ${
                        isCredit ? "text-success" : ""
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {Number(t.coins ?? 0).toLocaleString(
                        "en-IN"
                      )}
                    </p>

                    <p className="text-[10px] text-muted-foreground">
                      ₹{formatAmount(t.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
