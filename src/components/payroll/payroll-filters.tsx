"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Filter } from "lucide-react";
import { getMonthName } from "@/src/lib/payroll/calculations";

interface PayrollFiltersProps {
  currentMonth: number;
  currentYear: number;
  statusCounts: {
    draft: number;
    approved: number;
    paid: number;
  };
}

export function PayrollFilters({
  currentMonth,
  currentYear,
  statusCounts,
}: PayrollFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleMonthChange = (month: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", month);
    router.push(`/payroll?${params.toString()}`);
  };

  const handleYearChange = (year: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", year);
    router.push(`/payroll?${params.toString()}`);
  };

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    router.push(`/payroll?${params.toString()}`);
  };

  const handleClearFilters = () => {
    router.push("/payroll");
  };

  const currentStatus = searchParams.get("status") || "all";
  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Month Filter */}
      <select
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={currentMonth}
        onChange={(e) => handleMonthChange(e.target.value)}
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <option key={m} value={m}>
            {getMonthName(m)}
          </option>
        ))}
      </select>

      {/* Year Filter */}
      <select
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={currentYear}
        onChange={(e) => handleYearChange(e.target.value)}
      >
        {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={currentStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
      >
        <option value="all">All Status</option>
        <option value="draft">Draft ({statusCounts.draft})</option>
        <option value="approved">Approved ({statusCounts.approved})</option>
        <option value="paid">Paid ({statusCounts.paid})</option>
      </select>

      {/* Clear Filters */}
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={handleClearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );
}
