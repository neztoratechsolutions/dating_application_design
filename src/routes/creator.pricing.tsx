
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import {
  MessageCircle,
  Phone,
  Video,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/creator/pricing")({
  component: Pricing,
});

const API_BASE_URL = String(
  import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

type Prices = {
  chat: number;
  voice: number;
  video: number;
};

type PricingResponse = {
  id?: number;
  user_id?: number | string;
  chat_amount?: number | string;
  voice_call_amount?: number | string;
  video_call_amount?: number | string;
};

function Pricing() {
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);

  // Both id and user_id may exist in the auth object.
  // They must identify the same database user.
  const pricingUserId = Number(
    user?.id ?? user?.user_id
  );

  const [prices, setPrices] = useState<Prices>({
    chat: 8,
    voice: 25,
    video: 50,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const authHeaders = {
    Accept: "application/json",
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };

  const items = [
    {
      k: "chat" as const,
      icon: MessageCircle,
      label: "Chat",
      unit: "/msg",
      min: 2,
      max: 30,
    },
    {
      k: "voice" as const,
      icon: Phone,
      label: "Voice Call",
      unit: "/min",
      min: 10,
      max: 100,
    },
    {
      k: "video" as const,
      icon: Video,
      label: "Video Call",
      unit: "/min",
      min: 20,
      max: 200,
    },
  ];

  // ================================================
  // FETCH EXISTING CREATOR PRICING
  // GET /pricing-details/user/{user_id}
  // ================================================

  useEffect(() => {
    let cancelled = false;

    const fetchPricing = async () => {
      if (
        !Number.isInteger(pricingUserId) ||
        pricingUserId <= 0
      ) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/pricing-details/user/${pricingUserId}`,
          {
            method: "GET",
            headers: authHeaders,
          }
        );

        if (response.ok) {
          const data: PricingResponse =
            await response.json();

          if (
            data.user_id != null &&
            Number(data.user_id) !== pricingUserId
          ) {
            throw new Error(
              "Pricing belongs to a different user."
            );
          }

          if (!cancelled) {
            setPrices({
              chat: Number(data.chat_amount ?? 8),
              voice: Number(
                data.voice_call_amount ?? 25
              ),
              video: Number(
                data.video_call_amount ?? 50
              ),
            });
          }
        } else if (response.status === 404) {
          console.log(
            "No existing pricing found for creator:",
            pricingUserId
          );
        } else {
          const errorData = await response
            .json()
            .catch(() => ({}));

          throw new Error(
            errorData.detail ||
              "Unable to fetch pricing."
          );
        }
      } catch (error) {
        console.error(
          "Pricing fetch error:",
          error
        );

        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Unable to load pricing."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchPricing();

    return () => {
      cancelled = true;
    };
  }, [pricingUserId, token]);

  // ================================================
  // SAVE CREATOR PRICING
  // POST /pricing-details/
  // ================================================

  const savePricing = async () => {
    if (
      !Number.isInteger(pricingUserId) ||
      pricingUserId <= 0
    ) {
      toast.error(
        "Invalid user ID. Please log in again."
      );
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/pricing-details/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({
            user_id: pricingUserId,
            chat_amount: prices.chat,
            voice_call_amount: prices.voice,
            video_call_amount: prices.video,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to save pricing."
        );
      }

      if (
        data.user_id != null &&
        Number(data.user_id) !== pricingUserId
      ) {
        throw new Error(
          "Saved pricing returned an unexpected user ID."
        );
      }

      toast.success(
        "Pricing updated successfully!"
      );
    } catch (error) {
      console.error("Save pricing error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save pricing."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ================================================
  // UI
  // ================================================

  return (
    <div>
      <PageHeader
        title="Pricing"
        subtitle="Set your per-minute coin rates"
      />

      <div className="mb-4 rounded-xl glass p-3 text-sm">
        Creator User ID:{" "}
        <strong>{pricingUserId || "Not available"}</strong>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <GlassCard key={item.k}>
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-full bg-gradient-primary p-2 shadow-glow">
                  <item.icon className="h-4 w-4" />
                </div>

                <p className="font-semibold">
                  {item.label}
                </p>

                <p className="ml-auto font-bold gradient-text">
                  {prices[item.k]} coins{item.unit}
                </p>
              </div>

              <input
                type="range"
                min={item.min}
                max={item.max}
                value={prices[item.k]}
                onChange={(event) =>
                  setPrices((previous) => ({
                    ...previous,
                    [item.k]: Number(event.target.value),
                  }))
                }
                className="w-full accent-primary"
                disabled={isSaving}
              />

              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{item.min}</span>
                <span>{item.max}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={savePricing}
        disabled={isSaving || isLoading}
        className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save pricing"
        )}
      </button>
    </div>
  );
}
