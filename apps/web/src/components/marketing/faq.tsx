"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQS } from "./data";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl divide-y divide-border rounded-2xl border border-border bg-card shadow-card">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
            >
              <span className="text-base font-semibold text-foreground">{f.q}</span>
              <span className={cn("grid size-7 shrink-0 place-items-center rounded-full transition-colors", isOpen ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground")}>
                {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
              </span>
            </button>
            <div className={cn("ease-expo grid transition-all duration-300", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted-foreground sm:px-6">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
