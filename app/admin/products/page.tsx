import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAdminProducts } from "@/lib/admin/products";
import { formatMoney } from "@/lib/money";
import { setProductStatusAction, deleteProductAction } from "@/lib/actions/admin/product-actions";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Admin Products",
};

type SearchParamsType = Promise<{ q?: string; status?: string; page?: string }>;

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParamsType }) {
  const sp = await searchParams;
  const page = sp.page ? Math.max(1, Number(sp.page) || 1) : 1;
  const results = await getAdminProducts({ q: sp.q, status: sp.status, page });

  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { q: sp.q, status: sp.status, page: sp.page, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return `/admin/products${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link href="/admin/products/new">
          <Button type="button">New product</Button>
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <form method="GET" className="flex items-center gap-2">
          <input
            type="search"
            name="q"
            placeholder="Search by name..."
            defaultValue={sp.q}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        <div className="flex gap-1 text-sm">
          {["", "DRAFT", "ACTIVE", "ARCHIVED"].map((s) => (
            <Link
              key={s}
              href={buildHref({ status: s || undefined, page: undefined })}
              className={`rounded-full px-3 py-1 ${(sp.status ?? "") === s ? "bg-foreground text-background" : "hover:bg-muted"}`}
            >
              {s || "All"}
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{results.total} products</p>

      <div className="mt-2 divide-y divide-border rounded-lg border border-border">
        {results.products.map((product) => {
          const image = product.images[0];
          return (
            <div key={product.id} className="flex items-center gap-4 p-3 text-sm">
              <div className="relative size-12 shrink-0 overflow-hidden rounded bg-muted">
                {image && <Image src={image.url} alt={product.name} fill sizes="48px" className="object-cover" />}
              </div>
              <div className="flex-1">
                <Link href={`/admin/products/${product.id}`} className="hover:underline">
                  {product.name}
                </Link>
                <p className="text-muted-foreground">{product.category.name}</p>
              </div>
              <span className="w-24 text-right">{formatMoney(product.priceCents)}</span>
              <span className={`w-16 text-right ${product.stockQuantity <= 10 ? "text-destructive" : ""}`}>
                {product.stockQuantity} left
              </span>
              <span className="w-20 text-xs text-muted-foreground">{product.status}</span>
              <form action={setProductStatusAction}>
                <input type="hidden" name="id" value={product.id} />
                <input
                  type="hidden"
                  name="status"
                  value={product.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED"}
                />
                <Button type="submit" variant="ghost" size="sm">
                  {product.status === "ARCHIVED" ? "Restore" : "Archive"}
                </Button>
              </form>
              {product.status === "ARCHIVED" && (
                <form action={deleteProductAction}>
                  <input type="hidden" name="id" value={product.id} />
                  <Button type="submit" variant="destructive" size="sm">
                    Delete
                  </Button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      <Pagination
        page={results.page}
        totalPages={results.totalPages}
        buildHref={(p) => buildHref({ page: p === 1 ? undefined : String(p) })}
      />
    </div>
  );
}
