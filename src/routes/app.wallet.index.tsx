import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-store";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

export const Route = createFileRoute("/app/wallet/")({
  component: Wallet,
});

const API_BASE_URL =
  import.meta.env.VITE_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

// =====================================================
// TYPES
// =====================================================

type CoinPack = {
  id: number;
  coins: number;
  bonus: number;
  mrp: number;
  is_active: boolean;
  display_order: number;
};

type WalletResponse = {
  id: number;
  user_id: number;
  user_name: string;
  phone: string;
  wallet_id: string;
  balance: string | number;
  coins: number;
  deposits: string | number;
  spending: string | number;
  last_transaction: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type WalletTransaction = {
  id: number;
  transaction_id: string;
  user_id: number;
  user_name: string;
  wallet_id: string;

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
// WALLET COMPONENT
// =====================================================

function Wallet() {
  const user = useAuth((s) => s.user);

  // ===================================================
  // WALLET STATES
  // ===================================================

  const [wallet, setWallet] = useState<WalletResponse | null>(
    null
  );

  const [isLoadingWallet, setIsLoadingWallet] = useState(true);

  const [walletError, setWalletError] = useState("");

  // ===================================================
  // COIN PACK STATES
  // ===================================================

  const [coinPacks, setCoinPacks] = useState<CoinPack[]>([]);

  const [isLoadingPacks, setIsLoadingPacks] = useState(true);

  // ===================================================
  // TRANSACTION STATES
  // ===================================================

  const [transactions, setTransactions] = useState<
    WalletTransaction[]
  >([]);

  const [isLoadingTransactions, setIsLoadingTransactions] =
    useState(true);

  const [transactionError, setTransactionError] = useState("");

  // ===================================================
  // FORMAT CURRENCY
  // ===================================================

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // ===================================================
  // FETCH WALLET API
  // ===================================================

  const fetchWallet = useCallback(async () => {
    if (!user?.id) {
      setWallet(null);
      setIsLoadingWallet(false);
      return;
    }

    setIsLoadingWallet(true);
    setWalletError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/wallets/user/${user.id}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
            `Failed to fetch wallet (${response.status})`
        );
      }

      const data: WalletResponse = await response.json();

      setWallet(data);
    } catch (error) {
      console.error("Failed to fetch wallet:", error);

      setWalletError(
        error instanceof Error
          ? error.message
          : "Unable to load wallet"
      );
    } finally {
      setIsLoadingWallet(false);
    }
  }, [user?.id]);

  // ===================================================
  // FETCH QUICK PACKS API
  // ===================================================

  const fetchPacks = useCallback(async () => {
    setIsLoadingPacks(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/quick-packs/`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch coin packs (${response.status})`
        );
      }

      const data = await response.json();

      setCoinPacks(
        Array.isArray(data)
          ? data.filter((pack: CoinPack) => pack.is_active)
          : []
      );
    } catch (error) {
      console.error("Failed to fetch coin packs:", error);

      setCoinPacks([]);
    } finally {
      setIsLoadingPacks(false);
    }
  }, []);

  // ===================================================
  // FETCH TRANSACTION HISTORY API
  // ===================================================


// =====================================================
// FETCH TRANSACTION HISTORY API
// =====================================================

