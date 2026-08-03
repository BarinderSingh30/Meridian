import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";

const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 768;

// Plenty for a product description or a search query; caps request cost/latency
// and guards against an arbitrarily long `q` from an unauthenticated request.
const MAX_INPUT_CHARS = 2000;

// This is a search-page/admin-save-blocking call — fail fast into the existing
// keyword-only fallback rather than hang on a slow/stuck upstream request.
const EMBEDDING_TIMEOUT_MS = 8000;

let client: GoogleGenAI | null = null;
let warnedMissingKey = false;

function getClient(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return client;
}

export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

/**
 * Never throws. Callers treat `null` as "no embedding available this time"
 * and fall back to keyword-only behavior (product save still succeeds;
 * search still returns ILIKE results) rather than failing the request.
 */
export async function embedText(text: string, taskType: EmbeddingTaskType): Promise<number[] | null> {
  if (!env.GEMINI_API_KEY) {
    if (!warnedMissingKey) {
      console.warn("[embedText] GEMINI_API_KEY is not set — semantic search is disabled, falling back to keyword-only.");
      warnedMissingKey = true;
    }
    return null;
  }
  try {
    const response = await getClient().models.embedContent({
      model: EMBEDDING_MODEL,
      contents: [text.trim().slice(0, MAX_INPUT_CHARS)],
      config: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
        taskType,
        httpOptions: { timeout: EMBEDDING_TIMEOUT_MS },
      },
    });
    const values = response.embeddings?.[0]?.values;
    if (!values || values.length !== EMBEDDING_DIMENSIONS) return null;
    return values;
  } catch (error) {
    console.error("[embedText] Gemini embedding call failed:", error);
    return null;
  }
}

export function buildProductEmbeddingText(
  product: { name: string; brand: string | null; description: string },
  categoryName: string,
): string {
  return `${product.name} — ${product.brand ?? ""} — ${categoryName}. ${product.description}`;
}

/**
 * Embeds `text` and, on success, writes it to Product.embedding via raw SQL
 * (required: `embedding` is an Unsupported/pgvector column, invisible to
 * Prisma Client's typed create/update). No-ops on embedding failure.
 */
export async function generateAndStoreEmbedding(productId: string, text: string): Promise<boolean> {
  const values = await embedText(text, "RETRIEVAL_DOCUMENT");
  if (!values) return false;
  const vectorLiteral = `[${values.join(",")}]`;
  try {
    await prisma.$executeRaw`UPDATE "Product" SET embedding = ${vectorLiteral}::vector WHERE id = ${productId}`;
    return true;
  } catch (error) {
    console.error("[generateAndStoreEmbedding] Failed to store embedding:", error);
    return false;
  }
}
