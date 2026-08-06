"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { applyCouponAction } from "@/lib/actions/cart-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CouponForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    let result;
    try {
      result = await applyCouponAction(code);
    } catch (err) {
      console.error("[coupon-form] applyCoupon failed:", err);
      setPending(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setCode("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <Input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Promo code"
          className="flex-1"
        />
        <Button type="submit" variant="outline" size="sm" disabled={pending || !code.trim()}>
          {pending ? "Applying..." : "Apply"}
        </Button>
      </div>
      {error && <p className="text-[11px] font-medium text-danger">{error}</p>}
    </form>
  );
}
