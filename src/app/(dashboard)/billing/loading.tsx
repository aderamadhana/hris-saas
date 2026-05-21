// app/(dashboard)/billing/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function BillingLoading() {
  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <div className="border border-gray-200 bg-white p-5">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="mt-1 h-4 w-56" />
      </div>

      {/* Current plan card */}
      <div className="border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div className="h-2 w-2/5 rounded-full bg-gray-300" />
          </div>
          <Skeleton className="h-3 w-40" />
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="border border-gray-200 bg-white p-5 space-y-4"
          >
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-20" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-3.5 shrink-0" />
                  <Skeleton className="h-3.5 flex-1" />
                </div>
              ))}
            </div>
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
