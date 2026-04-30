"use client";

// src/components/reports/reports-client.tsx

import { useCallback, useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";

interface Employee {
  id: string;
  name: string;
  employeeId: string;
  department: string;
}

interface Department {
  id: string;
  name: string;
}

interface ReportsClientProps {
  organizationId: string;
  userRole: string;
  employees: Employee[];
  departments: Department[];
}

type ReportTab = "attendance" | "leave" | "payroll";
type ReportRow = Record<string, unknown>;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

const REPORT_TABS: Array<{
  id: ReportTab;
  label: string;
  description: string;
  icon: ElementType;
}> = [
  {
    id: "attendance",
    label: "Attendance",
    description: "Workdays, presence, absence, and lateness.",
    icon: Clock,
  },
  {
    id: "leave",
    label: "Leave",
    description: "Leave requests, approvals, and days taken.",
    icon: CalendarDays,
  },
  {
    id: "payroll",
    label: "Payroll",
    description: "Salary, allowances, deductions, and net pay.",
    icon: Wallet,
  },
];

function getValue(row: ReportRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }

  return null;
}

function formatText(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function toSafeNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value)
    .replace(/[^\d.-]/g, "")
    .trim();

  if (!normalized || normalized === "-" || normalized === ".") return 0;

  const number = Number(normalized);

  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value: unknown) {
  const number = toSafeNumber(value);
  return new Intl.NumberFormat("en-US").format(number);
}

function formatPercent(value: unknown) {
  const number = toSafeNumber(value);
  return `${number.toFixed(1)}%`;
}

function formatCurrency(value: unknown) {
  const number = toSafeNumber(value);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number);
}

function getStatusClass(value: unknown) {
  const status = String(value ?? "").toLowerCase();

  if (["approved", "paid", "completed", "present", "active"].includes(status)) {
    return "bg-[#EAF5F0] text-[#0B5A43]";
  }

  if (["pending", "draft", "processing"].includes(status)) {
    return "bg-[#FFF4D9] text-[#7A5A00]";
  }

  if (["rejected", "unpaid", "absent", "failed"].includes(status)) {
    return "bg-red-50 text-red-700";
  }

  return "bg-gray-100 text-gray-700";
}

