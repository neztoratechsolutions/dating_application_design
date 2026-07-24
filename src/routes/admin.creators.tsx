import { createFileRoute } from "@tanstack/react-router";
import { AdminUserTable } from "@/components/admin-shared";

export const Route = createFileRoute("/admin/creators")({ 
  component: () => <AdminUserTable title="Creators" subtitle="Manage creator accounts" showBan role="creator" /> 
});