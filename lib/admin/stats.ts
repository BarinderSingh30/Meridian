import { prisma } from "@/lib/db";
import type { OrderStatus } from "@/lib/generated/prisma/enums";

const PAID_STATUSES: OrderStatus[] = ["PAID", "FULFILLED"];

export async function getDashboardStats() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [revenueAgg, lowStock, topProducts, dailyOrders] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: PAID_STATUSES }, createdAt: { gte: thirtyDaysAgo } },
      _sum: { totalCents: true },
      _count: true,
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE", stockQuantity: { lte: 10 } },
      orderBy: { stockQuantity: "asc" },
      take: 8,
      select: { id: true, name: true, slug: true, stockQuantity: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productName"],
      where: { order: { status: { in: PAID_STATUSES } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.order.findMany({
      where: { status: { in: PAID_STATUSES }, createdAt: { gte: thirtyDaysAgo } },
      select: { totalCents: true, createdAt: true },
    }),
  ]);

  const revenueCents = revenueAgg._sum.totalCents ?? 0;
  const orderCount = revenueAgg._count;
  const aovCents = orderCount > 0 ? Math.round(revenueCents / orderCount) : 0;

  const byDay = new Map<string, number>();
  for (const order of dailyOrders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + order.totalCents);
  }
  const revenueByDay = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, cents]) => ({ date, cents }));

  return {
    revenueCents,
    orderCount,
    aovCents,
    lowStock,
    topProducts: topProducts.map((p) => ({ name: p.productName, units: p._sum.quantity ?? 0 })),
    revenueByDay,
  };
}
