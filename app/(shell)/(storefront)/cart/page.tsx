import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getCart } from "@/lib/cart";
import { updateCartItemAction, removeCartItemAction, clearCartAction } from "@/lib/actions/cart-actions";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";

export const metadata: Metadata = {
  title: "Cart",
};

export default async function CartPage() {
  const cart = await getCart();
  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md p-3 py-16 text-center">
        <h1 className="text-xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-ink-3">Browse the catalog and add something you like.</p>
        <Link href="/" className="mt-6 inline-block">
          <Button type="button">Continue shopping</Button>
        </Link>
      </div>
    );
  }

  const subtotalCents = items.reduce((sum, item) => sum + item.quantity * item.product.priceCents, 0);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-baseline gap-3">
        <h1 className="text-[22px] font-extrabold tracking-tight">Your cart</h1>
        <span className="text-xs text-ink-3">{items.length} items</span>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-3">
          <div className="rounded-[6px] border border-border bg-surface">
            <div className="grid grid-cols-[1fr_120px_130px_40px] gap-3 border-b border-border-subtle px-4 py-2.5 text-[10px] font-bold tracking-[0.08em] text-ink-3">
              <span>PRODUCT</span>
              <span className="text-center">QUANTITY</span>
              <span className="text-right">SUBTOTAL</span>
              <span />
            </div>

            {items.map((item) => {
              const image = item.product.images[0];
              const outOfStock = item.product.stockQuantity <= 0;
              const overStock = item.quantity > item.product.stockQuantity;

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_120px_130px_40px] items-center gap-3 border-b border-border-subtle px-4 py-3.5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/p/${item.product.slug}`}
                      className="relative size-[68px] shrink-0 overflow-hidden rounded-[4px] bg-surface-muted"
                    >
                      {image && (
                        <Image src={image.url} alt={image.altText ?? item.product.name} fill sizes="68px" className="object-cover" />
                      )}
                    </Link>
                    <div className="flex flex-col gap-1">
                      <Link href={`/p/${item.product.slug}`} className="text-[13px] font-semibold hover:text-teal">
                        {item.product.name}
                      </Link>
                      {outOfStock && (
                        <span className="text-[11px] font-medium text-danger">Out of stock - remove to continue</span>
                      )}
                      {!outOfStock && overStock && (
                        <span className="text-[11px] font-medium text-danger">Only {item.product.stockQuantity} left in stock</span>
                      )}
                      {!outOfStock && !overStock && <span className="text-[11px] font-medium text-teal-dark">In stock</span>}
                    </div>
                  </div>

                  <form action={updateCartItemAction} className="flex justify-center">
                    <input type="hidden" name="productId" value={item.productId} />
                    <QuantityStepper
                      name="quantity"
                      defaultValue={item.quantity}
                      min={1}
                      max={item.product.stockQuantity || undefined}
                      autoSubmit
                    />
                  </form>

                  <span className="text-right text-base font-extrabold tracking-tight">
                    {formatMoney(item.quantity * item.product.priceCents)}
                  </span>

                  <form action={removeCartItemAction} className="flex justify-center">
                    <input type="hidden" name="productId" value={item.productId} />
                    <button type="submit" aria-label="Remove item" className="text-sm text-muted-2 hover:text-danger">
                      ✕
                    </button>
                  </form>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between rounded-[6px] border border-border bg-surface px-4 py-3">
            <Link href="/" className="text-xs font-semibold text-teal hover:text-teal-dark">
              ← Continue shopping
            </Link>
            <form action={clearCartAction}>
              <button type="submit" className="text-xs font-semibold text-muted-2 hover:text-danger">
                Clear cart
              </button>
            </form>
          </div>
        </div>

        <aside className="flex flex-col gap-2.5 rounded-[6px] border border-border bg-surface p-4">
          <h2 className="text-sm font-bold tracking-tight">Order summary</h2>
          <div className="flex justify-between text-xs text-ink-3">
            <span>Subtotal ({items.length} items)</span>
            <span className="font-semibold text-ink">{formatMoney(subtotalCents)}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-border-subtle pt-3">
            <span className="text-sm font-bold">Total</span>
            <span className="text-[22px] font-extrabold tracking-tight">{formatMoney(subtotalCents)}</span>
          </div>
          <p className="text-[11px] text-muted-2">Shipping and taxes calculated at checkout.</p>
          <Link href="/checkout" className="mt-1 block">
            <Button type="button" className="w-full">
              Proceed to checkout
            </Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
