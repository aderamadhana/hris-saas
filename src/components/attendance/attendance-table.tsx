"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle,
  Clock,
  LogOut,
  Search,
  X,
} from "lucide-react";

import { Input } from "@/src/components/ui/input";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string | null;
  department: string | null;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  notes?: string | null;
}

interface AttendanceTableProps {
  data?: AttendanceRecord[];
  selectedDate: string;
  canEdit?: boolean;
}

type StatusFilter = "all" | "present" | "late" | "absent" | "leave";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    className: string;
    dotClassName: string;
    icon: ReactNode;
  }
> = {
  present: {
    label: "Present",
    className: "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]",
    dotClassName: "bg-[#0B5A43]",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  late: {
    label: "Late",
    className: "border-[#F7A81B]/50 bg-[#FFF4D9] text-[#7A5A00]",
    dotClassName: "bg-[#F7A81B]",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  absent: {
    label: "Absent",
    className: "border-red-200 bg-red-50 text-red-700",
    dotClassName: "bg-red-500",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  leave: {
    label: "On Leave",
    className: "border-gray-200 bg-gray-50 text-gray-700",
    dotClassName: "bg-gray-400",
    icon: <CalendarDays className="h-3.5 w-3.5" />,
  },
};

const FILTERS: Array<{
  value: StatusFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
  { value: "leave", label: "Leave" },
];

export function AttendanceTable({
  data = [],
  selectedDate,
  canEdit = false,
}: AttendanceTableProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const records = Array.isArray(data) ? data : [];

  const statusCounts = useMemo(() => {
    return {
      all: records.length,
      present: records.filter((record) => record.status === "present").length,
      late: records.filter((record) => record.status === "late").length,
      absent: records.filter((record) => record.status === "absent").length,
      leave: records.filter((record) => record.status === "leave").length,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesStatus =
        statusFilter === "all" || record.status === statusFilter;

      const matchesSearch =
        !query ||
        [
          record.employeeName,
          record.employeeId,
          record.position,
          record.department,
          record.status,
          record.notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [records, search, statusFilter]);

  const hasActiveFilter = search.trim() || statusFilter !== "all";

  const handleDateChange = (date: string) => {
    router.push(`/attendance?date=${encodeURIComponent(date)}`);
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-gray-200 p-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-950">
            Attendance records
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {formatReadableDate(selectedDate)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600">
            {filteredRecords.length} shown
          </span>

          <span className="border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600">
            {records.length} total
          </span>

          {canEdit && (
            <span className="border border-[#F7A81B]/50 bg-[#FFF4D9] px-2.5 py-1 text-xs font-medium text-[#7A5A00]">
              Admin access
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 border-b border-gray-200 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee, ID, department, status, or notes..."
              className="h-10 pl-9 focus-visible:ring-[#0B5A43]"
            />
          </div>

          <Input
            type="date"
            value={selectedDate}
            onChange={(event) => handleDateChange(event.target.value)}
            className="h-10 focus-visible:ring-[#0B5A43]"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const isActive = statusFilter === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={
                    isActive
                      ? "border border-[#0B5A43] bg-[#0B5A43] px-3 py-1.5 text-xs font-semibold text-white"
                      : "border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-[#0B5A43]/40 hover:bg-[#EAF5F0] hover:text-[#0B5A43]"
                  }
                >
                  {filter.label}{" "}
                  <span
                    className={isActive ? "text-white/75" : "text-gray-400"}
                  >
                    {statusCounts[filter.value]}
                  </span>
                </button>
              );
            })}
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#0B5A43]"
            >
              <X className="h-3.5 w-3.5" />
              Reset filters
            </button>
          )}
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Check in</TableHead>
              <TableHead>Check out</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <EmptyState hasActiveFilter={Boolean(hasActiveFilter)} />
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <EmployeeCell record={record} />
                  </td>

                  <td className="px-4 py-4 text-gray-600">
                    {record.department || "—"}
                  </td>

                  <td className="px-4 py-4">
                    <TimeCell value={record.checkIn} type="in" />
                  </td>

                  <td className="px-4 py-4">
                    <TimeCell value={record.checkOut} type="out" />
                  </td>

                  <td className="px-4 py-4 font-medium text-gray-700">
                    {calculateWorkHours(record.checkIn, record.checkOut)}
                  </td>

                  <td className="px-4 py-4">
                    <StatusBadge status={record.status} />
                  </td>

                  <td className="max-w-[280px] px-4 py-4 text-gray-500">
                    <p className="truncate">{record.notes || "—"}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-gray-100 md:hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState hasActiveFilter={Boolean(hasActiveFilter)} />
          </div>
        ) : (
          filteredRecords.map((record) => (
            <MobileRecord key={record.id} record={record} />
          ))
        )}
      </div>
    </section>
  );
}

function EmployeeCell({ record }: { record: AttendanceRecord }) {
  return (
    <div className="flex min-w-[220px] items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#EAF5F0] text-xs font-semibold text-[#0B5A43]">
        {getInitials(record.employeeName)}
      </div>

      <div className="min-w-0">
        <p className="truncate font-medium text-gray-950">
          {formatEmployeeName(record.employeeName)}
        </p>
        <p className="mt-0.5 truncate text-xs text-gray-500">
          {record.employeeId}
          {record.position ? ` · ${record.position}` : ""}
        </p>
      </div>
    </div>
  );
}

function MobileRecord({ record }: { record: AttendanceRecord }) {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <EmployeeCell record={record} />
        <StatusBadge status={record.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <MobileInfo label="Department" value={record.department || "—"} />
        <MobileInfo
          label="Hours"
          value={calculateWorkHours(record.checkIn, record.checkOut)}
        />
        <MobileInfo
          label="Check in"
          value={<TimeCell value={record.checkIn} type="in" />}
        />
        <MobileInfo
          label="Check out"
          value={<TimeCell value={record.checkOut} type="out" />}
        />
      </div>

      {record.notes && (
        <div className="mt-3 border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Notes
          </p>
          <p className="mt-1 text-sm text-gray-700">{record.notes}</p>
        </div>
      )}
    </div>
  );
}

function MobileInfo({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <div className="mt-1 font-medium text-gray-900">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: formatStatus(status),
    className: "border-gray-200 bg-gray-50 text-gray-700",
    dotClassName: "bg-gray-400",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function TimeCell({
  value,
  type,
}: {
  value: string | null;
  type: "in" | "out";
}) {
  if (!value) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-gray-700">
      <span className="text-[#0B5A43]">
        {type === "in" ? (
          <Clock className="h-3.5 w-3.5" />
        ) : (
          <LogOut className="h-3.5 w-3.5" />
        )}
      </span>
      {formatTime(value)}
    </span>
  );
}

function TableHead({ children }: { children: ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </th>
  );
}

function EmptyState({ hasActiveFilter }: { hasActiveFilter: boolean }) {
  return (
    <div>
      <div className="mx-auto flex h-10 w-10 items-center justify-center bg-gray-100 text-gray-400">
        <CalendarDays className="h-5 w-5" />
      </div>

      <p className="mt-3 text-sm font-medium text-gray-800">
        {hasActiveFilter ? "No matching records" : "No attendance records"}
      </p>

      <p className="mt-1 text-sm text-gray-500">
        {hasActiveFilter
          ? "Try changing the search keyword or status filter."
          : "There are no attendance records for this date yet."}
      </p>
    </div>
  );
}

function formatTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function calculateWorkHours(checkIn: string | null, checkOut: string | null) {
  if (!checkIn || !checkOut) return "—";

  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "—";
  }

  const diffMs = end.getTime() - start.getTime();

  if (diffMs <= 0) return "—";

  const hours = diffMs / 1000 / 60 / 60;

  return `${hours.toFixed(1)}h`;
}

function formatEmployeeName(value: string) {
  return value.replace(/\s+/g, " ").trim() || "Unnamed employee";
}

function getInitials(name: string) {
  const parts = formatEmployeeName(name).split(" ");

  const first = parts[0]?.charAt(0) ?? "";
  const second = parts[1]?.charAt(0) ?? "";

  return `${first}${second}`.toUpperCase() || "U";
}

function formatStatus(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatReadableDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return value;

  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
