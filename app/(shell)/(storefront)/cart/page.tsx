import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getCart } from "@/lib/cart";
import { updateCartItemAction, removeCartItemAction } from "@/lib/actions/cart-actions";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Cart",
};

export default async function CartPage() {
  const cart = await getCart();
  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Browse the catalog and add something you like.</p>
        <Link href="/" className="mt-6 inline-block">
          <Button type="button">Continue shopping</Button>
        </Link>
      </div>
    );
  }

  const subtotalCents = items.reduce((sum, item) => sum + item.quantity * item.product.priceCents, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Your Cart</h1>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_280px]">
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const image = item.product.images[0];
            const outOfStock = item.product.stockQuantity <= 0;
            const overStock = item.quantity > item.product.stockQuantity;

            return (
              <li key={item.id} className="flex gap-4 py-6">
                <Link href={`/p/${item.product.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {image && (
                    <Image src={image.url} alt={image.altText ?? item.product.name} fill sizes="96px" className="object-cover" />
                  )}
                </Link>

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link href={`/p/${item.product.slug}`} className="text-sm font-medium hover:underline">
                      {item.product.name}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">{formatMoney(item.product.priceCents)}</p>
                    {outOfStock && <p className="mt-1 text-xs text-destructive">Out of stock - remove to continue</p>}
                    {!outOfStock && overStock && (
                      <p className="mt-1 text-xs text-destructive">Only {item.product.stockQuantity} left in stock</p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <form action={updateCartItemAction} className="flex items-center gap-2">
                      <input type="hidden" name="productId" value={item.productId} />
                      <input
                        type="number"
                        name="quantity"
                        min={1}
                        max={item.product.stockQuantity || undefined}
                        defaultValue={item.quantity}
                        className="w-16 rounded-lg border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                      <Button type="submit" variant="secondary" size="sm">
                        Update
                      </Button>
                    </form>

                    <form action={removeCartItemAction}>
                      <input type="hidden" name="productId" value={item.productId} />
                      <Button type="submit" variant="ghost" size="sm">
                        Remove
                      </Button>
                    </form>
                  </div>
                </div>

                <p className="shrink-0 text-sm font-medium">{formatMoney(item.quantity * item.product.priceCents)}</p>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit rounded-lg border border-border p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatMoney(subtotalCents)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Shipping and taxes calculated at checkout.</p>
          <Link href="/checkout" className="mt-4 block">
            <Button type="button" className="w-full">
              Proceed to checkout
            </Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
