import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/reviews", label: "Reviews" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[180px_1fr]">
        <aside>
          <p className="mb-4 text-sm font-medium">Admin</p>
          <nav className="space-y-1 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-lg px-2 py-1.5 hover:bg-muted">
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
