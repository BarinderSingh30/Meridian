import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact | Meridian",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold mb-2">Contact Us</h1>
      <p className="text-muted-foreground mb-8">
        We&apos;re happy to help with orders, returns, or anything else on
        your mind.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Customer support</h2>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Email:{" "}
          <a
            href="mailto:support@meridian.example"
            className="underline underline-offset-4 hover:text-foreground"
          >
            support@meridian.example
          </a>
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Phone: (800) 555-0142
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Support hours: Monday–Friday, 9:00 AM–6:00 PM (Eastern Time).
          Messages sent outside these hours will be answered the next
          business day.
        </p>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-2">Before you reach out</h2>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Many common questions — order tracking, returns, payment methods,
          and shipping times — are already answered on our{" "}
          <Link
            href="/faq"
            className="underline underline-offset-4 hover:text-foreground"
          >
            FAQ page
          </Link>
          . It&apos;s often the fastest way to get what you need.
        </p>
      </div>
    </div>
  );
}
