import Link from "next/link";
import { auth } from "@/lib/auth";
import { getTopLevelCategories } from "@/lib/categories/queries";
import { signOutAction } from "@/lib/actions/auth-actions";
import { getCart, cartItemCount } from "@/lib/cart";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const [session, categories, cart] = await Promise.all([auth(), getTopLevelCategories(), getCart()]);
  const itemCount = cartItemCount(cart);

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight shrink-0">
          Meridian
        </Link>

        <form action="/search" className="flex-1">
          <input
            type="search"
            name="q"
            placeholder="Search products..."
            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </form>

        <nav className="flex items-center gap-3 shrink-0 text-sm">
          <Link href="/cart" className="hover:text-foreground/80">
            Cart{itemCount > 0 && ` (${itemCount})`}
          </Link>

          {session?.user ? (
            <>
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="hover:text-foreground/80">
                  Admin
                </Link>
              )}
              <Link href="/account" className="hover:text-foreground/80">
                {session.user.name ?? session.user.email}
              </Link>
              <form action={signOutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Link href="/signin">
              <Button type="button" variant="secondary" size="sm">
                Sign in
              </Button>
            </Link>
          )}
        </nav>
      </div>

      {categories.length > 0 && (
        <div className="border-t border-border">
          <nav className="mx-auto flex max-w-6xl items-center gap-4 overflow-x-auto px-4 py-2 text-sm text-muted-foreground">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/c/${category.slug}`}
                className="shrink-0 whitespace-nowrap hover:text-foreground"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
