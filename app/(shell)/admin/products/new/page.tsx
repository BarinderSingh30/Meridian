import type { Metadata } from "next";
import { getAllCategoriesFlat } from "@/lib/categories/queries";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = {
  title: "New Product",
};

export default async function NewProductPage() {
  const categories = await getAllCategoriesFlat();

  return (
    <div>
      <h1 className="text-2xl font-semibold">New product</h1>
      <div className="mt-6">
        <ProductForm categories={categories} existing={null} />
      </div>
    </div>
  );
}
