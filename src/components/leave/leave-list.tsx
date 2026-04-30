"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

interface LeaveRequest {
  id: string;
  leaveType: string;
  leaveTypeLabel?: string | null;
  startDate: string;
  endDate: string;
  days: number;
  totalHours?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
  status: "pending" | "approved" | "rejected" | string;
  createdAt: string;
  approvedBy?: string | null;
  rejectedReason?: string | null;
  delegate?: {
    name?: string | null;
    position?: string | null;
  } | null;
  isPaid?: boolean | null;
}

interface LeaveListProps {
  leaves?: LeaveRequest[];
  data?: LeaveRequest[];
  userRole?: string;
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: RefreshCw,
    badge: "border-[#F7A81B]/50 bg-[#FFF4D9] text-[#7A5A00]",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    badge: "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    badge: "border-red-200 bg-red-50 text-red-700",
  },
};

const FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function LeaveList({
  leaves,
  data,
  userRole = "employee",
}: LeaveListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const safeLeaves = Array.isArray(leaves)
    ? leaves
    : Array.isArray(data)
      ? data
      : [];

  const stats = useMemo(() => {
    return {
      total: safeLeaves.length,
      pending: safeLeaves.filter((leave) => leave.status === "pending").length,
      approved: safeLeaves.filter((leave) => leave.status === "approved")
        .length,
      rejected: safeLeaves.filter((leave) => leave.status === "rejected")
        .length,
    };
  }, [safeLeaves]);

  const filteredLeaves = useMemo(() => {
    const query = search.trim().toLowerCase();

    return safeLeaves.filter((leave) => {
      const matchesStatus =
        statusFilter === "all" || leave.status === statusFilter;

      const searchableText = [
        leave.leaveTypeLabel,
        leave.leaveType,
        leave.reason,
        leave.status,
        leave.delegate?.name,
        leave.delegate?.position,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [safeLeaves, search, statusFilter]);

  const hasActiveFilter = search.trim() || statusFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-5">
      <div className="grid border border-gray-200 bg-white md:grid-cols-4">
        <SummaryItem label="Total" value={stats.total} />
        <SummaryItem label="Pending" value={stats.pending} tone="orange" />
        <SummaryItem label="Approved" value={stats.approved} tone="green" />
        <SummaryItem label="Rejected" value={stats.rejected} tone="red" />
      </div>

      <section className="border border-gray-200 bg-white">
        <div className="space-y-3 border-b border-gray-200 p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search leave type, reason, delegate, or status..."
                className="h-10 pl-9 focus-visible:ring-[#0B5A43]"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="h-10 focus:ring-[#0B5A43]">
                <Filter className="mr-2 h-4 w-4 text-gray-400" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => {
                const isActive = statusFilter === filter.value;
                const count =
                  filter.value === "all" ? stats.total : stats[filter.value];

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
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <p className="text-xs text-gray-500">
                Showing {filteredLeaves.length} of {safeLeaves.length}
              </p>

              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#0B5A43]"
                >
                  <X className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {filteredLeaves.length === 0 ? (
          <EmptyState
            hasAnyLeave={safeLeaves.length > 0}
            hasActiveFilter={Boolean(hasActiveFilter)}
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLeaves.map((leave) => (
              <LeaveRow key={leave.id} leave={leave} userRole={userRole} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LeaveRow({
  leave,
  userRole,
}: {
  leave: LeaveRequest;
  userRole: string;
}) {
  const isOOO = leave.leaveType === "out_of_office";
  const leaveLabel = getLeaveLabel(leave);
  const reason = leave.reason?.trim() || "No reason provided";
  const isUnpaid = leave.isPaid === false;

  return (
    <div className="grid gap-4 p-4 hover:bg-gray-50 lg:grid-cols-[1fr_auto] lg:items-start">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-gray-950">{leaveLabel}</h3>

          <StatusBadge status={leave.status} />

          {isUnpaid && (
            <span className="border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
              Unpaid
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
          <InlineMeta
            icon={<Calendar className="h-3.5 w-3.5" />}
            value={formatDateRange(leave, isOOO)}
          />

          <InlineMeta
            icon={<Clock className="h-3.5 w-3.5" />}
            value={formatDuration(leave, isOOO)}
          />

          <InlineMeta
            icon={<FileText className="h-3.5 w-3.5" />}
            value={`Submitted ${formatSafeDate(leave.createdAt, "MMM d, yyyy")}`}
          />
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-500">
          {reason}
        </p>

        {leave.delegate && (
          <p className="mt-2 text-xs text-gray-500">
            <span className="font-medium text-gray-700">Delegated to:</span>{" "}
            {leave.delegate.name || "Unnamed delegate"}
            {leave.delegate.position ? ` — ${leave.delegate.position}` : ""}
          </p>
        )}

        {leave.status === "rejected" && leave.rejectedReason && (
          <div className="mt-3 flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <strong>Reason for rejection:</strong> {leave.rejectedReason}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 lg:justify-end">
        <span className="text-xs text-gray-400">
          {userRole === "employee" ? "My request" : "Team request"}
        </span>

        <Link href={`/leave/${leave.id}`}>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 hover:border-[#0B5A43] hover:bg-[#EAF5F0] hover:text-[#0B5A43]"
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
        </Link>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config =
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ||
    STATUS_CONFIG.pending;

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-medium ${config.badge}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

function SummaryItem({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "orange" | "green" | "red";
}) {
  const valueClass = {
    default: "text-gray-950",
    orange: "text-[#7A5A00]",
    green: "text-[#0B5A43]",
    red: "text-red-700",
  }[tone];

  return (
    <div className="border-b border-gray-200 p-4 md:border-b-0 md:border-r last:border-r-0">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

function InlineMeta({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[#0B5A43]">{icon}</span>
      <span>{value}</span>
    </span>
  );
}

function EmptyState({
  hasAnyLeave,
  hasActiveFilter,
}: {
  hasAnyLeave: boolean;
  hasActiveFilter: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center bg-gray-100 text-gray-400">
        <Calendar className="h-6 w-6" />
      </div>

      <p className="mt-4 font-semibold text-gray-800">
        {hasActiveFilter
          ? "No matching leave requests"
          : "No leave requests yet"}
      </p>

      <p className="mt-1 max-w-sm text-sm leading-relaxed text-gray-500">
        {hasActiveFilter
          ? "Try changing the search keyword or status filter."
          : hasAnyLeave
            ? "No leave requests match the current view."
            : "Submit your first leave request to get started."}
      </p>

      {!hasAnyLeave && (
        <Link href="/leave/new" className="mt-5">
          <Button className="bg-[#0B5A43] text-white hover:bg-[#084735]">
            <Plus className="mr-2 h-4 w-4" />
            Request leave
          </Button>
        </Link>
      )}
    </div>
  );
}

function getLeaveLabel(leave: LeaveRequest) {
  return (
    leave.leaveTypeLabel?.trim() ||
    formatText(leave.leaveType) ||
    "Leave request"
  );
}

function formatDateRange(leave: LeaveRequest, isOOO: boolean) {
  if (isOOO) {
    return formatSafeDate(leave.startDate, "MMM d, yyyy");
  }

  const start = formatSafeDate(leave.startDate, "MMM d");
  const end = formatSafeDate(leave.endDate, "MMM d, yyyy");

  return `${start} – ${end}`;
}

function formatDuration(leave: LeaveRequest, isOOO: boolean) {
  if (isOOO && leave.startTime && leave.endTime) {
    const hours =
      typeof leave.totalHours === "number"
        ? ` (${leave.totalHours.toFixed(1)} hrs)`
        : "";

    return `${leave.startTime} – ${leave.endTime}${hours}`;
  }

  const days = Number.isFinite(leave.days) ? leave.days : 0;

  return `${days} ${days === 1 ? "day" : "days"}`;
}

function formatSafeDate(value: string, pattern: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "-";
  }

  return format(date, pattern);
}

function formatText(value?: string | null) {
  if (!value) return "";

  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
