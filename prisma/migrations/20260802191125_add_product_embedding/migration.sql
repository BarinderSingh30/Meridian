-- AlterTable
ALTER TABLE "Product" ADD COLUMN "embedding" vector(768);

-- CreateIndex
CREATE INDEX "Product_embedding_idx" ON "Product" USING hnsw ("embedding" vector_cosine_ops);
