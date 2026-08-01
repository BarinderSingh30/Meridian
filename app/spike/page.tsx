"use client";

import { useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function SpikePage() {
  const [status, setStatus] = useState<string>("idle");

  async function startPayment() {
    setStatus("creating order...");
    const res = await fetch("/api/spike/create-order", { method: "POST" });
    const order = await res.json();

    setStatus("opening checkout...");
    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: "Meridian (spike test)",
      description: "Step 4 deploy/webhook proof — not a real product",
      handler: () => setStatus("payment completed client-side — check webhook logs for server confirmation"),
      modal: { ondismiss: () => setStatus("checkout dismissed") },
      theme: { color: "#000000" },
    });
    rzp.open();
  }

  return (
    <div className="p-8 max-w-md mx-auto space-y-4">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <h1 className="text-xl font-semibold">Razorpay spike — ₹50 test payment</h1>
      <p className="text-sm text-gray-500">
        Throwaway page to prove the order-create → checkout → webhook round-trip. Delete after Step 4.
      </p>
      <button
        onClick={startPayment}
        className="px-4 py-2 bg-black text-white rounded"
      >
        Pay ₹50 (test)
      </button>
      <p className="text-sm">Status: {status}</p>
    </div>
  );
}
