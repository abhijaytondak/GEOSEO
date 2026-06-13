import { Skeleton } from "@/components/ui/skeleton";

export default function PerformanceLoading() {
  return (
    <div className="space-y-5 p-6 sm:p-8">
      {/* header */}
      <div>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2 h-7 w-52" />
        <Skeleton className="mt-2 h-4 w-[360px] max-w-full" />
      </div>
      {/* summary strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      {/* charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Skeleton className="h-[320px] rounded-2xl" />
        <Skeleton className="h-[320px] rounded-2xl" />
      </div>
      {/* ai-visibility + tracked pages */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Skeleton className="h-[300px] rounded-2xl" />
        <Skeleton className="h-[300px] rounded-2xl lg:col-span-2" />
      </div>
    </div>
  );
}
