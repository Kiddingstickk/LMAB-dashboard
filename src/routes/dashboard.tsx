import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AdminLayout } from "@/components/cms/AdminLayout";
import { getSession } from "@/lib/cms/auth";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  beforeLoad: async () => {
  if (!(await getSession())) {
    throw redirect({ to: "/login" });
  }
},
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
});
