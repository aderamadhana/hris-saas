"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Calendar,
  Loader2,
  MapPin,
  LogIn,
  LogOut,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeIdCode: string;
  position: string;
  department?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: "present" | "late" | "absent" | "leave";
  workHours?: number;
  notes?: string;
}

interface CheckInButtonProps {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  checkInTime?: string;
  checkOutTime?: string;
}

// ─── Check-In / Check-Out Button ─────────────────────────────────────────────
export function CheckInButton({
  hasCheckedIn,
  hasCheckedOut,
  checkInTime,
  checkOutTime,
}: CheckInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localCheckIn, setLocalCheckIn] = useState(hasCheckedIn);
  const [localCheckOut, setLocalCheckOut] = useState(hasCheckedOut);
  const [localCheckInTime, setLocalCheckInTime] = useState(checkInTime);
  const [localCheckOutTime, setLocalCheckOutTime] = useState(checkOutTime);

  async function handleCheckIn() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance/check-in", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Check-in failed");
      setLocalCheckIn(true);
      setLocalCheckInTime(format(new Date(), "HH:mm"));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckOut() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance/check-out", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Check-out failed");
      setLocalCheckOut(true);
      setLocalCheckOutTime(format(new Date(), "HH:mm"));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (localCheckOut) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-800">Attendance complete</p>
            <p className="text-sm text-green-600">
              {localCheckInTime && localCheckOutTime
                ? `${localCheckInTime} → ${localCheckOutTime}`
                : "Checked in and out today"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (localCheckIn) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <LogIn className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-800">Checked in</p>
                <p className="text-sm text-blue-600">
                  {localCheckInTime ?? "—"}
                </p>
              </div>
            </div>
            <Button
              onClick={handleCheckOut}
              disabled={loading}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Check Out
            </Button>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleCheckIn}
        disabled={loading}
        className="h-11 gap-2 px-6"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        Check In
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map = {
    present: {
      label: "Present",
      cls: "bg-green-50 text-green-700 border-green-200",
    },
    late: {
      label: "Late",
      cls: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    absent: { label: "Absent", cls: "bg-red-50 text-red-700 border-red-200" },
    leave: {
      label: "On Leave",
      cls: "bg-blue-50 text-blue-700 border-blue-200",
    },
  };
  const cfg = map[status as keyof typeof map] ?? map.absent;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

// ─── Attendance Table ─────────────────────────────────────────────────────────
export function AttendanceTable({
  records,
  selectedDate,
  onDateChange,
  userRole,
}: {
  records: AttendanceRecord[];
  selectedDate: string;
  onDateChange: (d: string) => void;
  userRole: string;
}) {
  const [search, setSearch] = useState("");

  const filtered = records.filter(
    (r) =>
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.position.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeIdCode.toLowerCase().includes(search.toLowerCase()),
  );

  const stats = {
    total: records.length,
    present: records.filter((r) => r.status === "present").length,
    late: records.filter((r) => r.status === "late").length,
    absent: records.filter((r) => r.status === "absent").length,
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total",
            value: stats.total,
            color: "text-gray-700",
            bg: "bg-gray-50 border-gray-100",
          },
          {
            label: "Present",
            value: stats.present,
            color: "text-green-700",
            bg: "bg-green-50 border-green-100",
          },
          {
            label: "Late",
            value: stats.late,
            color: "text-yellow-700",
            bg: "bg-yellow-50 border-yellow-100",
          },
          {
            label: "Absent",
            value: stats.absent,
            color: "text-red-700",
            bg: "bg-red-50 border-red-100",
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

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name, ID, or position…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full sm:w-44"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {[
                "Employee",
                "Department",
                "Check In",
                "Check Out",
                "Hours",
                "Status",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  No attendance records found
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {r.employeeName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {r.employeeIdCode} · {r.position}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {r.department ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.checkIn ? (
                      <span className="font-mono text-gray-700">
                        {r.checkIn}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.checkOut ? (
                      <span className="font-mono text-gray-700">
                        {r.checkOut}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.workHours != null ? `${r.workHours.toFixed(1)}h` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
