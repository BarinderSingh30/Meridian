import NextAuth from "next-auth";
import { cookies } from "next/headers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import authConfig from "@/lib/auth.config";
import { CART_COOKIE_NAME } from "@/lib/cart";
import type { Role } from "@/lib/generated/prisma/enums";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id) return;

      const cookieStore = await cookies();
      const guestToken = cookieStore.get(CART_COOKIE_NAME)?.value;
      if (!guestToken) return;

      const guestCart = await prisma.cart.findUnique({
        where: { token: guestToken },
        include: { items: true },
      });
      if (!guestCart || guestCart.userId) return;

      await prisma.$transaction(async (tx) => {
        const userCart = await tx.cart.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id },
        });
        if (guestCart.couponCode && !userCart.couponCode) {
          await tx.cart.update({ where: { id: userCart.id }, data: { couponCode: guestCart.couponCode } });
        }
        for (const item of guestCart.items) {
          await tx.cartItem.upsert({
            where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
            update: { quantity: { increment: item.quantity } },
            create: { cartId: userCart.id, productId: item.productId, quantity: item.quantity },
          });
        }
        await tx.cart.delete({ where: { id: guestCart.id } });
      });

      cookieStore.delete(CART_COOKIE_NAME);
    },
  },
});

export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Forbidden: admin access required");
  }
  return session;
}
