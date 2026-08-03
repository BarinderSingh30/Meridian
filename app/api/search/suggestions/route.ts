import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const SUGGESTION_LIMIT = 6;
const MIN_QUERY_LENGTH = 2;

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q")?.trim() ?? "").slice(0, 100);
  if (q.length < MIN_QUERY_LENGTH) {
    return Response.json([]);
  }

  // Escape ILIKE wildcard characters (%, _) and the escape character itself (\)
  // so a literal query like "50%" or "a_b" is matched as a literal substring
  // rather than being interpreted as an ILIKE pattern. This is a correctness
  // fix (not a SQL-injection concern, since we still bind via Prisma.sql
  // parameters) — without it, ordinary search text containing % or _ would
  // silently act as a wildcard instead of matching literally.
  const escapedQ = q.replace(/[\\%_]/g, "\\$&");

  const ranked = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT id FROM "Product"
    WHERE status = 'ACTIVE' AND name ILIKE '%' || ${escapedQ} || '%'
    ORDER BY similarity(name, ${q}) DESC, name ASC
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
