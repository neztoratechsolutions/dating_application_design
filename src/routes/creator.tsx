import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CreatorLayout } from "@/components/layouts/creator-layout";
import { ProtectedRoute } from "@/components/protected-route";

export const Route = createFileRoute("/creator")({
  component: () => (
    <ProtectedRoute role="creator">
      <CreatorLayout><Outlet /></CreatorLayout>
    </ProtectedRoute>
  ),
});
