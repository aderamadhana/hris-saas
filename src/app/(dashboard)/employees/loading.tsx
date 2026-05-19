// src/app/(dashboard)/employees/loading.tsx
import {
  SkeletonPageHeader,
  SkeletonStatsGrid,
  SkeletonTable,
} from "@/src/components/ui/skeleton-blocks";

export default function EmployeesLoading() {
  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <SkeletonPageHeader hasButton hasSubtitle />
      <SkeletonStatsGrid cols={4} />
      <SkeletonTable cols={6} rows={10} />
    </div>
  );
}
