"use server";

import { prisma } from "@/lib/db";
import { sendNotifyMeConfirmationEmail } from "@/lib/email/notify-me";

export type NotifyMeResult = { success: true } | { success: false; error: string };

export async function notifyMeAction(productId: string, email: string): Promise<NotifyMeResult> {
  if (!productId || !email) return { success: false, error: "Missing product or email." };

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } });
  if (!product) return { success: false, error: "Product not found." };

  await prisma.stockNotification.create({ data: { productId, email } });
  await sendNotifyMeConfirmationEmail(email, product.name);

  return { success: true };
}
