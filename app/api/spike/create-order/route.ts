import { razorpay } from "@/lib/razorpay";

export async function POST() {
  const order = await razorpay.orders.create({
    amount: 5000, // ₹50.00, in paise
    currency: "INR",
    receipt: `spike-${Date.now()}`,
  });

  return Response.json({ orderId: order.id, amount: order.amount, currency: order.currency });
}
