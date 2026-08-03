import Link from "next/link";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between rounded-[6px] border border-border bg-surface px-[14px] py-[11px] text-xs text-ink-3"
    >
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-[5px] text-xs font-semibold">
        <PageLink page={page - 1} disabled={page <= 1} buildHref={buildHref}>
          Prev
        </PageLink>
        {pages.map((p) => (
          <Link
            key={p}
            href={buildHref(p)}
            className={cn(
              "rounded-[4px] px-3 py-2",
              p === page ? "bg-chrome-deep text-white" : "border border-border text-ink-3 hover:bg-surface-muted"
            )}
          >
            {p}
          </Link>
        ))}
        <PageLink page={page + 1} disabled={page >= totalPages} buildHref={buildHref}>
          Next
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  page,
  disabled,
  buildHref,
  children,
}: {
  page: number;
  disabled: boolean;
  buildHref: (page: number) => string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return <span className="rounded-[4px] border border-border px-3 py-2 text-muted-2">{children}</span>;
  }
  return (
    <Link href={buildHref(page)} className="rounded-[4px] border border-border px-3 py-2 text-ink-3 hover:bg-surface-muted">
      {children}
    </Link>
  );
}
