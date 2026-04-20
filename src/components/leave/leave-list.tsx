// src/components/leave/leave-list.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  User,
  FileText,
  ChevronDown,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  getLeaveType,
  getStatusLabel,
  getStatusColor,
  formatLeaveDate,
} from "@/src/lib/leave-types";

interface LeaveItem {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  isPaid: boolean;
  category: string;
  startTime?: string | null;
  endTime?: string | null;
  totalHours?: number | null;
  delegateTo?: string | null;
  delegateNotes?: string | null;
  attachmentUrl?: string | null;
  approvedAt?: string | null;
  rejectedReason?: string | null;
  employee: { id: string; name: string; email: string };
  delegate?: { id: string; name: string } | null;
  createdAt: string;
}

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

// English status labels override for leave-types helper
const STATUS_LABEL_EN: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export function LeaveList() {
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLeaves = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (activeStatus !== "all") params.set("status", activeStatus);
      const res = await fetch(`/api/leave/list?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch data");
      setLeaves(data.leaves ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch leave requests");
    } finally {
      setIsLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const toggleExpand = (id: string) =>
    setExpandedId((p) => (p === id ? null : id));

  const statusLabel = (s: string) => STATUS_LABEL_EN[s] ?? s;

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border bg-gray-50 p-1 w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveStatus(tab.value)}
              className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                activeStatus === tab.value
                  ? "bg-white text-gray-900 shadow-sm border"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={fetchLeaves}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-5 w-5 animate-spin text-gray-400 mr-2" />
          <span className="text-gray-500">Loading...</span>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Failed to load data
            </p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLeaves}>
            Retry
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && leaves.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Calendar className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-base font-medium text-gray-900">
            No leave requests found
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {activeStatus !== "all"
              ? `No ${statusLabel(activeStatus).toLowerCase()} leave requests`
              : 'Click "Request Leave" to submit a new request'}
          </p>
          {activeStatus !== "all" && (
            <button
              onClick={() => setActiveStatus("all")}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              View all
            </button>
          )}
        </div>
      )}

      {/* Leave cards */}
      {!isLoading && !error && leaves.length > 0 && (
        <div className="space-y-3">
          {leaves.map((leave) => {
            const typeConfig = getLeaveType(leave.leaveType);
            const isExpanded = expandedId === leave.id;
            const isOOO = leave.leaveType === "out_of_office";

            return (
              <div
                key={leave.id}
                className="rounded-lg border bg-white overflow-hidden"
              >
                {/* Card header */}
                <div
                  className="flex items-start justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(leave.id)}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Status bar */}
                    <div
                      className={`mt-1 h-10 w-1 rounded-full flex-shrink-0 ${
                        leave.status === "approved"
                          ? "bg-green-500"
                          : leave.status === "rejected"
                            ? "bg-red-500"
                            : "bg-yellow-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">
                          {typeConfig?.name ?? leave.leaveType}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(leave.status)}`}
                        >
                          {statusLabel(leave.status)}
                        </span>
                        {!leave.isPaid && (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700 border border-red-100">
                            Unpaid
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatLeaveDate(leave.startDate)}
                          {leave.startDate !== leave.endDate && (
                            <> — {formatLeaveDate(leave.endDate)}</>
                          )}
                        </span>
                        {isOOO && leave.startTime && leave.endTime ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {leave.startTime} — {leave.endTime}
                            {leave.totalHours &&
                              ` (${leave.totalHours.toFixed(1)} hrs)`}
                          </span>
                        ) : (
                          <span className="font-medium text-gray-700">
                            {leave.days} day{leave.days !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        {leave.employee.name}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 flex-shrink-0 ml-2 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t px-4 py-4 bg-gray-50 space-y-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                        Reason
                      </p>
                      <p className="text-gray-700">{leave.reason}</p>
                    </div>
                    {leave.delegate && (
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                          Delegated to
                        </p>
                        <p className="flex items-center gap-1.5 text-gray-700">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          {leave.delegate.name}
                        </p>
                        {leave.delegateNotes && (
                          <p className="mt-1 text-gray-500 text-xs pl-5">
                            {leave.delegateNotes}
                          </p>
                        )}
                      </div>
                    )}
                    {leave.attachmentUrl && (
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                          Document
                        </p>
                        <a
                          href={leave.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-blue-600 hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5" /> View document
                        </a>
                      </div>
                    )}
                    {leave.status === "rejected" && leave.rejectedReason && (
                      <div className="rounded border border-red-200 bg-red-50 p-3">
                        <p className="text-xs font-medium text-red-700 mb-1">
                          Rejection reason
                        </p>
                        <p className="text-red-600">{leave.rejectedReason}</p>
                      </div>
                    )}
                    {leave.status === "approved" && leave.approvedAt && (
                      <div className="rounded border border-green-200 bg-green-50 p-3">
                        <p className="text-xs text-green-700">
                          Approved on {formatLeaveDate(leave.approvedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
