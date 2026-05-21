// app/(dashboard)/calendar/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonCalendar } from "@/components/ui/skeleton-blocks";

export default function CalendarLoading() {
  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <SkeletonCalendar />
    </div>
  );
}
