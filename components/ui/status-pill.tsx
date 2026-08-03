import { cn } from "@/lib/utils"

const STATUS_PILL_TONE_CLASSES = {
  danger: "bg-danger-tint text-danger-dark",
  warn: "bg-warn-tint text-warn",
  success: "bg-success-tint text-success",
  info: "bg-info-tint text-info",
  neutral: "bg-neutral-badge-tint text-neutral-badge",
} as const

type StatusPillTone = keyof typeof STATUS_PILL_TONE_CLASSES

function StatusPill({
  tone,
  className,
  ...props
}: React.ComponentProps<"span"> & { tone: StatusPillTone }) {
  return (
    <span
      data-slot="status-pill"
      className={cn(
        "inline-flex items-center rounded-[3px] px-[6px] py-[4px] text-[9px] font-bold tracking-wide uppercase",
        STATUS_PILL_TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  )
}

export { StatusPill }
export type { StatusPillTone }
