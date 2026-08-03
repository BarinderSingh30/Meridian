import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAdminProductById } from "@/lib/admin/products";
import { getAllCategoriesFlat } from "@/lib/categories/queries";
import { ProductForm } from "@/components/admin/product-form";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const product = await getAdminProductById(id);
  return { title: product ? `Edit ${product.name}` : "Product not found" };
}

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getAdminProductById(id), getAllCategoriesFlat()]);
  if (!product) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <div className="mt-6">
        <ProductForm categories={categories} existing={product} />
      </div>
    </div>
  );
}
