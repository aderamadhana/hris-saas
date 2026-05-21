// app/(dashboard)/profile/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonStatsGrid } from "@/components/ui/skeleton-blocks";

export default function ProfileLoading() {
  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      {/* Profile card */}
      <div className="border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Skeleton className="h-20 w-20 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-56" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
          <Skeleton className="h-9 w-28 shrink-0" />
        </div>
      </div>

      {/* Stats */}
      <SkeletonStatsGrid cols={4} />

      {/* Info sections */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="border border-gray-200 bg-white p-5 space-y-4"
          >
            <Skeleton className="h-4 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex justify-between">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-32" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
