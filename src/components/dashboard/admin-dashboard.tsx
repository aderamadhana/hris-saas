// src/components/admin-dashboard.tsx
"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

interface EmployeeSummary {
  firstName?: string | null;
}

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  absentToday: number;
  pendingLeave: number;
  approvedLeaveThisMonth: number;
  newEmployeesThisMonth: number;
  attendanceRate: number;
}

interface RecentLeave {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  days: number;
  status: string;
}

interface Props {
  employee: EmployeeSummary;
  role: string;
  stats: DashboardStats;
  recentLeaves: RecentLeave[];
}

const STATUS_STYLE: Record<string, string> = {
  pending: "border-[#F7A81B]/50 bg-[#FFF4D9] text-[#0B5A43]",
  approved: "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatLeaveType(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStatus(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function clampPercentage(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

function getAttendanceLabel(rate: number) {
  if (rate >= 90) return "Healthy";
  if (rate >= 75) return "Needs attention";
  return "Critical";
}

function getAttendanceTone(rate: number) {
  if (rate >= 90) return "text-[#0B5A43]";
  if (rate >= 75) return "text-[#B77900]";
  return "text-red-600";
}

export function AdminDashboard({ employee, role, stats, recentLeaves }: Props) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const firstName = employee.firstName || "there";
  const attendanceRate = clampPercentage(stats.attendanceRate);
  const roleTitle =
    role === "manager" ? "Team dashboard" : "Organization dashboard";

  return (
    <div className="mx-auto w-full space-y-6 pb-8">
      <section className="overflow-hidden rounded-lg border border-[#084735] bg-[#0B5A43] shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1fr_420px]">
          <div className="p-6 text-white sm:p-7">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
              {roleTitle}
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Welcome back, {firstName}
            </h1>

            <p className="mt-2 text-sm text-white/75">{today}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <HeroMetric
                label="Active employees"
                value={formatNumber(stats.activeEmployees)}
              />
              <HeroMetric
                label="Present today"
                value={formatNumber(stats.presentToday)}
              />
              <HeroMetric
                label="Attendance rate"
                value={`${attendanceRate}%`}
                accent
              />
            </div>
          </div>

          <div className="border-t border-[#084735] bg-white p-4 lg:border-l lg:border-t-0">
            <div className="grid gap-3">
              <ActionLink
                href="/employees"
                title="Manage employees"
                description="View employee records, roles, and employment status."
                icon={<Users className="h-5 w-5" />}
                tone="green"
              />

              <ActionLink
                href="/leave"
                title="Review leave requests"
                description={`${stats.pendingLeave} request${
                  stats.pendingLeave === 1 ? "" : "s"
                } waiting for approval.`}
                icon={<CalendarDays className="h-5 w-5" />}
                tone={stats.pendingLeave > 0 ? "orange" : "green"}
              />
            </div>
          </div>
        </div>
      </section>

      {stats.pendingLeave > 0 && (
        <section className="flex flex-col gap-4 rounded-lg border border-[#F7A81B]/40 bg-[#FFF4D9] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F7A81B] text-[#0B5A43]">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#0B5A43]">
                {stats.pendingLeave} leave request
                {stats.pendingLeave === 1 ? "" : "s"} need approval
              </p>
              <p className="mt-1 text-sm text-[#7A5A00]">
                Review pending requests before attendance and payroll are
                finalized.
              </p>
            </div>
          </div>

          <Link
            href="/leave"
            className="inline-flex items-center justify-center rounded-md bg-[#0B5A43] px-4 py-2 text-sm font-semibold text-white hover:bg-[#084735]"
          >
            Review now
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total employees"
          value={formatNumber(stats.totalEmployees)}
          description={`${formatNumber(stats.activeEmployees)} active employees`}
          href="/employees"
          icon={<Users className="h-5 w-5" />}
          tone="green"
        />

        <KpiCard
          label="Present today"
          value={formatNumber(stats.presentToday)}
          description={`${attendanceRate}% attendance rate`}
          href="/attendance"
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="softGreen"
        />

        <KpiCard
          label="Pending leave"
          value={formatNumber(stats.pendingLeave)}
          description="Requests awaiting approval"
          href="/leave"
          icon={<CalendarDays className="h-5 w-5" />}
          tone={stats.pendingLeave > 0 ? "orange" : "slate"}
        />

        <KpiCard
          label="New employees"
          value={formatNumber(stats.newEmployeesThisMonth)}
          description="Joined this month"
          href="/employees"
          icon={<TrendingUp className="h-5 w-5" />}
          tone="green"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5">
            <div>
              <h2 className="text-base font-semibold text-gray-950">
                Attendance overview
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Today’s attendance performance and absence condition.
              </p>
            </div>

            <span
              className={`rounded-full bg-[#EAF5F0] px-3 py-1 text-xs font-semibold ${getAttendanceTone(
                attendanceRate,
              )}`}
            >
              {getAttendanceLabel(attendanceRate)}
            </span>
          </div>

          <div className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Attendance rate
                </p>
                <p className="mt-1 text-4xl font-semibold tracking-tight text-gray-950">
                  {attendanceRate}%
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
                <MiniMetric label="Present" value={stats.presentToday} />
                <MiniMetric label="Absent" value={stats.absentToday} />
              </div>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#0B5A43]"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <InfoBlock
                label="Approved leave"
                value={stats.approvedLeaveThisMonth}
                description="This month"
              />
              <InfoBlock
                label="Absent today"
                value={stats.absentToday}
                description="Needs review if unusual"
              />
              <InfoBlock
                label="New joiners"
                value={stats.newEmployeesThisMonth}
                description="This month"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-950">
              Quick actions
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Common actions for daily HR operations.
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            <QuickAction
              href="/employees/new"
              icon={<UserPlus className="h-5 w-5" />}
              label="Add employee"
              description="Create a new employee profile."
            />

            <QuickAction
              href="/attendance"
              icon={<Clock className="h-5 w-5" />}
              label="Open attendance"
              description="Check today's attendance records."
            />

            <QuickAction
              href="/leave"
              icon={<CalendarDays className="h-5 w-5" />}
              label="Open leave requests"
              description="Review requests and approval status."
            />

            <QuickAction
              href="/payroll"
              icon={<FileText className="h-5 w-5" />}
              label="Open payroll"
              description="Prepare or review payroll data."
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-950">
              Recent leave requests
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Latest leave activity submitted by employees.
            </p>
          </div>

          <Link
            href="/leave"
            className="inline-flex items-center justify-center rounded-md border border-[#0B5A43]/30 px-3 py-2 text-sm font-semibold text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0]"
          >
            View all
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        {recentLeaves.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF5F0] text-[#0B5A43]">
              <CalendarDays className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-semibold text-gray-800">
              No leave requests yet
            </p>
            <p className="mt-1 text-sm text-gray-500">
              New requests will appear here once employees submit them.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentLeaves.slice(0, 5).map((leave) => (
              <Link
                key={leave.id}
                href="/leave"
                className="grid gap-3 p-4 transition hover:bg-[#EAF5F0]/60 sm:grid-cols-[1fr_auto_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-950">
                    {leave.employeeName}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatLeaveType(leave.leaveType)} · {leave.days} day
                    {leave.days === 1 ? "" : "s"}
                  </p>
                </div>

                <p className="text-xs font-medium text-gray-500">
                  Starts {formatDate(leave.startDate)}
                </p>

                <span
                  className={`w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    STATUS_STYLE[leave.status] ??
                    "border-gray-200 bg-gray-50 text-gray-600"
                  }`}
                >
                  {formatStatus(leave.status)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-3 ${
        accent
          ? "border-[#F7A81B]/40 bg-[#F7A81B]/15"
          : "border-white/10 bg-white/5"
      }`}
    >
      <p className="text-xs text-white/65">{label}</p>
      <p
        className={
          accent
            ? "mt-1 text-lg font-semibold text-[#F7A81B]"
            : "mt-1 text-lg font-semibold text-white"
        }
      >
        {value}
      </p>
    </div>
  );
}

function ActionLink({
  href,
  title,
  description,
  icon,
  tone,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  tone: "green" | "orange";
}) {
  const toneClass =
    tone === "orange"
      ? "border-[#F7A81B]/50 bg-[#FFF4D9] text-[#0B5A43] group-hover:border-[#F7A81B]"
      : "border-[#0B5A43]/15 bg-[#EAF5F0] text-[#0B5A43] group-hover:border-[#0B5A43]/40";

  return (
    <Link
      href={href}
      className={`group flex items-center justify-between gap-4 rounded-md border p-4 transition hover:shadow-sm ${toneClass}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 shrink-0">{icon}</div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-950">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">
            {description}
          </p>
        </div>
      </div>

      <ArrowUpRight className="h-4 w-4 shrink-0 opacity-70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
    </Link>
  );
}

function KpiCard({
  label,
  value,
  description,
  href,
  icon,
  tone,
}: {
  label: string;
  value: string;
  description: string;
  href: string;
  icon: ReactNode;
  tone: "green" | "orange" | "softGreen" | "slate";
}) {
  const toneClass = {
    green: "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]",
    orange: "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#0B5A43]",
    softGreen: "border-emerald-100 bg-emerald-50 text-emerald-700",
    slate: "border-slate-100 bg-slate-50 text-slate-700",
  }[tone];

  return (
    <Link
      href={href}
      className="group rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#0B5A43]/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-md border ${toneClass}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{description}</p>
        <ArrowUpRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#0B5A43]" />
      </div>
    </Link>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gray-950">
        {formatNumber(value)}
      </p>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-md border border-gray-200 p-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-950">
        {formatNumber(value)}
      </p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 p-4 transition hover:bg-[#EAF5F0]"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-600 group-hover:bg-[#0B5A43] group-hover:text-white">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-950 group-hover:text-[#0B5A43]">
            {label}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            {description}
          </p>
        </div>
      </div>

      <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#0B5A43]" />
    </Link>
  );
}
