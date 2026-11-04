import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth-store";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/creator/earnings")({ component: E });

// Set directly to your local backend URL
const API_BASE_URL = String(
  import.meta.env.VITE_BASE_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    ""
).replace(/\/+$/, "");

type DayPoint = { date: string; day: string; amount: number };

function E() {
  const user = useAuth((s) => s.user);
  const creatorId = user?.id ?? 1;

  const [totalEarned, setTotalEarned] = useState<number | null>(null);
  const [availablePayout, setAvailablePayout] = useState<number | null>(null);
  const [withdrawnTotal, setWithdrawnTotal] = useState<number | null>(null);
  const [chartData, setChartData] = useState<DayPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [withdrawInput, setWithdrawInput] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  // -------------------------------------------------------------------------
  // GET /earnings/{user_id} — totals + last 7 days chart
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`${API_BASE_URL}/earnings/${creatorId}`)
      .then(async (res) => {
        // A creator with no earnings row yet gets a 404 — treat as zeros.
        if (res.status === 404) {
          return {
            data: {
              total_earned: 0,
              available_payout: 0,
              withdrawal_amount: 0,
              last_7_days: [],
            },
          };
        }
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.detail || `Failed to load earnings (${res.status})`);
        }
        return res.json();
      })
      .then((body) => {
        if (cancelled) return;
        const d = body?.data ?? {};
        setTotalEarned(Number(d.total_earned) || 0);
        setAvailablePayout(Number(d.available_payout) || 0);
        setWithdrawnTotal(Number(d.withdrawal_amount) || 0);
        setChartData(Array.isArray(d.last_7_days) ? d.last_7_days : []);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err?.message || "Failed to load earnings");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [creatorId]);

  // -------------------------------------------------------------------------
  // POST /earnings/{user_id}/withdraw
  // -------------------------------------------------------------------------
  async function handleWithdraw() {
    const amount = parseFloat(withdrawInput);
    if (!withdrawInput || isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount to withdraw");
      return;
    }
    if (availablePayout != null && amount > availablePayout) {
      toast.error(
        `Amount exceeds available payout (₹${availablePayout.toLocaleString()})`
      );
      return;
    }

    setWithdrawing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/earnings/${creatorId}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || `Withdrawal failed (${res.status})`);
      }

      const body = await res.json();
      const d = body?.data ?? {};
      setAvailablePayout(Number(d.available_payout) || 0);
      setWithdrawnTotal(Number(d.withdrawal_amount) || 0);
      if (d.total_earned != null) setTotalEarned(Number(d.total_earned) || 0);

      setWithdrawInput("");
      toast.success(`₹${amount.toLocaleString()} withdrawal requested`);
    } catch (err: any) {
      toast.error(err?.message || "Withdrawal failed. Please try again.");
    } finally {
      setWithdrawing(false);
    }
  }

  const canWithdraw =
    availablePayout != null && availablePayout > 0 && !withdrawing;

  return (
    <div>
      <PageHeader title="Earnings" />

      <div className="grid grid-cols-2 gap-3 mb-5">
        <GlassCard>
          <p className="text-xs text-muted-foreground">Total earned</p>
          <p className="text-2xl font-bold gradient-text">
            {totalEarned == null ? "—" : `₹${totalEarned.toLocaleString()}`}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-muted-foreground">Available payout</p>
          <p className="text-2xl font-bold">
            {availablePayout == null ? "—" : `₹${availablePayout.toLocaleString()}`}
          </p>
        </GlassCard>
      </div>

      <GlassCard className="mb-5">
        <p className="text-xs text-muted-foreground mb-2">Last 7 days</p>
        <div className="h-48">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <XAxis dataKey="day" stroke="#888" fontSize={11} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{
                    background: "rgba(20,15,30,0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                  }}
                  formatter={(value: number) => [
                    `₹${Number(value).toLocaleString()}`,
                    "Earned",
                  ]}
                />
                <Bar dataKey="amount" fill="oklch(0.7 0.22 350)" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>

      {/* Withdrawal */}
      <GlassCard className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">Withdraw earnings</p>
          {withdrawnTotal != null && withdrawnTotal > 0 && (
            <p className="text-xs text-muted-foreground">
              Withdrawn: ₹{withdrawnTotal.toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex items-center flex-1 rounded-xl bg-glass border border-glass px-3">
            <span className="text-sm text-muted-foreground">₹</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="Enter amount"
              value={withdrawInput}
              onChange={(e) => setWithdrawInput(e.target.value)}
              disabled={!canWithdraw}
              className="flex-1 w-full bg-transparent py-3 px-2 text-sm outline-none disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleWithdraw}
            disabled={!canWithdraw}
            className={`rounded-xl bg-gradient-primary px-5 py-3 font-semibold shadow-glow text-sm ${
              canWithdraw ? "" : "opacity-60 pointer-events-none"
            }`}
          >
            {withdrawing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Withdraw"
            )}
          </button>
        </div>

        {availablePayout != null && availablePayout > 0 && (
          <button
            onClick={() => setWithdrawInput(String(availablePayout))}
            disabled={withdrawing}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Use max · ₹{availablePayout.toLocaleString()}
          </button>
        )}
      </GlassCard>

      <p className="text-xs text-muted-foreground mt-2 text-center">
        Default commission: 20% · Calls under 1 min not charged
      </p>
    </div>
  );
}
