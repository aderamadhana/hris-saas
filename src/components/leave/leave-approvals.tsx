// src/components/leave/leave-approvals.tsx
// Leave Approvals Component - For Managers/HR

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  User,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getLeaveType } from "@/src/lib/leave-types";
import { useToast } from "@/src/hooks/use-toast";

interface Approval {
  approvalId: string;
  level: number;
  sequence: number;
  leave: {
    id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
    isPaid: boolean;
    category: string;
    startTime?: string;
    endTime?: string;
    totalHours?: number;
    delegateTo?: string;
    delegateNotes?: string;
    attachmentUrl?: string;
    employee: {
      id: string;
      name: string;
      email: string;
      position?: string;
      department?: string;
    };
    delegate?: {
      id: string;
      name: string;
    } | null;
    createdAt: string;
  };
}

export function LeaveApprovals() {
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Dialog states
  const [showDialog, setShowDialog] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(
    null,
  );
  const [dialogAction, setDialogAction] = useState<"approve" | "reject">(
    "approve",
  );
  const [comments, setComments] = useState("");

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/leave/pending-approvals");
      const data = await response.json();

      if (data.success) {
        setApprovals(data.approvals);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error("Fetch approvals error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch approvals",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (
    approval: Approval,
    action: "approve" | "reject",
  ) => {
    setSelectedApproval(approval);
    setDialogAction(action);
    setComments("");
    setShowDialog(true);
  };

  const handleApprovalAction = async () => {
    if (!selectedApproval) return;

    setProcessingId(selectedApproval.approvalId);

    try {
      const response = await fetch("/api/leave/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveId: selectedApproval.leave.id,
          action: dialogAction === "approve" ? "approved" : "rejected",
          comments: comments || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process approval");
      }

      toast({
        title: "Success",
        description: data.message || `Leave ${dialogAction}d successfully`,
      });

      // Remove from list
      setApprovals((prev) =>
        prev.filter((a) => a.approvalId !== selectedApproval.approvalId),
      );

      setShowDialog(false);
    } catch (error: any) {
      console.error("Approval action error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process approval",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd MMM yyyy", { locale: idLocale });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (approvals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <p className="text-gray-600 text-center font-medium">
            No pending approvals
          </p>
          <p className="text-sm text-gray-500 mt-2">
            All leave requests have been processed
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pending Approvals ({approvals.length})</span>
              <Badge variant="secondary">{approvals.length} pending</Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        {approvals.map((approval) => {
          const leaveTypeConfig = getLeaveType(approval.leave.leaveType);
          const isProcessing = processingId === approval.approvalId;

          return (
            <Card key={approval.approvalId}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Left side - Leave info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">
                        {leaveTypeConfig?.icon || "📝"}
                      </span>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {leaveTypeConfig?.name || approval.leave.leaveType}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {approval.leave.employee.name}
                        </p>
                        {approval.leave.employee.position && (
                          <p className="text-xs text-gray-500">
                            {approval.leave.employee.position}
                            {approval.leave.employee.department &&
                              ` • ${approval.leave.employee.department}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Approval level badge */}
                    <Badge variant="outline" className="mb-3">
                      Approval Level {approval.level}
                    </Badge>

                    {/* Dates */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>
                          {formatDate(approval.leave.startDate)} -{" "}
                          {formatDate(approval.leave.endDate)}
                        </span>
                      </div>
                      <Badge variant="outline">
                        {approval.leave.days}{" "}
                        {approval.leave.days === 1 ? "day" : "days"}
                      </Badge>
                      {!approval.leave.isPaid && (
                        <Badge variant="destructive">Unpaid</Badge>
                      )}
                    </div>

                    {/* Time (for OOO) */}
                    {approval.leave.startTime && approval.leave.endTime && (
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>
                          {approval.leave.startTime} - {approval.leave.endTime}{" "}
                          ({approval.leave.totalHours} hours)
                        </span>
                      </div>
                    )}

                    {/* Delegation */}
                    {approval.leave.delegate && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">
                            Delegated to: {approval.leave.delegate.name}
                          </span>
                        </div>
                        {approval.leave.delegateNotes && (
                          <p className="text-sm text-blue-700 mt-1 ml-6">
                            {approval.leave.delegateNotes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Reason */}
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">
                        Reason:
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {approval.leave.reason}
                      </p>
                    </div>

                    {/* Document */}
                    {approval.leave.attachmentUrl && (
                      <div className="mt-2">
                        <a
                          href={approval.leave.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          View Supporting Document
                        </a>
                      </div>
                    )}

                    {/* Submitted date */}
                    <p className="text-xs text-gray-500 mt-3">
                      Submitted: {formatDate(approval.leave.createdAt)}
                    </p>
                  </div>

                  {/* Right side - Action buttons */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      onClick={() => handleOpenDialog(approval, "approve")}
                      disabled={isProcessing}
                      className="min-w-[120px]"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={() => handleOpenDialog(approval, "reject")}
                      disabled={isProcessing}
                      className="min-w-[120px]"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Approval Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "approve" ? "Approve" : "Reject"} Leave Request
            </DialogTitle>
            <DialogDescription>
              {dialogAction === "approve"
                ? "Approve this leave request for "
                : "Reject this leave request from "}
              {selectedApproval?.leave.employee.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedApproval && (
              <div className="text-sm">
                <p className="font-medium">
                  {getLeaveType(selectedApproval.leave.leaveType)?.name}
                </p>
                <p className="text-gray-600">
                  {formatDate(selectedApproval.leave.startDate)} -{" "}
                  {formatDate(selectedApproval.leave.endDate)} (
                  {selectedApproval.leave.days} days)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="comments">
                Comments{" "}
                {dialogAction === "reject" && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={
                  dialogAction === "approve"
                    ? "Add comments (optional)"
                    : "Please provide a reason for rejection"
                }
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={dialogAction === "approve" ? "default" : "destructive"}
              onClick={handleApprovalAction}
              disabled={
                processingId !== null ||
                (dialogAction === "reject" && !comments.trim())
              }
            >
              {processingId !== null && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {dialogAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
