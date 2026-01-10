"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { BrutalButton } from "./brutal-button"

/**
 * Neobrutalist Dialog Component
 *
 * Features:
 * - Modal with brutal styling
 * - Heavy 4px black border
 * - 8px offset shadow
 * - Yellow close button
 * - Backdrop blur overlay
 */

interface BrutalDialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const BrutalDialogContext = React.createContext<BrutalDialogContextValue | null>(null)

function useBrutalDialog() {
  const context = React.useContext(BrutalDialogContext)
  if (!context) {
    throw new Error("BrutalDialog components must be used within a BrutalDialog")
  }
  return context
}

interface BrutalDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
  children: React.ReactNode
}

function BrutalDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultOpen = false,
  children,
}: BrutalDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const onOpenChange = isControlled
    ? controlledOnOpenChange || (() => {})
    : setUncontrolledOpen

  return (
    <BrutalDialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </BrutalDialogContext.Provider>
  )
}

type BrutalDialogTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>

const BrutalDialogTrigger = React.forwardRef<
  HTMLButtonElement,
  BrutalDialogTriggerProps
>(({ className, children, ...props }, ref) => {
  const { onOpenChange } = useBrutalDialog()

  return (
    <BrutalButton
      ref={ref}
      className={className}
      onClick={() => onOpenChange(true)}
      {...props}
    >
      {children}
    </BrutalButton>
  )
})
BrutalDialogTrigger.displayName = "BrutalDialogTrigger"

interface BrutalDialogPortalProps {
  children: React.ReactNode
}

function BrutalDialogPortal({ children }: BrutalDialogPortalProps) {
  const { open } = useBrutalDialog()

  if (!open) return null

  return <>{children}</>
}

const BrutalDialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { onOpenChange } = useBrutalDialog()

  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-50",
        "bg-black/50 backdrop-blur-sm",
        "animate-in fade-in-0",
        className
      )}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  )
})
BrutalDialogOverlay.displayName = "BrutalDialogOverlay"

interface BrutalDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  showClose?: boolean
}

const BrutalDialogContent = React.forwardRef<
  HTMLDivElement,
  BrutalDialogContentProps
>(({ className, children, showClose = true, ...props }, ref) => {
  const { onOpenChange } = useBrutalDialog()

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [onOpenChange])

  // Prevent body scroll when dialog is open
  React.useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  return (
    <BrutalDialogPortal>
      <BrutalDialogOverlay />
      <div
        ref={ref}
        className={cn(
          // Positioning
          "fixed left-1/2 top-1/2 z-50",
          "-translate-x-1/2 -translate-y-1/2",
          // Sizing
          "w-full max-w-lg max-h-[85vh]",
          "overflow-auto",
          // Brutal styling
          "border-4 border-black dark:border-white",
          "bg-white dark:bg-black",
          "shadow-[8px_8px_0_0_#000000] dark:shadow-[8px_8px_0_0_#FFFFFF]",
          // Animation
          "animate-in fade-in-0 zoom-in-95",
          "duration-200",
          // Padding
          "p-6",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        {...props}
      >
        {showClose && (
          <button
            className={cn(
              "absolute right-4 top-4",
              "h-8 w-8",
              "inline-flex items-center justify-center",
              "bg-brutal-yellow text-black",
              "border-2 border-black",
              "shadow-[2px_2px_0_0_#000000]",
              "transition-all duration-100 ease-out",
              "hover:translate-x-[-1px] hover:translate-y-[-1px]",
              "hover:shadow-[3px_3px_0_0_#000000]",
              "active:translate-x-[1px] active:translate-y-[1px]",
              "active:shadow-[1px_1px_0_0_#000000]",
              "focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            )}
            onClick={() => onOpenChange(false)}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" strokeWidth={3} />
          </button>
        )}
        {children}
      </div>
    </BrutalDialogPortal>
  )
})
BrutalDialogContent.displayName = "BrutalDialogContent"

const BrutalDialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 mb-4", className)}
    {...props}
  />
))
BrutalDialogHeader.displayName = "BrutalDialogHeader"

const BrutalDialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3",
      "mt-6 pt-4",
      "border-t-3 border-black dark:border-white",
      className
    )}
    {...props}
  />
))
BrutalDialogFooter.displayName = "BrutalDialogFooter"

const BrutalDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-xl font-black tracking-tight text-black dark:text-white pr-8",
      className
    )}
    {...props}
  />
))
BrutalDialogTitle.displayName = "BrutalDialogTitle"

const BrutalDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
BrutalDialogDescription.displayName = "BrutalDialogDescription"

/**
 * Convenience component for quick alert/confirm dialogs
 */
interface BrutalAlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: string
  cancelLabel?: string
  confirmLabel?: string
  onCancel?: () => void
  onConfirm?: () => void
  destructive?: boolean
}

function BrutalAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  onCancel,
  onConfirm,
  destructive = false,
}: BrutalAlertDialogProps) {
  const handleCancel = () => {
    onCancel?.()
    onOpenChange?.(false)
  }

  const handleConfirm = () => {
    onConfirm?.()
    onOpenChange?.(false)
  }

  return (
    <BrutalDialog open={open} onOpenChange={onOpenChange}>
      <BrutalDialogContent showClose={false}>
        <BrutalDialogHeader>
          <BrutalDialogTitle>{title}</BrutalDialogTitle>
          {description && (
            <BrutalDialogDescription>{description}</BrutalDialogDescription>
          )}
        </BrutalDialogHeader>
        <BrutalDialogFooter>
          <BrutalButton variant="outline" onClick={handleCancel}>
            {cancelLabel}
          </BrutalButton>
          <BrutalButton
            variant={destructive ? "destructive" : "primary"}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </BrutalButton>
        </BrutalDialogFooter>
      </BrutalDialogContent>
    </BrutalDialog>
  )
}

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
}
