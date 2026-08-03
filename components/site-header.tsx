import Link from "next/link";
import { auth } from "@/lib/auth";
import { getTopLevelCategories } from "@/lib/categories/queries";
import { signOutAction } from "@/lib/actions/auth-actions";
import { getCart, cartItemCount } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { SearchAutocomplete } from "@/components/search-autocomplete";

export async function SiteHeader() {
  const [session, categories, cart] = await Promise.all([auth(), getTopLevelCategories(), getCart()]);
  const itemCount = cartItemCount(cart);

  return (
    <header>
      <div className="flex items-center justify-between gap-4 bg-chrome-top px-6 py-[7px] text-[11px] font-medium tracking-wide text-muted-2">
        <span>FREE DELIVERY OVER ₹499 · SAME-DAY DISPATCH FROM BENGALURU</span>
        <div className="hidden items-center gap-[18px] sm:flex">
          <Link href="/faq" className="hover:text-white">
            Help centre
          </Link>
          <span>Track order</span>
          <span>Sell on Meridian</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 bg-chrome-deep px-6 py-3">
        <Link href="/" className="shrink-0 text-[19px] font-extrabold tracking-tight text-white">
          MERIDIAN
        </Link>

        <SearchAutocomplete />

        <nav className="ml-auto flex flex-wrap items-center gap-[18px] text-xs font-medium text-[#cbd5e1]">
          <Link href="/cart" className="font-bold text-teal-bright hover:text-white">
            Cart{itemCount > 0 && ` (${itemCount})`}
          </Link>

          {session?.user ? (
            <>
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="hover:text-white">
                  Admin
                </Link>
              )}
              <Link href="/account/orders" className="hover:text-white">
                Orders
              </Link>
              <Link href="/account/wishlist" className="hover:text-white">
                Wishlist
              </Link>
              <Link href="/account" className="hover:text-white">
                {session.user.name ?? session.user.email}
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-[5px] border border-[#2f4b55] px-[11px] py-[7px] text-[#cbd5e1] hover:border-teal-bright hover:text-white"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/signin">
              <Button type="button" variant="dark" size="sm" className="border border-[#2f4b55]">
                Sign in
              </Button>
            </Link>
          )}
        </nav>
      </div>

      {categories.length > 0 && (
        <div className="bg-chrome-nav px-6 py-[9px]">
          <nav className="flex items-center gap-[18px] overflow-x-auto text-xs font-medium text-[#cbd5e1]">
            <span className="shrink-0 font-bold text-white">All categories</span>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/c/${category.slug}`}
                className="shrink-0 whitespace-nowrap hover:text-white"
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
