// app/(dashboard)/settings/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <div className="border border-gray-200 bg-white p-5">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-8 w-24 rounded-t-[4px] rounded-b-none"
          />
        ))}
      </div>

      {/* Form */}
      <div className="border border-gray-200 bg-white p-6 space-y-5">
        <Skeleton className="h-5 w-40" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 border-t border-gray-100 pt-4">
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  );
}
