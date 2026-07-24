import { createFileRoute } from "@tanstack/react-router";
import { AdminUserTable } from "@/components/admin-shared";

export const Route = createFileRoute("/admin/customers")({ 
  component: () => <AdminUserTable title="Customers" subtitle="Manage customer accounts" showBan role="customer" /> 
});