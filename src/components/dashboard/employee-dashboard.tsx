// src/components/employee-dashboard.tsx
"use client";

import Link from "next/link";
import {
  Clock,
  CalendarDays,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface Props {
  employee: any;
  stats: {
    attendanceThisMonth: number;
    workingDaysThisMonth: number;
    pendingLeave: number;
    approvedLeave: number;
    annualLeaveBalance: number;
    todayCheckedIn: boolean;
    todayCheckInTime: string | null;
  };
}

export function EmployeeDashboard({ employee, stats }: Props) {
  const attendancePct =
    stats.workingDaysThisMonth > 0
      ? Math.round(
          (stats.attendanceThisMonth / stats.workingDaysThisMonth) * 100,
        )
      : 0;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {employee.firstName}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">{today}</p>
      </div>

      {/* Check-in status banner */}
      <div
        className={`rounded-xl border p-4 flex items-center justify-between ${
          stats.todayCheckedIn
            ? "bg-green-50 border-green-200"
            : "bg-yellow-50 border-yellow-200"
        }`}
      >
        <div className="flex items-center gap-3">
          {stats.todayCheckedIn ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          )}
          <div>
            <p
              className={`font-medium text-sm ${stats.todayCheckedIn ? "text-green-800" : "text-yellow-800"}`}
            >
              {stats.todayCheckedIn
                ? `Checked in at ${stats.todayCheckInTime}`
                : "You haven't checked in today"}
            </p>
            <p
              className={`text-xs mt-0.5 ${stats.todayCheckedIn ? "text-green-600" : "text-yellow-600"}`}
            >
              {stats.todayCheckedIn
                ? "Have a productive day!"
                : "Remember to check in when you start working"}
            </p>
          </div>
        </div>
        <Link
          href="/attendance"
          className={`text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
            stats.todayCheckedIn
              ? "border-green-300 text-green-700 hover:bg-green-100"
              : "border-yellow-300 text-yellow-700 hover:bg-yellow-100"
          }`}
        >
          {stats.todayCheckedIn ? "View Attendance" : "Check In"}
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Attendance This Month"
          value={`${attendancePct}%`}
          sub={`${stats.attendanceThisMonth} / ${stats.workingDaysThisMonth} days`}
          color="blue"
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          label="Annual Leave Balance"
          value={`${stats.annualLeaveBalance}`}
          sub="days remaining"
          color="green"
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Leave"
          value={`${stats.pendingLeave}`}
          sub="awaiting approval"
          color="yellow"
          icon={<AlertCircle className="h-5 w-5" />}
        />
        <StatCard
          label="Approved Leave"
          value={`${stats.approvedLeave}`}
          sub="this year"
          color="purple"
          icon={<CheckCircle className="h-5 w-5" />}
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <QuickAction
            href="/leave/new"
            icon={<CalendarDays className="h-5 w-5 text-blue-600" />}
            title="Request Leave"
            desc="Submit a time-off request"
          />
          <QuickAction
            href="/attendance"
            icon={<Clock className="h-5 w-5 text-green-600" />}
            title="View Attendance"
            desc="Check your attendance history"
          />
          <QuickAction
            href="/payslip"
            icon={<FileText className="h-5 w-5 text-purple-600" />}
            title="View Payslip"
            desc="Download your latest payslip"
          />
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  color: "blue" | "green" | "yellow" | "purple";
  icon: React.ReactNode;
}) {
  const colors = {
    blue: {
      bg: "bg-blue-50",
      icon: "bg-blue-100 text-blue-600",
      val: "text-blue-700",
    },
    green: {
      bg: "bg-green-50",
      icon: "bg-green-100 text-green-600",
      val: "text-green-700",
    },
    yellow: {
      bg: "bg-yellow-50",
      icon: "bg-yellow-100 text-yellow-600",
      val: "text-yellow-700",
    },
    purple: {
      bg: "bg-purple-50",
      icon: "bg-purple-100 text-purple-600",
      val: "text-purple-700",
    },
  };
  const c = colors[color];
  return (
    <div className={`rounded-xl border p-4 ${c.bg}`}>
      <div className={`inline-flex rounded-lg p-2 ${c.icon}`}>{icon}</div>
      <p className={`mt-3 text-2xl font-bold ${c.val}`}>{value}</p>
      <p className="text-xs font-medium text-gray-600 mt-1">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border bg-white p-4 hover:bg-gray-50 transition-colors"
    >
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
    </Link>
  );
}
