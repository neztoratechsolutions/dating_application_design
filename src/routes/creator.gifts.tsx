// import { createFileRoute } from "@tanstack/react-router";
// import { PageHeader, GlassCard } from "@/components/ui-kit";
// import { GIFTS, useGifts } from "@/lib/gift-store";
// import { CREATORS } from "@/lib/mock-data";
// import { Gift, Trophy, Coins, TrendingUp } from "lucide-react";
// import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";

// export const Route = createFileRoute("/creator/gifts")({ component: CreatorGifts });

// const SEED = [
//   { customer: "Aarav", giftId: "rose", count: 12 },
//   { customer: "Rohan", giftId: "cake", count: 4 },
//   { customer: "Vikram", giftId: "ring", count: 2 },
//   { customer: "Karan", giftId: "heart", count: 18 },
//   { customer: "Dev", giftId: "bouquet", count: 3 },
// ];

// function CreatorGifts() {
//   const share = useGifts((s) => s.creatorShare);
//   const mine = useGifts((s) => s.history);

//   const totalCoins = SEED.reduce((a, s) => a + (GIFTS.find((g) => g.id === s.giftId)?.price ?? 0) * s.count, 0)
//     + mine.reduce((a, h) => a + h.price, 0);
//   const earnings = Math.round((totalCoins * share) / 100);

//   const breakdown = GIFTS.slice(0, 7).map((g) => ({
//     name: g.emoji,
//     coins: (SEED.find((s) => s.giftId === g.id)?.count ?? 0) * g.price + mine.filter((m) => m.giftId === g.id).reduce((a, m) => a + m.price, 0),
//   }));

//   const supporters = SEED.map((s, i) => ({
//     ...s,
//     avatar: CREATORS[i].avatar,
//     coins: (GIFTS.find((g) => g.id === s.giftId)?.price ?? 0) * s.count,
//   })).sort((a, b) => b.coins - a.coins);

//   return (
//     <div className="space-y-6">
//       <PageHeader title="Gifts Received" subtitle={`Your share: ${share}% of every gift`} />

//       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//         {[
//           { icon: Gift, label: "Total gifts", value: SEED.reduce((a, s) => a + s.count, 0) + mine.length },
//           { icon: Coins, label: "Gift coins", value: totalCoins },
//           { icon: TrendingUp, label: "Your earnings", value: earnings },
//           { icon: Trophy, label: "Top supporter", value: supporters[0]?.customer ?? "—" },
//         ].map((s) => (
//           <GlassCard key={s.label}>
//             <s.icon className="h-4 w-4 text-primary mb-1" />
//             <p className="text-xl font-bold">{s.value}</p>
//             <p className="text-[10px] text-muted-foreground">{s.label}</p>
//           </GlassCard>
//         ))}
//       </div>

//       <GlassCard>
//         <h3 className="font-bold mb-3">Gift breakdown</h3>
//         <div className="h-56">
//           <ResponsiveContainer>
//             <BarChart data={breakdown}>
//               <XAxis dataKey="name" stroke="#888" fontSize={18} />
//               <Tooltip contentStyle={{ background: "rgba(20,15,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
//               <Bar dataKey="coins" fill="oklch(0.7 0.22 350)" radius={[8, 8, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </GlassCard>

//       <div>
//         <h3 className="font-bold mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" /> Top Supporters</h3>
//         <div className="space-y-2">
//           {supporters.map((s, i) => (
//             <GlassCard key={s.customer} className="flex items-center gap-3">
//               <span className="font-bold gradient-text w-6">#{i + 1}</span>
//               <img src={s.avatar} className="h-10 w-10 rounded-full object-cover" alt="" />
//               <div className="flex-1">
//                 <p className="font-semibold text-sm">{s.customer}</p>
//                 <p className="text-xs text-muted-foreground">{s.count} × {GIFTS.find((g) => g.id === s.giftId)?.emoji}</p>
//               </div>
//               <span className="text-sm font-semibold text-amber-400 flex items-center gap-1">
//                 <Coins className="h-3 w-3" /> {s.coins}
//               </span>
//             </GlassCard>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth-store";
import {
  Gift,
  Trophy,
  Coins,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from "recharts";

export const Route = createFileRoute("/creator/gifts")({
  component: CreatorGifts,
});

// ================================================
// API CONFIG + AUTH (mirrors chat-room.tsx)
// ================================================

const API_BASE_URL = String(
  import.meta.env.VITE_BASE_URL ?? ""
).replace(/\/+$/, "");

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token")
  );
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();

  return {
    Accept: "application/json",
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };
}

// ================================================
// RESPONSE TYPES
// ================================================
// FastAPI serializes Decimal as a string by default,
// so coin fields are typed as number | string and
// coerced with toNum() below.

interface GiftBreakdownItem {
  gift_id: number;
  gift_name: string;
  gift_icon: string;
  quantity: number;
  total_coins: number | string;
}

interface TopSupporter {
  sender_id: number;
  name: string | null;
  profile_image: string | null;
  gift_count: number;
  most_sent_gift: GiftBreakdownItem | null;
  most_sent_gift_count: number;
  total_coins: number | string;
  rank?: number;
}

interface TopSupporterSummary {
  sender_id: number;
  name: string | null;
  profile_image: string | null;
  total_coins: number | string;
}

interface ReceivedSummary {
  user_id: number;
  share_percentage: number | string;
  total_gifts: number;
  total_gift_coins: number | string;
  total_earnings: number | string;
  top_supporter: TopSupporterSummary | null;
  gift_breakdown: GiftBreakdownItem[];
  top_supporters: TopSupporter[];
}

// ================================================
// HELPERS
// ================================================

