import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Neobrutalist Badge Component
 *
 * Features:
 * - Small, bold badges
 * - 2px border
 * - Various color variants
 * - Optional interactive state
 */

const brutalBadgeVariants = cva(
  [
    // Base styles
    "inline-flex items-center justify-center",
    "border-2 border-black dark:border-white",
    "font-bold text-xs uppercase tracking-wide",
    "whitespace-nowrap",
  ],
  {
    variants: {
      variant: {
        default: "bg-white text-black dark:bg-black dark:text-white",
        primary: "bg-brutal-yellow text-black border-black",
        secondary: "bg-brutal-blue text-white border-black",
        success: "bg-brutal-green text-black border-black",
        destructive: "bg-brutal-red text-white border-black",
        outline: "bg-transparent text-black dark:text-white",
        pink: "bg-brutal-pink text-black border-black",
        inverted: "bg-black text-white dark:bg-white dark:text-black",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[10px]",
        md: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
      interactive: {
        true: [
          "cursor-pointer",
          "transition-all duration-100 ease-out",
          "shadow-[2px_2px_0_0_#000000]",
          "hover:translate-x-[-1px] hover:translate-y-[-1px]",
          "hover:shadow-[3px_3px_0_0_#000000]",
          "active:translate-x-[1px] active:translate-y-[1px]",
          "active:shadow-[1px_1px_0_0_#000000]",
          "dark:shadow-[2px_2px_0_0_#FFFFFF]",
          "dark:hover:shadow-[3px_3px_0_0_#FFFFFF]",
          "dark:active:shadow-[1px_1px_0_0_#FFFFFF]",
        ],
        false: [],
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      interactive: false,
    },
  }
)

export interface BrutalBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof brutalBadgeVariants> {}

const BrutalBadge = React.forwardRef<HTMLSpanElement, BrutalBadgeProps>(
  ({ className, variant, size, interactive, ...props }, ref) => {
    return (
      <span
        className={cn(brutalBadgeVariants({ variant, size, interactive, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
BrutalBadge.displayName = "BrutalBadge"

/**
 * Badge Group - for displaying multiple badges inline
 */
const BrutalBadgeGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-wrap gap-2", className)}
    {...props}
  />
))
BrutalBadgeGroup.displayName = "BrutalBadgeGroup"

export { BrutalBadge, BrutalBadgeGroup, brutalBadgeVariants }
