"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function fulfillOrderAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim() || null;
  if (!id) return;

  await prisma.order.updateMany({
    where: { id, status: "PAID" },
    data: { status: "FULFILLED", trackingNumber },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/account/orders");
}

export async function cancelOrderAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.order.updateMany({
    where: { id, status: { in: ["PENDING", "PAID"] } },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/account/orders");
}

// Refunds are recorded manually here (status flip only) rather than calling
// Razorpay's refund API - out of scope per the plan's non-goals (no
// automated refund flow), but the order still needs a status a human can
// look up.
export async function markRefundedAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.order.updateMany({
    where: { id, status: { in: ["PAID", "FULFILLED"] } },
    data: { status: "REFUNDED" },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/account/orders");
}
