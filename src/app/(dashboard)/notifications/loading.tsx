// src/app/(dashboard)/notifications/loading.tsx
import { Skeleton } from "@/src/components/ui/skeleton";
import { SkeletonPageHeader } from "@/src/components/ui/skeleton-blocks";

export default function NotificationsLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>

      {/* Notification list */}
      <div className="border border-gray-200 bg-white divide-y divide-gray-100">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 px-5 py-4">
            <Skeleton className="h-9 w-9 rounded-full shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-24" />
            </div>
            {i % 3 === 0 && (
              <Skeleton className="h-2 w-2 rounded-full mt-2 shrink-0 bg-green-300" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
