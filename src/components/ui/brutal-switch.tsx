"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface BrutalSwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string;
  description?: string;
}

const BrutalSwitch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  BrutalSwitchProps
>(({ className, label, description, id, ...props }, ref) => {
  const generatedId = React.useId();
  const switchId = id ?? generatedId;

  const switchElement = (
    <SwitchPrimitive.Root
      id={switchId}
      ref={ref}
      className={cn(
        "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center",
        "border-brutal",
        "transition-colors duration-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-brutal-green data-[state=unchecked]:bg-gray-200",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-[18px] w-[18px]",
          "bg-white border-2 border-black",
          "transition-transform duration-100",
          "data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-[3px]"
        )}
      />
    </SwitchPrimitive.Root>
  );

  if (!label) {
    return switchElement;
  }

  return (
    <div className="flex items-start gap-3">
      {switchElement}
      <div className="flex flex-col">
        <label
          htmlFor={switchId}
          className="text-sm font-bold cursor-pointer"
        >
          {label}
        </label>
        {description && (
          <span className="text-xs text-gray-500 mt-0.5">{description}</span>
        )}
      </div>
    </div>
  );
});

BrutalSwitch.displayName = "BrutalSwitch";

export { BrutalSwitch };
