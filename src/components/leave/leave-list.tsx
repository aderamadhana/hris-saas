// src/components/leave/leave-list.tsx
// Leave List Component - Client Component

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Loader2, Calendar, Clock, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getLeaveType } from "@/src/lib/leave-types";

interface Leave {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  isPaid: boolean;
  category: string;
  startTime?: string;
  endTime?: string;
  totalHours?: number;
  delegateTo?: string;
  delegateNotes?: string;
  employee: {
    id: string;
    name: string;
    email: string;
  };
  delegate?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
}

export function LeaveList() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter, typeFilter]);

  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);

      const response = await fetch(`/api/leave/list?${params}`);
      const data = await response.json();

      if (data.success) {
        setLeaves(data.leaves);
      }
    } catch (error) {
      console.error("Fetch leaves error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", label: "Pending" },
      approved: {
        variant: "default",
        label: "Approved",
        className: "bg-green-600",
      },
      rejected: { variant: "destructive", label: "Rejected" },
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Leave Type
              </label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="annual">Cuti Tahunan</SelectItem>
                  <SelectItem value="sick">Cuti Sakit</SelectItem>
                  <SelectItem value="maternity">Cuti Melahirkan</SelectItem>
                  <SelectItem value="marriage">Cuti Menikah</SelectItem>
                  <SelectItem value="out_of_office">Out of Office</SelectItem>
                  <SelectItem value="wfh">Work From Home</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Items */}
      {leaves.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">No leave requests found</p>
            <p className="text-sm text-gray-500 mt-2">
              Try adjusting your filters or create a new request
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave) => {
            const leaveTypeConfig = getLeaveType(leave.leaveType);

            return (
              <Card key={leave.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Left side */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">
                          {leaveTypeConfig?.icon || "📝"}
                        </span>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {leaveTypeConfig?.name || leave.leaveType}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {leave.employee.name}
                          </p>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            {formatDate(leave.startDate)} -{" "}
                            {formatDate(leave.endDate)}
                          </span>
                        </div>
                        <Badge variant="outline">
                          {leave.days} {leave.days === 1 ? "day" : "days"}
                        </Badge>
                        {!leave.isPaid && (
                          <Badge variant="destructive">Unpaid</Badge>
                        )}
                      </div>

                      {/* Time (for OOO) */}
                      {leave.startTime && leave.endTime && (
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>
                            {leave.startTime} - {leave.endTime} (
                            {leave.totalHours} hours)
                          </span>
                        </div>
                      )}

                      {/* Delegation */}
                      {leave.delegate && (
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>
                            Delegated to: <strong>{leave.delegate.name}</strong>
                          </span>
                        </div>
                      )}

                      {/* Reason */}
                      <div className="mt-3">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {leave.reason}
                        </p>
                      </div>

                      {/* Document */}
                      {leave.attachmentUrl && (
                        <div className="mt-2">
                          <a
                            href={leave.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            View Document
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Right side - Status */}
                    <div className="text-right">
                      {getStatusBadge(leave.status)}
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(leave.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
