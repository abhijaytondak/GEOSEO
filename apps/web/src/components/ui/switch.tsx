"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type SwitchSize = "sm" | "md";

const TRACK: Record<SwitchSize, string> = {
  sm: "h-5 w-9",
  md: "h-6 w-11",
};
const THUMB: Record<SwitchSize, string> = {
  // translate distance = track width - thumb size - (2 × inset)
  sm: "size-4 data-[state=on]:translate-x-4",
  md: "size-5 data-[state=on]:translate-x-5",
};

export interface SwitchProps
  extends Omit<React.ComponentProps<"button">, "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Visual size of the track + thumb. */
  size?: SwitchSize;
  /** Shows a spinner inside the thumb while a change is persisting. */
  busy?: boolean;
}

/**
 * Accessible toggle: `role="switch"`, `aria-checked`, keyboard-operable
 * (Space / Enter), with brand-on track styling and a visible focus ring.
 */
function Switch({
  checked,
  onCheckedChange,
  size = "md",
  busy = false,
  disabled,
  className,
  children,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-busy={busy || undefined}
      data-slot="switch"
      data-state={checked ? "on" : "off"}
      disabled={disabled || busy}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent p-0.5 transition-colors outline-none",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-60",
        checked ? "bg-brand" : "bg-muted",
        TRACK[size],
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none flex items-center justify-center rounded-full bg-white shadow-xs transition-transform duration-150 ease-out",
          "translate-x-0",
          THUMB[size],
        )}
      >
        {children}
      </span>
    </button>
  );
}

export { Switch };
