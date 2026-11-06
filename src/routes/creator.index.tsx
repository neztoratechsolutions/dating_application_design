import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  PageHeader,
  GlassCard,
  CoinBadge,
} from "@/components/ui-kit";

import { useAuth } from "@/lib/auth-store";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";

import {
  TrendingUp,
  Users,
  Phone,
  Star,
  MessageCircle,
} from "lucide-react";

import { toast } from "sonner";

// =====================================================
// API TYPES
// =====================================================

interface CreatorDashboardResponse {
  status_code: number;
  message: string;

  data: {
    creator: {
      user_id: number;
      name: string;
      profile_photo: string | null;
    };

    kyc: {
      status: string;
      message: string;
      can_receive_payouts: boolean;
    };

    today: {
      earnings: number;
      followers: number;
      calls: number;
      rating: number;
    };

    weekly: {
      earnings: number;

      chart: {
        date: string;
        day: string;
        earnings: number;
      }[];
    };

    messages: {
      new_messages: number;
    };

    payout: {
      balance: number;
      withdrawal_amount: number;
    };
  };
}

// =====================================================
// API URL
// =====================================================

const BASE_URL = import.meta.env.VITE_BASE_URL || "";

// =====================================================
// ROUTE
// =====================================================

export const Route = createFileRoute("/creator/")({
  component: CreatorHome,
});

// =====================================================
// CREATOR DASHBOARD
// =====================================================

