import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="space-y-5 p-6 sm:p-8">
      <div>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-2 h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-[420px] max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
        {/* facet rail */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-lg" />
          ))}
        </div>
        {/* results */}
        <div>
          <Skeleton className="h-11 w-full rounded-xl" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
