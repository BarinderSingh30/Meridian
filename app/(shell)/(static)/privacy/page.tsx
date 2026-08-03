import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Meridian",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">
        How Meridian collects, uses, and protects your information.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Information we collect</h2>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          When you create an account, we collect information such as your
          name, email address, and password. When you place an order, we
          collect shipping and billing details needed to fulfill it, such as
          your address and payment information.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We also use cookies and similar technologies to keep you signed in,
          remember items in your cart, and understand how the site is used so
          we can improve it.
        </p>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-2">How we use your information</h2>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          We use the information we collect to process and fulfill orders,
          communicate with you about your account or purchases, maintain your
          shopping cart and session between visits, and improve the
          performance and usability of the site.
        </p>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-2">Sharing of information</h2>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          We do not sell your personal information to third parties. We share
          information only with service providers who help us operate the
          site — for example, payment processors and shipping carriers — and
          only to the extent necessary for them to perform those services.
        </p>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-2">Cookies</h2>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Meridian uses cookies to keep your cart and session active as you
          browse, and to remember your preferences between visits. You can
          control cookies through your browser settings, though disabling
          them may affect features like your shopping cart.
        </p>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-2">Contact us</h2>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          If you have questions about this Privacy Policy or how your
          information is handled, contact us at{" "}
          <a
            href="mailto:privacy@meridian.example"
            className="underline underline-offset-4 hover:text-foreground"
          >
            privacy@meridian.example
          </a>
          .
        </p>
      </div>
    </div>
  );
}
