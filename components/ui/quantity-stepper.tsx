"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

function QuantityStepper({
  name,
  defaultValue = 1,
  min = 1,
  max,
  disabled = false,
  autoSubmit = false,
  className,
}: {
  name: string
  defaultValue?: number
  min?: number
  max?: number
  disabled?: boolean
  /** Submit the enclosing form whenever the value changes — for controls like Cart's line-item
   * quantity where there's no separate "Update" button in the design. Leave off (default) for
   * controls like PDP's "Add to cart" form, where quantity should only apply on deliberate submit. */
  autoSubmit?: boolean
  className?: string
}) {
  const [value, setValue] = useState(defaultValue)

  function clamp(next: number) {
    let clamped = Math.max(min, next)
    if (max !== undefined) clamped = Math.min(max, clamped)
    return clamped
  }

  function commit(next: number, form: HTMLFormElement | null) {
    setValue(next)
    if (autoSubmit) form?.requestSubmit()
  }

  return (
    <div
      className={cn(
        "flex items-center overflow-hidden rounded-[5px] border border-border",
        disabled && "opacity-50",
        className
      )}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => commit(clamp(value - 1), e.currentTarget.form)}
        className="px-3 py-2 text-sm font-semibold text-ink-3 hover:bg-surface-muted disabled:pointer-events-none"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        name={name}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => commit(clamp(Number(e.target.value) || min), e.currentTarget.form)}
        className="w-10 border-x border-border py-2 text-center text-sm font-semibold text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => commit(clamp(value + 1), e.currentTarget.form)}
        className="px-3 py-2 text-sm font-semibold text-ink-3 hover:bg-surface-muted disabled:pointer-events-none"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  )
}

export { QuantityStepper }
