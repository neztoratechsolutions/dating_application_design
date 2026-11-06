import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import {
  PageHeader,
  GlassCard,
  EmptyState,
} from "@/components/ui-kit";

import {
  Gift as GiftIcon,
  Coins,
  RefreshCw,
} from "lucide-react";

// --------------------------------------------------
// API CONFIGURATION
// --------------------------------------------------

const BASE_URL = "http://127.0.0.1:8000";

// --------------------------------------------------
// API RESPONSE TYPES
// --------------------------------------------------

interface GiftHistoryItem {
  gift_detail_id: number;
  gift_id: number;
  catalog_name: string;
  icon: string;

  sender_id: number;
  creator_name: string;

  coins_spent: number;
  earnings: number;

  created_at: string;
}

interface GiftHistoryResponse {
  status_code: number;
  message: string;

  data: {
    sender_id: number;
    total_gifts: number;
    total_coins_spent: number;
    total_earnings: number;
    gifts: GiftHistoryItem[];
  };
}

// --------------------------------------------------
// STORED USER TYPE
// --------------------------------------------------

interface StoredUser {
  user_id?: number | string;
  id?: number | string;
  role?: string;
  email?: string;
  referral_code?: string;
}

// --------------------------------------------------
// ROUTE
// --------------------------------------------------

export const Route = createFileRoute("/app/gifts")({
  component: MyGifts,
});

// --------------------------------------------------
// COMPONENT
// --------------------------------------------------