function StatusBadge({ value }: { value: unknown }) {
  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold capitalize ${getStatusClass(
        value,
      )}`}
    >
      {formatText(value).replaceAll("_", " ")}
    </span>
  );
}

function SummaryItem({
  label,
  value,
  description,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  tone?: "default" | "green" | "orange" | "red";
}) {
  const iconClass = {
    default: "border-gray-200 bg-gray-50 text-gray-600",
    green: "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]",
    orange: "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]",
    red: "border-red-200 bg-red-50 text-red-700",
  }[tone];

  const valueClass = {
    default: "text-gray-950",
    green: "text-[#0B5A43]",
    orange: "text-[#7A5A00]",
    red: "text-red-700",
  }[tone];

  const safeValue =
    typeof value === "number" && !Number.isFinite(value) ? 0 : value;

  return (
    <div className="border-b border-gray-200 p-4 md:border-b-0 md:border-r last:border-r-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p
            className={`mt-2 text-3xl font-semibold tracking-tight ${valueClass}`}
          >
            {safeValue}
          </p>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center border ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="px-4 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center bg-gray-100 text-gray-400">
        {icon}
      </div>

      <p className="mt-4 font-semibold text-gray-800">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

function getReportLabel(type: ReportTab) {
  return REPORT_TABS.find((tab) => tab.id === type)?.label ?? "Report";
}

function getRowEmployeeName(row: ReportRow) {
  return formatText(
    getValue(row, [
      "employeeName",
      "name",
      "employee",
      "fullName",
      "employee_name",
    ]),
  );
}

function getRowEmployeeId(row: ReportRow) {
  return formatText(
    getValue(row, ["employeeId", "employeeCode", "employee_id", "code"]),
  );
}

function getRowDepartment(row: ReportRow) {
  return formatText(
    getValue(row, ["department", "departmentName", "department_name"]),
  );
}

function AttendanceTable({ rows }: { rows: ReportRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left">
        <thead>
          <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
            <th className="px-5 py-3 font-semibold">Employee</th>
            <th className="px-5 py-3 font-semibold">Department</th>
            <th className="px-5 py-3 font-semibold">Workdays</th>
            <th className="px-5 py-3 font-semibold">Present</th>
            <th className="px-5 py-3 font-semibold">Absent</th>
            <th className="px-5 py-3 font-semibold">Late</th>
            <th className="px-5 py-3 font-semibold">Overtime</th>
            <th className="px-5 py-3 font-semibold">Rate</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr
              key={String(row.id ?? index)}
              className="border-b border-gray-100 text-sm last:border-b-0 hover:bg-gray-50"
            >
              <td className="px-5 py-4">
                <p className="font-semibold text-gray-950">
                  {getRowEmployeeName(row)}
                </p>
                <p className="text-xs text-gray-500">{getRowEmployeeId(row)}</p>
              </td>

              <td className="px-5 py-4 text-gray-600">
                {getRowDepartment(row)}
              </td>

              <td className="px-5 py-4">
                {formatNumber(
                  getValue(row, ["workingDays", "workdays", "totalWorkDays"]),
                )}
              </td>

              <td className="px-5 py-4 text-[#0B5A43]">
                {formatNumber(
                  getValue(row, ["presentDays", "present", "attendanceDays"]),
                )}
              </td>

              <td className="px-5 py-4 text-red-600">
                {formatNumber(getValue(row, ["absentDays", "absent"]))}
              </td>

              <td className="px-5 py-4 text-[#7A5A00]">
                {formatNumber(getValue(row, ["lateDays", "late", "lateCount"]))}
              </td>

              <td className="px-5 py-4">
                {formatNumber(
                  getValue(row, ["overtimeHours", "overtime", "totalOvertime"]),
                )}
              </td>

              <td className="px-5 py-4 font-semibold">
                {formatPercent(
                  getValue(row, [
                    "attendanceRate",
                    "rate",
                    "percentage",
                    "attendancePercentage",
                  ]),
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeaveTable({ rows }: { rows: ReportRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left">
        <thead>
          <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
            <th className="px-5 py-3 font-semibold">Employee</th>
            <th className="px-5 py-3 font-semibold">Department</th>
            <th className="px-5 py-3 font-semibold">Requests</th>
            <th className="px-5 py-3 font-semibold">Approved</th>
            <th className="px-5 py-3 font-semibold">Pending</th>
            <th className="px-5 py-3 font-semibold">Rejected</th>
            <th className="px-5 py-3 font-semibold">Days Taken</th>
            <th className="px-5 py-3 font-semibold">Balance</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr
              key={String(row.id ?? index)}
              className="border-b border-gray-100 text-sm last:border-b-0 hover:bg-gray-50"
            >
              <td className="px-5 py-4">
                <p className="font-semibold text-gray-950">
                  {getRowEmployeeName(row)}
                </p>
                <p className="text-xs text-gray-500">{getRowEmployeeId(row)}</p>
              </td>

              <td className="px-5 py-4 text-gray-600">
                {getRowDepartment(row)}
              </td>

              <td className="px-5 py-4">
                {formatNumber(
                  getValue(row, ["totalRequests", "requests", "requestCount"]),
                )}
              </td>

              <td className="px-5 py-4 text-[#0B5A43]">
                {formatNumber(
                  getValue(row, [
                    "approvedRequests",
                    "approved",
                    "approvedCount",
                  ]),
                )}
              </td>

              <td className="px-5 py-4 text-[#7A5A00]">
                {formatNumber(
                  getValue(row, ["pendingRequests", "pending", "pendingCount"]),
                )}
              </td>

              <td className="px-5 py-4 text-red-600">
                {formatNumber(
                  getValue(row, [
                    "rejectedRequests",
                    "rejected",
                    "rejectedCount",
                  ]),
                )}
              </td>

              <td className="px-5 py-4">
                {formatNumber(
                  getValue(row, ["daysTaken", "totalDays", "leaveDays"]),
                )}
              </td>

              <td className="px-5 py-4 font-semibold">
                {formatNumber(
                  getValue(row, [
                    "remainingBalance",
                    "balance",
                    "leaveBalance",
                  ]),
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PayrollTable({ rows }: { rows: ReportRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-left">
        <thead>
          <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
            <th className="px-5 py-3 font-semibold">Employee</th>
            <th className="px-5 py-3 font-semibold">Department</th>
            <th className="px-5 py-3 font-semibold">Base Salary</th>
            <th className="px-5 py-3 font-semibold">Allowances</th>
            <th className="px-5 py-3 font-semibold">Overtime</th>
            <th className="px-5 py-3 font-semibold">Deductions</th>
            <th className="px-5 py-3 font-semibold">Net Pay</th>
            <th className="px-5 py-3 font-semibold">Status</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr
              key={String(row.id ?? index)}
              className="border-b border-gray-100 text-sm last:border-b-0 hover:bg-gray-50"
            >
              <td className="px-5 py-4">
                <p className="font-semibold text-gray-950">
                  {getRowEmployeeName(row)}
                </p>
                <p className="text-xs text-gray-500">{getRowEmployeeId(row)}</p>
              </td>

              <td className="px-5 py-4 text-gray-600">
                {getRowDepartment(row)}
              </td>

              <td className="px-5 py-4">
                {formatCurrency(getValue(row, ["baseSalary", "salary"]))}
              </td>

              <td className="px-5 py-4 text-[#0B5A43]">
                {formatCurrency(
                  getValue(row, ["allowances", "totalAllowances", "allowance"]),
                )}
              </td>

              <td className="px-5 py-4">
                {formatCurrency(
                  getValue(row, ["overtimePay", "overtimeAmount", "overtime"]),
                )}
              </td>

              <td className="px-5 py-4 text-red-600">
                {formatCurrency(
                  getValue(row, ["deductions", "totalDeductions", "deduction"]),
                )}
              </td>

              <td className="px-5 py-4 font-semibold text-gray-950">
                {formatCurrency(
                  getValue(row, ["netSalary", "netPay", "takeHomePay"]),
                )}
              </td>

              <td className="px-5 py-4">
                <StatusBadge
                  value={getValue(row, ["status", "paymentStatus"])}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportTable({ type, rows }: { type: ReportTab; rows: ReportRow[] }) {
  if (type === "attendance") return <AttendanceTable rows={rows} />;
  if (type === "leave") return <LeaveTable rows={rows} />;
  return <PayrollTable rows={rows} />;
}

export function ReportsClient({ employees, departments }: ReportsClientProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>("attendance");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear);
  const [departmentId, setDepartmentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [search, setSearch] = useState("");

  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [error, setError] = useState("");

  const activeReport = REPORT_TABS.find((tab) => tab.id === activeTab)!;
  const ActiveIcon = activeReport.icon;

  const resetReport = () => {
    setHasGenerated(false);
    setReportData([]);
    setSearch("");
    setError("");
  };

  const generateReport = useCallback(async () => {
    setLoading(true);
    setError("");
    setHasGenerated(true);

    try {
      const params = new URLSearchParams({
        type: activeTab,
        month: String(month),
        year: String(year),
      });

      if (departmentId) params.set("departmentId", departmentId);
      if (employeeId) params.set("employeeId", employeeId);

      const response = await fetch(`/api/reports?${params.toString()}`, {
        cache: "no-store",
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to generate report.");
      }

      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.report)
            ? payload.report
            : [];

      setReportData(data);
    } catch (err: unknown) {
      setReportData([]);
      setError(
        err instanceof Error ? err.message : "Failed to generate report.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, month, year, departmentId, employeeId]);

  const exportReport = async (format: "xlsx" | "pdf") => {
    setExporting(format);
    setError("");

    try {
      const params = new URLSearchParams({
        type: activeTab,
        month: String(month),
        year: String(year),
        format,
      });

      if (departmentId) params.set("departmentId", departmentId);
      if (employeeId) params.set("employeeId", employeeId);

      const response = await fetch(`/api/reports/export?${params.toString()}`);

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to export report.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${activeTab}-report-${MONTHS[month - 1]}-${year}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to export report.");
    } finally {
      setExporting(null);
    }
  };

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return reportData;

    return reportData.filter((row) => {
      const text = [
        getRowEmployeeName(row),
        getRowEmployeeId(row),
        getRowDepartment(row),
        row.status,
        row.paymentStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [reportData, search]);

  const summary = useMemo(() => {
    const totalRows = reportData.length;

    if (activeTab === "attendance") {
      const present = reportData.reduce(
        (total, row) =>
          total +
          toSafeNumber(
            getValue(row, ["presentDays", "present", "attendanceDays"]),
          ),
        0,
      );

      const absent = reportData.reduce(
        (total, row) =>
          total + toSafeNumber(getValue(row, ["absentDays", "absent"])),
        0,
      );

      const late = reportData.reduce(
        (total, row) =>
          total +
          toSafeNumber(getValue(row, ["lateDays", "late", "lateCount"])),
        0,
      );

      return {
        one: {
          label: "Employees",
          value: totalRows,
          description: "Included in report",
        },
        two: {
          label: "Present",
          value: present,
          description: "Total present days",
        },
        three: {
          label: "Absent",
          value: absent,
          description: "Total absent days",
        },
        four: {
          label: "Late",
          value: late,
          description: "Total late records",
        },
      };
    }

    if (activeTab === "leave") {
      const approved = reportData.reduce(
        (total, row) =>
          total +
          toSafeNumber(
            getValue(row, ["approvedRequests", "approved", "approvedCount"]),
          ),
        0,
      );

      const pending = reportData.reduce(
        (total, row) =>
          total +
          toSafeNumber(
            getValue(row, ["pendingRequests", "pending", "pendingCount"]),
          ),
        0,
      );

      const days = reportData.reduce(
        (total, row) =>
          total +
          toSafeNumber(getValue(row, ["daysTaken", "totalDays", "leaveDays"])),
        0,
      );

      return {
        one: {
          label: "Employees",
          value: totalRows,
          description: "Included in report",
        },
        two: {
          label: "Approved",
          value: approved,
          description: "Approved requests",
        },
        three: {
          label: "Pending",
          value: pending,
          description: "Waiting for review",
        },
        four: {
          label: "Days Taken",
          value: days,
          description: "Total leave days",
        },
      };
    }

    const netPay = reportData.reduce(
      (total, row) =>
        total +
        toSafeNumber(getValue(row, ["netSalary", "netPay", "takeHomePay"])),
      0,
    );

    const deductions = reportData.reduce(
      (total, row) =>
        total +
        toSafeNumber(
          getValue(row, ["deductions", "totalDeductions", "deduction"]),
        ),
      0,
    );

    return {
      one: {
        label: "Employees",
        value: totalRows,
        description: "Included in report",
      },
      two: {
        label: "Net Pay",
        value: formatCurrency(netPay),
        description: "Total take-home pay",
      },
      three: {
        label: "Deductions",
        value: formatCurrency(deductions),
        description: "Total deductions",
      },
      four: {
        label: "Period",
        value: MONTHS[month - 1] ?? "-",
        description: String(year),
      },
    };
  }, [activeTab, reportData, month, year]);

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
              Reports
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Generate attendance, leave, and payroll reports for your
              organization.
            </p>
          </div>

          {hasGenerated && reportData.length > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                onClick={() => exportReport("xlsx")}
                disabled={Boolean(exporting)}
                className="bg-[#0B5A43] text-white hover:bg-[#084735]"
              >
                {exporting === "xlsx" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                )}
                Export Excel
              </Button>

              <Button
                type="button"
                onClick={() => exportReport("pdf")}
                disabled={Boolean(exporting)}
                variant="outline"
              >
                {exporting === "pdf" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Export PDF
              </Button>
            </div>
          )}
        </div>
      </header>

      <section className="grid border border-gray-200 bg-white md:grid-cols-4">
        <SummaryItem
          label={summary.one.label}
          value={summary.one.value}
          description={summary.one.description}
          icon={<Users className="h-5 w-5" />}
        />

        <SummaryItem
          label={summary.two.label}
          value={summary.two.value}
          description={summary.two.description}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="green"
        />

        <SummaryItem
          label={summary.three.label}
          value={summary.three.value}
          description={summary.three.description}
          icon={
            activeTab === "attendance" ? (
              <XCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )
          }
          tone={activeTab === "attendance" ? "red" : "orange"}
        />

        <SummaryItem
          label={summary.four.label}
          value={summary.four.value}
          description={summary.four.description}
          icon={<Clock className="h-5 w-5" />}
          tone="orange"
        />
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            {REPORT_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    resetReport();
                  }}
                  className={[
                    "flex min-w-[160px] flex-1 items-start gap-3 border px-4 py-3 text-left transition-colors lg:flex-none",
                    active
                      ? "border-[#0B5A43] bg-[#EAF5F0] text-[#0B5A43]"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <span className="block text-sm font-semibold">
                      {tab.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      {tab.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-b border-gray-200 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-800">
              Report Filters
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Month
              </label>
              <select
                value={month}
                onChange={(event) => {
                  setMonth(Number(event.target.value));
                  resetReport();
                }}
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
              >
                {MONTHS.map((item, index) => (
                  <option key={item} value={index + 1}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Year
              </label>
              <select
                value={year}
                onChange={(event) => {
                  setYear(Number(event.target.value));
                  resetReport();
                }}
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
              >
                {YEARS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(event) => {
                  setDepartmentId(event.target.value);
                  resetReport();
                }}
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
              >
                <option value="">All Departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Employee
              </label>
              <select
                value={employeeId}
                onChange={(event) => {
                  setEmployeeId(event.target.value);
                  resetReport();
                }}
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#0B5A43]"
              >
                <option value="">All Employees</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                onClick={generateReport}
                disabled={loading}
                className="h-10 w-full bg-[#0B5A43] text-white hover:bg-[#084735]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-[#EAF5F0] text-[#0B5A43]">
              <ActiveIcon className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-950">
                {getReportLabel(activeTab)} Report
              </h2>
              <p className="text-sm text-gray-500">
                {hasGenerated
                  ? `${filteredRows.length} row${
                      filteredRows.length === 1 ? "" : "s"
                    } found.`
                  : "Set filters, then generate a report."}
              </p>
            </div>
          </div>

          {hasGenerated && reportData.length > 0 && (
            <div className="relative min-w-0 lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search report results..."
                className="h-10 w-full border border-gray-300 pl-9 pr-3 text-sm outline-none focus:border-[#0B5A43]"
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center px-4 py-16 text-sm text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#0B5A43]" />
            Generating report...
          </div>
        ) : !hasGenerated ? (
          <EmptyState
            title="No report generated yet"
            description="Choose the report type and filters, then click Generate."
            icon={<FileText className="h-6 w-6" />}
          />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="No data found"
            description="No records match the selected filters."
            icon={<FileText className="h-6 w-6" />}
          />
        ) : (
          <ReportTable type={activeTab} rows={filteredRows} />
        )}
      </section>
    </div>
  );
}

export default ReportsClient;
