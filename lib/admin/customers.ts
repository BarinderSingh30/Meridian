import { prisma } from "@/lib/db";

export async function getAdminCustomers() {
  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const spend = await prisma.order.groupBy({
    by: ["userId"],
    where: { status: { in: ["PAID", "FULFILLED"] }, userId: { not: null } },
    _sum: { totalCents: true },
    _count: true,
  });
  const byUserId = new Map(spend.map((s) => [s.userId, { orderCount: s._count, totalCents: s._sum.totalCents ?? 0 }]));

  return users.map((u) => ({
    ...u,
    orderCount: byUserId.get(u.id)?.orderCount ?? 0,
    lifetimeSpendCents: byUserId.get(u.id)?.totalCents ?? 0,
  }));
}

export function getAdminCustomerById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      orders: {
        orderBy: { createdAt: "desc" },
        select: { id: true, orderNumber: true, status: true, totalCents: true, createdAt: true },
      },
    },
  });
}
