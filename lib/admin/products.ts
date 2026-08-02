import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ProductStatus } from "@/lib/generated/prisma/enums";

const PER_PAGE = 20;

export async function getAdminProducts(params: { q?: string; status?: string; page?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const where: Prisma.ProductWhereInput = {
    ...(params.q ? { name: { contains: params.q, mode: "insensitive" } } : {}),
    ...(params.status ? { status: params.status as ProductStatus } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        slug: true,
        name: true,
        priceCents: true,
        stockQuantity: true,
        status: true,
        category: { select: { name: true } },
        images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, page, perPage: PER_PAGE, totalPages: Math.max(1, Math.ceil(total / PER_PAGE)) };
}

export function getAdminProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } } },
  });
}
