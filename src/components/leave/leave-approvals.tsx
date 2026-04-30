"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Textarea } from "@/src/components/ui/textarea";

interface LeaveApproval {
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
  status: string;
  createdAt: string;
  isPaid?: boolean | null;
  employee: {
    id: string;
    name: string;
    employeeId?: string | null;
    position?: string | null;
    department?: string | null;
  };
  delegate?: {
    name?: string | null;
    position?: string | null;
  } | null;
}

interface LeaveApprovalsProps {
  userRole?: string;
}

export function LeaveApprovals({ userRole = "employee" }: LeaveApprovalsProps) {
  const [approvals, setApprovals] = useState<LeaveApproval[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedRejectId, setSelectedRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canApprove = ["manager", "hr", "admin", "owner"].includes(userRole);

  useEffect(() => {
    loadApprovals();
  }, []);

  async function loadApprovals() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/leave/pending-approvals", {
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to load leave approvals.");
      }

      const items = Array.isArray(data?.approvals)
        ? data.approvals
        : Array.isArray(data?.leaves)
          ? data.leaves
          : Array.isArray(data)
            ? data
            : [];

      setApprovals(items);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load leave approvals.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    setActionLoadingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/leave/${id}/approve`, {
        method: "POST",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to approve leave request.");
      }

      setApprovals((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to approve leave request.",
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReject() {
    if (!selectedRejectId) return;

    setActionLoadingId(selectedRejectId);
    setError(null);

    try {
      const response = await fetch(`/api/leave/${selectedRejectId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: rejectReason.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to reject leave request.");
      }

      setApprovals((current) =>
        current.filter((item) => item.id !== selectedRejectId),
      );
      setSelectedRejectId(null);
      setRejectReason("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reject leave request.",
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  const filteredApprovals = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return approvals;

    return approvals.filter((approval) =>
      [
        approval.employee?.name,
        approval.employee?.employeeId,
        approval.employee?.position,
        approval.employee?.department,
        approval.leaveTypeLabel,
        approval.leaveType,
        approval.reason,
        approval.delegate?.name,
        approval.delegate?.position,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [approvals, search]);

  if (loading) {
    return (
      <section className="border border-gray-200 bg-white p-10 text-center">
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#0B5A43]" />
        <p className="mt-3 text-sm text-gray-500">
          Loading pending approvals...
        </p>
      </section>
    );
  }

  return (
    <>
      <div className="space-y-5">
        <header className="flex flex-col gap-4 border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
              Leave Approvals
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Review pending leave requests from your team.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/leave">
              <Button
                variant="outline"
                className="w-full border-[#0B5A43]/30 text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0] sm:w-auto"
              >
                Back to leave
              </Button>
            </Link>

            <Button
              type="button"
              variant="outline"
              onClick={loadApprovals}
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 sm:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </header>

        {error && (
          <div className="flex gap-3 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {!canApprove && (
          <div className="flex gap-3 border border-[#F7A81B]/40 bg-[#FFF4D9] p-3 text-sm text-[#7A5A00]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Your current role does not have approval permission. You can view
              requests, but approval actions are disabled.
            </p>
          </div>
        )}

        <section className="border border-gray-200 bg-white">
          <div className="space-y-3 border-b border-gray-200 p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search employee, leave type, reason, or delegate..."
                  className="h-10 pl-9 focus-visible:ring-[#0B5A43]"
                />
              </div>

              {search.trim() && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="inline-flex items-center justify-center gap-1.5 border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 hover:border-[#0B5A43]/40 hover:bg-[#EAF5F0] hover:text-[#0B5A43]"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Showing {filteredApprovals.length} of {approvals.length} pending
              request{approvals.length === 1 ? "" : "s"}.
            </p>
          </div>

          {filteredApprovals.length === 0 ? (
            <EmptyState hasSearch={Boolean(search.trim())} />
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredApprovals.map((approval) => (
                <ApprovalRow
                  key={approval.id}
                  approval={approval}
                  canApprove={canApprove}
                  loading={actionLoadingId === approval.id}
                  onApprove={() => handleApprove(approval.id)}
                  onReject={() => {
                    setSelectedRejectId(approval.id);
                    setRejectReason("");
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog
        open={Boolean(selectedRejectId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRejectId(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject leave request</DialogTitle>
            <DialogDescription>
              Add a reason so the employee understands why this request was
              rejected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Write rejection reason..."
              rows={4}
              className="resize-none focus-visible:ring-[#0B5A43]"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedRejectId(null);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={!rejectReason.trim() || Boolean(actionLoadingId)}
              onClick={handleReject}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {actionLoadingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ApprovalRow({
  approval,
  canApprove,
  loading,
  onApprove,
  onReject,
}: {
  approval: LeaveApproval;
  canApprove: boolean;
  loading: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isOOO = approval.leaveType === "out_of_office";
  const isUnpaid = approval.isPaid === false;

  return (
    <div className="grid gap-4 p-4 hover:bg-gray-50 lg:grid-cols-[1fr_auto] lg:items-start">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-gray-950">
            {approval.employee?.name || "Unnamed employee"}
          </h3>

          <span className="border border-[#F7A81B]/50 bg-[#FFF4D9] px-2.5 py-1 text-xs font-medium text-[#7A5A00]">
            Pending
          </span>

          {isUnpaid && (
            <span className="border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
              Unpaid
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-gray-500">
          {approval.employee?.employeeId || "-"}
          {approval.employee?.position
            ? ` · ${approval.employee.position}`
            : ""}
          {approval.employee?.department
            ? ` · ${approval.employee.department}`
            : ""}
        </p>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
          <InlineMeta
            icon={<Calendar className="h-3.5 w-3.5" />}
            value={getLeaveLabel(approval)}
          />

          <InlineMeta
            icon={<Clock className="h-3.5 w-3.5" />}
            value={formatDateAndDuration(approval, isOOO)}
          />

          <InlineMeta
            icon={<Calendar className="h-3.5 w-3.5" />}
            value={`Submitted ${formatSafeDate(
              approval.createdAt,
              "MMM d, yyyy",
            )}`}
          />
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-500">
          {approval.reason?.trim() || "No reason provided"}
        </p>

        {approval.delegate && (
          <p className="mt-2 text-xs text-gray-500">
            <span className="font-medium text-gray-700">Delegated to:</span>{" "}
            {approval.delegate.name || "Unnamed delegate"}
            {approval.delegate.position
              ? ` — ${approval.delegate.position}`
              : ""}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
        <Link href={`/leave/${approval.id}`}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-gray-300 text-gray-700 hover:border-[#0B5A43] hover:bg-[#EAF5F0] hover:text-[#0B5A43] sm:w-auto"
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
        </Link>

        <Button
          type="button"
          size="sm"
          disabled={!canApprove || loading}
          onClick={onApprove}
          className="w-full bg-[#0B5A43] text-white hover:bg-[#084735] sm:w-auto"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Approve
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canApprove || loading}
          onClick={onReject}
          className="w-full border-red-200 text-red-700 hover:bg-red-50 sm:w-auto"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Reject
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center bg-gray-100 text-gray-400">
        <CheckCircle className="h-6 w-6" />
      </div>

      <p className="mt-4 font-semibold text-gray-800">
        {hasSearch ? "No matching requests" : "No pending approvals"}
      </p>

      <p className="mt-1 max-w-sm text-sm leading-relaxed text-gray-500">
        {hasSearch
          ? "Try changing your search keyword."
          : "Pending leave requests will appear here when employees submit them."}
      </p>
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

function getLeaveLabel(approval: LeaveApproval) {
  return (
    approval.leaveTypeLabel?.trim() ||
    formatText(approval.leaveType) ||
    "Leave request"
  );
}

function formatDateAndDuration(approval: LeaveApproval, isOOO: boolean) {
  if (isOOO && approval.startTime && approval.endTime) {
    const hours =
      typeof approval.totalHours === "number"
        ? ` (${approval.totalHours.toFixed(1)} hrs)`
        : "";

    return `${formatSafeDate(approval.startDate, "MMM d, yyyy")} · ${
      approval.startTime
    } – ${approval.endTime}${hours}`;
  }

  const start = formatSafeDate(approval.startDate, "MMM d");
  const end = formatSafeDate(approval.endDate, "MMM d, yyyy");
  const days = Number.isFinite(approval.days) ? approval.days : 0;

  return `${start} – ${end} · ${days} ${days === 1 ? "day" : "days"}`;
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
