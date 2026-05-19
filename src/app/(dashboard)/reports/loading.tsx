// src/app/(dashboard)/reports/loading.tsx
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  SkeletonPageHeader,
  SkeletonStatsGrid,
} from "@/src/components/ui/skeleton-blocks";

export default function ReportsLoading() {
  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <SkeletonPageHeader hasSubtitle />

      {/* Filter bar */}
      <div className="border border-gray-200 bg-white px-4 py-3 flex flex-wrap items-center gap-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-28" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-28" />
      </div>

      <SkeletonStatsGrid cols={4} />

      {/* Chart area */}
      <div className="border border-gray-200 bg-white p-5 space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-56 w-full" />
      </div>

      {/* Data table */}
      <div className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-3">
          <Skeleton className="h-4 w-32" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-5 gap-4 border-b border-gray-100 px-5 py-3 last:border-b-0"
          >
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-3.5" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
