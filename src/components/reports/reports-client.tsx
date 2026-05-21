"use client";

// components/reports/reports-client.tsx

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmployeeOption {
  id: string;
  name: string;
  employeeId: string;
  department: string;
}

interface DepartmentOption {
  id: string;
  name: string;
}

interface ReportsClientProps {
  organizationId: string;
  userRole: string;
  employees: EmployeeOption[];
  departments: DepartmentOption[];
}

type ReportType = "attendance" | "leave" | "payroll";

interface AttendanceRow {
  employeeId: string;
  name: string;
  department: string;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  totalHours: number;
  attendanceRate: number;
  workingDays: number;
}

interface LeaveRow {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  reason: string;
  approvedBy: string;
}

interface PayrollRow {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  baseSalary: number;
  allowances: number;
  overtime: number;
  bonus: number;
  grossSalary: number;
  bpjsKesehatan: number;
  bpjsKetenagakerjaan: number;
  pph21: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  workDays: number;
  absentDays: number;
}

type ReportRow = AttendanceRow | LeaveRow | PayrollRow;

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

const REPORT_TYPES: Array<{
  value: ReportType;
  label: string;
  icon: typeof BarChart3;
}> = [
  { value: "attendance", label: "Attendance", icon: Calendar },
  { value: "leave", label: "Leave", icon: FileText },
  { value: "payroll", label: "Payroll", icon: Wallet },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatLeaveType(type: string) {
  const map: Record<string, string> = {
    annual: "Cuti Tahunan",
    sick: "Sakit",
    maternity: "Cuti Melahirkan",
    marriage: "Cuti Menikah",
    paternity: "Cuti Istri Melahirkan",
    family_death: "Keluarga Meninggal",
    hajj: "Haji",
    wfh: "WFH",
    wfa: "WFA",
    out_of_office: "Out of Office",
    business_trip_local: "Dinas Kota",
    business_trip_province: "Dinas Provinsi",
    unpaid: "Tanpa Upah",
  };
  return map[type] ?? type.replace(/_/g, " ");
}

// ─── Export to CSV ────────────────────────────────────────────────────────────

function exportToCSV(
  data: ReportRow[],
  type: ReportType,
  month: number,
  year: number,
) {
  if (!data.length) return;

  let headers: string[] = [];
  let rows: string[][] = [];

  if (type === "attendance") {
    headers = [
      "Employee ID",
      "Name",
      "Department",
      "Present",
      "Late",
      "Absent",
      "Hours",
      "Rate (%)",
      "Working Days",
    ];
    rows = (data as AttendanceRow[]).map((r) => [
      r.employeeId,
      r.name,
      r.department,
      String(r.presentDays),
      String(r.lateDays),
      String(r.absentDays),
      String(r.totalHours),
      String(r.attendanceRate),
      String(r.workingDays),
    ]);
  } else if (type === "leave") {
    headers = [
      "Employee ID",
      "Name",
      "Department",
      "Type",
      "Start",
      "End",
      "Days",
      "Status",
      "Approved By",
    ];
    rows = (data as LeaveRow[]).map((r) => [
      r.employeeId,
      r.employeeName,
      r.department,
      formatLeaveType(r.leaveType),
      r.startDate,
      r.endDate,
      String(r.totalDays),
      r.status,
      r.approvedBy,
    ]);
  } else {
    headers = [
      "Employee ID",
      "Name",
      "Department",
      "Base Salary",
      "Allowances",
      "Overtime",
      "Bonus",
      "Gross",
      "BPJS Kes",
      "BPJS TK",
      "PPh21",
      "Deductions",
      "Net Salary",
      "Status",
    ];
    rows = (data as PayrollRow[]).map((r) => [
      r.employeeId,
      r.employeeName,
      r.department,
      String(r.baseSalary),
      String(r.allowances),
      String(r.overtime),
      String(r.bonus),
      String(r.grossSalary),
      String(r.bpjsKesehatan),
      String(r.bpjsKetenagakerjaan),
      String(r.pph21),
      String(r.totalDeductions),
      String(r.netSalary),
      r.status,
    ]);
  }

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `report-${type}-${MONTHS[month - 1].toLowerCase()}-${year}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReportsClient({ employees, departments }: ReportsClientProps) {
  const now = new Date();

  const [reportType, setReportType] = useState<ReportType>("attendance");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [departmentId, setDepartmentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        type: reportType,
        month: String(month),
        year: String(year),
      });
      if (departmentId) params.set("departmentId", departmentId);
      if (employeeId) params.set("employeeId", employeeId);

      const res = await fetch(`/api/reports?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch report");
      setData(Array.isArray(json.data) ? json.data : []);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch report");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [reportType, month, year, departmentId, employeeId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      {/* Header */}
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
              Reports
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Attendance, leave, and payroll reports with export to CSV.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchReport}
              disabled={loading}
              className="sm:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => exportToCSV(data, reportType, month, year)}
              disabled={loading || data.length === 0}
              className="bg-[#0B5A43] text-white hover:bg-[#084735] sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      {/* Report type tabs */}
      <div className="flex gap-1 border-b border-gray-200 bg-white px-4">
        {REPORT_TYPES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setReportType(value)}
            className={[
              "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              reportType === value
                ? "border-[#0B5A43] text-[#0B5A43]"
                : "border-transparent text-gray-500 hover:text-gray-800",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="border border-gray-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="h-9 w-full border border-gray-300 px-2 text-sm outline-none focus:border-[#0B5A43]"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-9 w-full border border-gray-300 px-2 text-sm outline-none focus:border-[#0B5A43]"
            >
              {[
                now.getFullYear() - 1,
                now.getFullYear(),
                now.getFullYear() + 1,
              ].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Department
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="h-9 w-full border border-gray-300 px-2 text-sm outline-none focus:border-[#0B5A43]"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Employee
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="h-9 w-full border border-gray-300 px-2 text-sm outline-none focus:border-[#0B5A43]"
            >
              <option value="">All employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.employeeId})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Summary stats */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Records"
            value={String(data.length)}
            icon={<Users className="h-5 w-5" />}
          />
          {reportType === "attendance" && (
            <>
              <StatCard
                label="Avg Rate"
                value={`${Math.round((data as AttendanceRow[]).reduce((s, r) => s + r.attendanceRate, 0) / data.length)}%`}
                icon={<BarChart3 className="h-5 w-5" />}
                tone="green"
              />
              <StatCard
                label="Total Present"
                value={String(
                  (data as AttendanceRow[]).reduce(
                    (s, r) => s + r.presentDays,
                    0,
                  ),
                )}
                icon={<Calendar className="h-5 w-5" />}
                tone="green"
              />
              <StatCard
                label="Total Absent"
                value={String(
                  (data as AttendanceRow[]).reduce(
                    (s, r) => s + r.absentDays,
                    0,
                  ),
                )}
                icon={<AlertCircle className="h-5 w-5" />}
                tone="orange"
              />
            </>
          )}
          {reportType === "leave" && (
            <>
              <StatCard
                label="Approved"
                value={String(
                  (data as LeaveRow[]).filter((r) => r.status === "approved")
                    .length,
                )}
                icon={<FileText className="h-5 w-5" />}
                tone="green"
              />
              <StatCard
                label="Pending"
                value={String(
                  (data as LeaveRow[]).filter((r) => r.status === "pending")
                    .length,
                )}
                icon={<FileText className="h-5 w-5" />}
                tone="orange"
              />
              <StatCard
                label="Rejected"
                value={String(
                  (data as LeaveRow[]).filter((r) => r.status === "rejected")
                    .length,
                )}
                icon={<AlertCircle className="h-5 w-5" />}
              />
            </>
          )}
          {reportType === "payroll" && (
            <>
              <StatCard
                label="Total Gross"
                value={formatCurrency(
                  (data as PayrollRow[]).reduce((s, r) => s + r.grossSalary, 0),
                )}
                icon={<Wallet className="h-5 w-5" />}
                tone="green"
              />
              <StatCard
                label="Total Net"
                value={formatCurrency(
                  (data as PayrollRow[]).reduce((s, r) => s + r.netSalary, 0),
                )}
                icon={<Wallet className="h-5 w-5" />}
                tone="green"
              />
              <StatCard
                label="Total Tax"
                value={formatCurrency(
                  (data as PayrollRow[]).reduce((s, r) => s + r.pph21, 0),
                )}
                icon={<BarChart3 className="h-5 w-5" />}
                tone="orange"
              />
            </>
          )}
        </div>
      )}

      {/* Table */}
      <div className="border border-gray-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#0B5A43]" />
            <span className="ml-3 text-sm text-gray-500">
              Loading report...
            </span>
          </div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center bg-gray-100 text-gray-400">
              <BarChart3 className="h-6 w-6" />
            </div>
            <p className="mt-4 font-semibold text-gray-800">No data found</p>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting the filters or selecting a different period.
            </p>
          </div>
        ) : reportType === "attendance" ? (
          <AttendanceTable data={data as AttendanceRow[]} />
        ) : reportType === "leave" ? (
          <LeaveTable data={data as LeaveRow[]} />
        ) : (
          <PayrollTable data={data as PayrollRow[]} />
        )}
      </div>
    </div>
  );
}

