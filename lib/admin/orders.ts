import { prisma } from "@/lib/db";
import type { OrderStatus } from "@/lib/generated/prisma/enums";

const PER_PAGE = 20;

export async function getAdminOrders(params: { status?: string; page?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const where = params.status ? { status: params.status as OrderStatus } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        orderNumber: true,
        email: true,
        status: true,
        totalCents: true,
        createdAt: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, page, perPage: PER_PAGE, totalPages: Math.max(1, Math.ceil(total / PER_PAGE)) };
}

export function getAdminOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { items: true, user: { select: { name: true, email: true } } },
  });
}
