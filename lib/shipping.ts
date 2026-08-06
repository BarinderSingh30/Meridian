// Flat-rate shipping, matching the copy on /shipping-returns and /faq:
// free above ₹4,500, otherwise a flat ₹549 fee. No carrier-rate integration (YAGNI).
const FREE_SHIPPING_THRESHOLD_CENTS = 450000;
const FLAT_SHIPPING_FEE_CENTS = 54900;

// Fixed delivery-speed tiers (no admin-configurable shipping methods - YAGNI
// per spec decision). Express adds a flat surcharge on top of the standard
// flat-rate/free-above-threshold calculation below.
export const SHIPPING_METHODS = {
  standard: { label: "Standard", days: "4-6 business days", surchargeCents: 0 },
  express: { label: "Express", days: "1-2 business days", surchargeCents: 19900 },
} as const;

export type ShippingMethod = keyof typeof SHIPPING_METHODS;

export function calculateShippingCents(subtotalCents: number, method: ShippingMethod = "standard"): number {
  const base = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_FEE_CENTS;
  return base + SHIPPING_METHODS[method].surchargeCents;
}
