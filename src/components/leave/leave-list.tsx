"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Plus,
  Filter,
  Search,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

// ─── Types ───────────────────────────────────────────────────────────────────
interface LeaveRequest {
  id: string;
  leaveType: string;
  leaveTypeLabel: string;
  startDate: string;
  endDate: string;
  days: number;
  totalHours?: number;
  startTime?: string;
  endTime?: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedBy?: string;
  rejectedReason?: string;
  delegate?: { name: string; position: string } | null;
  isPaid: boolean;
}

interface LeaveListProps {
  leaves: LeaveRequest[];
  userRole: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: RefreshCw,
    badge: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    badge: "bg-green-50 text-green-700 border-green-200",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    badge: "bg-red-50 text-red-700 border-red-200",
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg =
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.badge}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export function LeaveList({ leaves, userRole }: LeaveListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const canApprove = ["manager", "hr", "admin", "owner"].includes(userRole);

  const filtered = leaves.filter((l) => {
    const matchSearch =
      l.leaveTypeLabel.toLowerCase().includes(search.toLowerCase()) ||
      l.reason.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: leaves.length,
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            {userRole === "employee"
              ? "Manage your leave requests"
              : "Manage team leave requests"}
          </p>
        </div>
        <div className="flex gap-2">
          {canApprove && (
            <Link href="/leave/approvals">
              <Button variant="outline" size="sm" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Pending Approvals
                {stats.pending > 0 && (
                  <span className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    {stats.pending}
                  </span>
                )}
              </Button>
            </Link>
          )}
          <Link href="/leave/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Request Leave
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total",
            value: stats.total,
            color: "text-gray-700",
            bg: "bg-gray-50 border-gray-200",
          },
          {
            label: "Pending",
            value: stats.pending,
            color: "text-amber-700",
            bg: "bg-amber-50 border-amber-200",
          },
          {
            label: "Approved",
            value: stats.approved,
            color: "text-green-700",
            bg: "bg-green-50 border-green-200",
          },
          {
            label: "Rejected",
            value: stats.rejected,
            color: "text-red-700",
            bg: "bg-red-50 border-red-200",
          },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-0.5 text-xs font-medium text-gray-500">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search leave type or reason…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="mr-2 h-4 w-4 text-gray-400" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <Calendar className="mb-3 h-12 w-12 text-gray-200" />
          <p className="font-semibold text-gray-400">No leave requests found</p>
          <p className="mt-1 text-sm text-gray-300">
            {leaves.length === 0
              ? "Submit your first leave request to get started."
              : "Try adjusting your search or filter."}
          </p>
          {leaves.length === 0 && (
            <Link href="/leave/new" className="mt-4">
              <Button size="sm" variant="outline">
                Request Leave
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((leave) => (
            <LeaveCard key={leave.id} leave={leave} userRole={userRole} />
          ))}
        </div>
      )}
    </div>
  );
}

function LeaveCard({
  leave,
  userRole,
}: {
  leave: LeaveRequest;
  userRole: string;
}) {
  const isOOO = leave.leaveType === "out_of_office";

  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-gray-200 hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              {leave.leaveTypeLabel}
            </h3>
            <StatusBadge status={leave.status} />
            {!leave.isPaid && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 border border-red-200">
                Unpaid
              </span>
            )}
          </div>

          {/* Date / Time */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-400" />
              {isOOO ? (
                <span>{format(new Date(leave.startDate), "MMM d, yyyy")}</span>
              ) : (
                <span>
                  {format(new Date(leave.startDate), "MMM d")} –{" "}
                  {format(new Date(leave.endDate), "MMM d, yyyy")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-purple-400" />
              {isOOO && leave.startTime && leave.endTime ? (
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
          <p className="text-sm text-gray-500 line-clamp-2">{leave.reason}</p>

          {/* Delegate */}
          {leave.delegate && (
            <p className="text-xs text-gray-400">
              <span className="font-medium text-gray-600">Delegated to:</span>{" "}
              {leave.delegate.name} — {leave.delegate.position}
            </p>
          )}

          {/* Rejection reason */}
          {leave.status === "rejected" && leave.rejectedReason && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>
                <strong>Reason for rejection:</strong> {leave.rejectedReason}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {format(new Date(leave.createdAt), "MMM d")}
          </span>
          <Link href={`/leave/${leave.id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
