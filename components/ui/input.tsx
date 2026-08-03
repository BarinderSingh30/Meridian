import { cn } from "@/lib/utils"

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "flex h-auto w-full rounded-[5px] border border-border bg-surface px-[11px] py-[10px] text-xs text-ink outline-none transition-colors placeholder:text-muted-2 focus-visible:border-[1.5px] focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/[0.18] aria-invalid:border-[1.5px] aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
