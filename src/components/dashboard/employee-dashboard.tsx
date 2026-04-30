// src/components/employee-dashboard.tsx
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
} from "lucide-react";

interface EmployeeSummary {
  firstName?: string | null;
}

interface DashboardStats {
  attendanceThisMonth: number;
  workingDaysThisMonth: number;
  pendingLeave: number;
  approvedLeave: number;
  annualLeaveBalance: number;
  todayCheckedIn: boolean;
  todayCheckInTime: string | null;
}

interface Props {
  employee: EmployeeSummary;
  stats: DashboardStats;
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function clampPercentage(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function getAttendanceStatus(rate: number) {
  if (rate >= 90) return "Excellent";
  if (rate >= 75) return "Good";
  return "Needs attention";
}

export function EmployeeDashboard({ employee, stats }: Props) {
  const attendancePct =
    stats.workingDaysThisMonth > 0
      ? Math.round(
          (stats.attendanceThisMonth / stats.workingDaysThisMonth) * 100,
        )
      : 0;

  const attendanceRate = clampPercentage(attendancePct);
  const firstName = employee.firstName || "there";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto w-full space-y-6 pb-8">
      <section className="overflow-hidden rounded-lg border border-[#0B5A43] bg-[#0B5A43] shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1fr_420px]">
          <div className="relative overflow-hidden p-6 text-white sm:p-7">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#F7A81B]/25" />
            <div className="pointer-events-none absolute bottom-0 right-12 h-20 w-20 rounded-full bg-white/10" />

            <div className="relative">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
                Employee dashboard
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                Good {getGreeting()}, {firstName}
              </h1>

              <p className="mt-2 text-sm text-white/80">{today}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <HeroMetric
                  label="Attendance"
                  value={`${attendanceRate}%`}
                  accent
                />
                <HeroMetric
                  label="Leave balance"
                  value={`${formatNumber(stats.annualLeaveBalance)} days`}
                />
                <HeroMetric
                  label="Pending leave"
                  value={formatNumber(stats.pendingLeave)}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[#0B5A43]/30 bg-[#F8FBF8] p-4 lg:border-l lg:border-t-0">
            <CheckInPanel
              checkedIn={stats.todayCheckedIn}
              checkInTime={stats.todayCheckInTime}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Attendance this month"
          value={`${attendanceRate}%`}
          description={`${stats.attendanceThisMonth} of ${stats.workingDaysThisMonth} working days`}
          href="/attendance"
          icon={<Clock className="h-5 w-5" />}
          tone="green"
        />

        <KpiCard
          label="Annual leave balance"
          value={formatNumber(stats.annualLeaveBalance)}
          description="Days remaining"
          href="/leave"
          icon={<CalendarDays className="h-5 w-5" />}
          tone="softGreen"
        />

        <KpiCard
          label="Pending leave"
          value={formatNumber(stats.pendingLeave)}
          description="Awaiting approval"
          href="/leave"
          icon={<AlertCircle className="h-5 w-5" />}
          tone={stats.pendingLeave > 0 ? "orange" : "slate"}
        />

        <KpiCard
          label="Approved leave"
          value={formatNumber(stats.approvedLeave)}
          description="This year"
          href="/leave"
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="green"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5">
            <div>
              <h2 className="text-base font-semibold text-gray-950">
                Monthly attendance
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Your attendance progress for the current month.
              </p>
            </div>

            <span className="rounded-full bg-[#EAF5F0] px-3 py-1 text-xs font-semibold text-[#0B5A43]">
              {getAttendanceStatus(attendanceRate)}
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

              <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
                <MiniMetric
                  label="Present"
                  value={stats.attendanceThisMonth}
                  suffix="days"
                />
                <MiniMetric
                  label="Working days"
                  value={stats.workingDaysThisMonth}
                  suffix="days"
                />
              </div>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#0B5A43]"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>

            <p className="mt-3 text-xs leading-relaxed text-gray-500">
              Attendance data is based on recorded check-ins for this month.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-950">
              Quick actions
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Common actions for your daily work.
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            <QuickAction
              href="/attendance"
              icon={<Clock className="h-5 w-5" />}
              label={stats.todayCheckedIn ? "View attendance" : "Check in now"}
              description={
                stats.todayCheckedIn
                  ? "See your attendance records."
                  : "Record your start time for today."
              }
              highlight={!stats.todayCheckedIn}
            />

            <QuickAction
              href="/leave/new"
              icon={<CalendarDays className="h-5 w-5" />}
              label="Request leave"
              description="Submit a new time-off request."
            />

            <QuickAction
              href="/leave"
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Leave history"
              description="Track your leave request status."
            />

            <QuickAction
              href="/payslip"
              icon={<FileText className="h-5 w-5" />}
              label="View payslip"
              description="Download or review your latest payslip."
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-950">
              Leave summary
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Keep your leave usage under control before submitting new
              requests.
            </p>
          </div>

          <Link
            href="/leave"
            className="inline-flex items-center justify-center rounded-md border border-[#0B5A43]/30 px-3 py-2 text-sm font-semibold text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0]"
          >
            Open leave
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <InfoBlock
            label="Available balance"
            value={`${formatNumber(stats.annualLeaveBalance)} days`}
            description="Remaining annual leave"
          />
          <InfoBlock
            label="Pending requests"
            value={formatNumber(stats.pendingLeave)}
            description="Waiting for approval"
            tone={stats.pendingLeave > 0 ? "orange" : "default"}
          />
          <InfoBlock
            label="Approved leave"
            value={formatNumber(stats.approvedLeave)}
            description="Approved this year"
          />
        </div>
      </section>
    </div>
  );
}

function CheckInPanel({
  checkedIn,
  checkInTime,
}: {
  checkedIn: boolean;
  checkInTime: string | null;
}) {
  return (
    <div
      className={`h-full rounded-md border p-5 ${
        checkedIn
          ? "border-[#0B5A43]/20 bg-[#EAF5F0]"
          : "border-[#F7A81B]/50 bg-[#FFF4D9]"
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-md ${
          checkedIn ? "bg-[#0B5A43] text-white" : "bg-[#F7A81B] text-[#0B5A43]"
        }`}
      >
        {checkedIn ? (
          <CheckCircle2 className="h-6 w-6" />
        ) : (
          <AlertCircle className="h-6 w-6" />
        )}
      </div>

      <p className="mt-4 text-base font-semibold text-gray-950">
        {checkedIn ? "You are checked in" : "You have not checked in"}
      </p>

      <p className="mt-1 text-sm leading-relaxed text-gray-600">
        {checkedIn
          ? `Your check-in time today is ${checkInTime || "-"}`
          : "Record your attendance when you start working today."}
      </p>

      <Link
        href="/attendance"
        className={`mt-5 inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-semibold ${
          checkedIn
            ? "border border-[#0B5A43]/30 text-[#0B5A43] hover:bg-white"
            : "bg-[#0B5A43] text-white hover:bg-[#084735]"
        }`}
      >
        {checkedIn ? "View attendance" : "Check in now"}
        <ArrowUpRight className="ml-2 h-4 w-4" />
      </Link>
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
          ? "border-[#F7A81B]/50 bg-[#F7A81B]/15"
          : "border-white/15 bg-white/10"
      }`}
    >
      <p className="text-xs text-white/70">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold ${
          accent ? "text-[#F7A81B]" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
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

function MiniMetric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix: string;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gray-950">
        {formatNumber(value)}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">{suffix}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  description,
  highlight = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between gap-4 p-4 transition ${
        highlight ? "bg-[#FFF4D9] hover:bg-[#FFE9A8]" : "hover:bg-[#EAF5F0]"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
            highlight
              ? "bg-[#F7A81B] text-[#0B5A43]"
              : "bg-gray-100 text-gray-600 group-hover:bg-[#0B5A43] group-hover:text-white"
          }`}
        >
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

function InfoBlock({
  label,
  value,
  description,
  tone = "default",
}: {
  label: string;
  value: string;
  description: string;
  tone?: "default" | "orange";
}) {
  return (
    <div
      className={`rounded-md border p-4 ${
        tone === "orange"
          ? "border-[#F7A81B]/40 bg-[#FFF4D9]"
          : "border-gray-200 bg-white"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-gray-950">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
  );
}
