"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/reviews", label: "Reviews" },
];

const INERT_ITEMS = ["Categories", "Settings"];

export function AdminNav({ name }: { name: string }) {
  const pathname = usePathname();

  return (
    <div className="flex w-[210px] shrink-0 flex-col gap-[3px] bg-chrome-deep p-3">
      <div className="flex items-center gap-2 px-2 pt-1 pb-4">
        <span className="text-base font-extrabold tracking-tight text-white">MERIDIAN</span>
        <span className="rounded-[3px] border border-[#2f5b62] px-[5px] py-1 text-[9px] font-semibold tracking-[0.1em] text-teal-bright">
          ADMIN
        </span>
      </div>

      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "rounded-[5px] bg-chrome-nav px-[10px] py-[9px] text-xs font-semibold text-white"
                : "rounded-[5px] px-[10px] py-[9px] text-xs font-medium text-[#94a3b8] hover:bg-chrome-nav/60"
            }
          >
            {item.label}
          </Link>
        );
      })}

      {INERT_ITEMS.map((label) => (
        <span
          key={label}
          className="cursor-not-allowed rounded-[5px] px-[10px] py-[9px] text-xs font-medium text-[#4b5c63]"
        >
          {label}
        </span>
      ))}

      <div className="mt-auto flex flex-col gap-[3px] border-t border-[#1e3a44] px-[10px] pt-3 pb-1">
        <span className="text-[11px] font-semibold text-[#cbd5e1]">{name}</span>
        <Link href="/" className="text-[10px] text-[#64748b] hover:text-teal-bright">
          Back to storefront
        </Link>
      </div>
    </div>
  );
}
