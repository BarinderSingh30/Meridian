import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ | Meridian",
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold mb-2">Frequently Asked Questions</h1>
      <p className="text-muted-foreground mb-8">
        Answers to the questions we hear most often. Can&apos;t find what
        you&apos;re looking for?{" "}
        <Link
          href="/contact"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Contact us
        </Link>
        .
      </p>

      <div className="space-y-6">
        <div className="space-y-1">
          <h3 className="font-medium">How do I track my order?</h3>
          <p className="text-sm text-muted-foreground">
            Once your order ships, you&apos;ll receive a confirmation email
            with a tracking number. You can also find the status and tracking
            details of any order from the Orders section of your account.
          </p>
        </div>

        <div className="space-y-1">
          <h3 className="font-medium">What is your return policy?</h3>
          <p className="text-sm text-muted-foreground">
            Most items can be returned within 30 days of delivery, provided
            they&apos;re unused and in their original packaging. Visit our{" "}
            <Link
              href="/shipping-returns"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Shipping &amp; Returns
            </Link>{" "}
            page for the full policy.
          </p>
        </div>

        <div className="space-y-1">
          <h3 className="font-medium">What payment methods do you accept?</h3>
          <p className="text-sm text-muted-foreground">
            We accept all major credit and debit cards, including Visa,
            Mastercard, American Express, and Discover, processed securely at
            checkout.
          </p>
        </div>

        <div className="space-y-1">
          <h3 className="font-medium">How long does shipping take, and what does it cost?</h3>
          <p className="text-sm text-muted-foreground">
            Orders typically arrive within 3–7 business days. Shipping is
            free on orders over $50; otherwise a flat rate of $5.99 applies.
            We currently ship within the United States only.
          </p>
        </div>

        <div className="space-y-1">
          <h3 className="font-medium">How do I create an account?</h3>
          <p className="text-sm text-muted-foreground">
            Click &quot;Sign In&quot; at the top of any page and choose the
            sign-up option. You can create an account with your email
            address, and you&apos;ll be able to save addresses, track orders,
            and check out faster next time.
          </p>
        </div>

        <div className="space-y-1">
          <h3 className="font-medium">How can I contact customer support?</h3>
          <p className="text-sm text-muted-foreground">
            Our support team is available by email at support@meridian.example
            or by phone Monday–Friday, 9:00 AM–6:00 PM Eastern. Visit the{" "}
            <Link
              href="/contact"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Contact page
            </Link>{" "}
            for full details.
          </p>
        </div>

        <div className="space-y-1">
          <h3 className="font-medium">Can I change or cancel an order after placing it?</h3>
          <p className="text-sm text-muted-foreground">
            If your order hasn&apos;t shipped yet, contact support as soon as
            possible and we&apos;ll do our best to update or cancel it. Once
            an order has shipped, it can no longer be changed, but you&apos;re
            welcome to return it after delivery.
          </p>
        </div>

        <div className="space-y-1">
          <h3 className="font-medium">An item I want is out of stock. Will it come back?</h3>
          <p className="text-sm text-muted-foreground">
            Availability is shown on each product page in real time. Many
            out-of-stock items are restocked, though timing varies by
            product. We recommend checking back periodically or reaching out
            to support for restock information.
          </p>
        </div>
      </div>
    </div>
  );
}
