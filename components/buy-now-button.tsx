"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/lib/actions/cart-actions";
import { Button } from "@/components/ui/button";

export function BuyNowButton({ productId, disabled }: { productId: string; disabled: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const formData = new FormData();
    formData.set("productId", productId);
    await addToCartAction(formData);
    router.push("/checkout");
  }

  return (
    <Button type="button" variant="dark" disabled={disabled || pending} onClick={handleClick} className="w-full">
      {pending ? "Adding..." : "Buy now"}
    </Button>
  );
}
