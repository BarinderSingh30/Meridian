import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const CART_COOKIE = "cartToken";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const cartInclude = {
  items: {
    orderBy: { id: "asc" as const },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          priceCents: true,
          stockQuantity: true,
          status: true,
          images: { select: { url: true, altText: true }, orderBy: { position: "asc" as const }, take: 1 },
        },
      },
    },
  },
};

export type CartWithItems = NonNullable<Awaited<ReturnType<typeof getCart>>>;

/**
 * Read-only cart lookup, safe to call during Server Component render.
 * Signed-in users are matched by userId; guests by the cartToken cookie.
 * Never creates a cart or writes a cookie - use getOrCreateCart() for that.
 */
export async function getCart() {
  const session = await auth();

  if (session?.user?.id) {
    return prisma.cart.findUnique({ where: { userId: session.user.id }, include: cartInclude });
  }

  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return null;
  return prisma.cart.findUnique({ where: { token }, include: cartInclude });
}

/**
 * Resolves (creating if needed) the current cart. Writes the guest cookie
 * when a new guest cart is created, so this must only be called from a
 * Server Action or Route Handler - never during a page/layout render.
 */
export async function getOrCreateCart() {
  const session = await auth();

  if (session?.user?.id) {
    return prisma.cart.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id },
      include: cartInclude,
    });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE)?.value;
  if (token) {
    const existing = await prisma.cart.findUnique({ where: { token }, include: cartInclude });
    if (existing) return existing;
  }

  const cart = await prisma.cart.create({ data: {}, include: cartInclude });
  cookieStore.set(CART_COOKIE, cart.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
  return cart;
}

export function cartItemCount(cart: { items: { quantity: number }[] } | null) {
  if (!cart) return 0;
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export const CART_COOKIE_NAME = CART_COOKIE;
