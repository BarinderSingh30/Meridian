import Link from "next/link";
import type { Metadata } from "next";
import { getAdminCustomers } from "@/lib/admin/customers";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Admin Customers",
};

export default async function AdminCustomersPage() {
  const customers = await getAdminCustomers();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Customers</h1>
      <p className="mt-1 text-sm text-muted-foreground">{customers.length} customers</p>

      <div className="mt-4 divide-y divide-border rounded-lg border border-border">
        {customers.map((customer) => (
          <Link
            key={customer.id}
            href={`/admin/customers/${customer.id}`}
            className="flex items-center justify-between gap-4 p-3 text-sm hover:bg-muted"
          >
            <div>
              <p className="font-medium">{customer.name ?? "Unnamed"}</p>
              <p className="text-muted-foreground">{customer.email}</p>
            </div>
            <p className="text-muted-foreground">
              {customer.orderCount} order{customer.orderCount === 1 ? "" : "s"}
            </p>
            <p className="font-medium">{formatMoney(customer.lifetimeSpendCents)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
