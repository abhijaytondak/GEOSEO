"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { History, RotateCcw, Loader2 } from "lucide-react";
import type { BrandMemoryVersion } from "@geoseo/types";
import { relativeTime } from "@/lib/format";

export function VersionHistory({ versions }: { versions: BrandMemoryVersion[] }) {
  const router = useRouter();
  const [reverting, setReverting] = useState<string | null>(null);

  async function revert(id: string) {
    setReverting(id);
    try {
      const { api } = await import("@/lib/api-client");
      await api.revertBrandVersion(id);
      router.refresh();
    } finally {
      setReverting(null);
    }
  }

  return (
    <ol className="relative space-y-3">
      {versions.map((v, i) => {
        const current = i === 0;
        return (
          <li key={v.id} className="relative flex gap-3">
            {i < versions.length - 1 && (
              <span className="absolute left-[13px] top-7 h-[calc(100%+4px)] w-px bg-border" />
            )}
            <div
              className={`z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                current ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              v{v.version}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[13px] font-medium text-foreground">{v.note}</p>
                {current && (
                  <span className="shrink-0 rounded-full bg-positive/12 px-1.5 py-0.5 text-[10px] font-semibold text-positive">
                    Current
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-muted-foreground">
                <span>{v.author}</span>
                <span>·</span>
                <span>{relativeTime(v.updatedAt)}</span>
                {!current && (
                  <button
                    onClick={() => revert(v.id)}
                    disabled={reverting !== null}
                    className="ml-auto inline-flex items-center gap-1 font-semibold text-brand hover:underline disabled:opacity-50"
                  >
                    {reverting === v.id ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <RotateCcw className="size-3" />
                    )}
                    Restore
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
      {versions.length === 0 && (
        <li className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <History className="size-4" /> No history yet.
        </li>
      )}
    </ol>
  );
}
