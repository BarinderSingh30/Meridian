import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/settings", label: "Settings" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[200px_1fr]">
        <aside>
          <p className="mb-4 text-sm font-medium">{session.user.name ?? session.user.email}</p>
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