function MyGifts() {
  const [gifts, setGifts] = useState<GiftHistoryItem[]>([]);

  const [totalGifts, setTotalGifts] = useState(0);
  const [totalCoinsSpent, setTotalCoinsSpent] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // GET LOGGED-IN CUSTOMER / SENDER ID
  // --------------------------------------------------

  const getSenderId = (): number | null => {
    try {
      // First check separately stored sender ID.
      const storedSenderId = localStorage.getItem("sender_id");

      if (storedSenderId) {
        const senderId = Number(storedSenderId);

        if (
          Number.isInteger(senderId) &&
          senderId > 0
        ) {
          return senderId;
        }
      }

      // Check separately stored customer ID.
      const storedCustomerIds = [
        localStorage.getItem("customer_id"),
        localStorage.getItem("customer_user_id"),
      ];

      for (const value of storedCustomerIds) {
        if (!value) {
          continue;
        }

        const customerId = Number(value);

        if (
          Number.isInteger(customerId) &&
          customerId > 0
        ) {
          return customerId;
        }
      }

      // Read actual login response user details.
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        const user: StoredUser = JSON.parse(storedUser);

        // Only use the login user ID for customer accounts.
        if (
          user.role?.toLowerCase() === "customer"
        ) {
          const customerId = Number(user.user_id);

          if (
            Number.isInteger(customerId) &&
            customerId > 0
          ) {
            return customerId;
          }
        }
      }

      console.error(
        "Customer sender ID not found in localStorage"
      );

      return null;
    } catch (error) {
      console.error(
        "Error getting sender ID:",
        error
      );

      return null;
    }
  };

  // --------------------------------------------------
  // FETCH GIFT HISTORY API
  // --------------------------------------------------

  const fetchGiftHistory = async () => {
    setLoading(true);
    setError("");

    try {
      // Get logged-in customer ID.
      const senderId = getSenderId();

      if (!senderId) {
        throw new Error(
          "Customer ID not found. Please login again."
        );
      }

      console.log(
        "Logged-in customer / sender ID:",
        senderId
      );

      // API:
      // GET /gift/sender/{sender_id}

      const accessToken =
        localStorage.getItem("access_token");

      const response = await fetch(
        `${BASE_URL}/gift/sender/${senderId}`,
        {
          method: "GET",

          headers: {
            Accept: "application/json",

            ...(accessToken
              ? {
                  Authorization: `Bearer ${accessToken}`,
                }
              : {}),
          },
        }
      );

      // Read API response.
      const result: GiftHistoryResponse =
        await response.json();

      console.log(
        "Gift history API response:",
        result
      );

      // HTTP error.
      if (!response.ok) {
        throw new Error(
          result.message ||
            `Failed to retrieve gift history. HTTP ${response.status}`
        );
      }

      // API status error.
      if (result.status_code !== 200) {
        throw new Error(
          result.message ||
            "Failed to retrieve gift history"
        );
      }

      // Check API data.
      if (!result.data) {
        throw new Error(
          "Gift history data not found"
        );
      }

      const data = result.data;

      // Verify sender ID.
      if (Number(data.sender_id) !== senderId) {
        throw new Error(
          `Sender mismatch. Logged-in customer: ${senderId}, API sender: ${data.sender_id}`
        );
      }

      // --------------------------------------------------
      // UPDATE GIFT HISTORY
      // --------------------------------------------------

      const giftList = Array.isArray(data.gifts)
        ? data.gifts
        : [];

      setGifts(giftList);

      // --------------------------------------------------
      // UPDATE SUMMARY
      // --------------------------------------------------

      setTotalGifts(
        Number(data.total_gifts ?? giftList.length)
      );

      setTotalCoinsSpent(
        Number(data.total_coins_spent ?? 0)
      );

      setTotalEarnings(
        Number(data.total_earnings ?? 0)
      );

      console.log(
        "Gift history loaded successfully"
      );
    } catch (error) {
      console.error(
        "Gift history API error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load gift history"
      );

      // Reset data on error.
      setGifts([]);

      setTotalGifts(0);

      setTotalCoinsSpent(0);

      setTotalEarnings(0);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // INITIAL API CALL
  // --------------------------------------------------

  useEffect(() => {
    fetchGiftHistory();
  }, []);

  // --------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------

  const formatDate = (date: string) => {
    if (!date) {
      return "Date unavailable";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(parsedDate.getTime())
    ) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="space-y-5">

      {/* PAGE HEADER */}

      <PageHeader
        title="My Gifts Sent"
        subtitle={`${totalGifts} gifts · ${totalCoinsSpent} coins spent`}
      />

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* TOTAL GIFTS */}

        <GlassCard className="flex items-center gap-3">

          <div className="rounded-xl bg-primary/10 p-3">
            <GiftIcon className="h-5 w-5 text-primary" />
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Total Gifts Sent
            </p>

            <p className="text-xl font-bold">
              {totalGifts}
            </p>
          </div>

        </GlassCard>

        {/* TOTAL COINS SPENT */}

        <GlassCard className="flex items-center gap-3">

          <div className="rounded-xl bg-amber-500/10 p-3">
            <Coins className="h-5 w-5 text-amber-400" />
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Total Coins Spent
            </p>

            <p className="text-xl font-bold text-amber-400">
              {totalCoinsSpent}
            </p>
          </div>

        </GlassCard>

      </div>

      {/* TOTAL CREATOR EARNINGS */}

      <GlassCard>

        <div className="flex items-center justify-between">

          <div>
            <p className="text-xs text-muted-foreground">
              Total Coins Spend
            </p>

            <p className="text-xl font-bold">
              {totalEarnings} coins
            </p>
          </div>

          <Coins className="h-5 w-5 text-primary" />

        </div>

      </GlassCard>

      {/* REFRESH BUTTON */}

      <div className="flex justify-end">

        <button
          type="button"
          onClick={fetchGiftHistory}
          disabled={loading}
          className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
        >

          <RefreshCw
            className={`h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />

          Refresh

        </button>

      </div>

      {/* LOADING */}

      {loading && (

        <GlassCard>

          <div className="flex items-center justify-center gap-2 py-8">

            <RefreshCw className="h-5 w-5 animate-spin" />

            <p className="text-sm text-muted-foreground">
              Loading gift history...
            </p>

          </div>

        </GlassCard>

      )}

      {/* ERROR */}

      {!loading && error && (

        <GlassCard>

          <div className="space-y-3 py-4">

            <p className="text-sm text-red-400">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchGiftHistory}
              className="rounded-full bg-primary px-4 py-2 text-sm text-white"
            >
              Try Again
            </button>

          </div>

        </GlassCard>

      )}

      {/* EMPTY STATE */}

      {!loading &&
        !error &&
        gifts.length === 0 && (

        <EmptyState
          icon={GiftIcon}
          title="No gifts sent yet"
          desc="Surprise your favourite creators with a gift!"
          action={
            <Link
              to="/app/creators"
              className="rounded-full bg-gradient-primary px-4 py-2 text-sm shadow-glow"
            >
              Browse creators
            </Link>
          }
        />

      )}

      {/* GIFT HISTORY */}

      {!loading &&
        !error &&
        gifts.length > 0 && (

        <div className="space-y-2">

          {gifts.map((gift) => (

            <GlassCard
              key={gift.gift_detail_id}
              className="flex items-center gap-3"
            >

              {/* GIFT ICON */}

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-3xl">

                {gift.icon || "🎁"}

              </div>

              {/* GIFT DETAILS */}

              <div className="min-w-0 flex-1">

                <p className="font-semibold text-sm">
                  {gift.catalog_name || "Gift"}
                </p>

                {/* <p className="text-xs text-muted-foreground">
                  Gift ID: {gift.gift_id}
                </p> */}

                {/* <p className="text-xs text-muted-foreground">
                  Sender ID: {gift.sender_id}
                </p> */}

                <p className="text-xs text-muted-foreground">
  To Creator: {gift.creator_name || "Creator"}
</p>

                <p className="text-xs text-muted-foreground">
                  {formatDate(gift.created_at)}
                </p>

                {/* <p className="mt-1 text-xs text-muted-foreground">
                  Coins Spended: {gift.earnings} coins
                </p> */}

              </div>

              {/* COINS SPENT */}

              <div className="flex shrink-0 items-center gap-1 text-sm font-semibold text-amber-400">

                <Coins className="h-3.5 w-3.5" />

                {gift.coins_spent}

              </div>

            </GlassCard>

          ))}

        </div>

      )}

    </div>
  );
}
