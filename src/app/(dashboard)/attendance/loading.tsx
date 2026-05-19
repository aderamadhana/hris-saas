// src/app/(dashboard)/attendance/loading.tsx
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  SkeletonPageHeader,
  SkeletonStatsGrid,
  SkeletonTable,
} from "@/src/components/ui/skeleton-blocks";

export default function AttendanceLoading() {
  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <SkeletonPageHeader hasSubtitle />

      {/* Check-in card */}
      <div className="border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      <SkeletonStatsGrid cols={4} />

      {/* Date filter */}
      <div className="border border-gray-200 bg-white px-4 py-3 flex items-center gap-3">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>

      <SkeletonTable cols={6} rows={8} />
    </div>
  );
}