// ─── Sub-tables ───────────────────────────────────────────────────────────────

function AttendanceTable({ data }: { data: AttendanceRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <Th>Employee</Th>
            <Th>Dept</Th>
            <Th>Present</Th>
            <Th>Late</Th>
            <Th>Absent</Th>
            <Th>Hours</Th>
            <Th>Rate</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((r) => (
            <tr key={r.employeeId} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{r.name}</p>
                <p className="text-xs text-gray-500">{r.employeeId}</p>
              </td>
              <Td>{r.department}</Td>
              <Td>
                <span className="font-medium text-[#0B5A43]">
                  {r.presentDays}
                </span>
              </Td>
              <Td>
                <span className="font-medium text-[#7A5A00]">{r.lateDays}</span>
              </Td>
              <Td>
                <span className="font-medium text-red-600">{r.absentDays}</span>
              </Td>
              <Td>{r.totalHours}h</Td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-[#0B5A43]"
                      style={{ width: `${r.attendanceRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {r.attendanceRate}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeaveTable({ data }: { data: LeaveRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <Th>Employee</Th>
            <Th>Dept</Th>
            <Th>Type</Th>
            <Th>Period</Th>
            <Th>Days</Th>
            <Th>Status</Th>
            <Th>Approved By</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{r.employeeName}</p>
                <p className="text-xs text-gray-500">{r.employeeId}</p>
              </td>
              <Td>{r.department}</Td>
              <Td>{formatLeaveType(r.leaveType)}</Td>
              <Td>
                {r.startDate} – {r.endDate}
              </Td>
              <Td>{r.totalDays}</Td>
              <td className="px-4 py-3">
                <StatusBadge status={r.status} />
              </td>
              <Td>{r.approvedBy}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PayrollTable({ data }: { data: PayrollRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <Th>Employee</Th>
            <Th>Dept</Th>
            <Th>Base</Th>
            <Th>Gross</Th>
            <Th>Deductions</Th>
            <Th>Net</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{r.employeeName}</p>
                <p className="text-xs text-gray-500">{r.employeeId}</p>
              </td>
              <Td>{r.department}</Td>
              <Td>{formatCurrency(r.baseSalary)}</Td>
              <Td>{formatCurrency(r.grossSalary)}</Td>
              <Td>
                <span className="text-red-600">
                  {formatCurrency(r.totalDeductions)}
                </span>
              </Td>
              <Td>
                <span className="font-semibold text-[#0B5A43]">
                  {formatCurrency(r.netSalary)}
                </span>
              </Td>
              <td className="px-4 py-3">
                <StatusBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-gray-600">{children}</td>;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "approved" || status === "paid"
      ? "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]"
      : status === "pending"
        ? "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]"
        : status === "rejected"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-gray-200 bg-gray-50 text-gray-600";
  return (
    <span
      className={`border px-2 py-0.5 text-xs font-medium capitalize ${cls}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "default" | "green" | "orange";
}) {
  const cls = {
    default: {
      icon: "border-gray-200 bg-gray-50 text-gray-600",
      value: "text-gray-950",
    },
    green: {
      icon: "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]",
      value: "text-[#0B5A43]",
    },
    orange: {
      icon: "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]",
      value: "text-[#7A5A00]",
    },
  }[tone];

  return (
    <div className="border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className={`mt-2 text-lg font-semibold ${cls.value}`}>{value}</p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center border ${cls.icon}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
