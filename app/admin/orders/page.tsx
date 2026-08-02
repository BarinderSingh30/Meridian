import Link from "next/link";
import type { Metadata } from "next";
import { getAdminOrders } from "@/lib/admin/orders";
import { formatMoney } from "@/lib/money";
import { Pagination } from "@/components/pagination";

export const metadata: Metadata = {
  title: "Admin Orders",
};

const STATUSES = ["", "PENDING", "PAID", "FULFILLED", "CANCELLED", "REFUNDED"];

type SearchParamsType = Promise<{ status?: string; page?: string }>;

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParamsType }) {
  const sp = await searchParams;
  const page = sp.page ? Math.max(1, Number(sp.page) || 1) : 1;
  const results = await getAdminOrders({ status: sp.status, page });

  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { status: sp.status, page: sp.page, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Orders</h1>

      <div className="mt-4 flex gap-1 text-sm">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={buildHref({ status: s || undefined, page: undefined })}
            className={`rounded-full px-3 py-1 ${(sp.status ?? "") === s ? "bg-foreground text-background" : "hover:bg-muted"}`}
          >
            {s || "All"}
          </Link>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{results.total} orders</p>

      <div className="mt-2 divide-y divide-border rounded-lg border border-border">
        {results.orders.map((order) => (
          <Link
            key={order.id}
            href={`/admin/orders/${order.id}`}
            className="flex items-center justify-between gap-4 p-3 text-sm hover:bg-muted"
          >
            <div>
              <p className="font-medium">{order.orderNumber}</p>
              <p className="text-muted-foreground">{order.email}</p>
            </div>
            <p className="text-muted-foreground">
              {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(order.createdAt)}
            </p>
            <p className="font-medium">{formatMoney(order.totalCents)}</p>
            <span className="w-24 text-right text-xs text-muted-foreground">{order.status}</span>
          </Link>
        ))}
      </div>

      <Pagination
        page={results.page}
        totalPages={results.totalPages}
        buildHref={(p) => buildHref({ page: p === 1 ? undefined : String(p) })}
      />
    </div>
  );
}
