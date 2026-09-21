import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { MessageCircle, Phone, Video, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/creator/pricing")({ component: Pricing });

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

function Pricing() {
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token); // Assuming you have a token in your auth store
  
  const [prices, setPrices] = useState({ chat: 8, voice: 25, video: 50 });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const items = [
    { k: "chat" as const, icon: MessageCircle, label: "Chat", unit: "/msg", min: 2, max: 30 },
    { k: "voice" as const, icon: Phone, label: "Voice Call", unit: "/min", min: 10, max: 100 },
    { k: "video" as const, icon: Video, label: "Video Call", unit: "/min", min: 20, max: 200 },
  ];

  // Fetch existing pricing details on component mount
  useEffect(() => {
    const fetchPricing = async () => {
      if (!user?.user_id) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/pricing-details?user_id=${user.user_id}`, {
          headers: {
            "Content-Type": "application/json",
            // Add Authorization header if your API requires it
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // API returns an array: [{ id: 1, user_id: 1, chat_amount: "7.00", ... }]
          if (Array.isArray(data) && data.length > 0) {
            const existingData = data[0];
            setPrices({
              // Convert string values to numbers using Number()
              chat: Number(existingData.chat_amount) || 8,
              voice: Number(existingData.voice_call_amount) || 25,
              video: Number(existingData.video_call_amount) || 50,
            });
          } else if (!Array.isArray(data) && data.chat_amount) {
            // Fallback just in case API returns a single object instead of an array
            setPrices({
              chat: Number(data.chat_amount) || 8,
              voice: Number(data.voice_call_amount) || 25,
              video: Number(data.video_call_amount) || 50,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch pricing:", error);
        // Silent fail on fetch, just keep defaults
      } finally {
        setIsLoading(false);
      }
    };

    fetchPricing();
  }, [user, token]);

  const savePricing = async () => {
    if (!user?.user_id) {
      toast.error("Authentication error. Please log in again.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/pricing-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add Authorization header if your API requires it
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: user.user_id,
          chat_amount: prices.chat,
          voice_call_amount: prices.voice,
          video_call_amount: prices.video,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to save pricing");
      }

      toast.success("Pricing updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save pricing. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Pricing" subtitle="Set your per-minute coin rates" />
      
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <GlassCard key={it.k}>
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-full bg-gradient-primary p-2 shadow-glow">
                  <it.icon className="h-4 w-4" />
                </div>
                <p className="font-semibold">{it.label}</p>
                <p className="ml-auto font-bold gradient-text">
                  {prices[it.k]} coins{it.unit}
                </p>
              </div>
              <input 
                type="range" 
                min={it.min} 
                max={it.max} 
                value={prices[it.k]}
                onChange={(e) => setPrices({ ...prices, [it.k]: +e.target.value })}
                className="w-full accent-primary" 
                disabled={isSaving}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{it.min}</span><span>{it.max}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
      
      <button 
        onClick={savePricing} 
        disabled={isSaving || isLoading}
        className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
          </>
        ) : (
          "Save pricing"
        )}
      </button>
    </div>
  );
}