function CreatorHome() {
  const user = useAuth((s) => s.user);

  const userId = Number(user?.user_id || user?.id);

  const [dashboard, setDashboard] =
    useState<CreatorDashboardResponse["data"] | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =====================================================
  // FETCH DASHBOARD API
  // =====================================================

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${BASE_URL}/creator/dashboard/${userId}`
        );

        const result: CreatorDashboardResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to fetch dashboard"
          );
        }

        if (!cancelled) {
          setDashboard(result.data);
        }
      } catch (err) {
        console.error("Creator dashboard error:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load dashboard"
          );

          toast.error("Failed to load creator dashboard");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="p-5">
        <PageHeader
          title="Creator Dashboard"
          subtitle="Loading your dashboard..."
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <GlassCard key={index}>
              <div className="h-16 animate-pulse rounded-xl bg-white/10" />
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !dashboard) {
    return (
      <div>
        <PageHeader
          title="Creator Dashboard"
          subtitle="Unable to load your dashboard"
        />

        <GlassCard>
          <p className="text-sm text-muted-foreground">
            {error || "Dashboard data not available"}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-gradient-primary px-4 py-2 text-sm"
          >
            Retry
          </button>
        </GlassCard>
      </div>
    );
  }

  // =====================================================
  // API DATA
  // =====================================================

  const creator = dashboard.creator;

  const today = dashboard.today;

  const weekly = dashboard.weekly;

  const payout = dashboard.payout;

  const kyc = dashboard.kyc;

  const messages = dashboard.messages;

  const creatorName =
    creator?.name || user?.name || "Creator";

  // =====================================================
  // STATS
  // =====================================================

  const stats = [
    {
      icon: TrendingUp,
      label: "Today's earnings",
      value: `₹${Number(today.earnings || 0).toLocaleString()}`,
      c: "text-success",
    },
    {
      icon: Users,
      label: "Followers",
      value: Number(today.followers || 0).toLocaleString(),
      c: "text-primary",
    },
    {
      icon: Phone,
      label: "Calls",
      value: Number(today.calls || 0).toLocaleString(),
      c: "text-accent",
    },
    {
      icon: Star,
      label: "Rating",
      value: Number(today.rating || 0).toFixed(1),
      c: "text-warning",
    },
  ];

  // =====================================================
  // WEEKLY CHART
  // =====================================================

  const chartData = weekly.chart || [];

  const weeklyTotal = Number(weekly.earnings || 0);

  // =====================================================
  // UI
  // =====================================================

  return (
    <div>
      {/* =================================================
          HEADER
      ================================================= */}

      <PageHeader
        title={`Hi, ${creatorName.split(" ")[0]} 👋`}
        subtitle="Here's how you're doing today"
      />

      {/* =================================================
          KYC
      ================================================= */}

      {!kyc.can_receive_payouts && (
        <Link
          to="/creator/kyc"
          className="block glass-strong rounded-2xl p-4 mb-5 border border-warning/30"
        >
          <p className="text-sm font-semibold text-warning">
            ⚠️ Complete your KYC
          </p>

          <p className="text-xs text-muted-foreground">
            {kyc.message ||
              "You can't receive payouts until verified."}
          </p>

          <p className="text-xs mt-2 text-warning">
            Status: {kyc.status}
          </p>
        </Link>
      )}

      {/* =================================================
          TODAY STATS
      ================================================= */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => (
          <GlassCard key={stat.label}>
            <stat.icon
              className={`h-5 w-5 ${stat.c} mb-2`}
            />

            <p className="text-xs text-muted-foreground">
              {stat.label}
            </p>

            <p className="font-bold text-xl">
              {stat.value}
            </p>
          </GlassCard>
        ))}
      </div>

      {/* =================================================
          WEEKLY EARNINGS
      ================================================= */}

      <GlassCard className="mb-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-xs text-muted-foreground">
              Weekly earnings
            </p>

            <p className="text-2xl font-bold gradient-text">
              ₹{weeklyTotal.toLocaleString()}
            </p>
          </div>

          <CoinBadge amount={payout.balance || 0} />
        </div>

        {/* Weekly Chart */}

        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient
                  id="creatorEarningsGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="oklch(0.7 0.22 350)"
                    stopOpacity={0.6}
                  />

                  <stop
                    offset="100%"
                    stopColor="oklch(0.7 0.22 350)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="day"
                stroke="#888"
                fontSize={11}
              />

              <Tooltip
                formatter={(value) => [
                  `₹${Number(value || 0).toLocaleString()}`,
                  "Earnings",
                ]}
                contentStyle={{
                  background: "rgba(20,15,30,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                }}
              />

              <Area
                type="monotone"
                dataKey="earnings"
                stroke="oklch(0.7 0.22 350)"
                fill="url(#creatorEarningsGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* =================================================
          PAYOUT SUMMARY
      ================================================= */}

      <div className="grid grid-cols-2 gap-3 mb-5">
        <GlassCard>
          <TrendingUp className="h-5 w-5 text-success mb-2" />

          <p className="text-xs text-muted-foreground">
            Available payout
          </p>

          <p className="font-bold text-xl">
            ₹{Number(payout.balance || 0).toLocaleString()}
          </p>
        </GlassCard>

        <GlassCard>
          <CoinsIcon />

          <p className="text-xs text-muted-foreground">
            Total withdrawn
          </p>

          <p className="font-bold text-xl">
            ₹
            {Number(
              payout.withdrawal_amount || 0
            ).toLocaleString()}
          </p>
        </GlassCard>
      </div>

      {/* =================================================
          MESSAGES AND PAYOUTS
      ================================================= */}

      <div className="grid grid-cols-2 gap-3">
        <Link to="/creator/chat">
          <GlassCard hover>
            <MessageCircle className="h-5 w-5 text-primary mb-2" />

            <p className="font-semibold text-sm">
              {messages.new_messages || 0} new messages
            </p>
          </GlassCard>
        </Link>

        <Link to="/creator/earnings">
          <GlassCard hover>
            <TrendingUp className="h-5 w-5 text-success mb-2" />

            <p className="font-semibold text-sm">
              View payouts
            </p>
          </GlassCard>
        </Link>
      </div>
    </div>
  );
}

// =====================================================
// PAYOUT ICON
// =====================================================

function CoinsIcon() {
  return (
    <TrendingUp className="h-5 w-5 text-primary mb-2" />
  );
}

