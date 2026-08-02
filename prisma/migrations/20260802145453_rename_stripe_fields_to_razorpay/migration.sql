-- Rename leftover Stripe-era columns now that payments run through Razorpay.
-- Both columns are still null on every row (no payment has completed yet), so
-- a plain RENAME is safe and preserves the existing unique constraints.
ALTER TABLE "Order" RENAME COLUMN "stripeCheckoutSessionId" TO "razorpayOrderId";
ALTER TABLE "Order" RENAME COLUMN "stripePaymentIntentId" TO "razorpayPaymentId";
ALTER INDEX "Order_stripeCheckoutSessionId_key" RENAME TO "Order_razorpayOrderId_key";
ALTER INDEX "Order_stripePaymentIntentId_key" RENAME TO "Order_razorpayPaymentId_key";

-- Unused field from the original Stripe-based schema; Razorpay's Orders API
-- doesn't need a pre-created customer record.
ALTER TABLE "User" DROP COLUMN "stripeCustomerId";
