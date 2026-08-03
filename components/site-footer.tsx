import Link from "next/link";
import { getTopLevelCategories } from "@/lib/categories/queries";

const HELP_LINKS = [
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Shipping & Returns", href: "/shipping-returns" },
];

const COMPANY_LINKS = [{ label: "About", href: "/about" }];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export async function SiteFooter() {
  const categories = await getTopLevelCategories();
  const shopCategories = categories.slice(0, 4);

  return (
    <footer className="flex flex-col gap-6 bg-chrome-deep px-6 pt-[30px] pb-[22px] text-[#cbd5e1]">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="flex flex-col gap-[10px]">
          <span className="text-lg font-extrabold tracking-tight text-white">MERIDIAN</span>
          <p className="max-w-[30ch] text-xs text-muted-2">Everything you need, shipped fast.</p>
        </div>

        <FooterColumn heading="Shop">
          {shopCategories.map((category) => (
            <li key={category.id}>
              <Link href={`/c/${category.slug}`} className="hover:text-white">
                {category.name}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn heading="Help">
          {HELP_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            </li>
          ))}
          <li>Track order</li>
        </FooterColumn>

        <FooterColumn heading="Company">
          {COMPANY_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            </li>
          ))}
          <li>Careers</li>
          <li>Press</li>
        </FooterColumn>

        <FooterColumn heading="Legal">
          {LEGAL_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            </li>
          ))}
        </FooterColumn>
      </div>

      <div className="flex items-center justify-between border-t border-[#1e3a44] pt-4 text-[11px] text-[#64748b]">
        <span>© {new Date().getFullYear()} Meridian Commerce Pvt. Ltd.</span>
        <span>Visa · Mastercard · UPI · Net banking</span>
      </div>
    </footer>
  );
}

function FooterColumn({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[9px]">
      <span className="text-[11px] font-bold tracking-[0.1em] text-white">{heading.toUpperCase()}</span>
      <ul className="flex flex-col gap-[7px] text-xs text-muted-2">{children}</ul>
    </div>
  );
}
