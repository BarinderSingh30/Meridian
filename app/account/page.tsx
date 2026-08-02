import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/orders";

export const metadata: Metadata = {
  title: "My Account",
};

export default async function AccountPage() {
  const session = await auth();
  const orders = await getOrdersForUser(session!.user.id);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Hi, {session!.user.name ?? session!.user.email}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {orders.length} order{orders.length === 1 ? "" : "s"} placed so far.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/account/orders" className="rounded-lg border border-border p-4 text-sm hover:bg-muted">
          <p className="font-medium">Orders</p>
          <p className="mt-1 text-muted-foreground">Track and review past purchases</p>
        </Link>
        <Link href="/account/addresses" className="rounded-lg border border-border p-4 text-sm hover:bg-muted">
          <p className="font-medium">Addresses</p>
          <p className="mt-1 text-muted-foreground">Manage your shipping address book</p>
        </Link>
        <Link href="/account/wishlist" className="rounded-lg border border-border p-4 text-sm hover:bg-muted">
          <p className="font-medium">Wishlist</p>
          <p className="mt-1 text-muted-foreground">Products you&apos;ve saved for later</p>
        </Link>
      </div>
    </div>
  );
}
