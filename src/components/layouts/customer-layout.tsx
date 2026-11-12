// import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
// import { motion } from "framer-motion";
// import { Home, Users, MessageCircle, User, Gamepad2, Bell, Search, LogOut, Gift } from "lucide-react";
// import { useAuth } from "@/lib/auth-store";
// import { CoinBadge } from "../ui-kit";
// import { cn } from "@/lib/utils";

// const customerNav = [
//   { to: "/app", icon: Home, label: "Home" },
//   { to: "/app/creators", icon: Users, label: "Creators" },
//   { to: "/app/chat", icon: MessageCircle, label: "Chat" },
//   { to: "/app/games", icon: Gamepad2, label: "Games" },
//   { to: "/app/profile", icon: User, label: "Profile" },
// ];

// export function CustomerLayout({ children }: { children: React.ReactNode }) {
//   const path = useRouterState({ select: (s) => s.location.pathname });
//   const user = useAuth((s) => s.user);
//   const logout = useAuth((s) => s.logout);
//   const navigate = useNavigate();

//   return (
//     <div className="min-h-screen pb-24 md:pb-8">
//       {/* Top bar */}
//       <header className="glass-strong sticky top-0 z-40 border-b border-glass-border">
//         <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
//           <Link to="/app" className="flex items-center gap-2">
//             <div className="h-8 w-8 rounded-xl bg-gradient-primary shadow-glow" />
//             <span className="font-bold text-lg">Velora<span className="gradient-text">Live</span></span>
//           </Link>
//           <div className="flex items-center gap-2">
//             <Link to="/app/search" className="rounded-full p-2 hover:bg-glass">
//               <Search className="h-5 w-5" />
//             </Link>
//             <Link to="/app/rewards" className="rounded-full p-2 hover:bg-glass" aria-label="Rewards">
//               <Gift className="h-5 w-5" />
//             </Link>
//             <Link to="/app/notifications" className="rounded-full p-2 hover:bg-glass relative">
//               <Bell className="h-5 w-5" />
//               <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
//             </Link>
//             <Link to="/app/wallet">
//               <CoinBadge amount={user?.coins ?? 0} />
//             </Link>
//             <button
//               onClick={() => { logout(); navigate({ to: "/" }); }}
//               className="rounded-full p-2 hover:bg-glass text-muted-foreground"
//               aria-label="Logout"
//             >
//               <LogOut className="h-5 w-5" />
//             </button>
//           </div>
//         </div>
//       </header>

//       <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

//       {/* Bottom nav */}
//       <nav className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 glass-strong rounded-full px-2 py-2 shadow-card">
//         <div className="flex items-center gap-1">
//           {customerNav.map((item) => {
//             const active = item.to === "/app" ? path === "/app" : path.startsWith(item.to);
//             return (
//               <Link
//                 key={item.to}
//                 to={item.to}
//                 className={cn(
//                   "relative flex flex-col items-center gap-0.5 rounded-full px-4 py-2 text-xs font-medium transition-colors",
//                   active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
//                 )}
//               >
//                 {active && (
//                   <motion.div
//                     layoutId="customer-nav-pill"
//                     className="absolute inset-0 rounded-full bg-gradient-primary shadow-glow"
//                     transition={{ type: "spring", stiffness: 380, damping: 30 }}
//                   />
//                 )}
//                 <item.icon className="relative h-5 w-5" />
//                 <span className="relative">{item.label}</span>
//               </Link>
//             );
//           })}
//         </div>
//       </nav>
//     </div>
//   );
// }
import { Link, useRouterState, useNavigate, useLoaderData } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Home, Users, MessageCircle, User, Gamepad2, Bell, Search, LogOut, Gift } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { CoinBadge } from "../ui-kit";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Backend base URL + path normalizer (same helper as in __root.tsx /
// AdminLayout.tsx / CreatorLayout.tsx / settings.tsx). The backend stores
// logo/favicon as relative paths, e.g.
// "uploads/app_settings/<uuid>_logo.png" -> absolute URL hitting the /uploads static mount.
const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";
const buildImageUrl = (path?: string | null): string => {
  if (!path) return "";
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${API_BASE_URL.replace(/\/+$/, "")}/${normalized}`;
};

const DEFAULT_APP_NAME = "Velora";

const customerNav = [
  { to: "/app", icon: Home, label: "Home" },
  { to: "/app/creators", icon: Users, label: "Creators" },
  { to: "/app/chat", icon: MessageCircle, label: "Chat" },
  { to: "/app/games", icon: Gamepad2, label: "Games" },
  { to: "/app/profile", icon: User, label: "Profile" },
];

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  // Brand name + logo come from the root route's loader (see __root.tsx),
  // which fetches /app-settings/ once on initial load.
  const rootData = useLoaderData({ from: "__root__" });
  const appName = rootData?.appName || DEFAULT_APP_NAME;
  const logoUrl = buildImageUrl(rootData?.logo);
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Top bar */}
      <header className="glass-strong sticky top-0 z-40 border-b border-glass-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/app" className="flex items-center gap-2">
            {logoUrl && !logoFailed ? (
              <img
                src={logoUrl}
                alt={appName}
                onError={() => setLogoFailed(true)}
                className="h-8 w-8 rounded-xl object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-xl bg-gradient-primary shadow-glow" />
            )}
            <span className="font-bold text-lg">{appName}<span className="gradient-text">Live</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/app/search" className="rounded-full p-2 hover:bg-glass">
              <Search className="h-5 w-5" />
            </Link>
            <Link to="/app/rewards" className="rounded-full p-2 hover:bg-glass" aria-label="Rewards">
              <Gift className="h-5 w-5" />
            </Link>
            <Link to="/app/notifications" className="rounded-full p-2 hover:bg-glass relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
            </Link>
            <Link to="/app/wallet">
              <CoinBadge amount={user?.coins ?? 0} />
            </Link>
            <button
              onClick={() => { logout(); navigate({ to: "/" }); }}
              className="rounded-full p-2 hover:bg-glass text-muted-foreground"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 glass-strong rounded-full px-2 py-2 shadow-card">
        <div className="flex items-center gap-1">
          {customerNav.map((item) => {
            const active = item.to === "/app" ? path === "/app" : path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-full px-4 py-2 text-xs font-medium transition-colors",
                  active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <motion.div
                    layoutId="customer-nav-pill"
                    className="absolute inset-0 rounded-full bg-gradient-primary shadow-glow"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <item.icon className="relative h-5 w-5" />
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
