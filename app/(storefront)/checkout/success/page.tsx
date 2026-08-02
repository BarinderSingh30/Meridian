import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PendingOrderPoller } from "@/components/pending-order-poller";

export const metadata: Metadata = {
  title: "Order confirmation",
};

type SearchParamsType = Promise<{ order?: string }>;

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: SearchParamsType }) {
  const session = await auth();
  const { order: orderNumber } = await searchParams;
  if (!session?.user?.id || !orderNumber) notFound();

  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: session.user.id },
    include: { items: true },
  });
  if (!order) notFound();

  if (order.status === "PENDING") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <PendingOrderPoller />
        <h1 className="text-2xl font-semibold">Finalizing your order...</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Payment received. We&apos;re confirming it with Razorpay - this page will update automatically in a few
          seconds.
        </p>
      </div>
    );
  }

  if (order.status !== "PAID" && order.status !== "FULFILLED") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Payment not completed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Order {order.orderNumber} is currently {order.status.toLowerCase()}. If you completed payment, check{" "}
          <Link href="/account/orders" className="underline underline-offset-4">
            your orders
          </Link>{" "}
          in a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Thank you for your order</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Order <span className="font-medium text-foreground">{order.orderNumber}</span> is confirmed.
        </p>
      </div>

      <ul className="mt-8 divide-y divide-border rounded-lg border border-border">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 p-4">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
              {item.productImageUrl && (
                <Image src={item.productImageUrl} alt={item.productName} fill sizes="56px" className="object-cover" />
              )}
            </div>
            <div className="flex-1 text-sm">
              <p>{item.productName}</p>
              <p className="text-muted-foreground">Qty {item.quantity}</p>
            </div>
            <p className="text-sm font-medium">{formatMoney(item.lineTotalCents)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-1 text-sm">
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
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm underline underline-offset-4">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
