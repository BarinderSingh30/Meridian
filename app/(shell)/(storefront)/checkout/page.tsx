import { redirect } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { getAddresses } from "@/lib/addresses";
import { formatMoney } from "@/lib/money";
import { calculateDiscountCents, validateCoupon } from "@/lib/coupons";
import { AddressForm } from "@/components/address-form";
import { CheckoutOrderSummary } from "@/components/checkout-order-summary";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const [cart, addresses] = await Promise.all([getCart(), getAddresses(session.user.id)]);
  if (!cart || cart.items.length === 0) redirect("/cart");

  const stockIssues = cart.items.filter(
    (item) => item.product.status !== "ACTIVE" || item.quantity > item.product.stockQuantity
  );

  const subtotalCents = cart.items.reduce((sum, item) => sum + item.quantity * item.product.priceCents, 0);

  let discountCents = 0;
  if (cart.couponCode) {
    const validation = await validateCoupon(cart.couponCode);
    if (validation.valid) discountCents = calculateDiscountCents(subtotalCents, validation.coupon);
  }

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];

  return (
    <div className="flex flex-col gap-3 p-3">
      <h1 className="text-xl font-extrabold tracking-tight">Checkout</h1>

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-3">
          <section className="flex flex-col gap-3.5 rounded-[6px] border border-border bg-surface p-[18px]">
            <h2 className="text-base font-bold tracking-tight">Shipping address</h2>

            {addresses.length === 0 ? (
              <AddressForm />
            ) : (
              <form id="checkout-form" className="flex flex-col gap-2">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className="flex cursor-pointer items-start gap-3 rounded-[5px] border border-border p-3.5 text-xs text-ink-2 has-checked:border-[1.5px] has-checked:border-teal has-checked:bg-teal-tint/40"
                  >
                    <input
                      type="radio"
                      name="addressId"
                      value={address.id}
                      defaultChecked={address.id === defaultAddress?.id}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-semibold text-ink">{address.fullName}</span>
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

            <a href="/account/addresses" className="text-xs font-semibold text-teal hover:text-teal-dark">
              Manage addresses
            </a>
          </section>

          <section className="flex flex-col gap-3 rounded-[6px] border border-border bg-surface p-[18px]">
            <h2 className="text-base font-bold tracking-tight">Order items</h2>
            <div className="flex flex-col divide-y divide-border-subtle">
              {cart.items.map((item) => {
                const image = item.product.images[0];
                const issue =
                  item.product.status !== "ACTIVE"
                    ? "No longer available"
                    : item.quantity > item.product.stockQuantity
                      ? `Only ${item.product.stockQuantity} left in stock`
                      : null;

                return (
                  <div key={item.id} className="flex items-center gap-3 py-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-[4px] bg-surface-muted">
                      {image && (
                        <Image src={image.url} alt={image.altText ?? item.product.name} fill sizes="56px" className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-medium text-ink">{item.product.name}</p>
                      <p className="text-ink-3">Qty {item.quantity}</p>
                      {issue && <p className="font-medium text-danger">{issue}</p>}
                    </div>
                    <p className="text-sm font-semibold">{formatMoney(item.quantity * item.product.priceCents)}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-3">
          <CheckoutOrderSummary
            subtotalCents={subtotalCents}
            discountCents={discountCents}
            formId="checkout-form"
            checkoutDisabled={addresses.length === 0 || stockIssues.length > 0}
          />
          {stockIssues.length > 0 && (
            <p className="text-xs font-medium text-danger">Resolve the stock issues above before placing your order.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
