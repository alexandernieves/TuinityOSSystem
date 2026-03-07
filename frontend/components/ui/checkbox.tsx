"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-gray-300 shadow-xs transition-shadow outline-none",
        "focus-visible:ring-[3px] focus-visible:ring-brand-500/20 focus-visible:border-brand-500",
        "data-[state=checked]:bg-brand-600 data-[state=checked]:text-white data-[state=checked]:border-brand-600",
        "dark:border-[#444] dark:bg-[#1a1a1a]",
        "dark:data-[state=checked]:bg-brand-600 dark:data-[state=checked]:border-brand-600",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-red-500 aria-invalid:ring-red-500/20",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
