/**
 * Neobrutalist Design System
 *
 * A bold, tactile component library inspired by Gumroad's aesthetic.
 *
 * Key principles:
 * - Bold 2-4px black borders on EVERYTHING
 * - Offset box shadows (4px right, 4px down, black)
 * - High contrast colors: black, white, bright accents
 * - Shadows expand on hover, shrink on active (Gumroad style)
 * - Geometric, grid-based layouts
 * - Bold, chunky typography
 * - No gradients, minimal rounded corners
 * - Brutally honest, no-bullshit aesthetic
 */

// Button
export {
  BrutalButton,
  brutalButtonVariants,
  type BrutalButtonProps,
} from "./brutal-button"

// Card
export {
  BrutalCard,
  BrutalCardHeader,
  BrutalCardTitle,
  BrutalCardDescription,
  BrutalCardContent,
  BrutalCardFooter,
  brutalCardVariants,
  type BrutalCardProps,
} from "./brutal-card"

// Input
export {
  BrutalInput,
  BrutalTextarea,
  brutalInputVariants,
  brutalTextareaVariants,
  type BrutalInputProps,
  type BrutalTextareaProps,
} from "./brutal-input"

// Badge
export {
  BrutalBadge,
  BrutalBadgeGroup,
  brutalBadgeVariants,
  type BrutalBadgeProps,
} from "./brutal-badge"

// Dialog
export {
  BrutalDialog,
  BrutalDialogTrigger,
  BrutalDialogPortal,
  BrutalDialogOverlay,
  BrutalDialogContent,
  BrutalDialogHeader,
  BrutalDialogFooter,
  BrutalDialogTitle,
  BrutalDialogDescription,
  BrutalAlertDialog,
} from "./brutal-dialog"

// Toast
export { ToastProvider, useToast } from "./toast"
