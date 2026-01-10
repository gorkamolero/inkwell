import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Neobrutalist Input Component
 *
 * Features:
 * - Bold 3px black border
 * - No border radius (brutally square)
 * - Bold focus state with shadow
 * - Optional label above in bold uppercase
 */

const brutalInputVariants = cva(
  [
    // Base styles
    "flex w-full",
    "border-3 border-black dark:border-white",
    "bg-white dark:bg-black",
    "text-black dark:text-white",
    "font-medium",
    "transition-shadow duration-100 ease-out",
    // Placeholder
    "placeholder:text-gray-400 dark:placeholder:text-gray-500",
    // Focus state
    "focus:outline-none",
    "focus:shadow-[4px_4px_0_0_#000000] dark:focus:shadow-[4px_4px_0_0_#FFFFFF]",
    // Disabled state
    "disabled:opacity-50 disabled:cursor-not-allowed",
    // File input specific
    "file:border-0 file:bg-transparent file:text-sm file:font-bold",
  ],
  {
    variants: {
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-4 text-base",
      },
      error: {
        true: [
          "border-brutal-red",
          "focus:shadow-[4px_4px_0_0_#FF3333]",
        ],
        false: [],
      },
    },
    defaultVariants: {
      size: "md",
      error: false,
    },
  }
)

export interface BrutalInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof brutalInputVariants> {
  label?: string
  helperText?: string
  errorMessage?: string
}

const BrutalInput = React.forwardRef<HTMLInputElement, BrutalInputProps>(
  ({ className, type, size, error, label, helperText, errorMessage, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const hasError = error || !!errorMessage

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-2 text-xs font-bold uppercase tracking-wider text-black dark:text-white"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(brutalInputVariants({ size, error: hasError, className }))}
          ref={ref}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {errorMessage && (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-sm font-medium text-brutal-red"
          >
            {errorMessage}
          </p>
        )}
        {helperText && !errorMessage && (
          <p
            id={`${inputId}-helper`}
            className="mt-2 text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
BrutalInput.displayName = "BrutalInput"

/**
 * Neobrutalist Textarea Component
 *
 * Same styling as input but for multi-line text
 */
const brutalTextareaVariants = cva(
  [
    // Base styles
    "flex w-full min-h-[80px]",
    "border-3 border-black dark:border-white",
    "bg-white dark:bg-black",
    "text-black dark:text-white",
    "font-medium",
    "px-4 py-3",
    "transition-shadow duration-100 ease-out",
    "resize-y",
    // Placeholder
    "placeholder:text-gray-400 dark:placeholder:text-gray-500",
    // Focus state
    "focus:outline-none",
    "focus:shadow-[4px_4px_0_0_#000000] dark:focus:shadow-[4px_4px_0_0_#FFFFFF]",
    // Disabled state
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      error: {
        true: [
          "border-brutal-red",
          "focus:shadow-[4px_4px_0_0_#FF3333]",
        ],
        false: [],
      },
    },
    defaultVariants: {
      error: false,
    },
  }
)

export interface BrutalTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof brutalTextareaVariants> {
  label?: string
  helperText?: string
  errorMessage?: string
}

const BrutalTextarea = React.forwardRef<HTMLTextAreaElement, BrutalTextareaProps>(
  ({ className, error, label, helperText, errorMessage, id, ...props }, ref) => {
    const generatedId = React.useId()
    const textareaId = id ?? generatedId
    const hasError = error || !!errorMessage

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block mb-2 text-xs font-bold uppercase tracking-wider text-black dark:text-white"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(brutalTextareaVariants({ error: hasError, className }))}
          ref={ref}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          {...props}
        />
        {errorMessage && (
          <p
            id={`${textareaId}-error`}
            className="mt-2 text-sm font-medium text-brutal-red"
          >
            {errorMessage}
          </p>
        )}
        {helperText && !errorMessage && (
          <p
            id={`${textareaId}-helper`}
            className="mt-2 text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
BrutalTextarea.displayName = "BrutalTextarea"

export { BrutalInput, BrutalTextarea, brutalInputVariants, brutalTextareaVariants }
