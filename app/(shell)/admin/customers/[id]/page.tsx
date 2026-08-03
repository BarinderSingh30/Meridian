import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getAdminCustomerById } from "@/lib/admin/customers";
import { formatMoney } from "@/lib/money";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const customer = await getAdminCustomerById(id);
  return { title: customer ? customer.name ?? customer.email : "Customer not found" };
}

export default async function AdminCustomerDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const customer = await getAdminCustomerById(id);
  if (!customer) notFound();

  return (
    <div>
      <Link href="/admin/customers" className="text-sm underline underline-offset-4">
        &larr; Back to customers
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">{customer.name ?? "Unnamed"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{customer.email}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Joined {new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(customer.createdAt)}
      </p>

      <h2 className="mt-6 mb-3 text-sm font-medium">Order history</h2>
      {customer.orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {customer.orders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="flex items-center justify-between gap-4 p-3 text-sm hover:bg-muted"
            >
              <span>{order.orderNumber}</span>
              <span className="text-muted-foreground">
                {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(order.createdAt)}
              </span>
              <span className="font-medium">{formatMoney(order.totalCents)}</span>
              <span className="w-24 text-right text-xs text-muted-foreground">{order.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
