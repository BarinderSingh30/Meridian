"use server";

import { signIn, signOut } from "@/lib/auth";
import { env } from "@/lib/env";

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/" });
}

export async function signInAsDemoCustomer() {
  await signIn("credentials", {
    email: env.DEMO_CUSTOMER_EMAIL,
    password: env.DEMO_CUSTOMER_PASSWORD,
    redirectTo: "/",
  });
}

export async function signInAsDemoAdmin() {
  await signIn("credentials", {
    email: env.DEMO_ADMIN_EMAIL,
    password: env.DEMO_ADMIN_PASSWORD,
    redirectTo: "/",
  });
}
