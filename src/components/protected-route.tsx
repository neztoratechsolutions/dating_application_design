import { useAuth, type Role } from "@/lib/auth-store";
import { Navigate } from "@tanstack/react-router";

export function ProtectedRoute({
  role,
  children,
}: {
  role?: Role | Role[];
  children: React.ReactNode;
}) {
  const user = useAuth((s) => s.user);
  const hasHydrated = useAuth((s) => s.hasHydrated);

  // Wait for persisted auth to rehydrate (avoids SSR/first-render bounce to /login)
  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(user.role)) {
      const dest = user.role === "creator" ? "/creator" : user.role === "admin" ? "/admin" : "/app";
      return <Navigate to={dest} />;
    }
  }
  return <>{children}</>;
}
