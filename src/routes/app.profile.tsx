import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-store";
import { PageHeader, GlassCard } from "@/components/ui-kit";
import { Edit2, Wallet, Bell, Shield, HelpCircle, LogOut, Settings, Gift, Heart, Trophy } from "lucide-react";

export const Route = createFileRoute("/app/profile")({ component: Profile });

function Profile() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  const items = [
    { to: "/app/profile/edit", icon: Edit2, label: "Edit Profile" },
    { to: "/app/wallet", icon: Wallet, label: "Wallet" },
    { to: "/app/gifts", icon: Gift, label: "My Gifts Sent" },
    { to: "/app/favorites", icon: Heart, label: "Favorite Creators" },
    { to: "/app/rewards", icon: Trophy, label: "Rewards & Check-in" },
    { to: "/app/notifications", icon: Bell, label: "Notifications" },
    { to: "/app/games", icon: Gift, label: "Games" },
    { to: "/app/settings", icon: Settings, label: "Settings" },
    { to: "/app/help", icon: HelpCircle, label: "Help & Support" },
    { to: "/legal/privacy", icon: Shield, label: "Privacy Policy" },
  ];

  return (
    <div>
      <PageHeader title="Profile" />
      <div className="glass-strong rounded-3xl p-6 mb-5 flex items-center gap-4">
        <div className="h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-2xl font-bold shadow-glow">
          {user?.name.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <p className="text-xs text-muted-foreground">{user?.mobile} · {user?.state}</p>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((it) => (
          <Link key={it.to} to={it.to} className="glass rounded-2xl p-4 flex items-center gap-3 hover:bg-glass-border transition">
            <it.icon className="h-5 w-5 text-primary" />
            <span className="flex-1 text-sm font-medium">{it.label}</span>
            <span className="text-muted-foreground">›</span>
          </Link>
        ))}
        <button onClick={() => { logout(); navigate({ to: "/" }); }}
          className="w-full glass rounded-2xl p-4 flex items-center gap-3 hover:bg-destructive/20 text-destructive">
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
