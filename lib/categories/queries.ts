import { prisma } from "@/lib/db";

export function getTopLevelCategories() {
  return prisma.category.findMany({
    where: { parentId: null },
    orderBy: { position: "asc" },
    select: { id: true, name: true, slug: true, imageUrl: true },
  });
}

export function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      children: { orderBy: { position: "asc" }, select: { id: true, name: true, slug: true, imageUrl: true } },
    },
  });
}

/** Walks the parent chain up to the root, returning root-first order for breadcrumbs. */
export async function getCategoryAncestors(category: { id: string; name: string; slug: string; parentId: string | null }) {
  const ancestors: { name: string; slug: string }[] = [];
  let parentId = category.parentId;
  while (parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: parentId },
      select: { name: true, slug: true, parentId: true },
    });
    if (!parent) break;
    ancestors.unshift({ name: parent.name, slug: parent.slug });
    parentId = parent.parentId;
  }
  return ancestors;
}
