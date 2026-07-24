import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, UserCog, ShieldCheck, Wallet, DollarSign,
  AlertTriangle, MessageCircle, Phone, Video, Activity, Gamepad2,
  Bell, Megaphone, Settings, FileText, LifeBuoy, LogOut, BarChart3, Gift,
} from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Overview",
    items: [
      { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
    ],
  },
  {
    label: "Users",
    items: [
      { to: "/admin/customers", icon: Users, label: "Customers" },
      { to: "/admin/creators", icon: UserCog, label: "Creators" },
      { to: "/admin/kyc", icon: ShieldCheck, label: "KYC Approvals" },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/admin/wallets", icon: Wallet, label: "Wallets" },
      { to: "/admin/revenue", icon: DollarSign, label: "Revenue" },
      { to: "/admin/withdrawals", icon: DollarSign, label: "Withdrawals" },
      { to: "/admin/gifts", icon: Gift, label: "Gifts" },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { to: "/admin/chats", icon: MessageCircle, label: "Chats" },
      { to: "/admin/voice-logs", icon: Phone, label: "Voice Calls" },
      { to: "/admin/video-logs", icon: Video, label: "Video Calls" },
      { to: "/admin/live", icon: Activity, label: "Live Users" },
      { to: "/admin/games", icon: Gamepad2, label: "Games" },
      { to: "/admin/fraud", icon: AlertTriangle, label: "Fraud" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/notifications", icon: Bell, label: "Push Notifs" },
      { to: "/admin/ads", icon: Megaphone, label: "Ads" },
      { to: "/admin/settings", icon: Settings, label: "App Settings" },
      { to: "/admin/legal", icon: FileText, label: "Legal Pages" },
      { to: "/admin/support", icon: LifeBuoy, label: "Support" },
    ],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen md:flex">
      <aside className="md:w-72 md:min-h-screen md:border-r md:border-glass-border glass-strong md:sticky md:top-0 overflow-y-auto max-h-screen">
        <div className="p-5">
          <Link to="/admin" className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-xl bg-gradient-primary shadow-glow" />
            <span className="font-bold">Velora<span className="gradient-text">Admin</span></span>
          </Link>
          {groups.map((g) => (
            <div key={g.label} className="mb-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground px-3 mb-1.5">{g.label}</p>
              <nav className="space-y-0.5">
                {g.items.map((it) => {
                  const active = it.to === "/admin" ? path === "/admin" : path.startsWith(it.to);
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                        active ? "bg-gradient-primary text-primary-foreground shadow-glow font-medium" : "text-muted-foreground hover:bg-glass hover:text-foreground",
                      )}
                    >
                      <it.icon className="h-4 w-4" />
                      <span>{it.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
          <button
            onClick={() => { logout(); navigate({ to: "/" }); }}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}
