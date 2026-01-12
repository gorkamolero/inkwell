import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const brutalButtonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-bold text-sm",
    "border-3 border-black dark:border-white",
    "transition-all duration-100 ease-out",
    "cursor-pointer select-none",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brutal-yellow focus-visible:ring-offset-2",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-white text-black",
          "shadow-[4px_4px_0_0_#000000]",
          "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000000]",
          "active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000000]",
          "disabled:shadow-[4px_4px_0_0_#000000]",
          "dark:bg-black dark:text-white",
          "dark:shadow-[4px_4px_0_0_#FFFFFF]",
          "dark:hover:shadow-[6px_6px_0_0_#FFFFFF]",
          "dark:active:shadow-[2px_2px_0_0_#FFFFFF]",
        ],
        primary: [
          "bg-brutal-yellow text-black",
          "shadow-[4px_4px_0_0_#000000]",
          "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000000]",
          "active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000000]",
          "disabled:shadow-[4px_4px_0_0_#000000]",
        ],
        secondary: [
          "bg-brutal-blue text-white",
          "shadow-[4px_4px_0_0_#000000]",
          "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000000]",
          "active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000000]",
          "disabled:shadow-[4px_4px_0_0_#000000]",
        ],
        destructive: [
          "bg-brutal-red text-white",
          "shadow-[4px_4px_0_0_#000000]",
          "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000000]",
          "active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000000]",
          "disabled:shadow-[4px_4px_0_0_#000000]",
        ],
        outline: [
          "bg-transparent text-black dark:text-white",
          "shadow-[4px_4px_0_0_#000000]",
          "hover:bg-black hover:text-white",
          "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000000]",
          "active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000000]",
          "disabled:shadow-[4px_4px_0_0_#000000]",
          "dark:shadow-[4px_4px_0_0_#FFFFFF]",
          "dark:hover:bg-white dark:hover:text-black",
          "dark:hover:shadow-[6px_6px_0_0_#FFFFFF]",
          "dark:active:shadow-[2px_2px_0_0_#FFFFFF]",
        ],
        ghost: [
          "bg-transparent text-black dark:text-white",
          "border-transparent",
          "shadow-none",
          "hover:bg-black/5 dark:hover:bg-white/5",
          "active:bg-black/10 dark:active:bg-white/10",
        ],
        link: [
          "bg-transparent text-black dark:text-white",
          "border-transparent",
          "shadow-none",
          "underline-offset-4 hover:underline",
        ],
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
        "icon-lg": "h-12 w-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface BrutalButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof brutalButtonVariants> {
  loading?: boolean;
  loadingText?: string;
}

const BrutalButton = React.forwardRef<HTMLButtonElement, BrutalButtonProps>(
  function BrutalButton(
    {
      className,
      variant,
      size,
      loading,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref,
  ) {
    return (
      <button
        className={cn(brutalButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2
              className="h-4 w-4 animate-spin"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            {loadingText ?? children}
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);
BrutalButton.displayName = "BrutalButton";

export { BrutalButton, brutalButtonVariants };
