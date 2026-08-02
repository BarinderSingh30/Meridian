// Flat-rate shipping, matching the copy on /shipping-returns and /faq:
// free above ₹4,500, otherwise a flat ₹549 fee. No carrier-rate integration (YAGNI).
const FREE_SHIPPING_THRESHOLD_CENTS = 450000;
const FLAT_SHIPPING_FEE_CENTS = 54900;

export function calculateShippingCents(subtotalCents: number): number {
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_FEE_CENTS;
}
