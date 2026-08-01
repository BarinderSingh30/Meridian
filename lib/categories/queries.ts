import { prisma } from "@/lib/db";

export function getTopLevelCategories() {
  return prisma.category.findMany({
    where: { parentId: null },
    orderBy: { position: "asc" },
    select: { id: true, name: true, slug: true },
  });
}
