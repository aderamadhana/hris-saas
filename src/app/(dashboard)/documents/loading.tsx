// src/app/(dashboard)/documents/loading.tsx
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  SkeletonPageHeader,
  SkeletonStatsGrid,
} from "@/src/components/ui/skeleton-blocks";

export default function DocumentsLoading() {
  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <SkeletonPageHeader hasButton hasSubtitle />
      <SkeletonStatsGrid cols={3} />

      {/* Filter + search */}
      <div className="border border-gray-200 bg-white px-4 py-3 flex items-center gap-3">
        <Skeleton className="h-8 w-48 flex-1 max-w-xs" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-28" />
      </div>

      {/* Document grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="border border-gray-200 bg-white p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-2">
              <Skeleton className="h-5 w-16" />
              <div className="flex gap-1">
                <Skeleton className="h-7 w-7" />
                <Skeleton className="h-7 w-7" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
