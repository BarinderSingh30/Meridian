import { resend } from "@/lib/resend";
import { env } from "@/lib/env";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendNotifyMeConfirmationEmail(email: string, productName: string) {
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: `We'll let you know when ${productName} is back in stock`,
    html: `<p>Thanks for your interest in <strong>${escapeHtml(productName)}</strong>. We'll email this address as soon as it's back in stock.</p>`,
  });
}
