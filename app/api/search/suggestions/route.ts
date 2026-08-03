import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const SUGGESTION_LIMIT = 6;
const MIN_QUERY_LENGTH = 2;

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < MIN_QUERY_LENGTH) {
    return Response.json([]);
  }

  const ranked = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT id FROM "Product"
    WHERE status = 'ACTIVE' AND similarity(name, ${q}) > 0.05
    ORDER BY similarity(name, ${q}) DESC
    LIMIT ${SUGGESTION_LIMIT}
  `);

  if (ranked.length === 0) {
    return Response.json([]);
  }

  const ids = ranked.map((r) => r.id);
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      slug: true,
      name: true,
      images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
    },
  });

  const byId = new Map(products.map((p) => [p.id, p]));
  const suggestions = ids
    .map((id) => byId.get(id))
    .filter((p): p is (typeof products)[number] => p !== undefined)
    .map((p) => ({ slug: p.slug, name: p.name, imageUrl: p.images[0]?.url ?? null }));

  return Response.json(suggestions);
}
