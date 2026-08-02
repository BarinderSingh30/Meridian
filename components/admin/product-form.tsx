import { createProductAction, updateProductAction } from "@/lib/actions/admin/product-actions";
import { Button } from "@/components/ui/button";

const IMAGE_SLOTS = 5;

export type AdminProductFormData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string | null;
  sku: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  stockQuantity: number;
  status: string;
  categoryId: string;
  images: { url: string }[];
} | null;

export function ProductForm({
  categories,
  existing,
}: {
  categories: { id: string; label: string }[];
  existing: AdminProductFormData;
}) {
  const imageSlots = Array.from({ length: IMAGE_SLOTS }, (_, i) => existing?.images[i]?.url ?? "");

  return (
    <form action={existing ? updateProductAction : createProductAction} className="max-w-xl space-y-4">
      {existing && <input type="hidden" name="id" value={existing.id} />}

      <Field label="Name" name="name" defaultValue={existing?.name} required />
      <Field label="Slug" name="slug" defaultValue={existing?.slug} required />

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Description</span>
        <textarea
          name="description"
          required
          rows={4}
          defaultValue={existing?.description}
          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Brand (optional)" name="brand" defaultValue={existing?.brand ?? ""} />
        <Field label="SKU (optional)" name="sku" defaultValue={existing?.sku ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Price (INR)"
          name="price"
          type="number"
          defaultValue={existing ? (existing.priceCents / 100).toString() : ""}
          required
        />
        <Field
          label="Compare-at price (optional)"
          name="compareAtPrice"
          type="number"
          defaultValue={existing?.compareAtPriceCents ? (existing.compareAtPriceCents / 100).toString() : ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Stock quantity"
          name="stockQuantity"
          type="number"
          defaultValue={existing?.stockQuantity?.toString() ?? "0"}
          required
        />
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Status</span>
          <select
            name="status"
            defaultValue={existing?.status ?? "DRAFT"}
            className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Category</span>
        <select
          name="categoryId"
          defaultValue={existing?.categoryId ?? ""}
          required
          className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="" disabled>
            Select a category
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-2">
        <span className="block text-sm font-medium">Image URLs</span>
        {imageSlots.map((url, i) => (
          <input
            key={i}
            type="url"
            name="imageUrl"
            defaultValue={url}
            placeholder={`Image ${i + 1} URL`}
            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        ))}
      </div>

      <Button type="submit">{existing ? "Save changes" : "Create product"}</Button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        step={type === "number" ? "0.01" : undefined}
        className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </label>
  );
}
