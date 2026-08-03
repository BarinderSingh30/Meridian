import type { LucideIcon } from "lucide-react"

function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon: LucideIcon
  title: string
  description: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <span className="flex size-13 items-center justify-center rounded-full bg-teal-tint text-teal">
        <Icon className="size-6" />
      </span>
      <p className="text-base font-bold text-ink">{title}</p>
      <p className="max-w-[48ch] text-xs text-ink-3">{description}</p>
      {actions && <div className="mt-2 flex items-center gap-3">{actions}</div>}
    </div>
  )
}

export { EmptyState }
