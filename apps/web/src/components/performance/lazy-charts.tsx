"use client";

/**
 * Recharts is heavy. These wrappers code-split the chart components so they load
 * only on /performance (and never weigh down other routes' client bundles), with
 * a stable-height skeleton during load to avoid layout shift.
 */
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const ChartFallback = () => <Skeleton className="h-[240px] w-full rounded-xl" />;

export const RankChartLazy = dynamic(() => import("./rank-chart").then((m) => m.RankChart), {
  ssr: false,
  loading: ChartFallback,
});

export const TrafficChartLazy = dynamic(() => import("./traffic-chart").then((m) => m.TrafficChart), {
  ssr: false,
  loading: ChartFallback,
});

export const AiVisibilityLazy = dynamic(() => import("./ai-visibility").then((m) => m.AiVisibility), {
  ssr: false,
  loading: ChartFallback,
});
