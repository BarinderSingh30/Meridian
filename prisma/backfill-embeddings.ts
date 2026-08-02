import "dotenv/config";
import { prisma } from "@/lib/db";
import { buildProductEmbeddingText, generateAndStoreEmbedding } from "@/lib/search/embed";

const DELAY_MS = 250; // stay under Gemini free-tier per-minute rate limits

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const missing = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Product" WHERE embedding IS NULL
  `;
  console.log(`Backfilling embeddings for ${missing.length} product(s)...`);

  for (const { id } of missing) {
    const product = await prisma.product.findUniqueOrThrow({
      where: { id },
      include: { category: { select: { name: true } } },
    });

    const text = buildProductEmbeddingText(product, product.category.name);
    const stored = await generateAndStoreEmbedding(id, text);

    console.log(stored ? `  embedded ${product.slug}` : `  skip ${product.slug}: embedding call failed`);
    await sleep(DELAY_MS);
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
