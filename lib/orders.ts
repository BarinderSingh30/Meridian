import { prisma } from "@/lib/db";

export function getOrdersForUser(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalCents: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });
}

export function getOrderForUser(userId: string, orderNumber: string) {
  return prisma.order.findFirst({
    where: { userId, orderNumber },
    include: { items: true },
  });
}
