// app/(dashboard)/announcements/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonPageHeader } from "@/components/ui/skeleton-blocks";

export default function AnnouncementsLoading() {
  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <SkeletonPageHeader hasButton hasSubtitle />

      {/* Announcement cards */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border border-gray-200 bg-white p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-14" />
                </div>
                <Skeleton className="h-5 w-2/3" />
              </div>
              <Skeleton className="h-7 w-7 shrink-0" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-5/6" />
              <Skeleton className="h-3.5 w-4/6" />
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-3.5 w-24" />
              </div>
              <Skeleton className="h-3.5 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
