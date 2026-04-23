// src/components/admin-dashboard.tsx
"use client";

import Link from "next/link";
import {
  Users,
  Clock,
  CalendarDays,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  UserPlus,
  FileText,
} from "lucide-react";

interface Props {
  employee: any;
  role: string;
  stats: {
    totalEmployees: number;
    activeEmployees: number;
    presentToday: number;
    absentToday: number;
    pendingLeave: number;
    approvedLeaveThisMonth: number;
    newEmployeesThisMonth: number;
    attendanceRate: number;
  };
  recentLeaves: {
    id: string;
    employeeName: string;
    leaveType: string;
    startDate: string;
    days: number;
    status: string;
  }[];
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export function AdminDashboard({ employee, role, stats, recentLeaves }: Props) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const roleTitle =
    role === "manager" ? "Team Overview" : "Organization Overview";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {employee.firstName}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {today} · {roleTitle}
        </p>
      </div>

      {/* Pending approvals alert */}
      {stats.pendingLeave > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                {stats.pendingLeave} leave request
                {stats.pendingLeave !== 1 ? "s" : ""} awaiting your approval
              </p>
              <p className="text-xs text-yellow-600 mt-0.5">
                Review and approve pending requests
              </p>
            </div>
          </div>
          <Link
            href="/leave"
            className="flex-shrink-0 rounded-lg border border-yellow-300 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100 transition-colors"
          >
            Review Now
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Employees"
          value={stats.totalEmployees}
          sub={`${stats.activeEmployees} active`}
          color="blue"
          icon={<Users className="h-5 w-5" />}
          href="/employees"
        />
        <StatCard
          label="Present Today"
          value={stats.presentToday}
          sub={`${stats.attendanceRate}% attendance rate`}
          color="green"
          icon={<Clock className="h-5 w-5" />}
          href="/attendance"
        />
        <StatCard
          label="Pending Leave"
          value={stats.pendingLeave}
          sub="awaiting approval"
          color="yellow"
          icon={<AlertCircle className="h-5 w-5" />}
          href="/leave"
        />
        <StatCard
          label="Approved This Month"
          value={stats.approvedLeaveThisMonth}
          sub="leave requests"
          color="purple"
          icon={<CheckCircle className="h-5 w-5" />}
          href="/leave"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Absent Today</p>
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              {stats.absentToday}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {stats.absentToday}
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full bg-red-400"
              style={{
                width: `${stats.totalEmployees > 0 ? (stats.absentToday / stats.totalEmployees) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">New Employees</p>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {stats.newEmployeesThisMonth}
          </p>
          <p className="mt-1 text-xs text-gray-400">joined this month</p>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Attendance Rate</p>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                stats.attendanceRate >= 90
                  ? "bg-green-50 text-green-700"
                  : stats.attendanceRate >= 75
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-red-50 text-red-700"
              }`}
            >
              {stats.attendanceRate >= 90
                ? "Good"
                : stats.attendanceRate >= 75
                  ? "Fair"
                  : "Low"}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {stats.attendanceRate}%
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full bg-blue-500"
              style={{ width: `${stats.attendanceRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent leave requests */}
        <div className="rounded-xl border bg-white">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Recent Leave Requests
            </h2>
            <Link
              href="/leave"
              className="text-xs text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y">
            {recentLeaves.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">
                No leave requests
              </p>
            ) : (
              recentLeaves.slice(0, 5).map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {leave.employeeName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {leave.leaveType.replace(/_/g, " ")} · {leave.days} day
                      {leave.days !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span
                    className={`ml-3 flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[leave.status] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {leave.status.charAt(0).toUpperCase() +
                      leave.status.slice(1)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border bg-white">
          <div className="border-b px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5">
            {[
              {
                href: "/employees/new",
                icon: <UserPlus className="h-4 w-4" />,
                label: "Add Employee",
                color: "text-blue-600 bg-blue-50",
              },
              {
                href: "/attendance",
                icon: <Clock className="h-4 w-4" />,
                label: "Attendance",
                color: "text-green-600 bg-green-50",
              },
              {
                href: "/leave",
                icon: <CalendarDays className="h-4 w-4" />,
                label: "Leave Requests",
                color: "text-yellow-600 bg-yellow-50",
              },
              {
                href: "/payroll",
                icon: <FileText className="h-4 w-4" />,
                label: "Payroll",
                color: "text-purple-600 bg-purple-50",
              },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-2.5 rounded-lg border p-3 hover:bg-gray-50 transition-colors"
              >
                <span className={`rounded-lg p-1.5 ${action.color}`}>
                  {action.icon}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
  href,
}: {
  label: string;
  value: number;
  sub: string;
  color: "blue" | "green" | "yellow" | "purple";
  icon: React.ReactNode;
  href: string;
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
    <Link
      href={href}
      className={`rounded-xl border p-4 ${c.bg} hover:opacity-90 transition-opacity block`}
    >
      <div className={`inline-flex rounded-lg p-2 ${c.icon}`}>{icon}</div>
      <p className={`mt-3 text-2xl font-bold ${c.val}`}>{value}</p>
      <p className="text-xs font-medium text-gray-600 mt-1">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </Link>
  );
}
