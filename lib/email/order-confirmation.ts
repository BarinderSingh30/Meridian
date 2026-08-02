import { resend } from "@/lib/resend";
import { env } from "@/lib/env";
import { formatMoney } from "@/lib/money";

type OrderForEmail = {
  orderNumber: string;
  email: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  shipName: string;
  shipLine1: string;
  shipLine2: string | null;
  shipCity: string;
  shipState: string | null;
  shipPostalCode: string;
  shipCountry: string;
  items: { productName: string; quantity: number; lineTotalCents: number }[];
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendOrderConfirmationEmail(order: OrderForEmail) {
  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;">${escapeHtml(item.productName)} &times; ${item.quantity}</td>
          <td style="padding:8px 0;text-align:right;">${formatMoney(item.lineTotalCents)}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h1 style="font-size:20px;">Thanks for your order</h1>
      <p>Order <strong>${escapeHtml(order.orderNumber)}</strong> is confirmed.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        ${itemsHtml}
        <tr><td style="padding-top:12px;border-top:1px solid #ddd;">Subtotal</td><td style="padding-top:12px;border-top:1px solid #ddd;text-align:right;">${formatMoney(order.subtotalCents)}</td></tr>
        <tr><td>Shipping</td><td style="text-align:right;">${order.shippingCents === 0 ? "Free" : formatMoney(order.shippingCents)}</td></tr>
        <tr><td style="font-weight:bold;">Total</td><td style="text-align:right;font-weight:bold;">${formatMoney(order.totalCents)}</td></tr>
      </table>
      <h2 style="font-size:16px;margin-top:24px;">Shipping to</h2>
      <p>
        ${escapeHtml(order.shipName)}<br/>
        ${escapeHtml(order.shipLine1)}${order.shipLine2 ? `, ${escapeHtml(order.shipLine2)}` : ""}<br/>
        ${escapeHtml(order.shipCity)}${order.shipState ? `, ${escapeHtml(order.shipState)}` : ""} ${escapeHtml(order.shipPostalCode)}, ${escapeHtml(order.shipCountry)}
      </p>
    </div>
  `.trim();

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: order.email,
    subject: `Order ${order.orderNumber} confirmed`,
    html,
  });
}
