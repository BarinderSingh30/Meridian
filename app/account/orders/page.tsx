import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/orders";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Orders",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending payment",
  PAID: "Paid",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default async function OrdersPage() {
  const session = await auth();
  const orders = await getOrdersForUser(session!.user.id);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Orders</h1>

      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">You haven&apos;t placed any orders yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-lg border border-border">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.orderNumber}`}
                className="flex items-center justify-between gap-4 p-4 text-sm hover:bg-muted"
              >
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-muted-foreground">
                    {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(order.createdAt)} ·{" "}
                    {order._count.items} item{order._count.items === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatMoney(order.totalCents)}</p>
                  <p className="text-muted-foreground">{STATUS_LABEL[order.status] ?? order.status}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
