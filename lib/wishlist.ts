import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Read-only, safe during render. Empty set for guests. */
export async function getWishlistedProductIds(): Promise<Set<string>> {
  const session = await auth();
  if (!session?.user?.id) return new Set();

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    select: { productId: true },
  });
  return new Set(items.map((i) => i.productId));
}

const listItemSelect = {
  id: true,
  slug: true,
  name: true,
  priceCents: true,
  compareAtPriceCents: true,
  stockQuantity: true,
  ratingAvg: true,
  ratingCount: true,
  images: { select: { url: true, altText: true }, orderBy: { position: "asc" as const }, take: 1 },
};

export async function getWishlistedProducts(userId: string) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { product: { select: listItemSelect } },
  });
  return items.map((i) => i.product);
}
