import { prisma } from "@/lib/db";

export type CouponRecord = { code: string; percentOff: number | null; flatCents: number | null };

export type CouponValidation = { valid: true; coupon: CouponRecord } | { valid: false; error: string };

export async function validateCoupon(code: string): Promise<CouponValidation> {
  const normalized = code.trim().toUpperCase();
  if (normalized.length === 0 || normalized.length > 32) return { valid: false, error: "Invalid coupon code." };
  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });

  if (!coupon) return { valid: false, error: "Invalid coupon code." };
  if (!coupon.active) return { valid: false, error: "This coupon is no longer active." };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, error: "This coupon has expired." };
  if (coupon.maxRedemptions !== null && coupon.timesRedeemed >= coupon.maxRedemptions) {
    return { valid: false, error: "This coupon has reached its redemption limit." };
  }

  return { valid: true, coupon };
}

export function calculateDiscountCents(subtotalCents: number, coupon: CouponRecord): number {
  if (coupon.percentOff) return Math.round(subtotalCents * (coupon.percentOff / 100));
  if (coupon.flatCents) return Math.min(coupon.flatCents, subtotalCents);
  return 0;
}
