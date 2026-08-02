import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Order received",
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Order received</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Order <span className="font-medium text-foreground">{order.orderNumber}</span> has been created and is
        awaiting payment. Total: {formatMoney(order.totalCents)}.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">Payment integration is coming in the next step.</p>
    </div>
  );
}
