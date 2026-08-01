import Razorpay from "razorpay";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text(); // raw string — signature is computed over this exact body
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const isValid = Razorpay.validateWebhookSignature(body, signature, env.RAZORPAY_WEBHOOK_SECRET);
  if (!isValid) {
    return new Response("Bad signature", { status: 400 });
  }

  const event = JSON.parse(body);
  console.log("[razorpay webhook] verified event:", event.event, JSON.stringify(event.payload));

  return new Response("ok", { status: 200 });
}
