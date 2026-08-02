import { redirect } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { getAddresses } from "@/lib/addresses";
import { calculateShippingCents } from "@/lib/shipping";
import { placeOrderAction } from "@/lib/actions/checkout-actions";
import { formatMoney } from "@/lib/money";
import { AddressForm } from "@/components/address-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Checkout",
};

type SearchParamsType = Promise<{ error?: string }>;

export default async function CheckoutPage({ searchParams }: { searchParams: SearchParamsType }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const [cart, addresses, sp] = await Promise.all([getCart(), getAddresses(session.user.id), searchParams]);
  if (!cart || cart.items.length === 0) redirect("/cart");

  const stockIssues = cart.items.filter(
    (item) => item.product.status !== "ACTIVE" || item.quantity > item.product.stockQuantity
  );

  const subtotalCents = cart.items.reduce((sum, item) => sum + item.quantity * item.product.priceCents, 0);
  const shippingCents = calculateShippingCents(subtotalCents);
  const totalCents = subtotalCents + shippingCents;

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Checkout</h1>

      {sp.error === "stock" && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Some items in your cart are no longer available in the requested quantity. Review your cart before
          continuing.
        </p>
      )}
      {sp.error === "address" && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Choose a shipping address to continue.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-semibold">Shipping address</h2>

            {addresses.length === 0 ? (
              <AddressForm />
            ) : (
              <form action={placeOrderAction} id="checkout-form" className="space-y-2">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 text-sm has-checked:border-foreground"
                  >
                    <input
                      type="radio"
                      name="addressId"
                      value={address.id}
                      defaultChecked={address.id === defaultAddress?.id}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-medium">{address.fullName}</span>
                      <br />
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                      <br />
                      {address.city}
                      {address.state ? `, ${address.state}` : ""} {address.postalCode}, {address.country}
                      {address.phone && (
                        <>
                          <br />
                          {address.phone}
                        </>
                      )}
                    </span>
                  </label>
                ))}
              </form>
            )}

            <a href="/account/addresses" className="mt-3 inline-block text-sm underline underline-offset-4">
              Manage addresses
            </a>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Order items</h2>
            <ul className="divide-y divide-border">
              {cart.items.map((item) => {
                const image = item.product.images[0];
                const issue =
                  item.product.status !== "ACTIVE"
                    ? "No longer available"
                    : item.quantity > item.product.stockQuantity
                      ? `Only ${item.product.stockQuantity} left in stock`
                      : null;

                return (
                  <li key={item.id} className="flex items-center gap-4 py-4">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {image && (
                        <Image src={image.url} alt={image.altText ?? item.product.name} fill sizes="64px" className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1 text-sm">
                      <p>{item.product.name}</p>
                      <p className="text-muted-foreground">Qty {item.quantity}</p>
                      {issue && <p className="text-destructive">{issue}</p>}
                    </div>
                    <p className="text-sm font-medium">{formatMoney(item.quantity * item.product.priceCents)}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="h-fit space-y-4 rounded-lg border border-border p-5">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMoney(subtotalCents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{shippingCents === 0 ? "Free" : formatMoney(shippingCents)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2 font-medium">
              <span>Total</span>
              <span>{formatMoney(totalCents)}</span>
            </div>
          </div>

          <Button
            type="submit"
            form="checkout-form"
            className="w-full"
            disabled={addresses.length === 0 || stockIssues.length > 0}
          >
            Place order
          </Button>
          {stockIssues.length > 0 && (
            <p className="text-xs text-destructive">Resolve the stock issues above before placing your order.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
