import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Meridian",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold mb-2">About Meridian</h1>
      <p className="text-muted-foreground mb-8">
        A single destination for the things you need, chosen with care and
        delivered without friction.
      </p>

      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Meridian started from a simple frustration: shopping online
          shouldn&apos;t mean hopping between a dozen different stores to find
          decent electronics, home goods, books, and everyday essentials.
          We set out to build one storefront that carries all of it, curated
          well enough that you can trust what you see on the page.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Today Meridian spans everything from kitchen gear and apparel to
          toys, beauty products, and pantry staples. Every category is
          organized the same way and held to the same standard, so browsing
          for a coffee grinder feels just as straightforward as browsing for
          a paperback.
        </p>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-2">What we care about</h2>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Quality over noise.</span>{" "}
          We&apos;d rather list products with clear, honest descriptions than
          bury you in options. If something is on Meridian, it&apos;s because
          it earned its place in the catalog.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Selection that spans your day.</span>{" "}
          From the coffee that gets you started to the desk you work at and
          the gifts you send at the end of the year, Meridian is built to
          cover the everyday and the occasional in one place.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Shipping you can plan around.</span>{" "}
          Flat, predictable rates and realistic delivery windows, no
          surprises at checkout.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Trust, not just transactions.</span>{" "}
          Clear return policies, straightforward account tools, and support
          that actually answers your questions.
        </p>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-2">Where we&apos;re headed</h2>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          We&apos;re still growing our catalog and refining the experience
          from the ground up — search that actually understands what
          you&apos;re looking for, recommendations that make sense, and a
          checkout that gets out of your way. Thanks for shopping with us
          while we build it.
        </p>
      </div>
    </div>
  );
}
