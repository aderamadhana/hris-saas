"use client";

// src/components/leave/leave-approvals.tsx

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  isPaid: boolean;
  currentApprovalLevel: number;
  requiresApprovalLevels: number;
  delegateTo?: string | null;
  delegateNotes?: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    position: string;
    department?: { name: string } | null;
  };
  approvals: Array<{
    id: string;
    approverId: string;
    action: string;
    status: string;
    comments?: string | null;
    level: number;
    actionDate: string;
  }>;
  delegate?: {
    firstName: string;
    lastName: string;
  } | null;
}

interface LeaveApprovalsProps {
  userRole: string;
}

const LEAVE_TYPE_LABEL: Record<string, string> = {
  annual: "Cuti Tahunan",
  sick: "Cuti Sakit",
  maternity: "Cuti Melahirkan",
  marriage: "Cuti Menikah",
  child_marriage: "Cuti Menikahkan Anak",
  child_circumcision: "Cuti Khitanan Anak",
  child_baptism: "Cuti Baptis Anak",
  paternity: "Cuti Istri Melahirkan",
  family_death: "Cuti Keluarga Meninggal",
  extended_family_death: "Cuti Keluarga Meninggal (Lain)",
  hajj: "Cuti Haji",
  compensatory: "Cuti Pengganti Libur",
  business_trip_local: "Dinas Luar Kota",
  business_trip_province: "Dinas Luar Provinsi",
  out_of_office: "Out of Office",
  wfh: "Work From Home",
  wfa: "Work From Anywhere",
  unpaid: "Cuti Tanpa Upah",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getLeaveTypeLabel(type: string) {
  return LEAVE_TYPE_LABEL[type] ?? type.replace(/_/g, " ");
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function LeaveApprovals({ userRole }: LeaveApprovalsProps) {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);
  const [approveComment, setApproveComment] = useState<Record<string, string>>(
    {},
  );

  const fetchPendingLeaves = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leave/pending-approvals", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error ?? "Failed to load pending leaves");
      setLeaves(Array.isArray(data.leaves) ? data.leaves : (data.data ?? []));
    } catch (err: any) {
      setError(err.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingLeaves();
  }, []);

  const handleApprove = async (leave: LeaveRequest, approvalId?: string) => {
    setActionLoading(leave.id);
    try {
      const res = await fetch("/api/leave/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveId: leave.id,
          approvalId: approvalId ?? null,
          action: "approved",
          comments: approveComment[leave.id] ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to approve");
      await fetchPendingLeaves();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (leave: LeaveRequest, approvalId?: string) => {
    const reason = rejectReason[leave.id]?.trim();
    if (!reason) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }
    setActionLoading(leave.id);
    try {
      const res = await fetch("/api/leave/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveId: leave.id,
          approvalId: approvalId ?? null,
          action: "rejected",
          rejectedReason: reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to reject");
      setShowRejectForm(null);
      setRejectReason((prev) => ({ ...prev, [leave.id]: "" }));
      await fetchPendingLeaves();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[#0B5A43]" />
        <span className="ml-3 text-sm text-gray-500">
          Loading pending approvals...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
              Leave Approvals
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Review and approve or reject pending leave requests.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchPendingLeaves}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending"
          value={leaves.length}
          tone="orange"
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          label="Level 1"
          value={leaves.filter((l) => l.currentApprovalLevel === 1).length}
          tone="default"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Level 2"
          value={leaves.filter((l) => l.currentApprovalLevel === 2).length}
          tone="default"
          icon={<Calendar className="h-5 w-5" />}
        />
      </div>

      {/* List */}
      {leaves.length === 0 ? (
        <div className="border border-gray-200 bg-white px-4 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center bg-gray-100 text-gray-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <p className="mt-4 font-semibold text-gray-800">
            No pending approvals
          </p>
          <p className="mt-1 text-sm text-gray-500">
            All leave requests have been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave) => {
            const isBusy = actionLoading === leave.id;
            const pendingApproval = leave.approvals.find(
              (a) =>
                a.status === "pending" &&
                a.level === leave.currentApprovalLevel,
            );

            return (
              <div key={leave.id} className="border border-gray-200 bg-white">
                {/* Card header */}
                <div className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#EAF5F0] text-sm font-semibold text-[#0B5A43]">
                    {getInitials(
                      leave.employee.firstName,
                      leave.employee.lastName,
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-950">
                        {leave.employee.firstName} {leave.employee.lastName}
                      </p>
                      <span className="border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
                        {leave.employee.employeeId}
                      </span>
                      <LevelBadge
                        level={leave.currentApprovalLevel}
                        max={leave.requiresApprovalLevels}
                      />
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {leave.employee.position}
                      {leave.employee.department?.name
                        ? ` · ${leave.employee.department.name}`
                        : ""}
                    </p>
                  </div>
                </div>

                {/* Leave details */}
                <div className="border-t border-gray-100 px-5 py-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailItem
                      label="Leave Type"
                      value={getLeaveTypeLabel(leave.leaveType)}
                    />
                    <DetailItem label="Duration" value={`${leave.days} hari`} />
                    <DetailItem
                      label="Start"
                      value={formatDate(leave.startDate)}
                    />
                    <DetailItem label="End" value={formatDate(leave.endDate)} />
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Reason
                    </p>
                    <p className="mt-1 text-sm text-gray-700">{leave.reason}</p>
                  </div>

                  {leave.delegate && (
                    <div className="mt-3 border border-amber-100 bg-amber-50 px-3 py-2 text-sm">
                      <span className="font-medium text-amber-800">
                        Delegated to:{" "}
                      </span>
                      <span className="text-amber-700">
                        {leave.delegate.firstName} {leave.delegate.lastName}
                      </span>
                      {leave.delegateNotes && (
                        <p className="mt-1 text-xs text-amber-600">
                          {leave.delegateNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {!leave.isPaid && (
                    <div className="mt-2 border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                      Unpaid leave — tidak memotong cuti berbayar
                    </div>
                  )}
                </div>

                {/* Approve comment */}
                <div className="border-t border-gray-100 px-5 py-3">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Comment (optional)
                  </label>
                  <input
                    type="text"
                    value={approveComment[leave.id] ?? ""}
                    onChange={(e) =>
                      setApproveComment((prev) => ({
                        ...prev,
                        [leave.id]: e.target.value,
                      }))
                    }
                    placeholder="Add approval comment..."
                    className="h-9 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
                    disabled={isBusy}
                  />
                </div>

                {/* Reject form */}
                {showRejectForm === leave.id && (
                  <div className="border-t border-red-100 bg-red-50 px-5 py-3">
                    <label className="mb-1 block text-xs font-medium text-red-700">
                      Rejection reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={rejectReason[leave.id] ?? ""}
                      onChange={(e) =>
                        setRejectReason((prev) => ({
                          ...prev,
                          [leave.id]: e.target.value,
                        }))
                      }
                      placeholder="Explain why this leave request is rejected..."
                      className="w-full border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-500"
                      disabled={isBusy}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 px-5 py-4">
                  {showRejectForm === leave.id ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRejectForm(null)}
                        disabled={isBusy}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleReject(leave, pendingApproval?.id)}
                        disabled={isBusy}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        {isBusy ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-2 h-3.5 w-3.5" />
                            Confirm Reject
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRejectForm(leave.id)}
                        disabled={isBusy}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="mr-2 h-3.5 w-3.5" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleApprove(leave, pendingApproval?.id)
                        }
                        disabled={isBusy}
                        className="bg-[#0B5A43] text-white hover:bg-[#084735]"
                      >
                        {isBusy ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-3.5 w-3.5" />
                            Approve
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "default" | "orange" | "green";
  icon: React.ReactNode;
}) {
  const cls = {
    default: {
      icon: "border-gray-200 bg-gray-50 text-gray-600",
      value: "text-gray-950",
    },
    orange: {
      icon: "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]",
      value: "text-[#7A5A00]",
    },
    green: {
      icon: "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]",
      value: "text-[#0B5A43]",
    },
  }[tone];

  return (
    <div className="border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className={`mt-2 text-3xl font-semibold ${cls.value}`}>{value}</p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center border ${cls.icon}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

function LevelBadge({ level, max }: { level: number; max: number }) {
  const isHR = level === 2;
  return (
    <span
      className={`border px-2 py-0.5 text-[11px] font-semibold ${
        isHR
          ? "border-purple-200 bg-purple-50 text-purple-700"
          : "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]"
      }`}
    >
      {isHR ? "HR Review" : "Manager Review"} · Level {level}/{max}
    </span>
  );
}
