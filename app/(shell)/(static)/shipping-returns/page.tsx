import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Returns | Meridian",
};

export default function ShippingReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold mb-2">Shipping &amp; Returns</h1>
      <p className="text-muted-foreground mb-8">
        What to expect once you place an order, and how to send something
        back if it doesn&apos;t work out.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Shipping</h2>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Meridian currently ships to addresses within India only. We use
          flat-rate shipping on every order rather than calculating rates by
          carrier, so the cost at checkout is always predictable.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Shipping is free on orders totaling ₹4,500 or more. Orders under
          ₹4,500 ship for a flat rate of ₹549, regardless of size or weight.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Most orders arrive within 3–7 business days of being placed. You&apos;ll
          receive a confirmation email with tracking information as soon as
          your order ships, and you can also check order status any time from
          your account.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Delivery estimates are business days and don&apos;t include
          weekends or major holidays. Orders placed on weekends or holidays
          are processed the next business day.
        </p>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-2">Returns</h2>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          If something isn&apos;t right, you can return most items within 30
          days of delivery. To be eligible, items must be unused, in their
          original condition, and returned in their original packaging.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          To start a return, contact our support team with your order number
          and the item you&apos;d like to return. We&apos;ll provide
          instructions for sending it back.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Once your return is received and inspected, we&apos;ll issue a
          refund to your original payment method. Refunds are typically
          processed within 5–10 business days, though it may take a few
          additional days for your bank or card issuer to post the credit.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A small number of items — such as perishable goods, gift cards, and
          personal care products that have been opened — are not eligible for
          return. Any such exceptions will be noted on the product page.
        </p>
      </div>
    </div>
  );
}
