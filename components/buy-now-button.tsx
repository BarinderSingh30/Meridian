"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/lib/actions/cart-actions";
import { Button } from "@/components/ui/button";

export function BuyNowButton({ productId, disabled }: { productId: string; disabled: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("productId", productId);
      await addToCartAction(formData);
      router.push("/checkout");
    } catch (err) {
      setError("Failed to add item to cart. Please try again.");
      setPending(false);
    }
  }

  return (
    <div>
      <Button type="button" variant="dark" disabled={disabled || pending} onClick={handleClick} className="w-full">
        {pending ? "Adding..." : "Buy now"}
      </Button>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
