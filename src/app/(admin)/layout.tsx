import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  try {
    const { user } = await requireAdmin();
    const displayName =
      "displayName" in user ? user.displayName : (user.user_metadata?.display_name as string | undefined) ?? "Admin";
    const email = user.email ?? "admin@munch.local";

    return (
      <AdminShell
        user={{
          displayName,
          email,
        }}
      >
        {children}
      </AdminShell>
    );
  } catch {
    redirect("/");
  }
}
