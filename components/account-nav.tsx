"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/lib/actions/auth-actions";

const NAV_ITEMS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/settings", label: "Settings" },
];

export function AccountNav({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();

  return (
    <div className="flex min-w-[200px] flex-col gap-1 rounded-[6px] border border-border bg-surface p-[14px]">
      <div className="flex flex-col gap-[3px] px-2 pt-1 pb-3">
        <span className="text-[13px] font-bold text-ink">{name}</span>
        <span className="text-[11px] text-ink-3">{email}</span>
      </div>

      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/account" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "rounded-r-[4px] border-l-[3px] border-teal bg-teal-tint px-[10px] py-[9px] text-xs font-semibold text-ink"
                : "rounded-[4px] px-[13px] py-[9px] text-xs font-medium text-ink-3 hover:bg-surface-muted"
            }
          >
            {item.label}
          </Link>
        );
      })}

      <form action={signOutAction} className="mt-1.5 border-t border-border-subtle pt-1.5">
        <button
          type="submit"
          className="w-full rounded-[4px] px-[13px] py-[9px] text-left text-xs font-medium text-danger hover:bg-danger-tint"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
