// src/app/(dashboard)/dashboard/loading.tsx
import { Skeleton } from "@/src/components/ui/skeleton";
import { SkeletonCardGrid } from "@/src/components/ui/skeleton-blocks";

export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      {/* Welcome banner */}
      <div className="border border-gray-200 bg-white p-5">
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>

      {/* Stats cards */}
      <SkeletonCardGrid count={4} cols={4} />

      {/* Two-col: recent activity + quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent leaves / activity */}
        <div className="lg:col-span-2 border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-3">
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <div className="border border-gray-200 bg-white p-4 space-y-3">
            <Skeleton className="h-4 w-28" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>

          <div className="border border-gray-200 bg-white p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