const fetchTransactions = useCallback(async () => {
  if (!user?.id) {
    setTransactions([]);
    setIsLoadingTransactions(false);
    return;
  }

  setIsLoadingTransactions(true);
  setTransactionError("");

  try {
    const params = new URLSearchParams();

    params.append("status_filter", "all");
    params.append("user_id", String(user.id));

    const response = await fetch(
      `${API_BASE_URL}/wallets/transactions?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

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

    setTransactions(Array.isArray(data) ? data : []);

  } catch (error) {
    console.error("Failed to fetch transactions:", error);

    setTransactionError(
      error instanceof Error
        ? error.message
        : "Unable to load transaction history"
    );

    setTransactions([]);

  } finally {
    setIsLoadingTransactions(false);
  }
}, [user?.id]);

  // ===================================================
  // INITIAL API CALLS
  // ===================================================

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    fetchPacks();
  }, [fetchPacks]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // ===================================================
  // REFRESH ALL WALLET DATA
  // ===================================================

  const refreshWalletData = useCallback(() => {
    fetchWallet();
    fetchTransactions();
  }, [fetchWallet, fetchTransactions]);

  // ===================================================
  // FORMAT WALLET VALUES
  // ===================================================

  const coins = Number(wallet?.coins ?? 0);

  const balance = Number(wallet?.balance ?? 0);

  const deposits = Number(wallet?.deposits ?? 0);

  const spending = Number(wallet?.spending ?? 0);

  // ===================================================
  // TRANSACTION HELPERS
  // ===================================================

  const isCreditTransaction = (transaction: WalletTransaction) => {
    const type = transaction.type.toLowerCase();

    return (
      type === "deposit" ||
      type === "refund"
    );
  };

  const getTransactionIcon = (transaction: WalletTransaction) => {
    if (isCreditTransaction(transaction)) {
      return (
        <ArrowDownLeft className="h-4 w-4" />
      );
    }

    return (
      <ArrowUpRight className="h-4 w-4" />
    );
  };

  const getTransactionColor = (transaction: WalletTransaction) => {
    return isCreditTransaction(transaction)
      ? "bg-success/20 text-success"
      : "bg-destructive/20 text-destructive";
  };

  const getTransactionAmountColor = (
    transaction: WalletTransaction
  ) => {
    return isCreditTransaction(transaction)
      ? "text-success"
      : "text-foreground";
  };

  const getTransactionAmountPrefix = (
    transaction: WalletTransaction
  ) => {
    return isCreditTransaction(transaction) ? "+" : "-";
  };

  const getTransactionDate = (
    transaction: WalletTransaction
  ) => {
    if (transaction.indian_date && transaction.indian_time) {
      return `${transaction.indian_date} • ${transaction.indian_time}`;
    }

    if (transaction.indian_date) {
      return transaction.indian_date;
    }

    if (transaction.created_at) {
      return new Date(transaction.created_at).toLocaleString(
        "en-IN",
        {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }
      );
    }

    return "";
  };

  const getTransactionStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
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
  // LOADING WALLET
  // ===================================================

  if (isLoadingWallet && !wallet) {
    return (
      <div>
        <PageHeader
          title="Wallet"
          subtitle="Manage your coins"
        />

        <div className="glass rounded-3xl p-10 flex justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // ===================================================
  // WALLET UI
  // ===================================================

  return (
    <div>
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <PageHeader
        title="Wallet"
        subtitle="Manage your coins"
      />

      {/* ================================================= */}
      {/* WALLET ERROR */}
      {/* ================================================= */}

      {walletError && (
        <div className="glass rounded-xl p-4 mb-4">
          <p className="text-sm text-destructive">
            {walletError}
          </p>

          <button
            type="button"
            onClick={fetchWallet}
            className="mt-2 text-sm font-semibold flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {/* ================================================= */}
      {/* WALLET BALANCE */}
      {/* ================================================= */}

      <div className="glass-strong rounded-3xl p-6 mb-5 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-coin opacity-40 blur-2xl" />

        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Current balance
            </p>

            <button
              type="button"
              onClick={refreshWalletData}
              disabled={
                isLoadingWallet ||
                isLoadingTransactions
              }
              className="rounded-lg glass p-2"
              title="Refresh wallet"
            >
              {isLoadingWallet ||
              isLoadingTransactions ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* COINS */}

          <div className="flex items-center gap-2 mt-1">
            <Coins className="h-7 w-7 text-amber-400" />

            <span className="text-4xl font-bold">
              {isLoadingWallet
                ? "—"
                : coins.toLocaleString("en-IN")}
            </span>
          </div>

          {/* WALLET BALANCE */}

          <p className="text-xs text-muted-foreground mt-1">
            {isLoadingWallet
              ? "Loading wallet balance..."
              : formatCurrency(balance)}
          </p>

          {/* WALLET ID */}

          {wallet?.wallet_id && (
            <p className="text-xs text-muted-foreground mt-2">
              Wallet ID: {wallet.wallet_id}
            </p>
          )}

          {/* WALLET STATUS */}

          {wallet?.status && (
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              Status: {wallet.status}
            </p>
          )}

          {/* ACTIONS */}

          <div className="flex gap-2 mt-4">
            <Link
              to="/app/wallet/buy"
              className="flex-1 rounded-xl bg-gradient-primary py-3 text-sm font-semibold shadow-glow text-center"
            >
              + Buy Coins
            </Link>

            <Link
              to="/app/wallet/transactions"
              className="rounded-xl glass px-5 py-3 text-sm font-semibold"
            >
              History
            </Link>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* WALLET SUMMARY */}
      {/* ================================================= */}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {/* DEPOSITS */}

        <GlassCard>
          <p className="text-xs text-muted-foreground">
            Deposits
          </p>

          <p className="text-xl font-bold gradient-text">
            {isLoadingWallet
              ? "—"
              : formatCurrency(deposits)}
          </p>
        </GlassCard>

        {/* SPENDING */}

        <GlassCard>
          <p className="text-xs text-muted-foreground">
            Spending
          </p>

          <p className="text-xl font-bold">
            {isLoadingWallet
              ? "—"
              : formatCurrency(spending)}
          </p>
        </GlassCard>

        {/* BALANCE */}

        <GlassCard>
          <p className="text-xs text-muted-foreground">
            Wallet Balance
          </p>

          <p className="text-xl font-bold gradient-text">
            {isLoadingWallet
              ? "—"
              : formatCurrency(balance)}
          </p>
        </GlassCard>
      </div>

      {/* ================================================= */}
      {/* QUICK PACKS */}
      {/* ================================================= */}

      <h3 className="font-semibold mb-3">
        Quick packs
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {isLoadingPacks ? (
          <div className="col-span-2 flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : coinPacks.length === 0 ? (
          <p className="col-span-2 text-center text-sm text-muted-foreground py-4">
            No coin packs available right now.
          </p>
        ) : (
          coinPacks.slice(0, 4).map((p) => (
            <Link
              key={p.id}
              to="/app/wallet/buy"
            >
              <GlassCard
                hover
                className="text-center relative"
              >
                {p.display_order === 1 && (
                  <span className="absolute -top-2 right-2 rounded-full bg-gradient-primary px-2 py-0.5 text-[10px]">
                    Popular
                  </span>
                )}

                <Coins className="h-7 w-7 mx-auto text-amber-400 mb-1" />

                <p className="font-bold">
                  {p.coins.toLocaleString("en-IN")}
                </p>

                {p.bonus > 0 && (
                  <p className="text-[10px] text-success">
                    +{p.bonus} bonus
                  </p>
                )}

                <p className="text-sm font-semibold mt-1 gradient-text">
                  {formatCurrency(p.mrp)}
                </p>
              </GlassCard>
            </Link>
          ))
        )}
      </div>

      {/* ================================================= */}
      {/* RECENT ACTIVITY */}
      {/* ================================================= */}

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">
          Recent activity
        </h3>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchTransactions}
            disabled={isLoadingTransactions}
            className="text-xs text-muted-foreground"
            title="Refresh transactions"
          >
            {isLoadingTransactions ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>

          <Link
            to="/app/wallet/transactions"
            className="text-xs text-primary font-semibold"
          >
            View all
          </Link>
        </div>
      </div>

      {/* ================================================= */}
      {/* TRANSACTION LOADING */}
      {/* ================================================= */}

      {isLoadingTransactions && (
        <div className="glass rounded-xl p-8 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />

          <p className="text-sm text-muted-foreground">
            Loading transaction history...
          </p>
        </div>
      )}

      {/* ================================================= */}
      {/* TRANSACTION ERROR */}
      {/* ================================================= */}

      {!isLoadingTransactions && transactionError && (
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-destructive">
            {transactionError}
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
      {/* EMPTY TRANSACTION HISTORY */}
      {/* ================================================= */}

      {!isLoadingTransactions &&
        !transactionError &&
        transactions.length === 0 && (
          <div className="glass rounded-xl p-8 text-center">
            <Coins className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-50" />

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

      {!isLoadingTransactions &&
        !transactionError &&
        transactions.length > 0 && (
          <div className="space-y-2">
            {transactions.slice(0, 4).map((t) => {
              const isCredit = isCreditTransaction(t);

              const amount = Number(t.amount ?? 0);

              return (
                <div
                  key={t.id}
                  className="glass rounded-xl p-3 flex items-center gap-3"
                >
                  {/* TRANSACTION ICON */}

                  <div
                    className={`rounded-full p-2 ${getTransactionColor(
                      t
                    )}`}
                  >
                    {getTransactionIcon(t)}
                  </div>

                  {/* TRANSACTION DETAILS */}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize truncate">
                      {t.type}
                    </p>

                    <p className="text-[10px] text-muted-foreground">
                      {getTransactionDate(t)}
                    </p>

                    {t.transaction_id && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {t.transaction_id}
                      </p>
                    )}

                    <p
                      className={`text-[10px] capitalize ${getTransactionStatusColor(
                        t.status
                      )}`}
                    >
                      {t.status}
                    </p>
                  </div>

                  {/* TRANSACTION AMOUNT */}

                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-bold ${getTransactionAmountColor(
                        t
                      )}`}
                    >
                      {getTransactionAmountPrefix(t)}
                      {t.coins.toLocaleString("en-IN")}
                    </p>

                    <p className="text-[10px] text-muted-foreground">
                      {formatCurrency(Math.abs(amount))}
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
