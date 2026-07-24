import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { ProtectedRoute } from "@/components/protected-route";

export const Route = createFileRoute("/admin")({
  component: () => (
    <ProtectedRoute role="admin">
      <AdminLayout><Outlet /></AdminLayout>
    </ProtectedRoute>
  ),
});
