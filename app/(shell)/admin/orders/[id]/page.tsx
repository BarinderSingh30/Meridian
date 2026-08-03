import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getAdminOrderById } from "@/lib/admin/orders";
import { formatMoney } from "@/lib/money";
import { fulfillOrderAction, cancelOrderAction, markRefundedAction } from "@/lib/actions/admin/order-actions";
import { Button } from "@/components/ui/button";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const order = await getAdminOrderById(id);
  return { title: order ? `Order ${order.orderNumber}` : "Order not found" };
}

export default async function AdminOrderDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const order = await getAdminOrderById(id);
  if (!order) notFound();

  return (
    <div>
      <Link href="/admin/orders" className="text-sm underline underline-offset-4">
        &larr; Back to orders
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{order.status}</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {order.user ? `${order.user.name ?? order.user.email} · ` : ""}
        {order.email}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Placed {new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(order.createdAt)}
        {order.paidAt && <> · Paid {new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(order.paidAt)}</>}
      </p>
      {order.razorpayOrderId && (
        <p className="mt-1 text-xs text-muted-foreground">
          Razorpay order: {order.razorpayOrderId}
          {order.razorpayPaymentId && <> · payment: {order.razorpayPaymentId}</>}
        </p>
      )}

      <ul className="mt-6 divide-y divide-border rounded-lg border border-border">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between p-3 text-sm">
            <span>
              {item.productName} &times; {item.quantity}
            </span>
            <span>{formatMoney(item.lineTotalCents)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 max-w-xs space-y-1 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatMoney(order.subtotalCents)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span>{order.shippingCents === 0 ? "Free" : formatMoney(order.shippingCents)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-1 font-medium">
          <span>Total</span>
          <span>{formatMoney(order.totalCents)}</span>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border p-4 text-sm">
        <p className="font-medium">Shipping to</p>
        <p className="mt-1 text-muted-foreground">
          {order.shipName}
          <br />
          {order.shipLine1}
          {order.shipLine2 ? `, ${order.shipLine2}` : ""}
          <br />
          {order.shipCity}
          {order.shipState ? `, ${order.shipState}` : ""} {order.shipPostalCode}, {order.shipCountry}
        </p>
        {order.trackingNumber && <p className="mt-2">Tracking: {order.trackingNumber}</p>}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {order.status === "PAID" && (
          <form action={fulfillOrderAction} className="flex items-center gap-2">
            <input type="hidden" name="id" value={order.id} />
            <input
              type="text"
              name="trackingNumber"
              placeholder="Tracking number (optional)"
              className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button type="submit" size="sm">
              Mark fulfilled
            </Button>
          </form>
        )}

        {(order.status === "PENDING" || order.status === "PAID") && (
          <form action={cancelOrderAction}>
            <input type="hidden" name="id" value={order.id} />
            <Button type="submit" variant="ghost" size="sm">
              Cancel order
            </Button>
          </form>
        )}

        {(order.status === "PAID" || order.status === "FULFILLED") && (
          <form action={markRefundedAction}>
            <input type="hidden" name="id" value={order.id} />
            <Button type="submit" variant="ghost" size="sm">
              Mark refunded
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
