import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getOrderForUser } from "@/lib/orders";
import { formatMoney } from "@/lib/money";

type Params = Promise<{ orderNumber: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order ${orderNumber}` };
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending payment",
  PAID: "Paid",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default async function OrderDetailPage({ params }: { params: Params }) {
  const session = await auth();
  const { orderNumber } = await params;
  const order = await getOrderForUser(session!.user.id, orderNumber);
  if (!order) notFound();

  return (
    <div>
      <Link href="/account/orders" className="text-sm underline underline-offset-4">
        &larr; Back to orders
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Placed {new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(order.createdAt)}
        {order.trackingNumber && <> · Tracking: {order.trackingNumber}</>}
      </p>

      <ul className="mt-6 divide-y divide-border rounded-lg border border-border">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 p-4">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
              {item.productImageUrl && (
                <Image src={item.productImageUrl} alt={item.productName} fill sizes="56px" className="object-cover" />
              )}
            </div>
            <div className="flex-1 text-sm">
              {item.productSlug ? (
                <Link href={`/p/${item.productSlug}`} className="hover:underline">
                  {item.productName}
                </Link>
              ) : (
                <p>{item.productName}</p>
              )}
              <p className="text-muted-foreground">
                Qty {item.quantity} &times; {formatMoney(item.unitPriceCents)}
              </p>
            </div>
            <p className="text-sm font-medium">{formatMoney(item.lineTotalCents)}</p>
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
        <p className="font-medium">Shipped to</p>
        <p className="mt-1 text-muted-foreground">
          {order.shipName}
          <br />
          {order.shipLine1}
          {order.shipLine2 ? `, ${order.shipLine2}` : ""}
          <br />
          {order.shipCity}
          {order.shipState ? `, ${order.shipState}` : ""} {order.shipPostalCode}, {order.shipCountry}
        </p>
      </div>
    </div>
  );
}
