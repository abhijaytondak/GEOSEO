"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Modern progress bar: subtle inset track, gradient fill with a soft leading
 * glow, rounded caps, and a spring fill-in on scroll into view. Reduced-motion
 * renders the final width statically.
 *
 * `from`/`to` are CSS colors — default to brand→info tokens so the fill follows
 * light/dark theming. Pass any pair to tint per series (e.g. AI-engine colors).
 */
export function ProgressBar({
  value,
  from = "var(--brand)",
  to = "var(--info)",
  height = 8,
  className,
  delay = 0,
}: {
  value: number;
  from?: string;
  to?: string;
  height?: number;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-muted/70 ring-1 ring-inset ring-black/[0.03]",
        className,
      )}
      style={{ height }}
    >
      <motion.div
        className="relative h-full rounded-full"
        style={{
          background: `linear-gradient(90deg, ${from} 0%, ${to} 100%)`,
          boxShadow: `0 0 12px -2px ${from}`,
        }}
        initial={{ width: reduce ? `${pct}%` : 0 }}
        animate={inView || reduce ? { width: `${pct}%` } : { width: 0 }}
        transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* glossy top highlight */}
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-full bg-white/20" />
        {/* leading cap glow */}
        <span
          className="pointer-events-none absolute right-0 top-1/2 size-2 -translate-y-1/2 translate-x-1/4 rounded-full"
          style={{ background: to, boxShadow: `0 0 8px 1px ${to}` }}
        />
      </motion.div>
    </div>
  );
}
