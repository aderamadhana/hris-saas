"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  User,
  FileText,
  AlertCircle,
  MessageSquare,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";

interface PendingLeave {
  id: string;
  leaveTypeLabel: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  totalHours?: number;
  startTime?: string;
  endTime?: string;
  reason: string;
  attachmentUrl?: string;
  requiresApprovalLevels: number;
  currentApprovalLevel: number;
  delegate?: { name: string; position: string } | null;
  delegateNotes?: string;
  employee: {
    name: string;
    position: string;
    department?: string;
    email: string;
  };
}

export function LeaveApprovals({ userRole }: { userRole: string }) {
  const [leaves, setLeaves] = useState<PendingLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLeave, setActionLeave] = useState<PendingLeave | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/leave/pending-approvals")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setLeaves(data.leaves ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAction() {
    if (!actionLeave || !action) return;
    if (action === "reject" && rejectionReason.trim().length < 5) {
      setError(
        "Please provide a reason for rejecting this request (min 5 characters).",
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/leave/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveId: actionLeave.id,
          action,
          comments: action === "approve" ? comment : rejectionReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      // Remove from list
      setLeaves((prev) => prev.filter((l) => l.id !== actionLeave.id));
      setActionLeave(null);
      setAction(null);
      setComment("");
      setRejectionReason("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function openDialog(leave: PendingLeave, act: "approve" | "reject") {
    setActionLeave(leave);
    setAction(act);
    setComment("");
    setRejectionReason("");
    setError(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Approvals</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and respond to pending leave requests
        </p>
      </div>

      {/* Count badge */}
      {leaves.length > 0 && (
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700">
          <AlertCircle className="h-4 w-4" />
          {leaves.length} request{leaves.length !== 1 ? "s" : ""} awaiting your
          approval
        </div>
      )}

      {/* List */}
      {leaves.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <CheckCircle className="mb-3 h-12 w-12 text-gray-200" />
          <p className="font-semibold text-gray-400">No pending approvals</p>
          <p className="mt-1 text-sm text-gray-300">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave) => (
            <div
              key={leave.id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Info */}
                <div className="flex-1 space-y-3">
                  {/* Leave type + level */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {leave.leaveTypeLabel}
                    </span>
                    <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      Approval level {leave.currentApprovalLevel} of{" "}
                      {leave.requiresApprovalLevels}
                    </span>
                  </div>

                  {/* Employee */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{leave.employee.name}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">
                      {leave.employee.position}
                    </span>
                    {leave.employee.department && (
                      <>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-500">
                          {leave.employee.department}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-blue-400" />
                      {leave.leaveType === "out_of_office" ? (
                        <span>
                          {format(new Date(leave.startDate), "MMM d, yyyy")}
                        </span>
                      ) : (
                        <span>
                          {format(new Date(leave.startDate), "MMM d")} –{" "}
                          {format(new Date(leave.endDate), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-purple-400" />
                      {leave.leaveType === "out_of_office" &&
                      leave.startTime ? (
                        <span>
                          {leave.startTime} – {leave.endTime} (
                          {leave.totalHours?.toFixed(1)} hrs)
                        </span>
                      ) : (
                        <span>
                          {leave.days} {leave.days === 1 ? "day" : "days"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reason */}
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {leave.reason}
                  </p>

                  {/* Delegation */}
                  {leave.delegate && (
                    <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      <User className="mr-1 inline h-3.5 w-3.5" />
                      <strong>Delegated to:</strong> {leave.delegate.name} —{" "}
                      {leave.delegate.position}
                      {leave.delegateNotes && (
                        <span className="ml-2 text-amber-600">
                          · {leave.delegateNotes}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Document */}
                  {leave.attachmentUrl && (
                    <a
                      href={leave.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View supporting document
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 sm:flex-col">
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 sm:flex-none"
                    onClick={() => openDialog(leave, "approve")}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5 border-red-200 text-red-600 hover:bg-red-50 sm:flex-none"
                    onClick={() => openDialog(leave, "reject")}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve / Reject Dialog */}
      <Dialog open={!!actionLeave} onOpenChange={() => setActionLeave(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle
              className={
                action === "approve" ? "text-green-700" : "text-red-700"
              }
            >
              {action === "approve"
                ? "Approve Leave Request"
                : "Reject Leave Request"}
            </DialogTitle>
          </DialogHeader>

          {actionLeave && (
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium text-gray-800">
                  {actionLeave.employee.name}
                </span>
              </p>
              <p>
                {actionLeave.leaveTypeLabel} · {actionLeave.days}{" "}
                {actionLeave.days === 1 ? "day" : "days"}
              </p>
              <p>
                {format(new Date(actionLeave.startDate), "MMM d")} –{" "}
                {format(new Date(actionLeave.endDate), "MMM d, yyyy")}
              </p>
            </div>
          )}

          {action === "approve" ? (
            <div className="space-y-2">
              <Label htmlFor="comment">Comments (optional)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add any notes or conditions for this approval…"
                rows={3}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="rejection">
                Reason for rejection <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejection"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please explain why this request cannot be approved…"
                rows={3}
              />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionLeave(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={submitting}
              className={
                action === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…
                </>
              ) : action === "approve" ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" /> Confirm Approval
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" /> Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
