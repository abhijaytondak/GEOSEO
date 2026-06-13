"use client";

import { useState, type KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";

/** Editable list of string chips — Enter or comma to add, × to remove. */
export function ChipInput({
  values,
  onChange,
  placeholder = "Add and press Enter",
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim().replace(/,$/, "");
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && draft === "" && values.length) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface-sunken p-2 focus-within:border-ring focus-within:bg-card">
      {values.map((v) => (
        <span
          key={v}
          className="inline-flex items-center gap-1 rounded-md bg-brand/10 py-1 pl-2 pr-1 text-[12.5px] font-medium text-brand"
        >
          {v}
          <button
            type="button"
            onClick={() => onChange(values.filter((x) => x !== v))}
            className="rounded-sm p-0.5 hover:bg-brand/20"
            aria-label={`Remove ${v}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <span className="flex min-w-[140px] flex-1 items-center gap-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={add}
          placeholder={placeholder}
          className="h-6 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/60"
        />
        {draft && (
          <button type="button" onClick={add} className="text-muted-foreground hover:text-brand" aria-label="Add">
            <Plus className="size-3.5" />
          </button>
        )}
      </span>
    </div>
  );
}
