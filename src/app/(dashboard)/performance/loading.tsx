// app/(dashboard)/performance/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import {
  SkeletonPageHeader,
  SkeletonStatsGrid,
} from "@/components/ui/skeleton-blocks";

export default function PerformanceLoading() {
  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <SkeletonPageHeader hasButton hasSubtitle />
      <SkeletonStatsGrid cols={3} />

      {/* Period selector */}
      <div className="border border-gray-200 bg-white px-4 py-3 flex items-center gap-3">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-28" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Review cards */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="border border-gray-200 bg-white p-5 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-20" />
            </div>

            {/* Score bars */}
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="h-3 w-28 shrink-0" />
                  <div className="flex-1 h-1.5 rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-gray-300"
                      style={{ width: `${40 + j * 10}%` }}
                    />
                  </div>
                  <Skeleton className="h-3 w-6 shrink-0" />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-7 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
