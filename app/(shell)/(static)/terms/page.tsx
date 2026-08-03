import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Meridian",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold mb-2">Terms of Service</h1>
      <p className="text-muted-foreground mb-8">
        Please read these terms carefully before using Meridian.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Acceptance of terms</h2>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          By accessing or using Meridian, you agree to be bound by these
          Terms of Service. If you do not agree with any part of these terms,
          please do not use the site.
        </p>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-2">Your account</h2>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          You&apos;re responsible for maintaining the confidentiality of your
          account credentials and for all activity that occurs under your
          account. Please notify us right away if you suspect unauthorized
          use of your account.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You agree to provide accurate and current information when creating
          an account and placing orders, including shipping and payment
          details.
        </p>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-2">Orders and pricing</h2>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Placing an order constitutes an offer to purchase a product, which
          we may accept or decline. We reserve the right to refuse or cancel
          any order for reasons including product availability, errors in
          pricing or product information, or suspected fraud.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          While we work to ensure prices and descriptions are accurate,
          errors may occasionally occur. If we discover a pricing error after
          you&apos;ve placed an order, we&apos;ll contact you before
          proceeding, and you&apos;ll have the option to confirm the order at
          the correct price or cancel it for a full refund.
        </p>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-2">Intellectual property</h2>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          All content on Meridian, including text, graphics, logos, and
          product images, is the property of Meridian or its licensors and is
          protected by applicable intellectual property laws. You may not
          reproduce, distribute, or create derivative works from this content
          without permission.
        </p>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-2">Limitation of liability</h2>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Meridian is provided on an &quot;as is&quot; and &quot;as
          available&quot; basis. To the fullest extent permitted by law, we
          disclaim liability for any indirect, incidental, or consequential
          damages arising from your use of the site or products purchased
          through it.
        </p>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-2">Governing law</h2>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          These terms are governed by the laws of the jurisdiction in which
          Meridian operates, without regard to conflict of law principles.
        </p>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-2">Changes to these terms</h2>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          We may update these Terms of Service from time to time. Changes
          take effect as soon as they&apos;re posted to this page. Continued
          use of Meridian after changes are posted constitutes acceptance of
          the revised terms.
        </p>
      </div>
    </div>
  );
}
