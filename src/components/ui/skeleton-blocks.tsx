// src/components/ui/skeleton-blocks.tsx
// Reusable skeleton pieces — import from loading.tsx files

import { Skeleton } from "./skeleton";

/** Page header card — matches the "border border-gray-200 bg-white p-5" headers */
export function SkeletonPageHeader({
  hasButton = false,
  hasSubtitle = true,
}: {
  hasButton?: boolean;
  hasSubtitle?: boolean;
}) {
  return (
    <div className="border border-gray-200 bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          {hasSubtitle && <Skeleton className="h-4 w-72" />}
        </div>
        {hasButton && <Skeleton className="h-9 w-32 shrink-0" />}
      </div>
    </div>
  );
}

/** Stats grid — 4-column summary bar */
export function SkeletonStatsGrid({ cols = 4 }: { cols?: number }) {
  return (
    <div
      className="border border-gray-200 bg-white"
      style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="border-b border-gray-200 p-4 last:border-r-0 md:border-b-0 md:border-r"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-10 w-10 shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Table skeleton — header + N rows */
export function SkeletonTable({
  cols = 5,
  rows = 8,
}: {
  cols?: number;
  rows?: number;
}) {
  return (
    <div className="border border-gray-200 bg-white">
      {/* toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-8 w-24" />
      </div>
      {/* head */}
      <div
        className="grid border-b border-gray-200 px-4 py-2"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 w-20" />
        ))}
      </div>
      {/* rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div
          key={ri}
          className="grid items-center border-b border-gray-100 px-4 py-3 last:border-b-0"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, ci) => (
            <Skeleton
              key={ci}
              className="h-4"
              style={{
                width: ci === 0 ? "80%" : ci === cols - 1 ? "60%" : "70%",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Card grid — N cards (for dashboards) */
export function SkeletonCardGrid({
  count = 4,
  cols = 4,
}: {
  count?: number;
  cols?: number;
}) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-8 w-8" />
          </div>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

/** Two-col layout skeleton (sidebar card + main content) */
export function SkeletonTwoCol() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <SkeletonTable rows={6} cols={4} />
      </div>
      <div className="space-y-4">
        <div className="border border-gray-200 bg-white p-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Form skeleton — generic form fields */
export function SkeletonForm({ fields = 6 }: { fields?: number }) {
  return (
    <div className="border border-gray-200 bg-white p-6">
      <div className="space-y-5 max-w-2xl">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  );
}

/** Profile card skeleton */
export function SkeletonProfileCard() {
  return (
    <div className="border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-5">
        <Skeleton className="h-20 w-20 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Calendar grid skeleton */
export function SkeletonCalendar() {
  return (
    <div className="border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-gray-200">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="border-r border-gray-100 p-2 last:border-r-0">
            <Skeleton className="h-3 w-6 mx-auto" />
          </div>
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, ri) => (
        <div
          key={ri}
          className="grid grid-cols-7 border-b border-gray-100 last:border-b-0"
        >
          {Array.from({ length: 7 }).map((_, ci) => (
            <div
              key={ci}
              className="min-h-[80px] border-r border-gray-100 p-2 last:border-r-0"
            >
              <Skeleton className="h-4 w-4 mb-1" />
              {Math.random() > 0.7 && <Skeleton className="h-5 w-full mt-1" />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
