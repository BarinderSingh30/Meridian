import Link from "next/link";
import type { Metadata } from "next";
import { getDashboardStats } from "@/lib/admin/stats";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();
  const maxDayCents = Math.max(1, ...stats.revenueByDay.map((d) => d.cents));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last 30 days</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Revenue</p>
          <p className="mt-1 text-2xl font-semibold">{formatMoney(stats.revenueCents)}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Orders</p>
          <p className="mt-1 text-2xl font-semibold">{stats.orderCount}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Average order value</p>
          <p className="mt-1 text-2xl font-semibold">{formatMoney(stats.aovCents)}</p>
        </div>
      </div>

      {stats.revenueByDay.length > 0 && (
        <div className="mt-6 rounded-lg border border-border p-4">
          <p className="mb-3 text-sm font-medium">Revenue by day</p>
          <div className="flex h-32 items-end gap-1">
            {stats.revenueByDay.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${formatMoney(d.cents)}`}
                className="flex-1 rounded-t bg-foreground/80"
                style={{ height: `${Math.max(2, (d.cents / maxDayCents) * 100)}%` }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-medium">Top products by units sold</h2>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {stats.topProducts.map((p) => (
                <li key={p.name} className="flex items-center justify-between p-3 text-sm">
                  <span>{p.name}</span>
                  <span className="text-muted-foreground">{p.units} units</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-medium">Low stock</h2>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing low on stock.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {stats.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between p-3 text-sm">
                  <Link href={`/admin/products/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                  <span className="text-destructive">{p.stockQuantity} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
