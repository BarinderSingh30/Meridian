import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen">
      <AdminNav name={session.user.name ?? session.user.email ?? "Admin"} />
      <div className="flex-1 bg-canvas p-6">{children}</div>
    </div>
  );
}
