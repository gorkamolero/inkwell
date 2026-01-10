import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Neobrutalist Card Component
 *
 * Features:
 * - Bold 3px black border
 * - 4px offset shadow
 * - White background
 * - Optional colored accent bar on top
 * - Optional interactive hover state
 */

const brutalCardVariants = cva(
  [
    // Base styles
    "relative",
    "border-3 border-black dark:border-white",
    "bg-white dark:bg-black",
    "shadow-[4px_4px_0_0_#000000] dark:shadow-[4px_4px_0_0_#FFFFFF]",
  ],
  {
    variants: {
      interactive: {
        true: [
          "transition-all duration-100 ease-out cursor-pointer",
          "hover:translate-x-[-2px] hover:translate-y-[-2px]",
          "hover:shadow-[6px_6px_0_0_#000000] dark:hover:shadow-[6px_6px_0_0_#FFFFFF]",
          "active:translate-x-[2px] active:translate-y-[2px]",
          "active:shadow-[2px_2px_0_0_#000000] dark:active:shadow-[2px_2px_0_0_#FFFFFF]",
        ],
        false: [],
      },
      accent: {
        none: [],
        yellow: "before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-brutal-yellow",
        blue: "before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-brutal-blue",
        pink: "before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-brutal-pink",
        green: "before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-brutal-green",
        red: "before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-brutal-red",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
    },
    defaultVariants: {
      interactive: false,
      accent: "none",
      padding: "md",
    },
  }
)

export interface BrutalCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof brutalCardVariants> {}

const BrutalCard = React.forwardRef<HTMLDivElement, BrutalCardProps>(
  ({ className, interactive, accent, padding, ...props }, ref) => {
    return (
      <div
        className={cn(brutalCardVariants({ interactive, accent, padding, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
BrutalCard.displayName = "BrutalCard"

/**
 * Card Header - for consistent card header styling
 */
const BrutalCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
))
BrutalCardHeader.displayName = "BrutalCardHeader"

/**
 * Card Title - bold neobrutalist heading
 */
const BrutalCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-black tracking-tight text-black dark:text-white",
      className
    )}
    {...props}
  />
))
BrutalCardTitle.displayName = "BrutalCardTitle"

/**
 * Card Description - muted text for subtitles
 */
const BrutalCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
BrutalCardDescription.displayName = "BrutalCardDescription"

/**
 * Card Content - main content area
 */
const BrutalCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
))
BrutalCardContent.displayName = "BrutalCardContent"

/**
 * Card Footer - for actions at the bottom
 */
const BrutalCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center pt-4 border-t-3 border-black dark:border-white mt-4 -mx-4 px-4",
      className
    )}
    {...props}
  />
))
BrutalCardFooter.displayName = "BrutalCardFooter"

export {
  BrutalCard,
  BrutalCardHeader,
  BrutalCardTitle,
  BrutalCardDescription,
  BrutalCardContent,
  BrutalCardFooter,
  brutalCardVariants,
}
