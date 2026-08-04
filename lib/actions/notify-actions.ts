"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendNotifyMeConfirmationEmail } from "@/lib/email/notify-me";

export type NotifyMeResult = { success: true } | { success: false; error: string };

export async function notifyMeAction(productId: string, email: string): Promise<NotifyMeResult> {
  if (!productId || !email) return { success: false, error: "Missing product or email." };

  const parsed = z.email().safeParse(email);
  if (!parsed.success) return { success: false, error: "Enter a valid email address." };
  const parsedEmail = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } });
  if (!product) return { success: false, error: "Product not found." };

  const { count } = await prisma.stockNotification.createMany({
    data: { productId, email: parsedEmail },
    skipDuplicates: true,
  });

  // Already subscribed — don't re-send the confirmation email.
  if (count === 0) return { success: true };

  // Email is non-critical; a failure here shouldn't reject the signup already in the DB
  await sendNotifyMeConfirmationEmail(parsedEmail, product.name).catch((err) => {
    console.error(`[notify-me] failed to send confirmation email to ${parsedEmail}:`, err);
  });

  return { success: true };
}
