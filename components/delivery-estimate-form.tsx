"use client";

import { useState } from "react";
import { estimateDelivery, type DeliveryEstimate } from "@/lib/delivery-estimate";

export function DeliveryEstimateForm() {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<DeliveryEstimate | null | "invalid">(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const estimate = estimateDelivery(pincode);
    setResult(estimate ?? "invalid");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-border-subtle pt-3">
      <span className="text-xs font-semibold text-ink">Check delivery estimate</span>
      <div className="flex gap-1.5">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
          placeholder="6-digit PIN code"
          className="w-full rounded-[4px] border border-border px-2.5 py-2 text-xs text-ink outline-none placeholder:text-muted-2 focus-visible:border-[1.5px] focus-visible:border-teal"
        />
        <button
          type="submit"
          className="shrink-0 rounded-[4px] border border-border px-3 py-2 text-xs font-semibold text-ink-3 hover:bg-surface-muted"
        >
          Check
        </button>
      </div>
      {result === "invalid" && <p className="text-[11px] font-medium text-danger">Enter a valid 6-digit PIN code.</p>}
      {result && result !== "invalid" && (
        <p className="text-[11px] text-teal-dark">
          Delivery to {result.zone} in {result.minDays}-{result.maxDays} business days.
        </p>
      )}
    </form>
  );
}
