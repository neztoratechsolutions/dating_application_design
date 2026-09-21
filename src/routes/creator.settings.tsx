import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/creator/settings")({ component: S });

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

// Helper to convert "14:00" -> "02.00 PM"
const formatToAPI = (time24: string) => {
  if (!time24) return "";
  let [hours, minutes] = time24.split(":");
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12; // the hour '0' should be '12'
  return `${h.toString().padStart(2, "0")}.${minutes} ${ampm}`;
};

// Helper to convert "02.00 PM" -> "14:00" for HTML time input
const parseFromAPI = (timeStr: string) => {
  if (!timeStr) return "";
  const [time, modifier] = timeStr.split(" ");
  if (!time || !modifier) return "";
  
  let [hours, minutes] = time.split(".");
  let h = parseInt(hours, 10);
  
  if (modifier === "PM" && h !== 12) {
    h += 12;
  } else if (modifier === "AM" && h === 12) {
    h = 0;
  }
  
  return `${h.toString().padStart(2, "0")}:${minutes}`;
};

function S() {
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);
  
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("22:00");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.user_id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/settings/?user_id=${user.user_id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Handle if API returns array or single object
          const settingsData = Array.isArray(data) && data.length > 0 ? data[0] : data;
          
          if (settingsData?.availability_hour) {
            const parts = settingsData.availability_hour.split(" - ");
            if (parts.length === 2) {
              const start = parseFromAPI(parts[0]);
              const end = parseFromAPI(parts[1]);
              if (start) setStartTime(start);
              if (end) setEndTime(end);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user, token]);

  const saveSettings = async () => {
    if (!user?.user_id) {
      toast.error("Authentication error. Please log in again.");
      return;
    }

    setIsSaving(true);

    try {
      const availabilityString = `${formatToAPI(startTime)} - ${formatToAPI(endTime)}`;

      const response = await fetch(`${API_BASE_URL}/settings/?user_id=${user.user_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          availability_hour: availabilityString,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to save settings");
      }

      toast.success("Settings saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" />
      <div className="space-y-3">
        <GlassCard>
          <p className="font-semibold text-sm mb-2">Availability hours</p>
          <div className="flex gap-2">
            <input 
              type="time" 
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={isSaving}
              className="glass rounded-xl px-3 py-2 text-sm outline-none flex-1 disabled:opacity-70" 
            />
            <input 
              type="time" 
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={isSaving}
              className="glass rounded-xl px-3 py-2 text-sm outline-none flex-1 disabled:opacity-70" 
            />
          </div>
        </GlassCard>
        
        <GlassCard>
          <p className="font-semibold text-sm mb-1">Auto-accept calls</p>
          <p className="text-xs text-muted-foreground">When online, automatically accept incoming</p>
        </GlassCard>
        
        <button 
          onClick={saveSettings} 
          disabled={isSaving}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </div>
  );
}