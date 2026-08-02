"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildProductEmbeddingText, generateAndStoreEmbedding } from "@/lib/search/embed";

function readProductFields(formData: FormData) {
  const priceRupees = Number(formData.get("price"));
  const compareAtRupees = formData.get("compareAtPrice") ? Number(formData.get("compareAtPrice")) : null;

  return {
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    brand: String(formData.get("brand") ?? "").trim() || null,
    sku: String(formData.get("sku") ?? "").trim() || null,
    priceCents: Math.round(priceRupees * 100),
    compareAtPriceCents: compareAtRupees ? Math.round(compareAtRupees * 100) : null,
    stockQuantity: Math.max(0, Math.round(Number(formData.get("stockQuantity")) || 0)),
    status: String(formData.get("status") ?? "DRAFT") as "DRAFT" | "ACTIVE" | "ARCHIVED",
    categoryId: String(formData.get("categoryId") ?? ""),
  };
}

function readImageUrls(formData: FormData) {
  return formData
    .getAll("imageUrl")
    .map((v) => String(v).trim())
    .filter(Boolean);
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();

  const fields = readProductFields(formData);
  if (!fields.name || !fields.slug || !fields.description || !fields.categoryId || !fields.priceCents) return;

  const imageUrls = readImageUrls(formData);

  const product = await prisma.product.create({
    data: {
      ...fields,
      images: { create: imageUrls.map((url, i) => ({ url, position: i })) },
    },
    include: { category: { select: { name: true } } },
  });

  await generateAndStoreEmbedding(product.id, buildProductEmbeddingText(fields, product.category.name));

  revalidatePath("/admin/products");
  redirect(`/admin/products/${product.id}`);
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const fields = readProductFields(formData);
  if (!fields.name || !fields.slug || !fields.description || !fields.categoryId || !fields.priceCents) return;

  const imageUrls = readImageUrls(formData);

  const [updated] = await prisma.$transaction([
    prisma.product.update({
      where: { id },
      data: fields,
      include: { category: { select: { name: true } } },
    }),
    prisma.productImage.deleteMany({ where: { productId: id } }),
    prisma.productImage.createMany({
      data: imageUrls.map((url, i) => ({ productId: id, url, position: i })),
    }),
  ]);

  await generateAndStoreEmbedding(id, buildProductEmbeddingText(fields, updated.category.name));

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath(`/p/${fields.slug}`);
}

export async function setProductStatusAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["DRAFT", "ACTIVE", "ARCHIVED"].includes(status)) return;

  await prisma.product.update({ where: { id }, data: { status: status as "DRAFT" | "ACTIVE" | "ARCHIVED" } });

  revalidatePath("/admin/products");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Only an already-archived product can be hard-deleted, so this is always
  // a second, deliberate step after archiving - not a one-click delete on a
  // live product. Order history survives: OrderItem.product is onDelete: SetNull
  // and every display field on OrderItem is already snapshotted.
  await prisma.product.deleteMany({ where: { id, status: "ARCHIVED" } });

  revalidatePath("/admin/products");
}
