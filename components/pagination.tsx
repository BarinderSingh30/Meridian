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

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 py-8 text-sm">
      <PageLink page={page - 1} disabled={page <= 1} buildHref={buildHref}>
        Previous
      </PageLink>
      <span className="text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <PageLink page={page + 1} disabled={page >= totalPages} buildHref={buildHref}>
        Next
      </PageLink>
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
    return <span className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground/50">{children}</span>;
  }
  return (
    <Link href={buildHref(page)} className={cn("rounded-lg border border-border px-3 py-1.5 hover:bg-muted")}>
      {children}
    </Link>
  );
}
