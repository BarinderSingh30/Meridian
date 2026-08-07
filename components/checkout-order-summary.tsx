"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { calculateShippingCents, SHIPPING_METHODS, type ShippingMethod } from "@/lib/shipping";
import { CheckoutButton } from "@/components/checkout-button";

export function CheckoutOrderSummary({
  subtotalCents,
  discountCents,
  formId,
  checkoutDisabled,
}: {
  subtotalCents: number;
  discountCents: number;
  formId: string;
  checkoutDisabled: boolean;
}) {
  const [method, setMethod] = useState<ShippingMethod>("standard");
  const shippingCents = calculateShippingCents(subtotalCents, method);
  const totalCents = subtotalCents + shippingCents - discountCents;

  return (
    <div className="flex flex-col gap-2.5 rounded-[6px] border border-border bg-surface p-4">
      <h2 className="text-sm font-bold tracking-tight">Order summary</h2>

      <fieldset className="flex flex-col gap-2 border-t border-border-subtle pt-3">
        <legend className="mb-1 text-xs font-bold text-ink">Delivery speed</legend>
        {(Object.keys(SHIPPING_METHODS) as ShippingMethod[]).map((key) => {
          const option = SHIPPING_METHODS[key];
          const cost = calculateShippingCents(subtotalCents, key);
          return (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between gap-2 rounded-[5px] border border-border p-2.5 text-xs has-checked:border-[1.5px] has-checked:border-teal has-checked:bg-teal-tint/40"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  form={formId}
                  name="shippingMethod"
                  value={key}
                  defaultChecked={key === "standard"}
                  onChange={() => setMethod(key)}
                />
                <span>
                  <span className="font-semibold text-ink">{option.label}</span>
                  <br />
                  <span className="text-ink-3">{option.days}</span>
                </span>
              </span>
              <span className="font-semibold text-ink">{cost === 0 ? "Free" : formatMoney(cost)}</span>
            </label>
          );
        })}
      </fieldset>

      <div className="flex flex-col gap-2 border-t border-border-subtle pt-3 text-xs text-ink-3">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold text-ink">{formatMoney(subtotalCents)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="font-semibold text-teal-dark">{shippingCents === 0 ? "Free" : formatMoney(shippingCents)}</span>
        </div>
        {discountCents > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span className="font-semibold text-danger">-{formatMoney(discountCents)}</span>
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between border-t border-border-subtle pt-3">
        <span className="text-sm font-bold">Total</span>
        <span className="text-[22px] font-extrabold tracking-tight">{formatMoney(totalCents)}</span>
      </div>

      <CheckoutButton formId={formId} disabled={checkoutDisabled} />
    </div>
  );
}
