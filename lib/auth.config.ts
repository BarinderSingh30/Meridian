import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export default {
  providers: [
    Google,
    Resend({ from: env.EMAIL_FROM }),
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const isDemoCustomer = email === env.DEMO_CUSTOMER_EMAIL && password === env.DEMO_CUSTOMER_PASSWORD;
        const isDemoAdmin = email === env.DEMO_ADMIN_EMAIL && password === env.DEMO_ADMIN_PASSWORD;
        if (!isDemoCustomer && !isDemoAdmin) return null;

        // Demo accounts are matched by env-var credentials, not a stored password hash —
        // the seeded row (with its real id/role) is what becomes the session user.
        return prisma.user.findUnique({ where: { email } });
      },
    }),
  ],
  pages: {
    signIn: "/signin",
    verifyRequest: "/verify-request",
    error: "/auth-error",
  },
} satisfies NextAuthConfig;
