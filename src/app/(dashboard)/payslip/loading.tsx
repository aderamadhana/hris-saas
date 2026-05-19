// src/app/(dashboard)/payslip/loading.tsx
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  SkeletonPageHeader,
  SkeletonStatsGrid,
} from "@/src/components/ui/skeleton-blocks";

export default function PayslipLoading() {
  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <SkeletonPageHeader hasSubtitle />
      <SkeletonStatsGrid cols={4} />

      {/* Payslip list */}
      <div className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-3 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <Skeleton className="h-10 w-10 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-14 ml-auto" />
              </div>
              <Skeleton className="h-8 w-20 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
