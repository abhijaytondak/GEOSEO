import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-5 p-6 sm:p-8">
      <div>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2 h-7 w-44" />
        <Skeleton className="mt-2 h-4 w-[420px] max-w-full" />
      </div>
      <Skeleton className="h-9 w-80 max-w-full rounded-xl" />
      <Skeleton className="h-16 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Skeleton className="h-[300px] rounded-2xl lg:col-span-2" />
        <Skeleton className="h-[300px] rounded-2xl" />
      </div>
    </div>
  );
}
