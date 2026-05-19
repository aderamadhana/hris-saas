// src/app/(dashboard)/payroll/loading.tsx
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  SkeletonPageHeader,
  SkeletonStatsGrid,
  SkeletonTable,
} from "@/src/components/ui/skeleton-blocks";

export default function PayrollLoading() {
  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <SkeletonPageHeader hasButton hasSubtitle />
      <SkeletonStatsGrid cols={4} />

      {/* Period filter */}
      <div className="border border-gray-200 bg-white px-4 py-3 flex items-center gap-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-28" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-24" />
      </div>

      <SkeletonTable cols={6} rows={10} />
    </div>
  );
}
