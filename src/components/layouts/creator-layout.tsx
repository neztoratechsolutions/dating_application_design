import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard, User, ShieldCheck, Image as ImageIcon, Wallet,
  MessageCircle, BarChart3, Star, Settings, LogOut, Power, Gift,
} from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
const API_BASE_URL = import.meta.env.VITE_BASE_URL;
const items = [
  { to: "/creator", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/creator/profile", icon: User, label: "Profile Setup" },
  { to: "/creator/kyc", icon: ShieldCheck, label: "KYC" },
  { to: "/creator/gallery", icon: ImageIcon, label: "Gallery" },
  { to: "/creator/pricing", icon: Wallet, label: "Pricing" },
  { to: "/creator/earnings", icon: BarChart3, label: "Earnings" },
  { to: "/creator/gifts", icon: Gift, label: "Gifts Received" },
  { to: "/creator/chat", icon: MessageCircle, label: "Inbox" },
  { to: "/creator/reviews", icon: Star, label: "Reviews" },
  { to: "/creator/settings", icon: Settings, label: "Settings" },
];

export function CreatorLayout({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const user = useAuth((s) => s.user);
  const update = useAuth((s) => s.updateUser);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  
  const [online, setOnline] = useState(user?.online ?? true);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleStatus = async () => {
    if (!user?.id || isUpdating) return;

    const newStatus = !online;
    setIsUpdating(true);

    try {
      // Send request to FastAPI backend using native fetch
      const response = await fetch(`${API_BASE_URL}/user-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // If your backend requires authentication tokens, add them here:
          // "Authorization": `Bearer ${your_token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          is_online: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      // Update local state and global store on success
      setOnline(newStatus);
      update({ online: newStatus });
      
      // Show toast based on the NEW status
      toast.success(newStatus ? "You're now online ✨" : "You're offline");
      
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen md:flex">
      <aside className="md:w-64 md:min-h-screen md:border-r md:border-glass-border glass-strong md:sticky md:top-0">
        <div className="p-5">
          <Link to="/creator" className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-xl bg-gradient-primary shadow-glow" />
            <span className="font-bold">Velora<span className="gradient-text">Creator</span></span>
          </Link>
          
          <button
            onClick={handleToggleStatus}
            disabled={isUpdating}
            className={cn(
              "w-full flex items-center justify-between rounded-xl px-3 py-2.5 mb-4 text-sm font-medium transition",
              online ? "bg-success/20 text-success" : "bg-muted text-muted-foreground",
              isUpdating && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="flex items-center gap-2">
              <Power className="h-4 w-4" />
              {isUpdating ? "Updating..." : online ? "Online" : "Offline"}
            </span>
            <span className={cn("h-2 w-2 rounded-full", online ? "bg-success animate-pulse" : "bg-muted-foreground")} />
          </button>

          <nav className="space-y-1 overflow-x-auto md:overflow-visible flex md:block no-scrollbar">
            {items.map((it) => {
              const active = it.to === "/creator" ? path === "/creator" : path.startsWith(it.to);
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition whitespace-nowrap",
                    active ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-glass hover:text-foreground",
                  )}
                >
                  <it.icon className="h-4 w-4" />
                  <span>{it.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => { logout(); navigate({ to: "/" }); }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </nav>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">{children}</main>
    </div>
  );
}