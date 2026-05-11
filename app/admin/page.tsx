import { redirect } from "next/navigation";
import { requireUser } from "@/backend/auth/session";
import { AdminDashboard } from "@/frontend/features/admin/admin-dashboard";

export default async function AdminPage() {
  try {
    await requireUser(["ADMIN"]);
  } catch {
    redirect("/");
  }

  return <AdminDashboard />;
}
