"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { placeOrderAction } from "@/lib/actions/checkout-actions";
import { Button } from "@/components/ui/button";
import type { ShippingMethod } from "@/lib/shipping";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function CheckoutButton({ formId, disabled }: { formId: string; disabled: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    const formData = form ? new FormData(form) : null;
    const addressId = formData ? String(formData.get("addressId") ?? "") : "";
    const shippingMethod = (formData ? String(formData.get("shippingMethod") ?? "standard") : "standard") as ShippingMethod;
    if (!addressId) {
      setError("Choose a shipping address to continue.");
      return;
    }

    setPending(true);
    setError(null);

    const result = await placeOrderAction(addressId, shippingMethod);
    if (!result.success) {
      setError(result.error);
      setPending(false);
      return;
    }

    const razorpay = new window.Razorpay({
      key: result.keyId,
      amount: result.amountPaise,
      currency: "INR",
      order_id: result.razorpayOrderId,
      name: "Meridian",
      description: `Order ${result.orderNumber}`,
      handler: () => {
        router.push(`/checkout/success?order=${result.orderNumber}`);
      },
      modal: {
        ondismiss: () => setPending(false),
      },
      theme: { color: "#000000" },
    });
    razorpay.open();
  }

  return (
    <div>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <Button type="button" onClick={handleClick} disabled={disabled || pending} className="w-full">
        {pending ? "Processing..." : "Place order"}
      </Button>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
