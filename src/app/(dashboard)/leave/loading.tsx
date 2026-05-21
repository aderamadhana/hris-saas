// app/(dashboard)/leave/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import {
  SkeletonPageHeader,
  SkeletonStatsGrid,
  SkeletonTable,
} from "@/components/ui/skeleton-blocks";

export default function LeaveLoading() {
  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <SkeletonPageHeader hasButton hasSubtitle />

      {/* Leave balance cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="border border-gray-200 bg-white p-4 space-y-2"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-12" />
            <div className="h-1.5 w-full rounded bg-gray-200" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-8 w-20 mb-0 rounded-t-[4px] rounded-b-none"
          />
        ))}
      </div>

      <SkeletonTable cols={7} rows={8} />
    </div>
  );
}