const toNum = (value: unknown): number => {
  const n = Number(value);

  return Number.isFinite(n) ? n : 0;
};

const fmt = (n: number): string => n.toLocaleString();

// The backend returns profile_image as a relative path with
// Windows backslashes (e.g. "uploads\\menus based.PNG").
// Normalize backslashes to forward slashes and prefix with the
// API base URL so the <img src> resolves. Absolute http(s) URLs
// and data: URIs are returned unchanged.
function normalizeImage(path?: string | null): string {
  if (!path) return "";

  const cleaned = String(path).replace(/\\/g, "/");

  if (
    /^https?:\/\//i.test(cleaned) ||
    cleaned.startsWith("data:")
  ) {
    return cleaned;
  }

  return `${API_BASE_URL}/${cleaned.replace(/^\/+/, "")}`;
}

function CreatorGifts() {
  // ================================================
  // LOGGED-IN CREATOR ID
  // ================================================

  const currentUser = useAuth((state) => state.user);

  const currentUserId = Number(
    currentUser?.id ?? currentUser?.user_id
  );

  const [data, setData] =
    useState<ReceivedSummary | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null
  );

  // ================================================
  // FETCH /gift-details/user/{user_id}/received-summary
  // ================================================

  const fetchSummary = async (userId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/gift-details/user/${userId}/received-summary`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) {
        const body = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          body.detail ||
            body.message ||
            `Failed to load gifts (${response.status})`
        );
      }

      const json: ReceivedSummary =
        await response.json();

      setData(json);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to load gifts summary."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      !Number.isInteger(currentUserId) ||
      currentUserId <= 0
    ) {
      setError("Please log in to view your gifts.");
      setLoading(false);
      return;
    }

    void fetchSummary(currentUserId);
  }, [currentUserId]);

  // ================================================
  // DERIVED VALUES
  // ================================================

  const share = data
    ? toNum(data.share_percentage)
    : 0;

  const totalGifts = data ? data.total_gifts : 0;

  const totalCoins = data
    ? toNum(data.total_gift_coins)
    : 0;

  const totalEarnings = data
    ? toNum(data.total_earnings)
    : 0;

  const topSupporterName =
    data?.top_supporter?.name ?? "—";

  const chartData = (data?.gift_breakdown ?? []).map(
    (item) => ({
      name: item.gift_icon,
      coins: toNum(item.total_coins),
    })
  );

  const supporters = data?.top_supporters ?? [];

  // ================================================
  // RENDER
  // ================================================

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Gifts Received"
          subtitle="Loading your gift summary…"
        />
        <GlassCard className="text-center text-sm text-muted-foreground">
          Loading…
        </GlassCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Gifts Received"
          subtitle={`Your share: ${share}% of every gift`}
        />
        <GlassCard className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            {error}
          </p>
          {Number.isInteger(currentUserId) &&
            currentUserId > 0 && (
              <button
                type="button"
                onClick={() =>
                  void fetchSummary(currentUserId)
                }
                className="inline-flex items-center gap-1 rounded-full glass px-3 py-1.5 text-xs hover:bg-glass"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            )}
        </GlassCard>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Gifts Received"
          subtitle={`Your share: ${share}% of every gift`}
        />
        <GlassCard className="text-center text-sm text-muted-foreground">
          No gift data available.
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gifts Received"
        subtitle={`Your share: ${share}% of every gift`}
      />

      {/* STAT CARDS */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: Gift,
            label: "Total gifts",
            value: fmt(totalGifts),
          },
          {
            icon: Coins,
            label: "Gift coins",
            value: fmt(totalCoins),
          },
          {
            icon: TrendingUp,
            label: "Your earnings",
            value: fmt(totalEarnings),
          },
          {
            icon: Trophy,
            label: "Top supporter",
            value: topSupporterName,
          },
        ].map((s) => (
          <GlassCard key={s.label}>
            <s.icon className="h-4 w-4 text-primary mb-1" />
            <p className="text-xl font-bold truncate">
              {s.value}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {s.label}
            </p>
          </GlassCard>
        ))}
      </div>

      {/* GIFT BREAKDOWN CHART */}

      <GlassCard>
        <h3 className="font-bold mb-3">Gift breakdown</h3>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">
            No gifts received yet.
          </p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  stroke="#888"
                  fontSize={18}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(20,15,30,0.9)",
                    border:
                      "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                  }}
                />
                <Bar
                  dataKey="coins"
                  fill="oklch(0.7 0.22 350)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>

      {/* TOP SUPPORTERS */}

      <div>
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" /> Top
          Supporters
        </h3>
        {supporters.length === 0 ? (
          <GlassCard className="text-center text-sm text-muted-foreground">
            No supporters yet.
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {supporters.map((s) => {
              const coins = toNum(s.total_coins);

              const normalizedAvatar = normalizeImage(
                s.profile_image
              );

              const rankLabel = s.rank ?? 0;

              const mostGiftIcon =
                s.most_sent_gift?.gift_icon ?? "🎁";

              const mostGiftName =
                s.most_sent_gift?.gift_name ??
                "gift";

              return (
                <GlassCard
                  key={s.sender_id}
                  className="flex items-center gap-3"
                >
                  <span className="font-bold gradient-text w-6">
                    #{rankLabel}
                  </span>

                  {normalizedAvatar ? (
                    <img
                      src={normalizedAvatar}
                      className="h-10 w-10 rounded-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full glass flex items-center justify-center text-sm font-semibold">
                      {(s.name ?? "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {s.name ?? "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.gift_count} × {mostGiftIcon}{" "}
                      {mostGiftName}
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-amber-400 flex items-center gap-1">
                    <Coins className="h-3 w-3" />{" "}
                    {fmt(coins)}
                  </span>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
