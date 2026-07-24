import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CustomerLayout } from "@/components/layouts/customer-layout";
import { ProtectedRoute } from "@/components/protected-route";

export const Route = createFileRoute("/app")({
  component: () => (
    <ProtectedRoute role="customer">
      <CustomerLayout><Outlet /></CustomerLayout>
    </ProtectedRoute>
  ),
});
