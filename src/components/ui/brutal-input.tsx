import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const brutalInputVariants = cva(
  [
    "flex w-full",
    "border-3 border-black dark:border-white",
    "bg-white dark:bg-black",
    "text-black dark:text-white",
    "font-medium",
    "transition-shadow duration-100 ease-out",
    "placeholder:text-gray-400 dark:placeholder:text-gray-500",
    "focus:outline-none",
    "focus:shadow-[4px_4px_0_0_#000000] dark:focus:shadow-[4px_4px_0_0_#FFFFFF]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
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

function getAriaDescribedBy(
  inputId: string,
  hasError: boolean,
  helperText?: string
): string | undefined {
  if (hasError) {
    return `${inputId}-error`
  }
  if (helperText) {
    return `${inputId}-helper`
  }
  return undefined
}

const BrutalInput = React.forwardRef<HTMLInputElement, BrutalInputProps>(
  function BrutalInput(
    { className, type, size, error, label, helperText, errorMessage, id, ...props },
    ref
  ) {
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
          aria-describedby={getAriaDescribedBy(inputId, hasError, helperText)}
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

const brutalTextareaVariants = cva(
  [
    "flex w-full min-h-[80px]",
    "border-3 border-black dark:border-white",
    "bg-white dark:bg-black",
    "text-black dark:text-white",
    "font-medium",
    "px-4 py-3",
    "transition-shadow duration-100 ease-out",
    "resize-y",
    "placeholder:text-gray-400 dark:placeholder:text-gray-500",
    "focus:outline-none",
    "focus:shadow-[4px_4px_0_0_#000000] dark:focus:shadow-[4px_4px_0_0_#FFFFFF]",
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
  function BrutalTextarea(
    { className, error, label, helperText, errorMessage, id, ...props },
    ref
  ) {
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
          aria-describedby={getAriaDescribedBy(textareaId, hasError, helperText)}
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
