import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { MessageCircle, Phone, Video, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/creator/pricing")({ component: Pricing });

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

function Pricing() {
  const user = useAuth((s) => s.user);
  const [prices, setPrices] = useState({ chat: 8, voice: 25, video: 50 });
  const [isSaving, setIsSaving] = useState(false);

  const items = [
    { k: "chat" as const, icon: MessageCircle, label: "Chat", unit: "/msg", min: 2, max: 30 },
    { k: "voice" as const, icon: Phone, label: "Voice Call", unit: "/min", min: 10, max: 100 },
    { k: "video" as const, icon: Video, label: "Video Call", unit: "/min", min: 20, max: 200 },
  ];

  const savePricing = async () => {
    setIsSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/pricing-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user?.user_id || 0, // Fallback to 0 if user_id is missing
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
      <div className="space-y-3">
        {items.map((it) => (
          <GlassCard key={it.k}>
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-full bg-gradient-primary p-2 shadow-glow"><it.icon className="h-4 w-4" /></div>
              <p className="font-semibold">{it.label}</p>
              <p className="ml-auto font-bold gradient-text">{prices[it.k]} coins{it.unit}</p>
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
      
      <button 
        onClick={savePricing} 
        disabled={isSaving}
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