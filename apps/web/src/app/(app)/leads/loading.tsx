import { Skeleton } from "@/components/ui/skeleton";

export default function LeadsLoading() {
  return (
    <div className="space-y-5 p-6 sm:p-8">
      <div>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-2 h-7 w-44" />
        <Skeleton className="mt-2 h-4 w-[340px] max-w-full" />
      </div>
      {/* stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-2xl" />
        ))}
      </div>
      {/* table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-card">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border/60 py-3 last:border-0">
            <div className="flex-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-1.5 h-3 w-44" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
